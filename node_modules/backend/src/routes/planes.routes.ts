import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, requireRole, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Obtener los planes
router.get('/', azureADAuth, async (req, res) => {
  try {
    const planes = await prisma.plan.findMany({
      include: {
        objetivos: {
          include: {
            programas: {
              include: { hitos: true }
            }
          }
        }
      }
    });
    res.json(planes);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo los planes' });
  }
});

// Crear un plan (Solo Admin)
router.post('/', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { nombre, ano, descripcion } = req.body;
    const nuevoPlan = await prisma.plan.create({
      data: {
        nombre,
        ano: parseInt(ano),
        descripcion,
        creadoPor: req.user.id
      }
    });
    res.status(201).json(nuevoPlan);
  } catch (error) {
    res.status(500).json({ error: 'Error creando el plan' });
  }
});

export default router;
