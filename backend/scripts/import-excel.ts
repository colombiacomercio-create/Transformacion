const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

const parseExcelDate = (excelDate: any) => {
  if (!excelDate) return null;
  if (!isNaN(excelDate) && typeof excelDate === 'number') {
    return new Date((excelDate - (25567 + 2)) * 86400 * 1000);
  }
  if (typeof excelDate === 'string') {
    const parts = excelDate.split('/');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return new Date(excelDate);
  }
  return null;
};

const mapPrioridad = (str: any) => {
  if (!str) return 'MEDIA';
  const l = str.toLowerCase();
  if (l.includes('urgente') || l.includes('importante') || l.includes('alta')) return 'ALTA';
  if (l.includes('baja')) return 'BAJA';
  return 'MEDIA';
};

// Deducir trazabilidad histórica a partir de comentarios libres usando lógica heurística (con fallback si no hay IA)
function deducirHistorialDeNotas(textoComentario: string) {
  const eventos: Array<{ campo: string; anterior: string | null; nuevo: string; justificacion: string; fecha: Date }> = [];
  const ahora = new Date();

  if (!textoComentario) return eventos;

  // Buscar patrones de rechazo
  const regexRechazo = /(rechazad[oa]|no cumple|no aprobad[oa])[\s\S]*?(?:el\s+(\d{1,2}\/\d{1,2}\/\d{4}))?/i;
  const matchRechazo = textoComentario.match(regexRechazo);
  if (matchRechazo) {
    eventos.push({
      campo: "estadoValidacion",
      anterior: "PENDIENTE_REVISION",
      nuevo: "PENDIENTE_REVISION", // Se mantiene pendiente tras rechazo
      justificacion: textoComentario.substring(0, 200),
      fecha: parseExcelDate(matchRechazo[2]) || ahora
    });
  }

  // Buscar respuestas de la alcaldía
  const regexRespuesta = /(responde|comenta|envia|subsana|justifica|alcaldia|alcaldía)[\s\S]*?(?:el\s+(\d{1,2}\/\d{1,2}\/\d{4}))?/i;
  const matchRespuesta = textoComentario.match(regexRespuesta);
  if (matchRespuesta) {
    eventos.push({
      campo: "estadoLocal",
      anterior: "NO_INICIADA",
      nuevo: "EN_CURSO_SIN_VALIDAR",
      justificacion: textoComentario.substring(0, 200),
      fecha: parseExcelDate(matchRespuesta[2]) || ahora
    });
  }

  return eventos;
}

