import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.get('/', azureADAuth, async (_req, res) => {
  try {
    const items = await prisma.seguimientoNormativo.findMany({
      include: { creadoPor: { select: { id: true, nombre: true } } },
      orderBy: { fechaCreacion: 'desc' },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo seguimientos normativos' });
  }
});

router.post('/', azureADAuth, async (req: AuthRequest, res) => {
  const { tipo, nombre, descripcion, estado, avances, urlDocumento } = req.body;
  try {
    const item = await prisma.seguimientoNormativo.create({
      data: {
        tipo, nombre,
        descripcion: descripcion || null,
        estado: estado || 'EN_FORMULACION',
        avances: avances || null,
        urlDocumento: urlDocumento || null,
        creadoPorId: req.user!.id,
      },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando seguimiento normativo' });
  }
});

router.patch('/:id', azureADAuth, async (req: AuthRequest, res) => {
  const { nombre, descripcion, estado, avances, urlDocumento } = req.body;
  try {
    const item = await prisma.seguimientoNormativo.update({
      where: { id: req.params.id },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(estado && { estado }),
        ...(avances !== undefined && { avances }),
        ...(urlDocumento !== undefined && { urlDocumento }),
      },
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando seguimiento normativo' });
  }
});

export default router;
