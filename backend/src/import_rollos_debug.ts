import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function main() {
  console.log("Iniciando importación...");
  const csvData = fs.readFileSync(path.join(__dirname, 'data.csv'), 'utf-8');
  
  // Create or find Plan
  console.log(Fetching plan...); let plan = await prisma.plan.findFirst({ where: { nombre: 'Plan de Desarrollo 2024-2028' } });
  if (!plan) {
    plan = await prisma.plan.create({
      data: { nombre: 'Plan de Desarrollo 2024-2028', ano: 2024, creadoPor: 'SYSTEM' }
    });
  }

  // Create or find ObjetivoEstrategico
  console.log(Fetching objetivo...); let objetivo = await prisma.objetivoEstrategico.findFirst({ where: { codigo: 'A5' } });
  if (!objetivo) {
    objetivo = await prisma.objetivoEstrategico.create({
      data: { codigo: 'A5', nombre: 'A5: Ciudadanía y Participación', orden: 5, planId: plan.id }
    });
  }

  // Create or find Programa
  console.log(Fetching programa...); let programa = await prisma.programa.findFirst({ where: { codigo: 'P08' } });
  if (!programa) {
    programa = await prisma.programa.create({
      data: {
        codigo: 'P08',
        nombre: 'P08. Rollos Legendarios',
        objetivoId: objetivo.id
      }
    });
  }

  console.log(Parsing CSV...); const lines = csvData.split('\n').filter(l => l.trim() !== '');
  
  const parsedRows: any[] = [];
  
  for (const line of lines) {
    // Simple CSV parser for quoted strings
    const row = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i+1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current);

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
    
    if (progresoRaw.toLowerCase() === 'completado') {
      estadoLocal = 'COMPLETA_SIN_VALIDAR';
      estadoValidacion = 'VALIDADA_COMPLETADA';
      progreso = 100;
    } else if (progresoRaw.toLowerCase() === 'en curso') {
      estadoLocal = 'EN_CURSO_SIN_VALIDAR';
      estadoValidacion = 'PENDIENTE_REVISION';
      progreso = 50;
    }
    
    parsedRows.push({
      localidadName,
      hitoName,
      actCodigo,
      actNombre,
      fechaInicio,
      fechaFin,
      valor,
      estadoLocal,
      estadoValidacion,
      progreso
    });
  }
  
  // Group by (Localidad, Hito, ActNombre) to handle repetitions
  const grouped = new Map<string, any[]>();
  for (const row of parsedRows) {
    const key = `${row.localidadName}|${row.hitoName}|${row.actNombre}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(row);
  }
  
  // Find Localidades
  const localidades = await prisma.localidad.findMany();
  const locMap = new Map(localidades.map(l => [l.nombre, l.id]));

  console.log(Iterating grouped... size:  + grouped.size); for (const [key, rows] of Array.from(grouped.entries())) {
    const [localidadName, hitoName, actNombre] = key.split('|');
    const locId = locMap.get(localidadName);
    
    if (!locId) {
      console.log(`Localidad no encontrada: ${localidadName}`);
      continue;
    }

    // Ensure Hito exists under P08
    let hito = await prisma.hito.findFirst({
      where: {
        nombre: hitoName,
        programaId: programa.id
      }
    });

    if (!hito) {
      hito = await prisma.hito.create({
        data: {
          nombre: hitoName,
          codigo: hitoName.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
          programaId: programa.id,
          fechaLimite: new Date('2028-12-31')
        }
      });
    }

    // Total indicador (valor)
    const totalIndicador = rows.reduce((sum, r) => sum + r.valor, 0);
    console.log(Upserting acts for  + hitoName); const isRepetitive = rows.length > 1;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const finalActNombre = isRepetitive ? `${actNombre} (Repetición ${i + 1}/${rows.length})` : actNombre;
      const actCodigo = isRepetitive ? `${row.actCodigo}-${i+1}` : row.actCodigo;
      
      // Upsert activity just in case it already exists
      console.log(Upserting:  + actCodigo); const newAct = await prisma.actividad.upsert({
        where: { codigoCompleto: actCodigo },
        create: {
          nombre: finalActNombre,
          codigoCompleto: actCodigo,
          hitoId: hito.id,
          fechaInicio: row.fechaInicio,
          fechaLimite: row.fechaFin,
          indicadorMeta: totalIndicador, 
          indicadorUnidad: 'Porcentaje',
          creadoPor: 'SYSTEM'
        },
        update: {
          nombre: finalActNombre,
          fechaInicio: row.fechaInicio,
          fechaLimite: row.fechaFin,
          indicadorMeta: totalIndicador,
        }
      });

      // Create AsignacionLocalidad
      const existingAsig = await prisma.asignacionLocalidad.findUnique({
        where: {
          actividadId_localidadId: {
            actividadId: newAct.id,
            localidadId: locId
          }
        }
      });

      if (!existingAsig) {
        await prisma.asignacionLocalidad.create({
          data: {
            actividadId: newAct.id,
            localidadId: locId,
            estadoLocal: row.estadoLocal as any,
            estadoValidacion: row.estadoValidacion as any,
            porcentajeAvance: row.progreso,
          }
        });
      } else {
        await prisma.asignacionLocalidad.update({
          where: { id: existingAsig.id },
          data: {
            estadoLocal: row.estadoLocal as any,
            estadoValidacion: row.estadoValidacion as any,
            porcentajeAvance: row.progreso,
          }
        });
      }
    }
  }

  console.log("Importación de Rollos Legendarios finalizada con éxito.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
