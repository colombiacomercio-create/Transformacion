const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.fichaResultados.delete({where: {id: '8cb12035-756d-47f4-aa1a-c5452f1c5073'}}).catch(console.error);
  console.log('Deleted bad record');
}

main().finally(() => prisma.$disconnect());
