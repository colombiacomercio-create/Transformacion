const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const fichas = await prisma.fichaResultados.findMany({
    orderBy: { periodo: 'desc' },
    select: { id: true, periodo: true, obrasProgramadasAlCorte: true, avancesEjecucion: true }
  });
  console.log(fichas);
}
main().finally(() => prisma.$disconnect());
