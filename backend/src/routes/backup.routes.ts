import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    console.log('Iniciando backup automático (COMPLETO)...');
    
    // Todas las tablas principales
    const actividades = await prisma.actividad.findMany();
    const asignaciones = await prisma.asignacionLocalidad.findMany();
    const alertas = await prisma.alerta.findMany();
    const fichasAlerta = await prisma.fichaAlerta.findMany();
    const actualizaciones = await prisma.actualizacionAlerta.findMany();
    const comentarios = await prisma.comentario.findMany();
    const evidencias = await prisma.evidencia.findMany();
    
    // Tablas adicionales solicitadas (Reuniones, Mesas, Informes, etc)
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

    const jsonString = JSON.stringify(backupData);
    const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
    
    if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el .env' });
    }

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
        return res.status(500).json({ error: 'Error subiendo archivo', details: errorText });
    }

    res.json({ message: 'Backup creado exitosamente y guardado en Supabase', fileName });
  } catch (error: any) {
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
});

export default router;
