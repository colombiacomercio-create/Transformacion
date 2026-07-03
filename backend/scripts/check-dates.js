const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const fichas = await prisma.fichaResultados.findMany({
    orderBy: { periodo: 'desc' },
    select: {
      id: true,
      periodo: true,
      ejecucionActEn: true,
      obrasActEn: true
    }
  });
  console.log(fichas);
}
check().finally(() => prisma.$disconnect());
