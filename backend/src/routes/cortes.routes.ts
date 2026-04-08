import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, AuthRequest, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Obtener cortes con reportes
router.get('/', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const cortes = await prisma.corteMensual.findMany({
      orderBy: { fechaLimite: 'desc' },
      include: {
         reportes: true
      }
    });
    res.json(cortes);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo cortes' });
  }
});

// Guardar informacion cualitativa para un objetivo en un corte
router.patch('/:corteId/objetivo/:objetivoId', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  const { corteId, objetivoId } = req.params;
  const { principalesAvances, alertasRecomendaciones } = req.body;

  try {
    const reporte = await prisma.reporteCualitativo.upsert({
       where: { objetivoId_corteId: { objetivoId, corteId } },
       create: {
          corteId,
          objetivoId,
          principalesAvances,
          alertasRecomendaciones
       },
       update: {
          principalesAvances,
          alertasRecomendaciones
       }
    });
    res.json(reporte);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando reporte' });
  }
});

export default router;
