const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

async function main() {
  console.log("Iniciando reclasificación de reuniones 'Rollos legendarios'...");

  // Buscar todas las reuniones
  const reuniones = await prisma.reunion.findMany();

  let actualizados = 0;

  for (const r of reuniones) {
    // Si el producto es "Otro" (OTRO o GLOBAL) y el subtema incluye "rollo" y "legendario"
    const isOtro = !r.tematica || r.tematica === 'GLOBAL' || r.tematica === 'OTRO' || r.tematica.toUpperCase().includes('OTRO');
    const hasRollo = r.subtematica && r.subtematica.toUpperCase().includes('ROLLO') && r.subtematica.toUpperCase().includes('LEGENDARIO');

    if (isOtro && hasRollo) {
      await prisma.reunion.update({
        where: { id: r.id },
        data: {
          tematica: 'P08',
        }
      });
      actualizados++;
    }
  }

  console.log(`Reclasificación finalizada. Registros actualizados: ${actualizados}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
