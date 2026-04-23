import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = "C:\\Users\\Roberto Carlos\\Downloads\\10. Transformación 2026 Engativa.xlsx";
  console.log('Leyendo archivo:', filePath);

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data: any[][] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

  // 1. Limpiar datos de Actividades, Asignaciones, Objetivos y Programas
  console.log('Limpiando base de datos...');
  // Borrado delegado al script seed.ts para evitar timeoutes de PostgreSQL

  const plan = await prisma.plan.findFirst();
  if (!plan) throw new Error('No hay Plan Estrategico. Por favor corre el seed inicial primero.');

  const localidades = await prisma.localidad.findMany();
  if (localidades.length === 0) throw new Error('No hay localidades.');

  // Usuario admin
  let adminUser = await prisma.usuario.findFirst({ where: { rol: 'ADMIN' } });
  if (!adminUser) adminUser = await prisma.usuario.findFirst();

  let insertCount = 0;

  // Objetivos Map
  const objetivosCreados = new Map<string, string>();
  
  const NOMBRES_PRODUCTOS: Record<string, string> = {
     'P01': 'Ejecución Presupuestal',
     'P02': 'Obras locales',
     'P03': 'Espacio Público',
     'P04': 'Seguridad y Convivencia',
     'P05': 'Inspección, Vigilancia y Control',
     'P06': 'Gestión del Riesgo',
     'P07': 'Participación Ciudadana',
     'P08': 'Memoria Histórica',
     'P09': 'Fortalecimiento Institucional',
     'P10': 'Diálogo Social'
  };

  // Creación incondicional de los 10 productos base para que la Interfaz siempre los relacione
  const objGen = await prisma.objetivoEstrategico.create({
      data: { codigo: 'O_BASE', nombre: 'Objetivos Estructurales', descripcion: 'Base Distrital', planId: plan.id, orden: 1 }
  });
  
  const programasCreados = new Map<string, string>();
  for (const [cod, nom] of Object.entries(NOMBRES_PRODUCTOS)) {
      const p = await prisma.programa.create({
          data: { codigo: cod, nombre: nom, objetivoId: objGen.id }
      });
      programasCreados.set(cod, p.id);
  }
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 5) continue;

    const actNameData = row[1] || '';
    const objNameData = row[2] || '';
    // state = row[3] -> ignoring, we force to NO_INICIADA globally as default starting point
    // const importance = row[4]
    const respStr = row[5] || ''; // Responsables
    let dateData = row[7] || null;

    if (!actNameData) continue;

    // Procesar fecha (Excel numeric dates)
    let finalDate = new Date(); // fallback
    if (typeof dateData === 'number') {
       finalDate = new Date((dateData - (25567 + 2)) * 86400 * 1000);
    } else if (typeof dateData === 'string') {
       // ej 17/03/2026
       const parts = dateData.split('/');
       if (parts.length === 3) {
          finalDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
       } else {
          finalDate = new Date(dateData);
       }
    }

    // Asegurar Objetivo (Ej. "O3. Espacio Público")
    const objCode = objNameData.split('.')[0] || 'O_GEN';
    let objetivoId = objetivosCreados.get(objCode);
    
    if (!objetivoId && objCode) {
        const o = await prisma.objetivoEstrategico.create({
           data: {
             codigo: objCode,
             nombre: objNameData,
             descripcion: objNameData,
             planId: plan.id,
             orden: 1
           }
        });
        objetivoId = o.id;
        objetivosCreados.set(objCode, o.id);
    }

    const prodCodeRaw = actNameData.split('.')[0] || 'P_GEN'; // P01
    let prodCode = prodCodeRaw;
    if (prodCode === 'P1') prodCode = 'P01';
    if (prodCode === 'P2') prodCode = 'P02';
    if (prodCode === 'P3') prodCode = 'P03';
    if (prodCode === 'P4') prodCode = 'P04';
    if (prodCode === 'P5') prodCode = 'P05';
    if (prodCode === 'P6') prodCode = 'P06';
    if (prodCode === 'P7') prodCode = 'P07';
    if (prodCode === 'P8') prodCode = 'P08';
    if (prodCode === 'P9') prodCode = 'P09';

    let progId = programasCreados.get(prodCode);
    if (!progId) {
        // Fallback by creating it
        const fallbackObj = await prisma.objetivoEstrategico.findFirst({ where: { codigo: 'O_BASE' } });
        const fallbackP = await prisma.programa.create({
            data: { codigo: prodCode, nombre: `Producto Extra ${prodCode}`, objetivoId: fallbackObj!.id }
        });
        progId = fallbackP.id;
        programasCreados.set(prodCode, progId);
    }

    // Asegurar Hito
    const hitoStr = actNameData.split('.')[1] || 'H1';
    let hitoId = '';
    const h = await prisma.hito.findFirst({ where: { programaId: progId, nombre: hitoStr }});
    if (!h) {
       const nh = await prisma.hito.create({
          data: { 
             codigo: hitoStr,
             nombre: hitoStr, 
             descripcion: hitoStr, 
             programaId: progId,
             fechaLimite: finalDate
          }
       });
       hitoId = nh.id;
    } else hitoId = h.id;

    // Insertar Actividad
    const actCodigo = actNameData.substring(0, 50); // Just use a shortened code for DB

    const newAct = await prisma.actividad.create({
       data: {
          codigoCompleto: actCodigo + "_" + Date.now() + "_" + i, // Solo para que prisma no falle unicidad interna
          nombre: actNameData, // Guardar TODO el nombre exacto como aparece en Excel
          descripcion: `Responsables: ${respStr}\n\n${row[17] || ''}`, // Adds column R text
          hitoId: hitoId,
          fechaInicio: new Date(),
          fechaLimite: finalDate,
          estado: 'PENDIENTE',
          indicadorMeta: 0,
          indicadorUnidad: 'Unidad',
          creadoPor: adminUser?.id || 'simulated'
       }
    });

    // Parse local state
    let estadoInicial = 'NO_INICIADA';
    const stateVal = (row[3] || '').trim().toLowerCase();
    if (stateVal === 'completado' || stateVal === 'completada') estadoInicial = 'COMPLETA_SIN_VALIDAR';
    else if (stateVal === 'en curso') estadoInicial = 'EN_CURSO_SIN_VALIDAR';

    for (const loc of localidades) {
       await prisma.asignacionLocalidad.create({
          data: {
             actividadId: newAct.id,
             localidadId: loc.id,
             estadoLocal: estadoInicial as any,
             estadoValidacion: 'PENDIENTE_REVISION'
          }
       });
    }
    insertCount++;
  }

  console.log(`✅ Transformación Completada. Plantamos ${insertCount} actividades en ${localidades.length} localidades = ${insertCount * localidades.length} expedientes vivos.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
