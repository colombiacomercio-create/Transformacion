const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: 'backend/.env' });

const prisma = new PrismaClient();

async function testBackup() {
  try {
    console.log('Iniciando prueba de backup COMPLETO local...');
    
    const actividades = await prisma.actividad.findMany();
    const asignaciones = await prisma.asignacionLocalidad.findMany();
    const alertas = await prisma.alerta.findMany();
    const fichasAlerta = await prisma.fichaAlerta.findMany();
    const actualizaciones = await prisma.actualizacionAlerta.findMany();
    const comentarios = await prisma.comentario.findMany();
    const evidencias = await prisma.evidencia.findMany();
    
    // Agregados
    const reuniones = await prisma.reunion.findMany();
    const asistentesReunion = await prisma.asistenteReunion.findMany();
    const compromisosReunion = await prisma.compromisoReunion.findMany();
    const informes = await prisma.informe.findMany();
    const eventos = await prisma.evento.findMany();
    const seguimientoNormativo = await prisma.seguimientoNormativo.findMany();
    const otrosEspacios = await prisma.otroEspacioArticulacion.findMany();
    const frenteObra = await prisma.frenteObra.findMany();
    const alertaObra = await prisma.alertaObra.findMany();
    const metadatoObra = await prisma.metadatoObra.findMany();

    const backupData = {
      timestamp: new Date().toISOString(),
      totales: {
        actividades: actividades.length,
        reuniones: reuniones.length,
        otrosEspacios: otrosEspacios.length
      },
      actividades,
      asignaciones,
      alertas,
      fichasAlerta,
      actualizaciones,
      comentarios,
      evidencias,
      reuniones,
      asistentesReunion,
      compromisosReunion,
      informes,
      eventos,
      seguimientoNormativo,
      otrosEspacios,
      frenteObra,
      alertaObra,
      metadatoObra
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const fileName = `backup-test-COMPLETO-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    // Guardarlo tambin en descargas localmente como pidi el usuario para verificar
    const fs = require('fs');
    const path = require('path');
    // Obtenemos la ruta de descargas del usuario de windows
    const downloadsPath = path.join(process.env.USERPROFILE, 'Downloads', fileName);
    fs.writeFileSync(downloadsPath, jsonString);
    console.log(`Backup guardado localmente en: ${downloadsPath}`);

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
    
    if (supabaseUrl && serviceRoleKey) {
        const uploadUrl = `${supabaseUrl}/storage/v1/object/backups/${fileName}`;
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          },
          body: jsonString
        });

        if (response.ok) {
            console.log('Backup COMPLETO subido a Supabase exitosamente.');
        } else {
            console.error('Error subiendo a supabase:', await response.text());
        }
    }
  } catch (error) {
    console.error('Error generando backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBackup();
