const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fields = {
    periodo: new Date("2026-08-28"),
    obrasProgramadasAlCorte: 1234,
    avancesEjecucion: "Test avance local",
    alertaEjecucion: "Test alerta local"
  };

  const upserted = await prisma.fichaResultados.upsert({
    where: { periodo: fields.periodo },
    update: fields,
    create: fields
  });
  
  console.log("Upserted:", upserted);
}

main().finally(() => prisma.$disconnect());
