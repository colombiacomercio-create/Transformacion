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
router.get('/', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const { tipo, periodo } = req.query;
        const informes = await prisma.informe.findMany({
            where: {
                ...(tipo ? { tipo: String(tipo) } : {}),
                ...(periodo ? { periodo: String(periodo) } : {}),
            },
            include: { creadoPor: { select: { id: true, nombre: true } } },
            orderBy: { fechaCreacion: 'desc' },
        });
        res.json(informes);
    }
    catch (error) {
        res.status(500).json({ error: 'Error obteniendo informes' });
    }
});
router.post('/', auth_middleware_1.azureADAuth, upload.single('archivo'), async (req, res) => {
    const { tipo, titulo, periodo, descripcion } = req.body;
    try {
        let urlArchivo = null;
        if (req.file) {
            urlArchivo = await (0, supabase_service_1.uploadFileToSupabase)(req.file.originalname, req.file.buffer, req.file.mimetype);
        }
        const informe = await prisma.informe.create({
            data: { tipo, titulo, periodo, descripcion: descripcion || null, urlArchivo, creadoPorId: req.user.id },
        });
        res.status(201).json(informe);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creando informe' });
    }
});
router.delete('/:id', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        await prisma.informe.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Error eliminando informe' });
    }
});
exports.default = router;
