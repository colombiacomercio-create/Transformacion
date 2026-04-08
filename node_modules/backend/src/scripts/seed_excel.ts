import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = "C:\\Users\\Roberto Carlos\\Downloads\\11. Transformación 2026 Suba.xlsx";
  console.log('Leyendo archivo:', filePath);

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data: any[][] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

  // 1. Limpiar datos de Actividades, Asignaciones, Objetivos y Programas
  console.log('Limpiando base de datos...');
  await prisma.fichaAlerta.deleteMany({});
  await prisma.reporteCualitativo.deleteMany({});
  await prisma.asignacionLocalidad.deleteMany({});
  await prisma.evidencia.deleteMany({});
  await prisma.comentario.deleteMany({});
  await prisma.subTarea.deleteMany({});
  await prisma.actividad.deleteMany({});
  await prisma.hito.deleteMany({});
  await prisma.programa.deleteMany({});
  await prisma.objetivoEstrategico.deleteMany({});

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
  // Code parsing regex for PXX
  // ej: P04.H2.A2.Intervención...
  
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

    // Asegurar Programa ficticio basado en el código P04
    const prodCode = actNameData.split('.')[0] || 'P_GEN'; // P04
    // Para simplificar, crearemos un programa generico para ese objetivo por que no tenemos la data exacta
    // Pero lo crearemos on-the-fly si no existe
    let prog = await prisma.programa.findFirst({ where: { codigo: prodCode, objetivoId: objetivoId } });
    if (!prog) {
       prog = await prisma.programa.create({
          data: {
             codigo: prodCode,
             nombre: `Producto ${prodCode}`,
             objetivoId: objetivoId!
          }
       });
    }

    // Asegurar Hito
    const hitoStr = actNameData.split('.')[1] || 'H1';
    let hitoId = '';
    const h = await prisma.hito.findFirst({ where: { programaId: prog.id, nombre: hitoStr }});
    if (!h) {
       const nh = await prisma.hito.create({
          data: { 
             codigo: hitoStr,
             nombre: hitoStr, 
             descripcion: hitoStr, 
             programaId: prog.id,
             fechaLimite: finalDate
          }
       });
       hitoId = nh.id;
    } else hitoId = h.id;

    // Insertar Actividad
    const partsName = actNameData.split('.');
    let cleanedName = actNameData;
    if (partsName.length >= 4) {
       cleanedName = partsName.slice(3).join('.').trim();
    }
    
    const actCodigo = partsName.slice(0, 3).join('.') + '_' + i; 

    const newAct = await prisma.actividad.create({
       data: {
          codigoCompleto: actCodigo,
          nombre: cleanedName || actNameData,
          descripcion: `Responsables: ${respStr}`,
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
