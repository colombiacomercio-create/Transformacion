import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, AuthRequest } from '../middlewares/auth.middleware';
import multer from 'multer';
import { uploadFileToSupabase } from '../services/supabase.service';
import { generarActaPDF, ActaData } from '../services/acta.service';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// GET /api/reuniones — lista con filtros opcionales
router.get('/', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const { tipoReunion, tipoContraparte, responsable, desde, hasta } = req.query;
    const reuniones = await prisma.reunion.findMany({
      where: {
        ...(tipoReunion ? { tipoReunion: String(tipoReunion) } : {}),
        ...(tipoContraparte ? { tipoContraparte: String(tipoContraparte) } : {}),
        ...(responsable ? { responsable: { contains: String(responsable), mode: 'insensitive' } } : {}),
        ...(desde || hasta ? {
          fecha: {
            ...(desde ? { gte: new Date(String(desde)) } : {}),
            ...(hasta ? { lte: new Date(String(hasta)) } : {}),
          },
        } : {}),
      },
      include: {
        creadoPor: { select: { id: true, nombre: true } },
        asistentes: true,
        compromisos: true,
      },
      orderBy: { fecha: 'desc' },
    });
    res.json(reuniones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo reuniones' });
  }
});

// GET /api/reuniones/stats — estadísticas de reuniones
router.get('/stats', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const { tipoReunion, tipoContraparte, responsable, desde, hasta } = req.query;
    const reuniones = await prisma.reunion.findMany({
      where: {
        ...(tipoReunion ? { tipoReunion: String(tipoReunion) } : {}),
        ...(tipoContraparte ? { tipoContraparte: String(tipoContraparte) } : {}),
        ...(responsable ? { responsable: { contains: String(responsable), mode: 'insensitive' } } : {}),
        ...(desde || hasta ? {
          fecha: {
            ...(desde ? { gte: new Date(String(desde)) } : {}),
            ...(hasta ? { lte: new Date(String(hasta)) } : {}),
          },
        } : {}),
      },
      select: { tipoReunion: true, tipoContraparte: true, tematica: true, responsable: true, fecha: true },
    });

    const porTipoContraparte: Record<string, number> = {};
    const porResponsable: Record<string, number> = {};
    const porTipoReunion: Record<string, number> = {};
    const porTematica: Record<string, number> = {};
    const porMes: Record<string, number> = {};

    for (const r of reuniones) {
      porTipoContraparte[r.tipoContraparte] = (porTipoContraparte[r.tipoContraparte] || 0) + 1;
      porResponsable[r.responsable] = (porResponsable[r.responsable] || 0) + 1;
      porTipoReunion[r.tipoReunion] = (porTipoReunion[r.tipoReunion] || 0) + 1;
      const t = r.tematica || 'GLOBAL';
      porTematica[t] = (porTematica[t] || 0) + 1;
      const mes = r.fecha.toISOString().slice(0, 7);
      porMes[mes] = (porMes[mes] || 0) + 1;
    }

    const compromisosTotal = await prisma.compromisoReunion.count();
    const compromisosPendientes = await prisma.compromisoReunion.count({ where: { cumplido: false } });

    res.json({ total: reuniones.length, porTipoContraparte, porResponsable, porTipoReunion, porTematica, porMes, compromisosTotal, compromisosPendientes });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// GET /api/reuniones/:id — detalle de una reunión
router.get('/:id', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const reunion = await prisma.reunion.findUnique({
      where: { id: req.params.id },
      include: { creadoPor: { select: { id: true, nombre: true } }, asistentes: true, compromisos: true },
    });
    if (!reunion) return res.status(404).json({ error: 'Reunión no encontrada' });
    res.json(reunion);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo reunión' });
  }
});

