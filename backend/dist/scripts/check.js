"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const p = new client_1.PrismaClient();
p.actividad.findMany({ include: { asignaciones: true } }).then(d => console.log('count:', d.length, 'asignaciones de la primera:', d[0]?.asignaciones?.length)).finally(() => p.$disconnect());
