const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.reunion.deleteMany({
    where: { NOT: { objeto: { contains: "Revisión Rupi's" } } }
  });
  console.log('Deleted:', count);

  const updated = await prisma.reunion.updateMany({
    where: { objeto: { contains: "Revisión Rupi's" } },
    data: { fecha: new Date('2026-06-18T00:00:00Z') }
  });
  console.log('Updated:', updated);
}

main().finally(() => prisma.$disconnect());
