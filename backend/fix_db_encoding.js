const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.chyxultlgupbvhtgkxek:%2Az%24%2CWP%2F%23Tx4%2CkKW@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});

async function run() {
  console.log("Fixing encoding...");
  
  // Fix Programas
  const progs = await prisma.programa.findMany();
  for (const p of progs) {
      if (p.nombre.includes('')) {
          let newName = p.nombre
              .replace(/Ingeniera/g, 'Ingeniería')
              .replace(/Participacin/g, 'Participación')
              .replace(/Reduccin/g, 'Reducción')
              .replace(/Transformacin/g, 'Transformación')
              .replace(/Cartografa/g, 'Cartografía')
              .replace(/Captulo/g, 'Capítulo');
          console.log(`Updating ${p.nombre} to ${newName}`);
          await prisma.programa.update({ where: { id: p.id }, data: { nombre: newName } });
      }
  }
  
  // Fix Objetivos
  const objs = await prisma.objetivoEstrategico.findMany();
  for (const o of objs) {
      if (o.nombre.includes('')) {
          let newName = o.nombre
              .replace(/Ejecucin/g, 'Ejecución')
              .replace(/Pblico/g, 'Público');
          console.log(`Updating ${o.nombre} to ${newName}`);
          await prisma.objetivoEstrategico.update({ where: { id: o.id }, data: { nombre: newName } });
      }
  }
  
  console.log("Done.");
}
run();
