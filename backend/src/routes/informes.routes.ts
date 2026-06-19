import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, AuthRequest } from '../middlewares/auth.middleware';
import multer from 'multer';
import { uploadFileToSupabase } from '../services/supabase.service';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.get('/', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const { tipo, periodo } = req.query;
    const informes = await prisma.informe.findMany({
      where: {
        ...(tipo ? { tipo: String(tipo) } : {}),
        ...(periodo ? { periodo: String(periodo) } : {}),
      },
      include: { creadoPor: { select: { id: true, nombre: true } } },
      orderBy: { fechaCreacion: 'desc' },
    });
    res.json(informes);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo informes' });
  }
});

router.post('/', azureADAuth, upload.single('archivo'), async (req: AuthRequest, res) => {
  const { tipo, titulo, periodo, descripcion } = req.body;
  try {
    let urlArchivo: string | null = null;
    if (req.file) {
      urlArchivo = await uploadFileToSupabase(req.file.originalname, req.file.buffer, req.file.mimetype);
    }
    const informe = await prisma.informe.create({
      data: { tipo, titulo, periodo, descripcion: descripcion || null, urlArchivo, creadoPorId: req.user!.id },
    });
    res.status(201).json(informe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando informe' });
  }
});

router.delete('/:id', azureADAuth, async (req: AuthRequest, res) => {
  try {
    await prisma.informe.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando informe' });
  }
});

export default router;
