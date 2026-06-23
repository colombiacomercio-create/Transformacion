const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

async function main() {
  const workbook = XLSX.readFile('C:/Users/Roberto Carlos/Downloads/20251205 mesas de trabajo.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  console.log(`Leyendo ${data.length} registros...`);

  let creados = 0;
  let errores = 0;

  // UUID por defecto o buscar un usuario administrador
  const usuarioDefault = await prisma.usuario.findFirst({
    where: { email: 'colombiacomercio@gmail.com' } // O usar req.user.id, como no tengo req, busco uno
  }) || await prisma.usuario.findFirst();

  if (!usuarioDefault) {
    console.error("No hay usuarios en la base de datos para asignar como creador");
    return;
  }

  const userId = usuarioDefault.id;

  for (const row of data) {
    const mesaTexto = row['Mesa de trabajo'] || '';
    const tematica = row['tematica'] || 'GLOBAL';
    const objetivo = row['objetivo'] || 'Registro Histórico 2025';

    // Parsear fecha del final de la cadena: " - 16/09/25" o similar
    const regexFecha = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/;
    const match = mesaTexto.match(regexFecha);
    
    let fecha = new Date('2025-01-01T12:00:00Z'); // default if not found
    if (match) {
      const d = parseInt(match[1]);
      const m = parseInt(match[2]) - 1;
      let y = parseInt(match[3]);
      if (y < 100) y += 2000;
      fecha = new Date(y, m, d, 12, 0, 0);
    }

    try {
      await prisma.reunion.create({
        data: {
          tipoReunion: 'MESA_TRABAJO',
          tipoContraparte: 'OTRA_ENTIDAD',
          tematica: tematica.substring(0, 200), // En caso de que sea muy largo
          subtematica: null, // El archivo no tiene subtematica
          objeto: objetivo.substring(0, 4000), // Evitar limites si aplica
          fecha: fecha,
          horaInicio: '08:00',
          horaFin: '09:00',
          lugar: 'No especificado (Histórico)',
          modalidad: 'VIRTUAL',
          responsable: 'Histórico 2025',
          desarrollo: mesaTexto.substring(0, 4000),
          creadoPorId: userId,
        }
      });
      creados++;
    } catch (error) {
      console.error("Error al insertar fila:", row['Mesa de trabajo'], error.message);
      errores++;
    }
  }

  console.log(`Importación finalizada. Creados: ${creados}, Errores: ${errores}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
