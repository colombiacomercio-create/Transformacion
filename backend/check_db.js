const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const fichas = await prisma.fichaResultados.findMany({
    orderBy: { periodo: 'desc' },
    take: 2
  });
  console.log(JSON.stringify(fichas, null, 2));
}
main().finally(() => prisma.$disconnect());
