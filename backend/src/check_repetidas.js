const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const acts = await prisma.actividad.findMany({
    where: {
      nombre: {
        contains: 'Repetición'
      },
      hito: {
        programa: {
          codigo: 'P08'
        }
      }
    },
    include: {
      asignaciones: {
        include: { localidad: true }
      }
    },
    orderBy: {
      codigoCompleto: 'asc'
    }
  });

  console.log(`Encontradas ${acts.length} actividades repetidas.`);
  
  // Agrupar por nombre base
  const groups = {};
  for (const a of acts) {
    const match = a.nombre.match(/(.+) \(Repetición \d+\/\d+\)/);
    const baseName = match ? match[1] : a.nombre;
    if (!groups[baseName]) {
      groups[baseName] = [];
    }
    const asignacion = a.asignaciones[0];
    groups[baseName].push({
      nombre: a.nombre,
      fechaInicio: a.fechaInicio,
      fechaLimite: a.fechaLimite,
      puntaje: a.indicadorMeta,
      progresoFisico: asignacion ? asignacion.porcentajeAvance : 0,
      localidad: asignacion ? asignacion.localidad.nombre : 'N/A'
    });
  }

  for (const [base, items] of Object.entries(groups)) {
    console.log(`\nActividad Base: ${base} (Localidad: ${items[0].localidad})`);
    console.log(`Puntaje Meta agrupada: ${items[0].puntaje}`);
    for (const item of items) {
      console.log(`  - ${item.nombre} | Inicio: ${item.fechaInicio ? item.fechaInicio.toISOString().split('T')[0] : 'N/A'} | Fin: ${item.fechaLimite ? item.fechaLimite.toISOString().split('T')[0] : 'N/A'} | Progreso: ${item.progresoFisico}%`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
