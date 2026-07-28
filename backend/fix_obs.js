const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const latest = await prisma.fichaResultados.findFirst({
    orderBy: { fechaCreacion: 'desc' }
  });
  if (latest && latest.observaciones) {
    const newAlerta = latest.alertaConvivencia 
      ? latest.alertaConvivencia + '\n\n' + latest.observaciones 
      : latest.observaciones;
      
    await prisma.fichaResultados.update({
      where: { id: latest.id },
      data: {
        alertaConvivencia: newAlerta,
        observaciones: null
      }
    });
    console.log("Moved observaciones to alertaConvivencia.");
  } else {
    console.log("No observaciones to move.");
  }
}
run().finally(() => prisma.$disconnect());
