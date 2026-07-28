const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== OBJETIVOS ESTRATEGICOS (Aspiraciones) ===");
  const objetivos = await prisma.objetivoEstrategico.findMany();
  for (const obj of objetivos) {
    console.log(`- [${obj.codigo}] ${obj.nombre}`);
  }

  console.log("\n=== PROGRAMAS ===");
  const programas = await prisma.programa.findMany();
  for (const prog of programas) {
    console.log(`- [${prog.codigo}] ${prog.nombre}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
