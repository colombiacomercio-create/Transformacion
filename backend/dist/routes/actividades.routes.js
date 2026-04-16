"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Obtener todas las actividades (Para Kanban/Dashboard)
router.get('/', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const user = req.user;
        let filtroLocalidad = {};
        let validLocalidadIds = undefined;
        if (user.rol === 'GESTOR') {
            let asignaciones = await prisma.asignacionLocalidad.findMany({
                where: { responsableId: user.id }
            });
            // Simulador de Entorno Local: Si es el mock de Gestor y no tiene asignaciones, fingir ser de la primera Localidad (ej. Suba)
            if (asignaciones.length === 0 && user.id === 'gestor-local-123') {
                const locPiloto = await prisma.localidad.findFirst();
                if (locPiloto)
                    asignaciones = await prisma.asignacionLocalidad.findMany({ where: { localidadId: locPiloto.id } });
            }
            validLocalidadIds = asignaciones.map(a => a.localidadId);
            filtroLocalidad = { id: { in: asignaciones.map(a => a.actividadId) } };
        }
        const actividades = await prisma.actividad.findMany({
            where: filtroLocalidad,
            include: {
                hito: {
                    include: { programa: { include: { objetivo: true } } }
                },
                evidencias: validLocalidadIds ? { where: { localidadId: { in: validLocalidadIds } } } : true,
                subTareas: true,
                asignaciones: validLocalidadIds ? {
                    where: { localidadId: { in: validLocalidadIds } },
                    include: { localidad: true }
                } : { include: { localidad: true } },
                comentarios: validLocalidadIds ? {
                    where: { localidadId: { in: validLocalidadIds } },
                    include: { autor: true },
                    orderBy: { fechaCreacion: 'desc' }
                } : {
                    include: { autor: true },
                    orderBy: { fechaCreacion: 'desc' }
                }
            }
        });
        res.json(actividades);
    }
    catch (error) {
        res.status(500).json({ error: 'Error obteniendo actividades' });
    }
});
// Crear nueva actividad (Admin o Gestor)
router.post('/', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN', 'GESTOR']), async (req, res) => {
    try {
        const { nombre, descripcion, fechaInicio, fechaLimite, prioridad, indicadorMeta, indicadorUnidad, hitoId } = req.body;
        if (!descripcion || descripcion.trim() === '') {
            return res.status(400).json({ error: 'La descripción es obligatoria' });
        }
        // Contar cuántas actividades hay en este hito para generar código simple automático si no viene el códigoCompleto
        const totalHito = await prisma.actividad.count({ where: { hitoId } });
        const hitoData = await prisma.hito.findUnique({ where: { id: hitoId }, include: { programa: true } });
        const nuevoCodigo = hitoData ? `${hitoData.codigo}.A${totalHito + 1}` : `A${Math.floor(Math.random() * 1000)}`;
        const nueva = await prisma.actividad.create({
            data: {
                hitoId,
                codigoCompleto: nuevoCodigo,
                nombre,
                descripcion,
                fechaInicio: new Date(fechaInicio),
                fechaLimite: new Date(fechaLimite),
                prioridad: prioridad || 'MEDIA',
                indicadorMeta: Number(indicadorMeta) || 0,
                indicadorUnidad: indicadorUnidad || 'Unidad',
                creadoPor: req.user.id,
                estado: 'PENDIENTE',
                tiposEvidenciaRequeridos: ['documento']
            }
        });
        res.status(201).json(nueva);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear la actividad' });
    }
});
// Agregar Comentario
router.post('/:id/comentarios', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { texto, localidadId } = req.body;
        // LocalidadId temporal mock si no viene
        const locIdFinal = localidadId || (await prisma.localidad.findFirst())?.id;
        if (!locIdFinal)
            return res.status(400).json({ error: 'No data localidad' });
        const comentario = await prisma.comentario.create({
            data: {
                actividadId: id,
                autorId: req.user.id,
                texto,
                localidadId: locIdFinal
            },
            include: {
                autor: true
            }
        });
        res.status(201).json(comentario);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al publicar comentario' });
    }
});
// Actualizar estado de SubTarea (Solo Gestores o Admins)
router.patch('/subtarea/:id', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN', 'GESTOR']), async (req, res) => {
    try {
        const { completada } = req.body;
        const subTarea = await prisma.subTarea.update({
            where: { id: req.params.id },
            data: { completada }
        });
        res.json(subTarea);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al actualizar subtarea' });
    }
});
// Actualizar datos maestros de la Actividad (Solo Admin)
router.patch('/:id', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const { descripcion, fechaInicio, fechaLimite } = req.body;
        const upd = await prisma.actividad.update({
            where: { id: req.params.id },
            data: {
                descripcion,
                fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
                fechaLimite: fechaLimite ? new Date(fechaLimite) : undefined
            }
        });
        res.json(upd);
    }
    catch (err) {
        res.status(500).json({ error: 'Error actualizando actividad' });
    }
});
// Actualizar estadoLocal de Asignacion (Para Gestores y Admin)
router.patch('/asignacion/:id/estadoLocal', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN', 'GESTOR']), async (req, res) => {
    try {
        const { estadoLocal } = req.body;
        const asig = await prisma.asignacionLocalidad.update({
            where: { id: req.params.id },
            data: { estadoLocal }
        });
        res.json(asig);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al actualizar estado local' });
    }
});
// Actualizar estadoValidacion de Asignacion (Solo Admin)
router.patch('/asignacion/:id/estadoValidacion', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const { estadoValidacion } = req.body;
        const asig = await prisma.asignacionLocalidad.update({
            where: { id: req.params.id },
            data: { estadoValidacion }
        });
        res.json(asig);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al actualizar estado de auditoría' });
    }
});
exports.default = router;
