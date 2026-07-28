const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const latest = await prisma.fichaResultados.findFirst({
    orderBy: { fechaCreacion: 'desc' }
  });
  console.log('motosContratadas:', latest.motosContratadas);
  console.log('motosEntregadasPolicia:', latest.motosEntregadasPolicia);
}
check().finally(() => prisma.$disconnect());
