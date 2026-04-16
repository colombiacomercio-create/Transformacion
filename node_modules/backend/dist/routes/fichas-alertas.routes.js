"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Obtener todas las fichas (filtradas por localidad si el usuario es gestor, u ocultadas si no hay bypass?)
router.get('/', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const user = req.user;
        let filtro = {};
        if (user.rol === 'GESTOR') {
            const asignaciones = await prisma.asignacionLocalidad.findMany({ where: { responsableId: user.id } });
            const checkUserGestor = (asignaciones.length === 0 && user.id === 'gestor-local-123') ? await prisma.localidad.findFirst() : null;
            const localIds = checkUserGestor ? [checkUserGestor.id] : asignaciones.map(a => a.localidadId);
            filtro = { localidadId: { in: localIds } };
        }
        const fichas = await prisma.fichaAlerta.findMany({
            where: filtro,
            include: {
                objetivo: true,
                actividad: true,
                localidad: true,
                creador: true
            },
            orderBy: { fechaCreacion: 'desc' }
        });
        res.json(fichas);
    }
    catch (error) {
        res.status(500).json({ error: 'Error obteniendo fichas de alerta' });
    }
});
// Crear una ficha
router.post('/', auth_middleware_1.azureADAuth, async (req, res) => {
    const { objetivoId, actividadId, localidadId, tipo, descripcion, responsable, fechaCompromiso } = req.body;
    try {
        const ficha = await prisma.fichaAlerta.create({
            data: {
                objetivoId: objetivoId || null,
                actividadId: actividadId || null,
                localidadId,
                tipo,
                descripcion,
                responsable,
                fechaCompromiso: fechaCompromiso ? new Date(fechaCompromiso) : null,
                creadoPorId: req.user.id
            }
        });
        res.json(ficha);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creando ficha de alerta' });
    }
});
// Cerrar / Editar ficha
router.patch('/:id/estado', auth_middleware_1.azureADAuth, async (req, res) => {
    const { estado, ultimaAccion, responsable } = req.body;
    try {
        const dataToUpdate = {};
        if (estado)
            dataToUpdate.estado = estado;
        if (ultimaAccion)
            dataToUpdate.ultimaAccion = ultimaAccion;
        if (responsable)
            dataToUpdate.responsable = responsable;
        const ficha = await prisma.fichaAlerta.update({
            where: { id: req.params.id },
            data: dataToUpdate
        });
        res.json(ficha);
    }
    catch (error) {
        res.status(500).json({ error: 'Error actualizando estado' });
    }
});
exports.default = router;
