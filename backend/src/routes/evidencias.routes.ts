import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, requireRole, AuthRequest } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

// Importando la integración con Supabase Storage (1GB Gratuito)
import { uploadFileToSupabase } from '../services/supabase.service';

// Pasamos de disco local a Memoria (RAM) para enviar directo a la nube sin tocar disco
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  // LÍMITE ESTRICTO APLICADO: 10 Megabytes máximo por archivo permitido
  limits: { fileSize: 10 * 1024 * 1024 } 
});

const SHAREPOINT_ROLLOS_2026_URL = 'https://gobiernobogota.sharepoint.com/:f:/s/Prueba939/IgBdPBai3S26Q6YqovlhsXgWAaA-7XazLIooMvRu_6M6McA?e=WYlxko';

// Cualquier usuario autenticado puede cargar evidencia y comentar avance sobre una actividad
router.post('/upload/:actividadId', azureADAuth, (req: any, res: any, next: any) => {
  upload.single('archivo')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'El archivo excede el tamaño máximo permitido de 10 MB.',
          detalles: `Si el archivo pesa más de 10 MB, cárguelo en la carpeta ROLLOS 2026 del drive de Transformación (${SHAREPOINT_ROLLOS_2026_URL}) y tome una captura de pantalla que evidencie el cargue para subirla junto a su comentario.`,
          sharepointUrl: SHAREPOINT_ROLLOS_2026_URL
        });
      }
      return res.status(400).json({ error: err.message || 'Error procesando el archivo adjunto' });
    }
    next();
  });
}, async (req: AuthRequest, res) => {
  try {
    const { actividadId } = req.params;
    const { tipoEvidencia, descripcion, localidadId, comentarioAdjunto, nuevoEstado } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    if (!comentarioAdjunto || comentarioAdjunto.trim() === '') {
      return res.status(400).json({ error: 'Debe agregar un comentario obligatorio describiendo la ejecución' });
    }

    // Resolver localidadId de manera robusta (evita errores con 'undefined' o strings no-UUID)
    let locFinalId: string = '';
    const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

    if (isUuid(localidadId)) {
      locFinalId = localidadId.trim();
    } else {
      const asig = await prisma.asignacionLocalidad.findFirst({
        where: { actividadId },
        select: { localidadId: true }
      });
      if (asig?.localidadId) {
        locFinalId = asig.localidadId;
      } else {
        const primeraLoc = await prisma.localidad.findFirst({ select: { id: true } });
        locFinalId = primeraLoc?.id || '';
      }
    }

    if (!locFinalId) {
      return res.status(400).json({ error: 'No se encontró localidad asociada para registrar la evidencia' });
    }

    console.log(`Subiendo archivo de ${Math.round(req.file.size / 1024 / 1024)} MB a Supabase Storage...`);
    
    // Aquí ocurre la magia: Mandamos el buffer en memoria directo al Bucket de Supabase
    const cloudUrlStr = await uploadFileToSupabase(
        req.file.originalname, 
        req.file.buffer, 
        req.file.mimetype
    );

    // Opción B: Si el usuario que sube evidencia es OBSERVADOR promover a GESTOR y sumarlo a correosNotificacion
    const userEmailLower = (req.user?.email || '').toLowerCase().trim();
    if (userEmailLower) {
      if (req.user?.rol === 'OBSERVADOR') {
        await prisma.usuario.update({
          where: { id: req.user.id },
          data: { rol: 'GESTOR' }
        });
        req.user.rol = 'GESTOR';
      }
      const act = await prisma.actividad.findUnique({ where: { id: actividadId } });
      if (act) {
        const correosActuales = (act.correosNotificacion || []).map((c: string) => c.toLowerCase().trim());
        if (!correosActuales.includes(userEmailLower)) {
          await prisma.actividad.update({
            where: { id: actividadId },
            data: { correosNotificacion: [...correosActuales, userEmailLower] }
          });
        }
      }
    }

    const evidencia = await prisma.evidencia.create({
      data: {
        actividadId,
        localidadId: locFinalId,
        subidoPorId: req.user.id,
        tipoEvidencia: tipoEvidencia || 'documento',
        nombreArchivo: req.file.originalname,
        urlArchivo: cloudUrlStr, // Guardamos la URL pública nativa de Supabase Storage
        descripcion,
        comentarioAdjunto
      }
    });

    // Registrar comentario en el hilo de chat con el archivo adjunto
    await prisma.comentario.create({
      data: {
        texto: `📎 Evidencia adjunta: ${req.file.originalname}\n${comentarioAdjunto}`,
        actividadId,
        localidadId: locFinalId,
        autorId: req.user.id
      }
    });

    // Si se especificó cambio de estado al cargar la evidencia
    if (nuevoEstado) {
      let normalizedEstado: any = 'NO_INICIADA';
      let actEstado: any = 'PENDIENTE';
      if (nuevoEstado === 'COMPLETA_SIN_VALIDAR' || nuevoEstado === 'COMPLETADA') {
        normalizedEstado = 'COMPLETA_SIN_VALIDAR';
        actEstado = 'COMPLETADA';
      } else if (nuevoEstado === 'EN_CURSO_SIN_VALIDAR' || nuevoEstado === 'EN_CURSO') {
        normalizedEstado = 'EN_CURSO_SIN_VALIDAR';
        actEstado = 'EN_PROGRESO';
      } else {
        normalizedEstado = 'NO_INICIADA';
        actEstado = 'PENDIENTE';
      }

      const asig = await prisma.asignacionLocalidad.findFirst({
        where: { actividadId, ...(locFinalId ? { localidadId: locFinalId } : {}) }
      });
      if (asig) {
        const act = await prisma.actividad.findUnique({ where: { id: actividadId } });
        const meta = act?.indicadorMeta || 0;
        let avance = 0;
        if (normalizedEstado === 'COMPLETA_SIN_VALIDAR') avance = meta;
        else if (normalizedEstado === 'EN_CURSO_SIN_VALIDAR') avance = meta * 0.5;

        await prisma.asignacionLocalidad.update({
          where: { id: asig.id },
          data: {
            estadoLocal: normalizedEstado,
            ...(asig.estadoValidacion === 'PENDIENTE_REVISION' ? { porcentajeAvance: avance } : {})
          }
        });
        await prisma.actividad.update({
          where: { id: actividadId },
          data: { estado: actEstado }
        });
      }
    }

    // Disparar prechequeo de IA de forma asíncrona en segundo plano sin bloquear respuesta HTTP
    import('../services/ai.service').then(async (aiService) => {
      try {
        const actividad = await prisma.actividad.findUnique({ where: { id: actividadId } });
        if (actividad) {
          const fileBase64 = req.file?.buffer.toString('base64') || null;
          const mimeType = req.file?.mimetype || null;
          
          const prechequeo = await aiService.prechequearEvidencia(
            actividad.descripcion || actividad.nombre,
            actividad.tiposEvidenciaRequeridos,
            fileBase64,
            mimeType,
            comentarioAdjunto
          );
          
          await prisma.evidencia.update({
            where: { id: evidencia.id },
            data: {
              prechequeoEstado: prechequeo.prechequeoEstado as any,
              prechequeoPuntaje: prechequeo.prechequeoPuntaje,
              prechequeoFeedback: prechequeo.prechequeoFeedback,
              fechaAnalisisIA: new Date()
            }
          });
          console.log(`[IA Prechequeo] Evidencia ${evidencia.id} procesada. Resultado: ${prechequeo.prechequeoEstado}`);
        }
      } catch (err) {
        console.error("⚠️ Error disparando pre-chequeo automático de IA:", err);
      }
    }).catch(err => console.error("⚠️ Error importando servicio de IA para prechequeo:", err));

    res.status(201).json(evidencia);
  } catch (error: any) {
    console.error('[Evidencias Upload Error]:', error);
    res.status(500).json({ 
      error: 'Error cargando la evidencia',
      detalles: error?.message || String(error)
    });
  }
});

export default router;
