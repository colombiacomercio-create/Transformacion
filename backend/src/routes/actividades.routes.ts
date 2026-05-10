import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.get('/', azureADAuth, async (req: Request, res: Response) => {
  try {
    const actividades = await prisma.actividad.findMany({
      include: {
        hito: {
          include: {
            programa: {
              include: {
                objetivo: true
              }
            }
          }
        },
        asignaciones: {
          include: {
            localidad: true,
            responsable: true
          }
        },
        evidencias: true
      }
    });
    res.json(actividades);
  } catch (error) {
    console.error('Error fetching actividades:', error);
    res.status(500).json({ error: 'Error fetching actividades' });
  }
});

export default router;