const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.chyxultlgupbvhtgkxek:%2Az%24%2CWP%2F%23Tx4%2CkKW@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});

const data = [
  { a_code: 'A1', a_name: 'Ejecución presupuestal', prods: [ {p_code: 'P01', p_name: 'Ingeniería de Detalle'}, {p_code: 'P02', p_name: 'Participación'} ] },
  { a_code: 'A2', a_name: 'Obras Locales', prods: [ {p_code: 'P03', p_name: 'Obras Ejecutadas'} ] },
  { a_code: 'A3', a_name: 'Espacio Público', prods: [ {p_code: 'P04', p_name: 'Reducción PC'}, {p_code: 'P05', p_name: 'Organizar puntos EP'} ] },
  { a_code: 'A4', a_name: 'Seguridad', prods: [ {p_code: 'P06', p_name: 'Equipos Seguridad'}, {p_code: 'P07', p_name: 'Operativos IVC'} ] },
  { a_code: 'A5', a_name: 'Rollos Legendarios', prods: [ {p_code: 'P08', p_name: 'Rollo Legendario'} ] },
  { a_code: 'A6', a_name: 'Bogotaneidad', prods: [ {p_code: 'P09', p_name: 'Transformación'}, {p_code: 'P10', p_name: 'Fortalecimiento'} ] },
  { a_code: 'AV1', a_name: 'Memoria', prods: [ {p_code: 'PV1', p_name: 'Estrategia de Memoria'}, {p_code: 'PV2', p_name: 'Cartografía'}, {p_code: 'PV3', p_name: 'Capítulo'} ] },
  { a_code: 'AV2', a_name: 'Canales', prods: [ {p_code: 'PV4', p_name: 'Plan Integral'} ] },
];

async function run() {
  try {
      console.log("Wiping catalog...");
      await prisma.hito.deleteMany();
      await prisma.programa.deleteMany();
      await prisma.reporteCualitativo.deleteMany();
      await prisma.objetivoEstrategico.deleteMany();
      await prisma.plan.deleteMany();
      
      console.log("Creating Plan 2026...");
      const plan = await prisma.plan.create({
          data: {
              nombre: 'Plan 2026',
              ano: 2026,
              estado: 'ACTIVO',
              creadoPor: 'admin'
          }
      });
      
      let o_orden = 1;
      for (const asp of data) {
          const objetivo = await prisma.objetivoEstrategico.create({
              data: {
                  planId: plan.id,
                  codigo: asp.a_code,
                  nombre: asp.a_name,
                  orden: o_orden++
              }
          });
          
          for (const prod of asp.prods) {
              const programa = await prisma.programa.create({
                  data: {
                      objetivoId: objetivo.id,
                      codigo: prod.p_code,
                      nombre: prod.p_name
                  }
              });
              
              await prisma.hito.create({
                  data: {
                      programaId: programa.id,
                      codigo: 'H1',
                      nombre: 'General',
                      fechaLimite: new Date('2026-12-31')
                  }
              });
          }
      }
      
      console.log("Catalog 2026 created successfully!");
  } catch (e) {
      console.error(e);
  }
}
run();