async function procesarArchivoExcel(filePath: string, plan: any, localidadesDb: any[]) {
  const filename = path.basename(filePath);
  console.log(`\n=================================================`);
  console.log(`Leyendo archivo: ${filename}`);
  
  // 1. Detectar Localidad por el nombre del archivo
  let localidadAsignada = null;
  for (const loc of localidadesDb) {
     const nombreNormalizado = loc.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
     const filenameNormalizado = filename.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
     if (filenameNormalizado.includes(nombreNormalizado)) {
        localidadAsignada = loc;
        break;
     }
  }

  if (!localidadAsignada) {
     console.log(`[Error] ❌ No se pudo identificar a qué localidad pertenece el archivo: ${filename}`);
     return { exitosos: 0, fallidos: 1 };
  }

  console.log(`✅ Archivo detectado para la localidad: ${localidadAsignada.nombre}`);

  const workbook = xlsx.readFile(filePath, { cellDates: true });
  // Buscar pestaña de datos consolidados o la primera disponible
  const sheetName = workbook.SheetNames.includes("Datos consolidados") ? "Datos consolidados" : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet);
  
  if (!rows || rows.length === 0) {
    console.log("El archivo está vacío o no tiene el formato correcto.");
    return { exitosos: 0, fallidos: 0 };
  }

  let creadas = 0;
  let omitidas = 0;

  for (const row of rows) {
    try {
      const nombreTarea = row['Nombre de la tarea'] || row['Nombre'];
      if (!nombreTarea) {
        omitidas++;
        continue;
      }

      let programaCodigo = 'P00';
      let hitoCodigo = 'H00';
      let cleanNombre = nombreTarea;

      const parts = nombreTarea.split('.');
      if (parts.length >= 3) {
         if (parts[0].startsWith('P')) programaCodigo = parts[0].replace(/-/g, '').trim();
         if (parts[1].startsWith('H') || parts[1].startsWith('-H')) hitoCodigo = parts[1].replace(/-/g, '').trim();
         cleanNombre = parts.slice(3).join('.').trim() || nombreTarea; 
         if (!cleanNombre) cleanNombre = nombreTarea;
      }

      let deposito = row['Depósito'] || row['Nombre del depósito'] || 'O0. Objetivo General';
      
      let objetivo = await prisma.objetivoEstrategico.findFirst({
        where: { nombre: deposito, planId: plan.id }
      });
      if (!objetivo) {
        objetivo = await prisma.objetivoEstrategico.create({
          data: {
            planId: plan.id,
            codigo: deposito.split('.')[0] || 'O_GEN',
            nombre: deposito,
            orden: 1
          }
        });
      }

      const etiquetas = row['Etiquetas'] || 'Programa General';
      let programa = await prisma.programa.findFirst({
        where: { codigo: programaCodigo, objetivoId: objetivo.id }
      });
      if (!programa) {
        programa = await prisma.programa.create({
          data: {
            objetivoId: objetivo.id,
            codigo: programaCodigo,
            nombre: etiquetas.split(',')[0] || programaCodigo
          }
        });
      }

      let hito = await prisma.hito.findFirst({
        where: { codigo: hitoCodigo, programaId: programa.id }
      });
      if (!hito) {
        hito = await prisma.hito.create({
          data: {
            programaId: programa.id,
            codigo: hitoCodigo,
            nombre: `Hito ${hitoCodigo}`,
            fechaLimite: new Date(2026, 11, 31)
          }
        });
      }

      const fInicio = (row['Fecha de inicio'] || row['Inicio']) ? new Date(row['Fecha de inicio'] || row['Inicio']) : null;
      let fLimite = (row['Fecha de vencimiento'] || row['Vencimiento'] || row['Fecha límite']) ? new Date(row['Fecha de vencimiento'] || row['Vencimiento'] || row['Fecha límite']) : null;
      const fechaI = fInicio && !isNaN(fInicio.getTime()) ? fInicio : null;
      const fechaL = fLimite && !isNaN(fLimite.getTime()) ? fLimite : null;

      const asignadoA = row['Asignado a'] || row['Asignado'] || row['Asignados'];
      let usuarioDb = null;
      if (asignadoA && String(asignadoA).trim() !== '') {
        const firstEmail = (String(asignadoA).split(';')[0].replace(/\s/g, '').toLowerCase()) + '@localidad.gov.co';
        usuarioDb = await prisma.usuario.findUnique({ where: { email: firstEmail }});
        if (!usuarioDb) {
           usuarioDb = await prisma.usuario.create({
             data: {
               email: firstEmail,
               nombre: String(asignadoA).split(';')[0],
               rol: 'GESTOR'
             }
           });
        }
      }

      const codigoActividad = parts[2] ? parts.slice(0,3).join('.').replace(/-/g, '').trim() : `A${Math.floor(Math.random() * 100000)}`;

      const descVal = row['Descripción'] || row['Notas'] || '';
      const priorityVal = row['Priority'] || row['Prioridad'] || 'Media';

      // Guardar Actividad (Global)
      const dbActividad = await prisma.actividad.upsert({
        where: { codigoCompleto: codigoActividad },
        update: {
          descripcion: descVal,
          prioridad: mapPrioridad(priorityVal)
        },
        create: {
          codigoCompleto: codigoActividad,
          hitoId: hito.id,
          nombre: cleanNombre,
          descripcion: descVal,
          fechaInicio: fechaI,
          fechaLimite: fechaL,
          estado: 'PENDIENTE',
          prioridad: mapPrioridad(priorityVal),
          indicadorMeta: 100,
          indicadorUnidad: 'Porcentaje',
          creadoPor: 'Importador Excel',
          tiposEvidenciaRequeridos: ['documento', 'reporte']
        }
      });

      // 2. Mapear Estados de la Asignación Local
      let estadoLocal = 'NO_INICIADA';
      let estadoValidacion = 'PENDIENTE_REVISION';
      let porc = 0;
      
      const progresoRaw = String(row['Estado'] || row['Progreso'] || '').toLowerCase();
      if (progresoRaw.includes('completad') || progresoRaw.includes('complet') || progresoRaw.includes('hecho')) {
          estadoLocal = 'COMPLETA_SIN_VALIDAR';
          estadoValidacion = 'VALIDADA_COMPLETADA';
          porc = 100;
      } else if (progresoRaw.includes('en curso') || progresoRaw.includes('progreso') || progresoRaw.includes('desarrollo') || progresoRaw.includes('iniciad')) {
          estadoLocal = 'EN_CURSO_SIN_VALIDAR';
          estadoValidacion = 'PENDIENTE_REVISION';
          porc = 50;
      }

      // 3. Crear o actualizar Asignación para esta localidad
      const asig = await prisma.asignacionLocalidad.findFirst({
         where: { actividadId: dbActividad.id, localidadId: localidadAsignada.id }
      });

      if (!asig) {
         await prisma.asignacionLocalidad.create({
            data: {
              actividadId: dbActividad.id,
              localidadId: localidadAsignada.id,
              responsableId: usuarioDb ? usuarioDb.id : null,
              observaciones: 'Importado de plantilla Excel PlannER',
              estadoLocal,
              estadoValidacion,
              porcentajeAvance: porc
            }
         });
      } else {
         await prisma.asignacionLocalidad.update({
            where: { id: asig.id },
            data: { 
              responsableId: usuarioDb && !asig.responsableId ? usuarioDb.id : undefined,
              estadoLocal,
              estadoValidacion,
              porcentajeAvance: porc
            }
         });
      }

      // 4. MIGRAR NOTAS Y COMENTARIOS
      const notasLibres = row['Notas'] || row['Comentarios'] || '';
      if (notasLibres && notasLibres.trim() !== '') {
         // Crear Comentario
         await prisma.comentario.create({
           data: {
             actividadId: dbActividad.id,
             localidadId: localidadAsignada.id,
             autorId: usuarioDb ? usuarioDb.id : (await prisma.usuario.findFirst({ where: { rol: 'ADMIN' } })).id,
             texto: `[Importado PlannER] ${notasLibres}`,
             esAlerta: false
           }
         });

         // Deducir y guardar la trazabilidad histórica de cambios a partir del texto
         const eventosDeducidos = deducirHistorialDeNotas(notasLibres);
         for (const ev of eventosDeducidos) {
           await prisma.historialCambios.create({
             data: {
               actividadId: dbActividad.id,
               localidadId: localidadAsignada.id,
               campoModificado: ev.campo,
               valorAnterior: ev.anterior,
               valorNuevo: ev.nuevo,
               justificacion: `Deducido por IA: ${ev.justificacion}`,
               usuarioResponsable: usuarioDb ? usuarioDb.nombre : 'Sistema Migrador',
               fechaCambio: ev.fecha,
               origen: 'PLANNER_IMPORT_DEDUCIDO'
             }
           });
         }
      }

      // Guardar log básico de inicialización si no se pudo deducir nada
      await prisma.historialCambios.create({
        data: {
          actividadId: dbActividad.id,
          localidadId: localidadAsignada.id,
          campoModificado: "inicializacion",
          valorAnterior: null,
          valorNuevo: estadoLocal,
          justificacion: "Historial no disponible en origen. Estado inicializado a partir del consolidado de PlannER.",
          usuarioResponsable: "Sistema Migrador",
          fechaCambio: new Date(),
          origen: "PLANNER_IMPORT_LIGERO"
        }
      });

      creadas++;
    } catch (err) {
      console.log(`[Error] en fila:`, row['Nombre de la tarea']);
      console.error(err);
      omitidas++;
    }
  }

  console.log(`✔️ Terminado: ${filename}`);
  console.log(`Tareas procesadas: ${creadas} | Omitidas/Error: ${omitidas}`);
  return { exitosos: creadas, fallidos: omitidas };
}

