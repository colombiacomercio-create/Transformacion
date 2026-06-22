const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const goodId = '5671f08d-241a-44d0-9186-f576d934869a';
  
  // 1. Update the good record with the data the user tried to submit
  await prisma.fichaResultados.update({
    where: { id: goodId },
    data: {
      intervencionesFinalizadas: 532,
      kmCarrilIntervenido: 31.5,
      kmIntervenidos: 58.725
    }
  });

  // 2. Delete the bad records
  await prisma.fichaResultados.deleteMany({
    where: {
      id: { in: ['a0e6ac4b-00a9-437a-adda-93862ac89f19', '652b2d52-7283-4177-9cd9-f8e402ae678b'] }
    }
  });

  console.log('Database fixed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
