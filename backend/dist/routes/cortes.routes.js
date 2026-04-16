"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Obtener cortes con reportes
router.get('/', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const cortes = await prisma.corteMensual.findMany({
            orderBy: { fechaLimite: 'desc' },
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
