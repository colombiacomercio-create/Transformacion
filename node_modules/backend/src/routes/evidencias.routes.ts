import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, requireRole, AuthRequest } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

// Configuración básica de Multer para uso local en /uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
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

    const fileUrl = `/uploads/${req.file.filename}`;
    const locFinalId = localidadId || (await prisma.localidad.findFirst())?.id;

    const evidencia = await prisma.evidencia.create({
      data: {
        actividadId,
        localidadId: locFinalId,
        subidoPorId: req.user.id,
        tipoEvidencia: tipoEvidencia || 'documento',
        nombreArchivo: req.file.originalname,
        urlArchivo: fileUrl,
        descripcion,
        comentarioAdjunto
      }
    });

    // Crear en el hilo de comentarios para que sea visible de inmediato
    await prisma.comentario.create({
      data: {
        actividadId,
        localidadId: locFinalId,
        autorId: req.user.id,
        texto: `[Adjuntó evidencia: ${req.file.originalname}] ${comentarioAdjunto}`
      }
    });

    res.status(201).json(evidencia);
  } catch (error) {
    res.status(500).json({ error: 'Error cargando la evidencia' });
  }
});

export default router;
