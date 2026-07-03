const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  await prisma.fichaResultados.deleteMany({
    where: {
      periodo: new Date('2026-07-03T00:00:00.000Z')
    }
  });
  console.log("Deleted bogus July 3 record");
}
clean().finally(() => prisma.$disconnect());
