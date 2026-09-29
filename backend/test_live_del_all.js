const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.chyxultlgupbvhtgkxek:%2Az%24%2CWP%2F%23Tx4%2CkKW@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});

async function run() {
  const acts = await prisma.actividad.findMany({ select: { id: true } });
  console.log("Total activities:", acts.length);
  
  let failed = 0;
  for (const act of acts) {
    const id = act.id;
    try {
        await prisma.$transaction(async (tx) => {
          await tx.asignacionLocalidad.deleteMany({ where: { actividadId: id } });
          await tx.subTarea.deleteMany({ where: { actividadId: id } });
          await tx.evidencia.deleteMany({ where: { actividadId: id } });
          await tx.comentario.deleteMany({ where: { actividadId: id } });
          await tx.alerta.deleteMany({ where: { actividadId: id } });

          const fichas = await tx.fichaAlerta.findMany({ where: { actividadId: id }, select: { id: true } });
          if (fichas.length > 0) {
            await tx.actualizacionAlerta.deleteMany({ where: { fichaAlertaId: { in: fichas.map(f => f.id) } } });
          }
          await tx.fichaAlerta.deleteMany({ where: { actividadId: id } });
          await tx.historialCambios.deleteMany({ where: { actividadId: id } });

          await tx.actividad.delete({ where: { id } });
          
          // ROLLBACK SO WE DON'T ACTUALLY DELETE THEM!
          throw new Error("ROLLBACK");
        });
    } catch (e) {
        if (e.message !== "ROLLBACK") {
            console.error("FAIL for", id, e.message.substring(0, 200));
            failed++;
        }
    }
  }
  console.log("Failed:", failed);
}
run();
