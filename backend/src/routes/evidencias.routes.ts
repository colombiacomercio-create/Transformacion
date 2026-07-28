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
  // LÍMITE ESTRICTO APLICADO: 20 Megabytes máximo por archivo permitido
  limits: { fileSize: 20 * 1024 * 1024 } 
});

router.post('/upload/:actividadId', azureADAuth, requireRole(['ADMIN', 'GESTOR']), upload.single('archivo'), async (req: AuthRequest, res) => {
  try {
    const { actividadId } = req.params;
    const { tipoEvidencia, descripcion, localidadId, comentarioAdjunto } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    if (!comentarioAdjunto || comentarioAdjunto.trim() === '') {
      return res.status(400).json({ error: 'Debe agregar un comentario obligatorio describiendo la ejecución' });
    }

    const locFinalId = localidadId || (await prisma.localidad.findFirst())?.id;

    console.log(`Subiendo archivo de ${Math.round(req.file.size / 1024 / 1024)} MB a Supabase Storage...`);
    
    // Aquí ocurre la magia: Mandamos el buffer en memoria directo al Bucket de Supabase
    const cloudUrlStr = await uploadFileToSupabase(
        req.file.originalname, 
        req.file.buffer, 
        req.file.mimetype
    );

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

    // Crear en el hilo de comentarios para que sea visible de inmediato
    await prisma.comentario.create({
      data: {
        actividadId,
        localidadId: locFinalId,
        autorId: req.user.id,
        texto: `[Adjuntó evidencia en la Nube Corporativa: ${req.file.originalname}] ${comentarioAdjunto}`
      }
    });

    res.status(201).json(evidencia);
  } catch (error) {
    res.status(500).json({ error: 'Error cargando la evidencia' });
  }
});

export default router;
