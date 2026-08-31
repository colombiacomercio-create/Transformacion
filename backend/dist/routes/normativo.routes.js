"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/', auth_middleware_1.azureADAuth, async (_req, res) => {
    try {
        const items = await prisma.seguimientoNormativo.findMany({
            include: { creadoPor: { select: { id: true, nombre: true } } },
            orderBy: { fechaCreacion: 'desc' },
        });
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ error: 'Error obteniendo seguimientos normativos' });
    }
});
router.post('/', auth_middleware_1.azureADAuth, async (req, res) => {
    const { tipo, nombre, descripcion, estado, avances, urlDocumento } = req.body;
    try {
        const item = await prisma.seguimientoNormativo.create({
            data: {
                tipo, nombre,
                descripcion: descripcion || null,
                estado: estado || 'EN_FORMULACION',
                avances: avances || null,
                urlDocumento: urlDocumento || null,
                creadoPorId: req.user.id,
            },
        });
        res.status(201).json(item);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creando seguimiento normativo' });
    }
});
router.patch('/:id', auth_middleware_1.azureADAuth, async (req, res) => {
    const { nombre, descripcion, estado, avances, urlDocumento } = req.body;
    try {
        const item = await prisma.seguimientoNormativo.update({
            where: { id: req.params.id },
            data: {
                ...(nombre && { nombre }),
                ...(descripcion !== undefined && { descripcion }),
                ...(estado && { estado }),
                ...(avances !== undefined && { avances }),
                ...(urlDocumento !== undefined && { urlDocumento }),
            },
        });
        res.json(item);
    }
    catch (error) {
        res.status(500).json({ error: 'Error actualizando seguimiento normativo' });
    }
});
exports.default = router;
