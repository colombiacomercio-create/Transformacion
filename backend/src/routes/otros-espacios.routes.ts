import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.get('/', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const { tipo } = req.query;
    const items = await prisma.otroEspacioArticulacion.findMany({
      where: tipo ? { tipo: String(tipo) } : {},
      include: { creadoPor: { select: { id: true, nombre: true } } },
      orderBy: { fecha: 'desc' },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo espacios de articulación' });
  }
});

router.post('/', azureADAuth, async (req: AuthRequest, res) => {
  const { tipo, nombre, fecha, descripcion, resultados } = req.body;
  try {
    const item = await prisma.otroEspacioArticulacion.create({
      data: {
        tipo, nombre, fecha: new Date(fecha),
        descripcion: descripcion || null,
        resultados: resultados || null,
        creadoPorId: req.user!.id,
      },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando espacio de articulación' });
  }
});

router.patch('/:id', azureADAuth, async (req: AuthRequest, res) => {
  const { nombre, fecha, descripcion, resultados } = req.body;
  try {
    const item = await prisma.otroEspacioArticulacion.update({
      where: { id: req.params.id },
      data: {
        ...(nombre && { nombre }),
        ...(fecha && { fecha: new Date(fecha) }),
        ...(descripcion !== undefined && { descripcion }),
        ...(resultados !== undefined && { resultados }),
      },
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando espacio de articulación' });
  }
});

export default router;
