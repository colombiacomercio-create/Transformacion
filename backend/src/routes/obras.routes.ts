import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/obras/dashboard - Fetch all data for the dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const frentes = await prisma.frenteObra.findMany();
    const alertas = await prisma.alertaObra.findMany();
    const metadatos = await prisma.metadatoObra.findMany({ take: 1 });

    res.json({
      frentes,
      alertas,
      metadatos
    });
  } catch (error) {
    console.error('Error fetching obras dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/obras/upload - Receive parsed Excel data and update DB
router.post('/upload', async (req, res) => {
  const { frentes, alertas, fechaCorte } = req.body;

  if (!frentes || !alertas || !fechaCorte) {
    return res.status(400).json({ error: 'Missing frentes, alertas or fechaCorte in body' });
  }

  try {
    // Delete all old data
    await prisma.frenteObra.deleteMany({});
    await prisma.alertaObra.deleteMany({});
    await prisma.metadatoObra.deleteMany({});

    // Insert new metadata
    await prisma.metadatoObra.create({
      data: { fecha_corte: fechaCorte }
    });

    // We use createMany for bulk insertion
    if (frentes.length > 0) {
      await prisma.frenteObra.createMany({
        data: frentes
      });
    }

    if (alertas.length > 0) {
      await prisma.alertaObra.createMany({
        data: alertas
      });
    }

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error uploading obras data:', error);
    res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
});

export default router;
