const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const supabase = createClient('https://nuvxndlhfnrtpufsnviz.supabase.co', 'sb_publishable_Gh_zFuXXr0Xru4SsATc4sA_VBMVUXJJ');
const prisma = new PrismaClient();

async function migrateData() {
  console.log("Fetching old data from Supabase...");
  
  let allFrentes = [];
  let from = 0, to = 999;
  while(true) {
    const { data } = await supabase.from('frentes_obra').select('*').range(from, to);
    if (!data || data.length === 0) break;
    allFrentes = allFrentes.concat(data);
    if (data.length < 1000) break;
    from += 1000; to += 1000;
  }
  
  let allAlertas = [];
  from = 0; to = 999;
  while(true) {
    const { data } = await supabase.from('alertas_obra').select('*').range(from, to);
    if (!data || data.length === 0) break;
    allAlertas = allAlertas.concat(data);
    if (data.length < 1000) break;
    from += 1000; to += 1000;
  }

  const { data: meta } = await supabase.from('metadatos').select('*').limit(1);
  
  console.log(`Fetched ${allFrentes.length} frentes, ${allAlertas.length} alertas`);
  
  console.log("Wiping existing target tables...");
  await prisma.frenteObra.deleteMany({});
  await prisma.alertaObra.deleteMany({});
  await prisma.metadatoObra.deleteMany({});
  
  console.log("Inserting new data...");
  if (meta && meta[0]) {
    await prisma.metadatoObra.create({ data: { fecha_corte: meta[0].fecha_corte } });
  } else {
    await prisma.metadatoObra.create({ data: { fecha_corte: new Date().toISOString().split('T')[0] } });
  }

  const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
  
  const safeDate = (d) => {
    if (!d) return null;
    const date = new Date(d);
    if (isNaN(date.getTime()) || date.getFullYear() > 2100 || date.getFullYear() < 1900) return null;
    return date;
  };

  const cleanFrentes = allFrentes.map(({ id, crono_inicio, crono_fin, fecha_real_fin, fecha_suspension, ...rest }) => ({
    ...rest,
    crono_inicio: safeDate(crono_inicio),
    crono_fin: safeDate(crono_fin),
    fecha_real_fin: safeDate(fecha_real_fin),
    fecha_suspension: safeDate(fecha_suspension),
  }));
  
  for (const batch of chunk(cleanFrentes, 500)) {
    await prisma.frenteObra.createMany({ data: batch });
  }
  
  const cleanAlertas = allAlertas.map(({ id, ...rest }) => rest);
  for (const batch of chunk(cleanAlertas, 500)) {
    await prisma.alertaObra.createMany({ data: batch });
  }
  
  console.log("Migration successful!");
}

migrateData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
