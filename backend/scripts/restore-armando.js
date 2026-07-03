const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  await prisma.fichaResultados.update({
    where: { id: '725e225d-b3e6-4910-a2df-2f1efad0f829' },
    data: {
      comitesActPorId: '5007ee82-e2f8-4108-8067-22e5f0e74e04',
      comitesActEn: new Date('2026-07-02T00:00:00.000Z')
    }
  });
  console.log("Restored Armando for comites in July 2");
}
fix().finally(() => prisma.$disconnect());
