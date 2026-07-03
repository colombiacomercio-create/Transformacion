import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, requireRole, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

const incluyeReportadores = {
  reportadoPor: { select: { id: true, nombre: true, email: true } },
  ejecucionActPor: { select: { nombre: true } },
  obrasActPor: { select: { nombre: true } },
  comitesActPor: { select: { nombre: true } },
  espacioResiduosActPor: { select: { nombre: true } },
  espacioVentaActPor: { select: { nombre: true } },
  convivenciaActPor: { select: { nombre: true } },
  actuacionesActPor: { select: { nombre: true } },
  estrategiasActPor: { select: { nombre: true } },
  rollosActPor: { select: { nombre: true } },
};

// GET /api/ficha-resultados — lista de fichas (todas las fichas, orden desc)
router.get('/', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const fichas = await prisma.fichaResultados.findMany({
      include: incluyeReportadores,
      orderBy: { periodo: 'desc' },
    });
    res.json(fichas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo fichas de resultados' });
  }
});

// GET /api/ficha-resultados/periodo/:date — buscar ficha por fecha exacta
router.get('/periodo/:date', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const date = new Date(req.params.date);
    const ficha = await prisma.fichaResultados.findFirst({
      where: { periodo: date },
      include: incluyeReportadores
    });
    res.json(ficha || null);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo ficha por periodo' });
  }
});

// GET /api/ficha-resultados/ultima — última ficha registrada
router.get('/ultima', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const ficha = await prisma.fichaResultados.findFirst({
      include: incluyeReportadores,
      orderBy: { periodo: 'desc' },
    });
    res.json(ficha);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo última ficha' });
  }
});

// POST /api/ficha-resultados — crear o actualizar ficha
router.post('/', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  const data = req.body;
  try {
    const periodoDate = new Date(data.periodo);
    const secciones = data.seccionesActualizadas || [];
    const userId = req.user!.id;
    const ahora = periodoDate;

    const fields = {
      periodo: periodoDate,
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
      alertaEspacioResiduos: data.alertaEspacioResiduos ?? null,
      puntosIntervenidos: data.puntosIntervenidos ?? null,
      ventaInformal: data.ventaInformal ?? null,
      orgParqueo: data.orgParqueo ?? null,
      m2RecuperadosInformal: data.m2RecuperadosInformal ?? null,
      personasReubicadas: data.personasReubicadas ?? null,
      alertaEspacioVenta: data.alertaEspacioVenta ?? null,
      motosContratadas: data.motosContratadas ?? null,
      motosPendientesFdl: data.motosPendientesFdl ?? null,
      motosAlmacenFdl: data.motosAlmacenFdl ?? null,
      motosEntregadas: data.motosEntregadas ?? null,
      alertaConvivencia: data.alertaConvivencia ?? null,
      archivosPct: data.archivosPct ?? null,
      metaArchivos: data.metaArchivos ?? null,
      fallosPrimeraEstanciaPct: data.fallosPrimeraEstanciaPct ?? null,
      metaFallos: data.metaFallos ?? null,
      alertaActuaciones: data.alertaActuaciones ?? null,
      estrategiasResueltas: data.estrategiasResueltas ?? null,
      estrategiasFormulacion: data.estrategiasFormulacion ?? null,
      alertaEstrategias: data.alertaEstrategias ?? null,
      rollosResueltos: data.rollosResueltos ?? null,
      rollosEnCurso: data.rollosEnCurso ?? null,
      alertaRollos: data.alertaRollos ?? null,
      observaciones: data.observaciones ?? null,
      reportadoPorId: userId,
      
      ejecucionActPorId: data.ejecucionActPorId ?? null,
      ejecucionActEn: data.ejecucionActEn ? new Date(data.ejecucionActEn) : null,
      obrasActPorId: data.obrasActPorId ?? null,
      obrasActEn: data.obrasActEn ? new Date(data.obrasActEn) : null,
      comitesActPorId: data.comitesActPorId ?? null,
      comitesActEn: data.comitesActEn ? new Date(data.comitesActEn) : null,
      espacioResiduosActPorId: data.espacioResiduosActPorId ?? null,
      espacioResiduosActEn: data.espacioResiduosActEn ? new Date(data.espacioResiduosActEn) : null,
      espacioVentaActPorId: data.espacioVentaActPorId ?? null,
      espacioVentaActEn: data.espacioVentaActEn ? new Date(data.espacioVentaActEn) : null,
      convivenciaActPorId: data.convivenciaActPorId ?? null,
      convivenciaActEn: data.convivenciaActEn ? new Date(data.convivenciaActEn) : null,
      actuacionesActPorId: data.actuacionesActPorId ?? null,
      actuacionesActEn: data.actuacionesActEn ? new Date(data.actuacionesActEn) : null,
      estrategiasActPorId: data.estrategiasActPorId ?? null,
      estrategiasActEn: data.estrategiasActEn ? new Date(data.estrategiasActEn) : null,
      rollosActPorId: data.rollosActPorId ?? null,
      rollosActEn: data.rollosActEn ? new Date(data.rollosActEn) : null,

      // Mapear tracking si la seccion viene en el array
      ...(secciones.includes('ejecucion') && { ejecucionActPorId: userId, ejecucionActEn: ahora }),
      ...(secciones.includes('obras') && { obrasActPorId: userId, obrasActEn: ahora }),
      ...(secciones.includes('comites') && { comitesActPorId: userId, comitesActEn: ahora }),
      ...(secciones.includes('espacioResid') && { espacioResiduosActPorId: userId, espacioResiduosActEn: ahora }),
      ...(secciones.includes('ventaInformal') && { espacioVentaActPorId: userId, espacioVentaActEn: ahora }),
      ...(secciones.includes('convivencia') && { convivenciaActPorId: userId, convivenciaActEn: ahora }),
      ...(secciones.includes('actuaciones') && { actuacionesActPorId: userId, actuacionesActEn: ahora }),
      ...(secciones.includes('memoria') && { estrategiasActPorId: userId, estrategiasActEn: ahora }),
      ...(secciones.includes('rollos') && { rollosActPorId: userId, rollosActEn: ahora }),
    };

    if (data.id) {
       const updated = await prisma.fichaResultados.update({
         where: { id: data.id },
         data: fields
       });
       res.status(200).json(updated);
    } else {
       const upserted = await prisma.fichaResultados.upsert({
         where: { periodo: periodoDate },
         update: fields,
         create: fields
       });
       res.status(200).json(upserted);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error procesando ficha de resultados' });
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
          Object.entries(data).filter(([k]) => k !== 'periodo' && k !== 'seccionesActualizadas').map(([k, v]) => [k, v ?? null])
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
