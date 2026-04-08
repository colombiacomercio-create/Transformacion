const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

const parseExcelDate = (excelDate: any) => {
  if (!excelDate) return null;
  if (!isNaN(excelDate) && typeof excelDate === 'number') {
    // Es un serial de excel
    return new Date((excelDate - (25567 + 2)) * 86400 * 1000); // offset aproximado
  }
  // is String "DD/MM/YYYY" ?
  if (typeof excelDate === 'string') {
    const parts = excelDate.split('/');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return new Date(excelDate);
  }
  return null;
};

const mapEstado = (str: any) => {
  if (!str) return 'PENDIENTE';
  const l = str.toLowerCase();
  if (l.includes('completado')) return 'COMPLETADA';
  if (l.includes('en curso') || l.includes('progreso')) return 'EN_PROGRESO';
  return 'PENDIENTE';
};

const mapPrioridad = (str: any) => {
  if (!str) return 'MEDIA';
  const l = str.toLowerCase();
  if (l.includes('urgente') || l.includes('importante') || l.includes('alta')) return 'ALTA';
  if (l.includes('baja')) return 'BAJA';
  return 'MEDIA';
};

async function main() {
  const filePath = "C:\\Users\\Roberto Carlos\\Downloads\\11. Transformación 2026 Suba.xlsx";
  console.log(`Leyendo ${filePath}...`);
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);
  
  if (!rows || rows.length === 0) {
    console.log("No hay filas para importar.");
    return;
  }

  // 1. Obtener/Crear Plan Global
  let plan = await prisma.plan.findFirst();
  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        nombre: 'Plan Transformación 2026',
        ano: 2026,
        creadoPor: 'admin'
      }
    });
  }

  // 2. Obtener todas las Localidades
  const localidades = await prisma.localidad.findMany();
  if (localidades.length === 0) {
    console.log("No hay localidades en la base de datos.");
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

      // Ejemplo de nombre de tarea: "P04.H2.A2.Intervención de puntos de arrojo clandestino y otros – 1 trimestre"
      // o a veces "P01.-H2.-A10.Seguimiento..."
      // Queremos deducir el Programa y el Hito.
      let programaCodigo = 'P00';
      let hitoCodigo = 'H00';
      let cleanNombre = nombreTarea;

      // Extraer Pxx, Hxx 
      const parts = nombreTarea.split('.');
      if (parts.length >= 3) {
         if (parts[0].startsWith('P')) programaCodigo = parts[0].replace(/-/g, '');
         if (parts[1].startsWith('H') || parts[1].startsWith('-H')) hitoCodigo = parts[1].replace(/-/g, '');
         cleanNombre = parts.slice(3).join('.').trim() || nombreTarea; 
         // Fallback si no hay nada en slice 3
         if (!cleanNombre) cleanNombre = nombreTarea;
      }

      // Objetivo ("Nombre del depósito" -> Eje / Objetivo)
      let deposito = row['Nombre del depósito'] || 'O0. Objetivo General';
      
      // Buscar o crear Objetivo
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

      // Buscar o crear Programa
      // Usaremos las etiquetas para ver si saca el nombre del Programa
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

      // Buscar o crear Hito
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

      // Parsear Fechas (xlsx utils cellDates convierte a Date obj si el excel estaba formateado, sino viene string)
      const fInicio = row['Fecha de inicio'] ? new Date(row['Fecha de inicio']) : null;
      let fLimite = row['Fecha de vencimiento'] ? new Date(row['Fecha de vencimiento']) : null;
      // Tratar Invalid Date
      const fechaI = fInicio && !isNaN(fInicio.getTime()) ? fInicio : null;
      const fechaL = fLimite && !isNaN(fLimite.getTime()) ? fLimite : null;

      const asignadoA = row['Asignado a'];
      let usuarioDb = null;
      if (asignadoA && asignadoA.trim() !== '') {
        // Podríamos crear mocks o buscar el correo, lo simularemos asociado al texto tal cual para el nombre del reporte
        // Pero en nuestra Base de Datos el Usuario debe existir por EMAIL. 
        // Generaremos un observador ficticio.
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

      // Guardar Actividad verificando upsert o un codigo único
      const dbActividad = await prisma.actividad.upsert({
        where: { codigoCompleto: codigoActividad },
        update: {
          descripcion: row['Descripción'] || '',
          estado: mapEstado(row['Progreso']),
          fechaLimite: fechaL,
          fechaInicio: fechaI,
          prioridad: mapPrioridad(row['Priority'])
        },
        create: {
          codigoCompleto: codigoActividad,
          hitoId: hito.id,
          nombre: cleanNombre,
          descripcion: row['Descripción'] || '',
          fechaInicio: fechaI,
          fechaLimite: fechaL,
          estado: mapEstado(row['Progreso']),
          prioridad: mapPrioridad(row['Priority']),
          indicadorMeta: 100,
          indicadorUnidad: 'Porcentaje',
          creadoPor: 'Importador Excel',
          tiposEvidenciaRequeridos: ['documento', 'reporte']
        }
      });

      // Crear o asegurar AsignacionLocalidad para TODAS las 20 localidades
      for (const loc of localidades) {
        const asig = await prisma.asignacionLocalidad.findFirst({
           where: { actividadId: dbActividad.id, localidadId: loc.id }
        });

        if (!asig) {
           await prisma.asignacionLocalidad.create({
              data: {
                actividadId: dbActividad.id,
                localidadId: loc.id,
                responsableId: usuarioDb ? usuarioDb.id : null,
                observaciones: 'Asignado masivamente desde Plantilla Excel'
              }
           });
        } else if (usuarioDb && !asig.responsableId) {
           await prisma.asignacionLocalidad.update({
              where: { id: asig.id },
              data: { responsableId: usuarioDb.id }
           });
        }
      }

      creadas++;
    } catch (err) {
      console.log(`[Error] en fila:`, row['Nombre de la tarea']);
      console.error(err);
      omitidas++;
    }
  }

  console.log(`==== IMPORT FINISH ====`);
  console.log(`Creadas/Actualizadas: ${creadas}`);
  console.log(`Fallidas/Omitidas: ${omitidas}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
