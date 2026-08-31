"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const supabase_service_1 = require("../services/supabase.service");
const acta_service_1 = require("../services/acta.service");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
// GET /api/reuniones — lista con filtros opcionales
router.get('/', auth_middleware_1.azureADAuth, async (req, res) => {
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo reuniones' });
    }
});
// GET /api/reuniones/stats — estadísticas de reuniones
router.get('/stats', auth_middleware_1.azureADAuth, async (req, res) => {
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
        const porTipoContraparte = {};
        const porResponsable = {};
        const porTipoReunion = {};
        const porTematica = {};
        const porMes = {};
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
    }
    catch (error) {
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});
// GET /api/reuniones/:id — detalle de una reunión
router.get('/:id', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const reunion = await prisma.reunion.findUnique({
            where: { id: req.params.id },
            include: { creadoPor: { select: { id: true, nombre: true } }, asistentes: true, compromisos: true },
        });
        if (!reunion)
            return res.status(404).json({ error: 'Reunión no encontrada' });
        res.json(reunion);
    }
    catch (error) {
        res.status(500).json({ error: 'Error obteniendo reunión' });
    }
});
// POST /api/reuniones — crear reunión
router.post('/', auth_middleware_1.azureADAuth, async (req, res) => {
    const { tipoReunion, tipoContraparte, tematica, subtematica, objeto, fecha, horaInicio, horaFin, lugar, modalidad, responsable, desarrollo, asistentes, compromisos } = req.body;
    try {
        const reunion = await prisma.reunion.create({
            data: {
                tipoReunion: tipoReunion || '', tipoContraparte: tipoContraparte || '',
                tematica: tematica || 'GLOBAL', subtematica: subtematica || null, objeto: objeto || '',
                fecha: new Date(fecha.length === 10 ? fecha + 'T12:00:00Z' : fecha),
                horaInicio: horaInicio || '', horaFin: horaFin || '', lugar: lugar || '', modalidad: modalidad || 'VIRTUAL', responsable: responsable || '',
                desarrollo: desarrollo || '',
                creadoPorId: req.user.id,
                asistentes: {
                    create: (asistentes || []).map((a) => ({
                        nombre: typeof a === 'string' ? a : (a.nombre || ''),
                        cargo: typeof a === 'string' ? 'Unidad de Transformación' : (a.cargo || ''),
                        entidad: typeof a === 'string' ? 'SDG' : (a.entidad || '')
                    })),
                },
                compromisos: {
                    create: (compromisos || []).map((c) => ({
                        descripcion: c.descripcion,
                        responsable: c.responsable,
                        fechaEntrega: c.fechaEntrega ? new Date(c.fechaEntrega) : null,
                    })),
                },
            },
            include: { asistentes: true, compromisos: true, creadoPor: { select: { id: true, nombre: true } } },
        });
        res.status(201).json(reunion);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creando reunión' });
    }
});
// PATCH /api/reuniones/:id — actualizar campos básicos
router.patch('/:id', auth_middleware_1.azureADAuth, async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Error actualizando reunión' });
    }
});
// DELETE /api/reuniones/:id — eliminar reunión
router.delete('/:id', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const reunion = await prisma.reunion.findUnique({ where: { id: req.params.id } });
        if (!reunion)
            return res.status(404).json({ error: 'Reunión no encontrada' });
        if (reunion.creadoPorId !== req.user.id) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar esta reunión' });
        }
        await prisma.reunion.delete({ where: { id: req.params.id } });
        res.json({ message: 'Reunión eliminada correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error eliminando reunión' });
    }
});
// POST /api/reuniones/:id/imagen — subir imagen de asistencia
router.post('/:id/imagen', auth_middleware_1.azureADAuth, upload.single('imagen'), async (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: 'No se recibió imagen' });
    try {
        const url = await (0, supabase_service_1.uploadFileToSupabase)(req.file.originalname, req.file.buffer, req.file.mimetype);
        const reunion = await prisma.reunion.update({
            where: { id: req.params.id },
            data: { imagenAsistencia: url },
        });
        res.json({ url, reunion });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error subiendo imagen' });
    }
});
// GET /api/reuniones/:id/preview — previsualizar HTML del acta (solo dev)
router.get('/:id/preview', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const reunion = await prisma.reunion.findUnique({
            where: { id: req.params.id },
            include: { asistentes: true, compromisos: true },
        });
        if (!reunion)
            return res.status(404).json({ error: 'Reunión no encontrada' });
        const { buildActaHtml } = await Promise.resolve().then(() => __importStar(require('../services/acta.service')));
        const actaData = {
            objeto: reunion.objeto, fecha: reunion.fecha,
            horaInicio: reunion.horaInicio, horaFin: reunion.horaFin,
            lugar: reunion.lugar, modalidad: reunion.modalidad,
            dependencia: 'Subsecretaria Gestión Local - Unidad de Transformación',
            responsable: reunion.responsable,
            asistentes: reunion.asistentes.map(a => ({ nombre: a.nombre, cargo: a.cargo || undefined, entidad: a.entidad || undefined })),
            imagenAsistenciaUrl: reunion.imagenAsistencia || null,
            desarrollo: reunion.desarrollo || '',
            compromisos: reunion.compromisos.map(c => ({ descripcion: c.descripcion, responsable: c.responsable, fechaEntrega: c.fechaEntrega ? c.fechaEntrega.toISOString() : null })),
        };
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(buildActaHtml(actaData));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: String(error) });
    }
});
// POST /api/reuniones/:id/acta — subir acta PDF pre-elaborada
router.post('/:id/acta', auth_middleware_1.azureADAuth, upload.single('acta'), async (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: 'No se recibio archivo PDF' });
    try {
        const filename = `acta_${req.params.id}_${Date.now()}.pdf`;
        const url = await (0, supabase_service_1.uploadFileToSupabase)(filename, req.file.buffer, req.file.mimetype || 'application/pdf');
        await prisma.reunion.update({
            where: { id: req.params.id },
            data: { actaPdfUrl: url },
        });
        res.json({ url });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error subiendo PDF del acta' });
    }
});
// GET /api/reuniones/:id/pdf — generar o servir acta PDF
router.get('/:id/pdf', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const reunion = await prisma.reunion.findUnique({
            where: { id: req.params.id },
            include: { asistentes: true, compromisos: true },
        });
        if (!reunion)
            return res.status(404).json({ error: 'Reunion no encontrada' });
        const fechaStr = reunion.fecha.toISOString().slice(0, 10);
        const filename = `Acta_Reunion_${fechaStr}.pdf`;
        // Si el usuario cargo un PDF pre-elaborado, servirlo directamente
        if (reunion.actaPdfUrl) {
            const pdfResponse = await fetch(reunion.actaPdfUrl);
            if (!pdfResponse.ok)
                throw new Error('Error descargando el PDF almacenado');
            const arrayBuf = await pdfResponse.arrayBuffer();
            const pdfBuffer = Buffer.from(arrayBuf);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.send(pdfBuffer);
        }
        // Si no hay PDF cargado, generar desde los datos
        const actaData = {
            objeto: reunion.objeto,
            fecha: reunion.fecha,
            horaInicio: reunion.horaInicio,
            horaFin: reunion.horaFin,
            lugar: reunion.lugar,
            modalidad: reunion.modalidad,
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
        const pdfBuffer = await (0, acta_service_1.generarActaPDF)(actaData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('[PDF] Error:', error);
        res.status(500).json({ message: `Error: ${error.message || String(error)}` });
    }
});
// PATCH /api/reuniones/compromisos/:compromisoId — marcar compromiso como cumplido
router.patch('/compromisos/:compromisoId', auth_middleware_1.azureADAuth, async (req, res) => {
    const { cumplido } = req.body;
    try {
        const compromiso = await prisma.compromisoReunion.update({
            where: { id: req.params.compromisoId },
            data: { cumplido: Boolean(cumplido) },
        });
        res.json(compromiso);
    }
    catch (error) {
        res.status(500).json({ error: 'Error actualizando compromiso' });
    }
});
exports.default = router;
