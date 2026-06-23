const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const fields = {
    periodo: new Date("2026-06-25"),
    metaObras: 10,
    reportadoPorId: "ec470662-f067-4f50-9738-5e8db6f4081c"
  };
  try {
    const upserted = await prisma.fichaResultados.upsert({
      where: { periodo: fields.periodo },
      update: fields,
      create: fields
    });
    console.log("Upserted:", upserted.id);
  } catch (e) {
    console.error("Error:", e);
  }
}
main().finally(() => prisma.$disconnect());
