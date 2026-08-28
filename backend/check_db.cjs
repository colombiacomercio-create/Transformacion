const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ficha = await prisma.fichaResultados.findFirst({
    orderBy: { periodo: 'desc' }
  });
  console.log('Ultima Ficha ID:', ficha.id);
  console.log('Periodo:', ficha.periodo);
  console.log('obrasProgramadasAlCorte:', ficha.obrasProgramadasAlCorte);
  console.log('metaCompromisosPct:', ficha.metaCompromisosPct);
}
main().then(() => process.exit(0));
