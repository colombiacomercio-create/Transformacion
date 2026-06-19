import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, requireRole, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// GET /api/ficha-resultados — lista de fichas (todas las fichas, orden desc)
router.get('/', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const fichas = await prisma.fichaResultados.findMany({
      include: { reportadoPor: { select: { id: true, nombre: true, email: true } } },
      orderBy: { periodo: 'desc' },
    });
    res.json(fichas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo fichas de resultados' });
  }
});

// GET /api/ficha-resultados/ultima — última ficha registrada
router.get('/ultima', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const ficha = await prisma.fichaResultados.findFirst({
      include: { reportadoPor: { select: { id: true, nombre: true } } },
      orderBy: { periodo: 'desc' },
    });
    res.json(ficha);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo última ficha' });
  }
});

// POST /api/ficha-resultados — crear nueva ficha (solo ADMIN)
router.post('/', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  const data = req.body;
  try {
    const ficha = await prisma.fichaResultados.create({
      data: {
        periodo: new Date(data.periodo),
        compromisosPct: data.compromisosPct ?? null,
        girosPct: data.girosPct ?? null,
        procesosMonitoreados: data.procesosMonitoreados ?? null,
        procesosRequierenComite: data.procesosRequierenComite ?? null,
        alertaEjecucion: data.alertaEjecucion ?? null,
        metaObras: data.metaObras ?? null,
        intervencionesFinalizadas: data.intervencionesFinalizadas ?? null,
        kmCarrilIntervenido: data.kmCarrilIntervenido ?? null,
        kmIntervenidos: data.kmIntervenidos ?? null,
        alertaObras: data.alertaObras ?? null,
        comitesRealizados: data.comitesRealizados ?? null,
        comitesMeta: data.comitesMeta ?? null,
        alertaComites: data.alertaComites ?? null,
        accionesReportadas: data.accionesReportadas ?? null,
        residuosM3: data.residuosM3 ?? null,
        espacioPublicoM2: data.espacioPublicoM2 ?? null,
        puntosIntervenidos: data.puntosIntervenidos ?? null,
        ventaInformal: data.ventaInformal ?? null,
        orgParqueo: data.orgParqueo ?? null,
        m2RecuperadosInformal: data.m2RecuperadosInformal ?? null,
        personasReubicadas: data.personasReubicadas ?? null,
        motosContratadas: data.motosContratadas ?? null,
        motosPendientesFdl: data.motosPendientesFdl ?? null,
        motosAlmacenFdl: data.motosAlmacenFdl ?? null,
        motosEntregadas: data.motosEntregadas ?? null,
        alertaConvivencia: data.alertaConvivencia ?? null,
        archivosPct: data.archivosPct ?? null,
        metaArchivos: data.metaArchivos ?? null,
        fallosPrimeraEstanciaPct: data.fallosPrimeraEstanciaPct ?? null,
        metaFallos: data.metaFallos ?? null,
        estrategiasResueltas: data.estrategiasResueltas ?? null,
        estrategiasFormulacion: data.estrategiasFormulacion ?? null,
        rollosResueltos: data.rollosResueltos ?? null,
        rollosEnCurso: data.rollosEnCurso ?? null,
        alertaRollos: data.alertaRollos ?? null,
        observaciones: data.observaciones ?? null,
        reportadoPorId: req.user!.id,
      },
    });
    res.status(201).json(ficha);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando ficha de resultados' });
  }
});

// PATCH /api/ficha-resultados/:id — editar ficha (solo ADMIN)
router.patch('/:id', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const ficha = await prisma.fichaResultados.update({
      where: { id },
      data: {
        ...(data.periodo && { periodo: new Date(data.periodo) }),
        ...Object.fromEntries(
          Object.entries(data).filter(([k]) => k !== 'periodo').map(([k, v]) => [k, v ?? null])
        ),
      },
    });
    res.json(ficha);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error actualizando ficha' });
  }
});

export default router;
