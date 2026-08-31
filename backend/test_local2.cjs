const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fields = {
    periodo: new Date("2026-08-28"),
    obrasProgramadasAlCorte: 1234,
    avancesEjecucion: "Test avance local",
    alertaEjecucion: "Test alerta local"
  };

  const updated = await prisma.fichaResultados.update({
    where: { id: "44e6f26b-33d0-4986-a06b-e5e6382e955a" }, // The ID from earlier query
    data: fields
  });
  
  console.log("Updated:", updated);
}

main().finally(() => prisma.$disconnect());
