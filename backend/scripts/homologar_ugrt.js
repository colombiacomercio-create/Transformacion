const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

async function main() {
  console.log("Iniciando homologación de reuniones con UGRT...");

  // Buscar todas las reuniones
  const reuniones = await prisma.reunion.findMany();

  let actualizados = 0;

  for (const r of reuniones) {
    const d = r.desarrollo ? r.desarrollo.toUpperCase() : '';
    const o = r.objeto ? r.objeto.toUpperCase() : '';
    const t = r.tematica ? r.tematica.toUpperCase() : '';

    if (d.includes('UGRT') || o.includes('UGRT') || t.includes('UGRT')) {
      await prisma.reunion.update({
        where: { id: r.id },
        data: {
          tipoContraparte: 'INTERNA',
          tipoReunion: 'OTRA',
          tematica: 'GLOBAL'
        }
      });
      actualizados++;
    }
  }

  console.log(`Homologación finalizada. Registros actualizados: ${actualizados}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
