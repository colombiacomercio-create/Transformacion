import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, AuthRequest } from '../middlewares/auth.middleware';
import multer from 'multer';
import { uploadFileToSupabase } from '../services/supabase.service';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.get('/', azureADAuth, async (_req, res) => {
  try {
    const eventos = await prisma.evento.findMany({
      include: { creadoPor: { select: { id: true, nombre: true } } },
      orderBy: { fecha: 'desc' },
    });
    res.json(eventos);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo eventos' });
  }
});

router.post('/', azureADAuth, upload.single('archivo'), async (req: AuthRequest, res) => {
  const { tipo, nombre, fecha, lugar, descripcion, resultados } = req.body;
  try {
    let urlArchivo: string | null = null;
    if (req.file) {
      urlArchivo = await uploadFileToSupabase(req.file.originalname, req.file.buffer, req.file.mimetype);
    }
    const evento = await prisma.evento.create({
      data: {
        tipo, nombre, fecha: new Date(fecha), lugar,
        descripcion: descripcion || null,
        resultados: resultados || null,
        urlArchivo,
        creadoPorId: req.user!.id,
      },
    });
    res.status(201).json(evento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando evento' });
  }
});

router.patch('/:id', azureADAuth, async (req: AuthRequest, res) => {
  const { nombre, fecha, lugar, descripcion, resultados } = req.body;
  try {
    const evento = await prisma.evento.update({
      where: { id: req.params.id },
      data: {
        ...(nombre && { nombre }),
        ...(fecha && { fecha: new Date(fecha) }),
        ...(lugar && { lugar }),
        ...(descripcion !== undefined && { descripcion }),
        ...(resultados !== undefined && { resultados }),
      },
    });
    res.json(evento);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando evento' });
  }
});

export default router;
