import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, AuthRequest, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Obtener cortes con reportes (ordenados cronológicamente)
router.get('/', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const cortes = await prisma.corteMensual.findMany({
      orderBy: { fechaLimite: 'asc' },
      include: {
         reportes: true
      }
    });
    res.json(cortes);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo cortes' });
  }
});

// Crear un nuevo corte (ej: "15 de Noviembre de 2026")
router.post('/', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { nombre, fechaLimite, esActivo } = req.body;
    if (!nombre || !fechaLimite) {
      return res.status(400).json({ error: 'Nombre y fechaLimite son requeridos' });
    }

    if (esActivo) {
      await prisma.corteMensual.updateMany({ data: { esActivo: false } });
    }

    const nuevoCorte = await prisma.corteMensual.create({
      data: {
        nombre,
        fechaLimite: new Date(fechaLimite),
        esActivo: !!esActivo
      }
    });
    res.status(201).json(nuevoCorte);
  } catch (error) {
    res.status(500).json({ error: 'Error creando corte mensual' });
  }
});

// Activar un corte específico como corte activo
router.patch('/:corteId/activar', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  const { corteId } = req.params;
  try {
    await prisma.corteMensual.updateMany({ data: { esActivo: false } });
    const activado = await prisma.corteMensual.update({
      where: { id: corteId },
      data: { esActivo: true }
    });
    res.json(activado);
  } catch (error) {
    res.status(500).json({ error: 'Error activando corte' });
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
