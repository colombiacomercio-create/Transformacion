const { PrismaClient } = require('./node_modules/@prisma/client');
require('dotenv').config({ path: 'backend/.env' });
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Usuarios:', await prisma.usuario.count());
    console.log('Planes:', await prisma.plan.count());
    console.log('Actividades:', await prisma.actividad.count());
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
