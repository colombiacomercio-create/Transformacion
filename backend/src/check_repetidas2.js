const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const acts = await prisma.actividad.findMany({
    where: { nombre: { contains: 'Repetición' } },
    include: { asignaciones: { include: { localidad: true } }, hito: true },
    orderBy: { codigoCompleto: 'asc' }
  });

  const groups = {};
  for (const a of acts) {
    const asig = a.asignaciones[0];
    const loc = asig ? asig.localidad.nombre : 'N/A';
    const key = `${loc} | ${a.hito.nombre} | ${a.nombre.replace(/ \(Repetición \d+\/\d+\)/, '')}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }

  let totalRepetitivas = 0;
  for (const [key, items] of Object.entries(groups)) {
    totalRepetitivas += items.length;
    console.log(`\nGrupo: ${key} (${items.length} repeticiones)`);
    console.log(`Puntaje global consolidado: ${items[0].indicadorMeta}`);
    for (const item of items) {
      const asig = item.asignaciones[0];
      const prog = asig ? asig.porcentajeAvance : 0;
      console.log(`  - ${item.nombre}: ${item.fechaInicio ? item.fechaInicio.toISOString().split('T')[0] : 'N/A'} a ${item.fechaLimite ? item.fechaLimite.toISOString().split('T')[0] : 'N/A'} | Progreso: ${prog}%`);
    }
  }
  console.log(`\nTotal creadas con esta función: ${totalRepetitivas}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
