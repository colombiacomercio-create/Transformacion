const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.chyxultlgupbvhtgkxek:%2Az%24%2CWP%2F%23Tx4%2CkKW@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});

async function run() {
  try {
      console.log("Deleting all activities...");
      await prisma.$transaction(async (tx) => {
        await tx.asignacionLocalidad.deleteMany({});
        await tx.subTarea.deleteMany({});
        await tx.evidencia.deleteMany({});
        await tx.comentario.deleteMany({});
        await tx.alerta.deleteMany({});
        await tx.actualizacionAlerta.deleteMany({});
        await tx.fichaAlerta.deleteMany({});
        await tx.historialCambios.deleteMany({});
        const res = await tx.actividad.deleteMany({});
        console.log("Deleted", res.count, "actividades");
      });
  } catch (e) {
      console.error("FAIL:", e);
  }
}
run();
