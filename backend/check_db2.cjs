const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ficha = await prisma.fichaResultados.findFirst({
    orderBy: { periodo: 'desc' }
  });
  console.log('Ultima Ficha ID:', ficha.id);
  console.log('Periodo:', ficha.periodo);
  console.log('ejecucionActEn:', ficha.ejecucionActEn);
  console.log('obrasActEn:', ficha.obrasActEn);
}
main().then(() => process.exit(0));
