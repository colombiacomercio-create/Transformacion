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
     console.log(`Asegúrate de que el nombre del archivo contenga el nombre de la localidad (ej: "Transformacion Suba.xlsx")`);
     return;
  }

  console.log(`✅ Archivo detectado para la localidad: ${localidadAsignada.nombre}`);

  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);
  
  if (!rows || rows.length === 0) {
    console.log("El archivo está vacío o no tiene el formato correcto.");
    return;
  }

  let creadas = 0;
  let omitidas = 0;

  for (const row of rows) {
    try {
      const nombreTarea = row['Nombre de la tarea'];
      if (!nombreTarea) {
        omitidas++;
        continue;
      }

      let programaCodigo = 'P00';
      let hitoCodigo = 'H00';
      let cleanNombre = nombreTarea;

      const parts = nombreTarea.split('.');
      if (parts.length >= 3) {
         if (parts[0].startsWith('P')) programaCodigo = parts[0].replace(/-/g, '');
         if (parts[1].startsWith('H') || parts[1].startsWith('-H')) hitoCodigo = parts[1].replace(/-/g, '');
         cleanNombre = parts.slice(3).join('.').trim() || nombreTarea; 
         if (!cleanNombre) cleanNombre = nombreTarea;
      }

      let deposito = row['Nombre del depósito'] || 'O0. Objetivo General';
      
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

      const fInicio = row['Fecha de inicio'] ? new Date(row['Fecha de inicio']) : null;
      let fLimite = row['Fecha de vencimiento'] ? new Date(row['Fecha de vencimiento']) : null;
      const fechaI = fInicio && !isNaN(fInicio.getTime()) ? fInicio : null;
      const fechaL = fLimite && !isNaN(fLimite.getTime()) ? fLimite : null;

      const asignadoA = row['Asignado a'];
      let usuarioDb = null;
      if (asignadoA && asignadoA.trim() !== '') {
        const firstEmail = (asignadoA.split(';')[0].replace(/\s/g, '').toLowerCase()) + '@localidad.gov.co';
        usuarioDb = await prisma.usuario.findUnique({ where: { email: firstEmail }});
        if (!usuarioDb) {
           usuarioDb = await prisma.usuario.create({
             data: {
               email: firstEmail,
               nombre: asignadoA.split(';')[0],
               rol: 'GESTOR'
             }
           });
        }
      }

      const codigoActividad = parts[2] ? parts.slice(0,3).join('.').replace(/-/g, '') : `A${Math.floor(Math.random() * 100000)}`;

      // Guardar Actividad (Global) sin sobreescribir su estado base con el progreso de una sola localidad
      const dbActividad = await prisma.actividad.upsert({
        where: { codigoCompleto: codigoActividad },
        update: {
          descripcion: row['Descripción'] || '',
          prioridad: mapPrioridad(row['Priority'])
        },
        create: {
          codigoCompleto: codigoActividad,
          hitoId: hito.id,
          nombre: cleanNombre,
          descripcion: row['Descripción'] || '',
          fechaInicio: fechaI,
          fechaLimite: fechaL,
          estado: 'PENDIENTE',
          prioridad: mapPrioridad(row['Priority']),
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
      
      const progresoRaw = row['Progreso'] ? String(row['Progreso']).toLowerCase() : '';
      if (progresoRaw.includes('completado')) {
          estadoLocal = 'COMPLETA_SIN_VALIDAR';
          estadoValidacion = 'VALIDADA_COMPLETADA'; // A petición, si ya venía completado, se valida.
          porc = 100;
      } else if (progresoRaw.includes('en curso') || progresoRaw.includes('progreso')) {
          estadoLocal = 'EN_CURSO_SIN_VALIDAR';
          estadoValidacion = 'PENDIENTE_REVISION';
          porc = 50;
      }

      // 3. Crear o actualizar Asignación EXCLUSIVA para esta localidad
      const asig = await prisma.asignacionLocalidad.findFirst({
         where: { actividadId: dbActividad.id, localidadId: localidadAsignada.id }
      });

      if (!asig) {
         await prisma.asignacionLocalidad.create({
            data: {
              actividadId: dbActividad.id,
              localidadId: localidadAsignada.id,
              responsableId: usuarioDb ? usuarioDb.id : null,
              observaciones: 'Importado de plantilla Excel',
              estadoLocal,
              estadoValidacion,
              porcentajeAvance: porc
            }
         });
      } else {
         // Si ya existía, actualizamos su estado y avance de acuerdo a este Excel
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

      creadas++;
    } catch (err) {
      console.log(`[Error] en fila:`, row['Nombre de la tarea']);
      console.error(err);
      omitidas++;
    }
  }

  console.log(`✔️ Terminado: ${filename}`);
  console.log(`Tareas procesadas: ${creadas} | Omitidas/Error: ${omitidas}`);
}

async function main() {
  console.log("Iniciando Importador de Bases por Localidad...");
  
  const importsFolder = path.join(__dirname, '../imports');
  if (!fs.existsSync(importsFolder)) {
    console.log(`Creando carpeta /imports. Por favor, pon tus archivos Excel allí.`);
    fs.mkdirSync(importsFolder);
    return;
  }

  const files = fs.readdirSync(importsFolder).filter((f: string) => f.endsWith('.xlsx'));
  if (files.length === 0) {
    console.log(`No se encontraron archivos .xlsx en la carpeta backend/imports/`);
    console.log(`Pon tus 20 archivos Excel ahí y vuelve a ejecutar el script.`);
    return;
  }

  // Cargar Plan Base
  let plan = await prisma.plan.findFirst();
  if (!plan) {
    plan = await prisma.plan.create({
      data: { nombre: 'Plan Transformación 2026', ano: 2026, creadoPor: 'admin' }
    });
  }

  // Cargar localidades en memoria
  const localidadesDb = await prisma.localidad.findMany();
  if (localidadesDb.length === 0) {
    console.log("Error: No hay localidades en la base de datos.");
    return;
  }

  // Procesar en lote
  for (const file of files) {
    const filePath = path.join(importsFolder, file);
    await procesarArchivoExcel(filePath, plan, localidadesDb);
  }

  console.log(`\n=================================================`);
  console.log(`🎉 IMPORTACIÓN MASIVA FINALIZADA. Archivos procesados: ${files.length}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