// POST /api/reuniones — crear reunión
router.post('/', azureADAuth, async (req: AuthRequest, res) => {
  const { tipoReunion, tipoContraparte, tematica, subtematica, objeto, fecha, horaInicio, horaFin, lugar, modalidad, responsable, desarrollo, asistentes, compromisos } = req.body;
  try {
    const reunion = await prisma.reunion.create({
      data: {
        tipoReunion: tipoReunion || '', tipoContraparte: tipoContraparte || '',
        tematica: tematica || 'GLOBAL', subtematica: subtematica || null, objeto: objeto || '',
        fecha: new Date(fecha.length === 10 ? fecha + 'T12:00:00Z' : fecha),
        horaInicio: horaInicio || '', horaFin: horaFin || '', lugar: lugar || '', modalidad: modalidad || 'VIRTUAL', responsable: responsable || '',
        desarrollo: desarrollo || '',
        creadoPorId: req.user!.id,
        asistentes: {
          create: (asistentes || []).map((a: any) => ({ 
            nombre: typeof a === 'string' ? a : (a.nombre || ''), 
            cargo: typeof a === 'string' ? 'Unidad de Transformación' : (a.cargo || ''), 
            entidad: typeof a === 'string' ? 'SDG' : (a.entidad || '') 
          })),
        },
        compromisos: {
          create: (compromisos || []).map((c: any) => ({
            descripcion: c.descripcion,
            responsable: c.responsable,
            fechaEntrega: c.fechaEntrega ? new Date(c.fechaEntrega) : null,
          })),
        },
      },
      include: { asistentes: true, compromisos: true, creadoPor: { select: { id: true, nombre: true } } },
    });
    res.status(201).json(reunion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando reunión' });
  }
});

// PATCH /api/reuniones/:id — actualizar campos básicos
router.patch('/:id', azureADAuth, async (req: AuthRequest, res) => {
  const { objeto, fecha, horaInicio, horaFin, lugar, modalidad, responsable, desarrollo } = req.body;
  try {
    const reunion = await prisma.reunion.update({
      where: { id: req.params.id },
      data: {
        ...(objeto && { objeto }),
        ...(fecha && { fecha: new Date(fecha.length === 10 ? fecha + 'T12:00:00Z' : fecha) }),
        ...(horaInicio && { horaInicio }),
        ...(horaFin && { horaFin }),
        ...(lugar && { lugar }),
        ...(modalidad && { modalidad }),
        ...(responsable && { responsable }),
        ...(desarrollo && { desarrollo }),
      },
    });
    res.json(reunion);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando reunión' });
  }
});

// DELETE /api/reuniones/:id — eliminar reunión
router.delete('/:id', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const reunion = await prisma.reunion.findUnique({ where: { id: req.params.id } });
    if (!reunion) return res.status(404).json({ error: 'Reunión no encontrada' });
    if (reunion.creadoPorId !== req.user!.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta reunión' });
    }
    await prisma.reunion.delete({ where: { id: req.params.id } });
    res.json({ message: 'Reunión eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error eliminando reunión' });
  }
});

// POST /api/reuniones/:id/imagen — subir imagen de asistencia
router.post('/:id/imagen', azureADAuth, upload.single('imagen'), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });
  try {
    const url = await uploadFileToSupabase(req.file.originalname, req.file.buffer, req.file.mimetype);
    const reunion = await prisma.reunion.update({
      where: { id: req.params.id },
      data: { imagenAsistencia: url },
    });
    res.json({ url, reunion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error subiendo imagen' });
  }
});

