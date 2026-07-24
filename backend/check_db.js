const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const latest = await prisma.fichaResultados.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log('motosContratadas:', latest.motosContratadas);
  console.log('motosPendientesFdl:', latest.motosPendientesFdl);
  console.log('motosAlmacenFdl:', latest.motosAlmacenFdl);
  console.log('motosEntregadas:', latest.motosEntregadas);
  console.log('motosEntregadasPolicia:', latest.motosEntregadasPolicia);
}
check().finally(() => prisma.());
