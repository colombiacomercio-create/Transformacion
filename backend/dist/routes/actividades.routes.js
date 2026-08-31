"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/', auth_middleware_1.azureADAuth, async (req, res) => {
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
                evidencias: true,
                comentarios: {
                    include: { autor: true },
                    orderBy: { fechaCreacion: 'asc' }
                }
            }
        });
        res.json(actividades);
    }
    catch (error) {
        console.error('Error fetching actividades:', error);
        res.status(500).json({ error: 'Error fetching actividades' });
    }
});
// Crear Actividad
router.post('/', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const { hitoId, codigoCompleto, nombre, descripcion, indicadorMeta, indicadorUnidad, prioridad, fechaInicio, fechaLimite } = req.body;
        const userId = req.user.id;
        // TODO: La asignación de localidad debería hacerse mediante endpoints separados o incluir localidadId en el body, 
        // pero por defecto lo crearemos sin asignación o con las localidades existentes si se proveen.
        const nuevaActividad = await prisma.actividad.create({
            data: {
                hitoId,
                codigoCompleto: codigoCompleto || `ACT-${Date.now()}`,
                nombre,
                descripcion,
                indicadorMeta: parseFloat(indicadorMeta) || 0,
                indicadorUnidad: indicadorUnidad || 'Unidades',
                prioridad: prioridad || 'MEDIA',
                fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
                fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
                creadoPor: userId,
                tiposEvidenciaRequeridos: ['documento']
            }
        });
        // Auto-asignar a todas las localidades
        const localidades = await prisma.localidad.findMany();
        if (localidades.length > 0) {
            await prisma.asignacionLocalidad.createMany({
                data: localidades.map(loc => ({
                    actividadId: nuevaActividad.id,
                    localidadId: loc.id
                }))
            });
        }
        res.status(201).json(nuevaActividad);
    }
    catch (error) {
        console.error('Error creando actividad:', error);
        res.status(500).json({ error: 'Error creando actividad' });
    }
});
// Agregar Comentario
router.post('/:id/comentarios', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { texto, localidadId } = req.body;
        const userId = req.user.id;
        let locId = localidadId;
        if (!locId) {
            const asig = await prisma.asignacionLocalidad.findFirst({ where: { actividadId: id } });
            if (asig)
                locId = asig.localidadId;
        }
        const comentario = await prisma.comentario.create({
            data: {
                texto,
                actividadId: id,
                localidadId: locId,
                autorId: userId
            },
            include: { autor: true }
        });
        res.json(comentario);
    }
    catch (error) {
        console.error('Error creando comentario:', error);
        res.status(500).json({ error: 'Error creando comentario' });
    }
});
// Cambiar Estado Local de una Asignación
router.patch('/asignacion/:id/estadoLocal', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { estadoLocal } = req.body;
        const asig = await prisma.asignacionLocalidad.update({
            where: { id },
            data: { estadoLocal }
        });
        res.json(asig);
    }
    catch (error) {
        console.error('Error actualizando estado local:', error);
        res.status(500).json({ error: 'Error actualizando estado local' });
    }
});
// Cambiar Estado Validación de una Asignación (Solo ADMIN)
router.patch('/asignacion/:id/estadoValidacion', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { estadoValidacion } = req.body;
        // Si validan como COMPLETADA, cerramos también el estadoLocal para que quede todo sincronizado
        let updateData = { estadoValidacion };
        if (estadoValidacion === 'VALIDADA_COMPLETADA') {
            updateData.estadoLocal = 'COMPLETA_SIN_VALIDAR'; // O dejarlo en algo que indique cerrado
        }
        const asig = await prisma.asignacionLocalidad.update({
            where: { id },
            data: updateData
        });
        res.json(asig);
    }
    catch (error) {
        console.error('Error actualizando estado validacion:', error);
        res.status(500).json({ error: 'Error actualizando estado de validación' });
    }
});
// Actualizar Descripción (y otras propiedades) de Actividad
router.patch('/:id', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { descripcion, fechaInicio, fechaLimite } = req.body;
        const actividad = await prisma.actividad.update({
            where: { id },
            data: {
                descripcion,
                fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
                fechaLimite: fechaLimite ? new Date(fechaLimite) : undefined
            }
        });
        res.json(actividad);
    }
    catch (error) {
        console.error('Error actualizando actividad:', error);
        res.status(500).json({ error: 'Error actualizando actividad' });
    }
});
exports.default = router;
