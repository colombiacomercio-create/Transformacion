
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.chyxultlgupbvhtgkxek:%2Az%24%2CWP%2F%23Tx4%2CkKW@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});
async function run() {
    const progs = await prisma.programa.findMany();
    for (const p of progs) {
        if (p.nombre.includes('\ufffd')) {
            const newName = p.nombre
                .replace('Ingenier\ufffda', 'Ingenier\u00eda')
                .replace('Participaci\ufffdn', 'Participaci\u00f3n')
                .replace('Reducci\ufffdn', 'Reducci\u00f3n')
                .replace('Transformaci\ufffdn', 'Transformaci\u00f3n')
                .replace('Cartograf\ufffda', 'Cartograf\u00eda')
                .replace('Cap\ufffdtulo', 'Cap\u00edtulo');
            await prisma.programa.update({ where: { id: p.id }, data: { nombre: newName } });
        }
    }
    const objs = await prisma.objetivoEstrategico.findMany();
    for (const o of objs) {
        if (o.nombre.includes('\ufffd')) {
            const newName = o.nombre
                .replace('Ejecuci\ufffdn', 'Ejecuci\u00f3n')
                .replace('P\ufffdblico', 'P\u00fablico');
            await prisma.objetivoEstrategico.update({ where: { id: o.id }, data: { nombre: newName } });
        }
    }
    console.log("Fixed");
}
run();
