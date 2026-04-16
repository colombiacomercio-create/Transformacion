import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando creación de Cortes Mensuales de prueba...');
  
  await prisma.corteMensual.deleteMany(); // clean up if necessary

  const cortes = [
    { nombre: 'Corte Enero 2026', fechaLimite: new Date('2026-01-31T23:59:59Z'), esActivo: false },
    { nombre: 'Corte Febrero 2026', fechaLimite: new Date('2026-02-28T23:59:59Z'), esActivo: false },
    { nombre: 'Corte Marzo 2026', fechaLimite: new Date('2026-03-31T23:59:59Z'), esActivo: true },
  ];

  for (const c of cortes) {
    await prisma.corteMensual.create({ data: c });
  }

  console.log('Cortes creados con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
