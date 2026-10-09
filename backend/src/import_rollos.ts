import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function main() {
  console.log("Iniciando importacion...");
  const csvData = fs.readFileSync(path.join(__dirname, 'data.csv'), 'utf-8');
  
  let plan = await prisma.plan.findFirst({ where: { nombre: 'Plan de Desarrollo 2024-2028' } });
  if (!plan) plan = await prisma.plan.create({ data: { nombre: 'Plan de Desarrollo 2024-2028', ano: 2024, creadoPor: 'SYSTEM' } });

  let objetivo = await prisma.objetivoEstrategico.findFirst({ where: { codigo: 'A5' } });
  if (!objetivo) objetivo = await prisma.objetivoEstrategico.create({ data: { codigo: 'A5', nombre: 'A5: Ciudadania y Participacion', orden: 5, planId: plan.id } });

  let programa = await prisma.programa.findFirst({ where: { codigo: 'P08' } });
  if (!programa) programa = await prisma.programa.create({ data: { codigo: 'P08', nombre: 'P08. Rollos Legendarios', objetivoId: objetivo.id } });

  const lines = csvData.split('\n').filter(l => l.trim() !== '');
  const parsedRows: any[] = [];
  
  for (let idx = 1; idx < lines.length; idx++) {
    const line = lines[idx];
    const row = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i+1] === '"') { current += '"'; i++; }
      else if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { row.push(current); current = ''; }
      else { current += char; }
    }
    row.push(current);

    if (row.length < 5) continue;

    const localidadName = row[1];
    const hitoName = row[2];
    const actCodigo = row[3];
    const actNombre = row[4];
    const fechaInicio = row[5] ? new Date(row[5]) : null;
    const fechaFin = row[6] ? new Date(row[6]) : new Date();
    const valor = parseFloat(row[7]) || 0;
    const progresoRaw = row[8] ? row[8].trim() : '';
    
    let estadoLocal = 'NO_INICIADA';
    let estadoValidacion = 'PENDIENTE_REVISION';
    let progreso = 0;
    
    if (progresoRaw.toLowerCase() === 'completado') { estadoLocal = 'COMPLETA_SIN_VALIDAR'; estadoValidacion = 'VALIDADA_COMPLETADA'; progreso = 100; }
    else if (progresoRaw.toLowerCase() === 'en curso') { estadoLocal = 'EN_CURSO_SIN_VALIDAR'; estadoValidacion = 'PENDIENTE_REVISION'; progreso = 50; }
    
    parsedRows.push({ localidadName, hitoName, actCodigo, actNombre, fechaInicio, fechaFin, valor, estadoLocal, estadoValidacion, progreso });
  }
  
  const localidades = await prisma.localidad.findMany();
  const locMap = new Map(localidades.map(l => [l.nombre, l.id]));

  for (let i = 0; i < parsedRows.length; i++) {
    const row = parsedRows[i];
    const locId = locMap.get(row.localidadName);
    if (!locId) continue;

    let hito = await prisma.hito.findFirst({ where: { nombre: row.hitoName, programaId: programa.id } });
    if (!hito) hito = await prisma.hito.create({ data: { nombre: row.hitoName, codigo: row.hitoName.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '').toUpperCase(), programaId: programa.id, fechaLimite: new Date('2028-12-31') } });

    // IMPORTANT: Make code completely unique per row so no overwrite happens if they have different names!
    // We add the Localidad ID to the code if there are duplicates with different names.
    // Or just make it `row.actCodigo + '-' + locId + '-' + i`
    const actCodigoUnico = `${row.actCodigo}-${locId}-${i}`;

    const newAct = await prisma.actividad.upsert({
      where: { codigoCompleto: actCodigoUnico },
      create: {
        nombre: row.actNombre,
        codigoCompleto: actCodigoUnico,
        hitoId: hito.id,
        fechaInicio: row.fechaInicio,
        fechaLimite: row.fechaFin,
        indicadorMeta: row.valor, 
        indicadorUnidad: 'Porcentaje',
        creadoPor: 'SYSTEM'
      },
      update: {
        nombre: row.actNombre,
        fechaInicio: row.fechaInicio,
        fechaLimite: row.fechaFin,
        indicadorMeta: row.valor,
      }
    });

    const existingAsig = await prisma.asignacionLocalidad.findUnique({
      where: { actividadId_localidadId: { actividadId: newAct.id, localidadId: locId } }
    });

    if (!existingAsig) {
      await prisma.asignacionLocalidad.create({ data: { actividadId: newAct.id, localidadId: locId, estadoLocal: row.estadoLocal as any, estadoValidacion: row.estadoValidacion as any, porcentajeAvance: row.progreso } });
    } else {
      await prisma.asignacionLocalidad.update({ where: { id: existingAsig.id }, data: { estadoLocal: row.estadoLocal as any, estadoValidacion: row.estadoValidacion as any, porcentajeAvance: row.progreso } });
    }
  }

  console.log("Importacion de Rollos Legendarios finalizada.");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
