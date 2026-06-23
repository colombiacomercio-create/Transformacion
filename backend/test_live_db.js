const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});
require('dotenv').config();

async function main() {
  const fields = {
    periodo: new Date("2026-06-25"),
    metaObras: 20
  };
  try {
    const upserted = await prisma.fichaResultados.upsert({
      where: { periodo: fields.periodo },
      update: fields,
      create: fields
    });
    console.log("Success:", upserted.id);
  } catch(e) {
    console.error("Error:", e);
  }
}
main().finally(() => prisma.$disconnect());
