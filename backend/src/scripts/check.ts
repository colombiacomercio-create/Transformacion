import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.actividad.findMany({ include: { asignaciones: true } }).then(d => console.log('count:', d.length, 'asignaciones de la primera:', d[0]?.asignaciones?.length)).finally(()=>p.$disconnect());