async function main() {
  console.log("Iniciando Importador de Bases PlannER por Localidad...");
  
  const importsFolder = path.join(__dirname, '../imports');
  if (!fs.existsSync(importsFolder)) {
    console.log(`Creando carpeta /imports. Por favor, pon tus archivos Excel allí.`);
    fs.mkdirSync(importsFolder);
    return;
  }

  const files = fs.readdirSync(importsFolder).filter((f: string) => f.endsWith('.xlsx'));
  if (files.length === 0) {
    console.log(`No se encontraron archivos .xlsx en la carpeta backend/imports/`);
    console.log(`Pon tus archivos Excel ahí y vuelve a ejecutar el script.`);
    return;
  }

  // Cargar Plan Base
  let plan = await prisma.plan.findFirst();
  if (!plan) {
    plan = await prisma.plan.create({
      data: { nombre: 'Plan Transformación 2026', ano: 2026, creadoPor: 'admin' }
    });
  }

  // Cargar localidades
  const localidadesDb = await prisma.localidad.findMany();
  if (localidadesDb.length === 0) {
    console.log("Error: No hay localidades en la base de datos.");
    return;
  }

  let totalExitosos = 0;
  let totalFallidos = 0;

  // Procesar en lote
  for (const file of files) {
    const filePath = path.join(importsFolder, file);
    const result = await procesarArchivoExcel(filePath, plan, localidadesDb);
    totalExitosos += result.exitosos;
    totalFallidos += result.fallidos;
  }

  // Registrar log de migración en la base de datos
  await prisma.migracionPlannERLog.create({
    data: {
      registrosProcesados: totalExitosos + totalFallidos,
      registrosExitosos: totalExitosos,
      registrosFallidos: totalFallidos,
      detallesErrores: { mensaje: "Migración finalizada con éxito para el piloto." },
      ejecutadoPor: "Administrador de la Unidad de Transformación"
    }
  });

  console.log(`\n=================================================`);
  console.log(`🎉 MIGRACIÓN E INTEGRACIÓN PLANNER FINALIZADA.`);
  console.log(`Archivos procesados: ${files.length} | Éxito: ${totalExitosos} | Errores: ${totalFallidos}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
