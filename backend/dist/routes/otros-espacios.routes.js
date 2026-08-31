"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const { tipo } = req.query;
        const items = await prisma.otroEspacioArticulacion.findMany({
            where: tipo ? { tipo: String(tipo) } : {},
            include: { creadoPor: { select: { id: true, nombre: true } } },
            orderBy: { fecha: 'desc' },
        });
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ error: 'Error obteniendo espacios de articulación' });
    }
});
router.post('/', auth_middleware_1.azureADAuth, async (req, res) => {
    const { tipo, nombre, fecha, descripcion, resultados } = req.body;
    try {
        const item = await prisma.otroEspacioArticulacion.create({
            data: {
                tipo, nombre, fecha: new Date(fecha),
                descripcion: descripcion || null,
                resultados: resultados || null,
                creadoPorId: req.user.id,
            },
        });
        res.status(201).json(item);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creando espacio de articulación' });
    }
});
router.patch('/:id', auth_middleware_1.azureADAuth, async (req, res) => {
    const { nombre, fecha, descripcion, resultados } = req.body;
    try {
        const item = await prisma.otroEspacioArticulacion.update({
            where: { id: req.params.id },
            data: {
                ...(nombre && { nombre }),
                ...(fecha && { fecha: new Date(fecha) }),
                ...(descripcion !== undefined && { descripcion }),
                ...(resultados !== undefined && { resultados }),
            },
        });
        res.json(item);
    }
    catch (error) {
        res.status(500).json({ error: 'Error actualizando espacio de articulación' });
    }
});
exports.default = router;
