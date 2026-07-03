const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  await prisma.fichaResultados.update({
    where: { id: '725e225d-b3e6-4910-a2df-2f1efad0f829' },
    data: {
      obrasActEn: new Date('2026-07-02T00:00:00.000Z')
    }
  });
  console.log("Fixed the bogus timestamp");
}
fix().finally(() => prisma.$disconnect());
