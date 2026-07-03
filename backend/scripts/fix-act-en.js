const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const fichas = await prisma.fichaResultados.findMany();
  for (const f of fichas) {
    const fieldsToFix = [
      'ejecucionActEn', 'obrasActEn', 'comitesActEn', 'espacioResiduosActEn',
      'espacioVentaActEn', 'convivenciaActEn', 'actuacionesActEn',
      'estrategiasActEn', 'rollosActEn'
    ];
    let data = {};
    for (const key of fieldsToFix) {
      if (f[key]) {
        // if it has milliseconds (not ending in 00.000Z or similar)
        const d = new Date(f[key]);
        if (d.getUTCHours() !== 0 || d.getUTCMinutes() !== 0 || d.getUTCSeconds() !== 0) {
           data[key] = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        }
      }
    }
    if (Object.keys(data).length > 0) {
      await prisma.fichaResultados.update({ where: { id: f.id }, data });
      console.log(`Fixed ${f.id}:`, data);
    }
  }
}

fix().catch(console.error).finally(() => prisma.$disconnect());
