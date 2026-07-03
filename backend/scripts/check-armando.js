const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.usuario.findMany({
    where: { nombre: { contains: 'armando', mode: 'insensitive' } }
  });
  console.log("Users:", users);

  const fichas = await prisma.fichaResultados.findMany({
    orderBy: { periodo: 'desc' },
    take: 3
  });
  console.log("Recent fichas:", fichas.map(f => ({
    id: f.id, 
    periodo: f.periodo, 
    comitesRealizados: f.comitesRealizados,
    comitesActPorId: f.comitesActPorId
  })));
}
check().finally(() => prisma.$disconnect());
