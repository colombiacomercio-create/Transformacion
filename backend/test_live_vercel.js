const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.chyxultlgupbvhtgkxek:%2Az%24%2CWP%2F%23Tx4%2CkKW@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});

async function run() {
  const acts = await prisma.actividad.findMany({ take: 1 });
  if (acts.length === 0) return;
  const id = acts[0].id;
  
  console.log("Trying to delete", id);
  const res = await fetch(`https://transformacion-backend.vercel.app/api/actividades/${id}`, {
      method: 'DELETE',
      headers: {
          'Authorization': 'Bearer bypass-token'
      }
  });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}
run();
