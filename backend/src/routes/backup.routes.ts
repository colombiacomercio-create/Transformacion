import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Ruta protegida que ejecuta el backup (Será llamada por Vercel Cron)
router.post('/', async (req, res) => {
  // 1. Verificación básica de seguridad: 
  // Usamos un secreto para que nadie externo pueda saturar la base de datos pidiendo backups.
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    console.log('Iniciando backup automático...');
    
    // 2. Recopilar todas las tablas críticas que no queremos perder nunca más
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
    
    // 3. Crear el nombre del archivo (Ej: backup-2026-09-29T12-00-00.json)
    const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
    
    if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el .env' });
    }

    // 4. Subir directamente al bucket "backups" en Supabase Storage
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

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Fallo subiendo el backup a Supabase:', errorText);
        return res.status(500).json({ error: 'Error subiendo archivo', details: errorText });
    }

    console.log('Backup completado:', fileName);
    res.json({ message: 'Backup creado exitosamente y guardado en Supabase', fileName });
  } catch (error: any) {
    console.error('Error generando backup:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
});

export default router;
