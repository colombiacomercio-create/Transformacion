const { PrismaClient } = require('./node_modules/@prisma/client');
require('dotenv').config({ path: 'backend/.env' });
const prisma = new PrismaClient();

async function main() {
  try {
    const totalFichas = await prisma.fichaAlerta.count();
    const totalAlertas = await prisma.alerta.count();
    console.log('Total FichaAlerta:', totalFichas);
    console.log('Total Alerta:', totalAlertas);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
