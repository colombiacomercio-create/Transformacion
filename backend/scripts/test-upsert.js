const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.usuario.findFirst();
  
  const fields = {
    periodo: new Date("2026-07-02"),
    obrasActEn: new Date("2026-07-02"),
    reportadoPorId: user.id
  };
  console.log("FIELDS BEFORE UPSERT:", fields);
  
  const upserted = await prisma.fichaResultados.upsert({
     where: { periodo: fields.periodo },
     update: fields,
     create: fields
  });
  console.log("UPSERTED RESULT FROM DB:", upserted.obrasActEn);
}

test().catch(console.error).finally(() => prisma.$disconnect());
