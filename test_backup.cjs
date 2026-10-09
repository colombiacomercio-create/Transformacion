const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: 'backend/.env' });

const prisma = new PrismaClient();

async function testBackup() {
  try {
    console.log('Iniciando prueba de backup local...');
    
    const actividades = await prisma.actividad.findMany();
    const asignaciones = await prisma.asignacionLocalidad.findMany();
    const alertas = await prisma.alerta.findMany();
    const fichasAlerta = await prisma.fichaAlerta.findMany();
    const actualizaciones = await prisma.actualizacionAlerta.findMany();
    const comentarios = await prisma.comentario.findMany();
    const evidencias = await prisma.evidencia.findMany();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      totales: {
        actividades: actividades.length,
        alertas: alertas.length,
        fichasAlerta: fichasAlerta.length
      },
      actividades,
      asignaciones,
      alertas,
      fichasAlerta,
      actualizaciones,
      comentarios,
      evidencias
    };

    const jsonString = JSON.stringify(backupData);
    const fileName = `backup-test-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
    
    if (!supabaseUrl || !serviceRoleKey) {
        console.error('ERROR: Falta configurar SUPABASE_SERVICE_ROLE_KEY en el archivo backend/.env');
        return;
    }

    const uploadUrl = `${supabaseUrl}/storage/v1/object/backups/${fileName}`;
    console.log(`Subiendo archivo ${fileName} a Supabase...`);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: jsonString
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Fallo subiendo el backup a Supabase:', errorText);
    } else {
        console.log('ÉXITO: Backup de prueba creado y subido correctamente a Supabase.');
    }
  } catch (error) {
    console.error('Error generando backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBackup();
