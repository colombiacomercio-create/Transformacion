const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fichas = await prisma.fichaResultados.findMany({
    orderBy: { periodo: 'desc' },
    take: 3
  });
  console.log(fichas);
}

main().finally(() => prisma.$disconnect());
