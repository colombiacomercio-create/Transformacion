const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const latest = await prisma.fichaResultados.findFirst({
    orderBy: { fechaCreacion: 'desc' }
  });
  if (latest) {
    await prisma.fichaResultados.update({
      where: { id: latest.id },
      data: {
        motosContratadas: 337,
        motosEntregadasPolicia: 45,
        motosEntregadas: 18,
        motosAlmacenFdl: 191,
        motosPendientesFdl: 83
      }
    });
    console.log("Updated latest ficha with exact motos breakdown");
  }
}
run().finally(() => prisma.$disconnect());
