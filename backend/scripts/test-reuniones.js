const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.usuario.findFirst().then(u => {
  console.log('User:', u.id);
  p.reunion.create({
    data: {
      tipoReunion: 'TEST',
      tipoContraparte: 'TEST',
      tematica: 'GLOBAL',
      objeto: 'TEST',
      fecha: new Date(),
      horaInicio: '09:00',
      horaFin: '10:00',
      lugar: 'TEST',
      modalidad: 'VIRTUAL',
      responsable: 'TEST',
      desarrollo: 'TEST',
      creadoPorId: u.id,
      asistentes: {
        create: ['Juan'].map(nombre => ({ nombre, cargo: 'Unidad de Transformación', entidad: 'SDG' }))
      }
    }
  }).then(r => console.log('OK', r.id)).catch(console.error).finally(() => p.$disconnect());
});
