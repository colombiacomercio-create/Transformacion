const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.usuario.findMany({where: {rol: 'ADMIN'}}).then(u => {
  console.log("Admins:");
  console.log(u.map(x=>x.email));
}).finally(()=>p.$disconnect());