// GET /api/reuniones/:id/preview — previsualizar HTML del acta (solo dev)
router.get('/:id/preview', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const reunion = await prisma.reunion.findUnique({
      where: { id: req.params.id },
      include: { asistentes: true, compromisos: true },
    });
    if (!reunion) return res.status(404).json({ error: 'Reunión no encontrada' });
    const { buildActaHtml } = await import('../services/acta.service');
    const actaData: ActaData = {
      objeto: reunion.objeto, fecha: reunion.fecha,
      horaInicio: reunion.horaInicio, horaFin: reunion.horaFin,
      lugar: reunion.lugar, modalidad: reunion.modalidad as ActaData['modalidad'],
      dependencia: 'Subsecretaria Gestión Local - Unidad de Transformación',
      responsable: reunion.responsable,
      asistentes: reunion.asistentes.map(a => ({ nombre: a.nombre, cargo: a.cargo || undefined, entidad: a.entidad || undefined })),
      imagenAsistenciaUrl: reunion.imagenAsistencia || null,
      desarrollo: reunion.desarrollo || '',
      compromisos: reunion.compromisos.map(c => ({ descripcion: c.descripcion, responsable: c.responsable, fechaEntrega: c.fechaEntrega ? c.fechaEntrega.toISOString() : null })),
    };
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(buildActaHtml(actaData));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/reuniones/:id/acta — subir acta PDF pre-elaborada
router.post('/:id/acta', azureADAuth, upload.single('acta'), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibio archivo PDF' });
  try {
    const filename = `acta_${req.params.id}_${Date.now()}.pdf`;
    const url = await uploadFileToSupabase(filename, req.file.buffer, req.file.mimetype || 'application/pdf');
    await prisma.reunion.update({
      where: { id: req.params.id },
      data: { actaPdfUrl: url },
    });
    res.json({ url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error subiendo PDF del acta' });
  }
});

// GET /api/reuniones/:id/pdf — generar o servir acta PDF
router.get('/:id/pdf', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const reunion = await prisma.reunion.findUnique({
      where: { id: req.params.id },
      include: { asistentes: true, compromisos: true },
    });
    if (!reunion) return res.status(404).json({ error: 'Reunion no encontrada' });

    const fechaStr = reunion.fecha.toISOString().slice(0, 10);
    const filename = `Acta_Reunion_${fechaStr}.pdf`;

    // Si el usuario cargo un PDF pre-elaborado, servirlo directamente
    const storedPdfUrl = (reunion.imagenAsistencia && reunion.imagenAsistencia.toLowerCase().includes('.pdf'))
      ? reunion.imagenAsistencia
      : (reunion as any).actaPdfUrl;

    if (storedPdfUrl) {
      const pdfResponse = await fetch(storedPdfUrl);
      if (!pdfResponse.ok) throw new Error('Error descargando el PDF almacenado');
      const arrayBuf = await pdfResponse.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuf);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(pdfBuffer);
    }

    // Si no hay PDF cargado, generar desde los datos
    const actaData: ActaData = {
      objeto: reunion.objeto,
      fecha: reunion.fecha,
      horaInicio: reunion.horaInicio,
      horaFin: reunion.horaFin,
      lugar: reunion.lugar,
      modalidad: reunion.modalidad as ActaData['modalidad'],
      dependencia: 'Subsecretaria Gestion Local - Unidad de Transformacion',
      responsable: reunion.responsable,
      asistentes: reunion.asistentes.map(a => ({ nombre: a.nombre, cargo: a.cargo || undefined, entidad: a.entidad || undefined })),
      imagenAsistenciaUrl: reunion.imagenAsistencia || null,
      desarrollo: reunion.desarrollo || '',
      compromisos: reunion.compromisos.map(c => ({
        descripcion: c.descripcion,
        responsable: c.responsable,
        fechaEntrega: c.fechaEntrega ? c.fechaEntrega.toISOString() : null,
      })),
    };

    const pdfBuffer = await generarActaPDF(actaData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('[PDF] Error:', error);
    res.status(500).json({ message: `Error: ${error.message || String(error)}` });
  }
});


// PATCH /api/reuniones/compromisos/:compromisoId — marcar compromiso como cumplido
router.patch('/compromisos/:compromisoId', azureADAuth, async (req: AuthRequest, res) => {
  const { cumplido } = req.body;
  try {
    const compromiso = await prisma.compromisoReunion.update({
      where: { id: req.params.compromisoId },
      data: { cumplido: Boolean(cumplido) },
    });
    res.json(compromiso);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando compromiso' });
  }
});

export default router;
