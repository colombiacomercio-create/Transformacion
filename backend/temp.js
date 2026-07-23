const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.fichaAlerta.findMany().then(res => console.log(res.slice(0, 3))).finally(() => prisma.$disconnect());
