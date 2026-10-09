const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') 
      AND relkind = 'r'
      ORDER BY relname;
    `);
    
    const unsecureTables = result.filter(r => r.relrowsecurity === false && !r.relname.startsWith('_'));
    const secureTables = result.filter(r => r.relrowsecurity === true && !r.relname.startsWith('_'));
    
    if (unsecureTables.length === 0) {
      console.log('SUCCESS: ¡Excelente! Todas las tablas (' + secureTables.length + ') tienen RLS activado.');
    } else {
      console.log('WARNING: Las siguientes tablas aún NO tienen RLS activado:');
      unsecureTables.forEach(t => console.log(' - ' + t.relname));
    }
  } catch (e) {
    console.error('Error conectando a la base de datos:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
