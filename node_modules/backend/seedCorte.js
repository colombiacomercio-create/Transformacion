const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
   let c = await prisma.corteMensual.findFirst({ where: { nombre: "Corte 20 de marzo de 2026" }});
   if(!c) {
       c = await prisma.corteMensual.create({
          data: {
             nombre: "Corte 20 de marzo de 2026",
             fechaLimite: new Date("2026-03-20T23:59:59Z"),
             esActivo: true
          }
       });
       console.log("Corte seed done", c.id);
   } else {
       console.log("Corte ya existente");
   }
}
seed();
