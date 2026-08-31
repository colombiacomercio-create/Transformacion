const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const ultima = await prisma.fichaResultados.findFirst({
    orderBy: { periodo: 'desc' }
  });
  console.log("obrasProgramadasAlCorte:", ultima.obrasProgramadasAlCorte);
  console.log("avancesEjecucion:", ultima.avancesEjecucion);
  console.log("alertaEjecucion:", ultima.alertaEjecucion);
  console.log("metaObras:", ultima.metaObras);
  console.log("intervencionesFinalizadas:", ultima.intervencionesFinalizadas);
}
main().finally(() => prisma.$disconnect());
