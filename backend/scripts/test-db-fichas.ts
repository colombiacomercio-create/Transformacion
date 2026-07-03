import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.fichaResultados.count();
  console.log('Total fichas:', count);
  const fichas = await prisma.fichaResultados.findMany({ orderBy: { periodo: 'desc' }, take: 1 });
  console.log('Ultima ficha:', fichas[0]?.periodo, fichas[0]?.compromisosPct);
}

main().finally(() => prisma.$disconnect());
