const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const fichas = await prisma.fichaResultados.findMany({
    where: { periodo: new Date("2026-06-23T00:00:00.000Z") }
  });
  console.log(JSON.stringify(fichas.map(f => ({ 
    id: f.id, 
    obrasActEn: f.obrasActEn, 
    periodo: f.periodo, 
    createdAt: f.fechaCreacion 
  })), null, 2));
}
main().finally(() => prisma.$disconnect());
