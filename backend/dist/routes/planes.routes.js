"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Obtener los planes
router.get('/', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const planes = await prisma.plan.findMany({
            include: {
                objetivos: {
                    include: {
                        programas: {
                            include: { hitos: true }
                        }
                    }
                }
            }
        });
        res.json(planes);
    }
    catch (error) {
        res.status(500).json({ error: 'Error obteniendo los planes' });
    }
});
// Crear un plan (Solo Admin)
router.post('/', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const { nombre, ano, descripcion } = req.body;
        const nuevoPlan = await prisma.plan.create({
            data: {
                nombre,
                ano: parseInt(ano),
                descripcion,
                creadoPor: req.user.id
            }
        });
        res.status(201).json(nuevoPlan);
    }
    catch (error) {
        res.status(500).json({ error: 'Error creando el plan' });
    }
});
exports.default = router;
