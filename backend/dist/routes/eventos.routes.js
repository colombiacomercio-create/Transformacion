"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const supabase_service_1 = require("../services/supabase.service");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
router.get('/', auth_middleware_1.azureADAuth, async (_req, res) => {
    try {
        const eventos = await prisma.evento.findMany({
            include: { creadoPor: { select: { id: true, nombre: true } } },
            orderBy: { fecha: 'desc' },
        });
        res.json(eventos);
    }
    catch (error) {
        res.status(500).json({ error: 'Error obteniendo eventos' });
    }
});
router.post('/', auth_middleware_1.azureADAuth, upload.single('archivo'), async (req, res) => {
    const { tipo, nombre, fecha, lugar, descripcion, resultados } = req.body;
    try {
        let urlArchivo = null;
        if (req.file) {
            urlArchivo = await (0, supabase_service_1.uploadFileToSupabase)(req.file.originalname, req.file.buffer, req.file.mimetype);
        }
        const evento = await prisma.evento.create({
            data: {
                tipo, nombre, fecha: new Date(fecha), lugar,
                descripcion: descripcion || null,
                resultados: resultados || null,
                urlArchivo,
                creadoPorId: req.user.id,
            },
        });
        res.status(201).json(evento);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creando evento' });
    }
});
router.patch('/:id', auth_middleware_1.azureADAuth, async (req, res) => {
    const { nombre, fecha, lugar, descripcion, resultados } = req.body;
    try {
        const evento = await prisma.evento.update({
            where: { id: req.params.id },
            data: {
                ...(nombre && { nombre }),
                ...(fecha && { fecha: new Date(fecha) }),
                ...(lugar && { lugar }),
                ...(descripcion !== undefined && { descripcion }),
                ...(resultados !== undefined && { resultados }),
            },
        });
        res.json(evento);
    }
    catch (error) {
        res.status(500).json({ error: 'Error actualizando evento' });
    }
});
exports.default = router;
