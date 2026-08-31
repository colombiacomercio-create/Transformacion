const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const ficha = await prisma.fichaResultados.findFirst({
    orderBy: { periodo: 'desc' }
  });
  console.log("Ficha ID:", ficha.id);
  console.log("metaAnualCompromisos:", ficha.metaAnualCompromisos);
  console.log("metaAnualGiros:", ficha.metaAnualGiros);
}
run();
