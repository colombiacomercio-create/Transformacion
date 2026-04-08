const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
   const principal = await prisma.objetivoEstrategico.findFirst({ where: { nombre: 'O1. Ejecución Presupuestal' }});
   const secundario = await prisma.objetivoEstrategico.findFirst({ where: { nombre: 'Ejecución Presupuestal' }});
   if (principal && secundario && principal.id !== secundario.id) {
       await prisma.programa.updateMany({ where: { objetivoId: secundario.id }, data: { objetivoId: principal.id } });
       await prisma.objetivoEstrategico.delete({ where: { id: secundario.id } });
       console.log("Mapeo de O1 unificado.");
   }
   
   await prisma.programa.updateMany({ where: { codigo: 'P6' }, data: { codigo: 'P06' }});
   await prisma.programa.updateMany({ where: { codigo: 'P7' }, data: { codigo: 'P07' }});
   console.log("P6 y P7 actualizados.");
}
run();
