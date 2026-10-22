"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Obtener cortes con reportes (ordenados cronológicamente)
router.get('/', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const cortes = await prisma.corteMensual.findMany({
            orderBy: { fechaLimite: 'asc' },
            include: {
                reportes: true
            }
        });
        res.json(cortes);
    }
    catch (error) {
        res.status(500).json({ error: 'Error obteniendo cortes' });
    }
});
// Crear un nuevo corte (ej: "15 de Noviembre de 2026")
router.post('/', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const { nombre, fechaLimite, esActivo } = req.body;
        if (!nombre || !fechaLimite) {
            return res.status(400).json({ error: 'Nombre y fechaLimite son requeridos' });
        }
        if (esActivo) {
            await prisma.corteMensual.updateMany({ data: { esActivo: false } });
        }
        const nuevoCorte = await prisma.corteMensual.create({
            data: {
                nombre,
                fechaLimite: new Date(fechaLimite),
                esActivo: !!esActivo
            }
        });
        res.status(201).json(nuevoCorte);
    }
    catch (error) {
        res.status(500).json({ error: 'Error creando corte mensual' });
    }
});
// Activar un corte específico como corte activo
router.patch('/:corteId/activar', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    const { corteId } = req.params;
    try {
        await prisma.corteMensual.updateMany({ data: { esActivo: false } });
        const activado = await prisma.corteMensual.update({
            where: { id: corteId },
            data: { esActivo: true }
        });
        res.json(activado);
    }
    catch (error) {
        res.status(500).json({ error: 'Error activando corte' });
    }
});
// Guardar informacion cualitativa para un objetivo en un corte
router.patch('/:corteId/objetivo/:objetivoId', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    const { corteId, objetivoId } = req.params;
    const { principalesAvances, alertasRecomendaciones } = req.body;
    try {
        const reporte = await prisma.reporteCualitativo.upsert({
            where: { objetivoId_corteId: { objetivoId, corteId } },
            create: {
                corteId,
                objetivoId,
                principalesAvances,
                alertasRecomendaciones
            },
            update: {
                principalesAvances,
                alertasRecomendaciones
            }
        });
        res.json(reporte);
    }
    catch (error) {
        res.status(500).json({ error: 'Error actualizando reporte' });
    }
});
exports.default = router;
