"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Configuración básica de Multer para uso local en /uploads
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});
router.post('/upload/:actividadId', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN', 'GESTOR']), upload.single('archivo'), async (req, res) => {
    try {
        const { actividadId } = req.params;
        const { tipoEvidencia, descripcion, localidadId, comentarioAdjunto } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: 'No se envió ningún archivo' });
        }
        if (!comentarioAdjunto || comentarioAdjunto.trim() === '') {
            return res.status(400).json({ error: 'Debe agregar un comentario obligatorio describiendo la ejecución' });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        const locFinalId = localidadId || (await prisma.localidad.findFirst())?.id;
        const evidencia = await prisma.evidencia.create({
            data: {
                actividadId,
                localidadId: locFinalId,
                subidoPorId: req.user.id,
                tipoEvidencia: tipoEvidencia || 'documento',
                nombreArchivo: req.file.originalname,
                urlArchivo: fileUrl,
                descripcion,
                comentarioAdjunto
            }
        });
        // Crear en el hilo de comentarios para que sea visible de inmediato
        await prisma.comentario.create({
            data: {
                actividadId,
                localidadId: locFinalId,
                autorId: req.user.id,
                texto: `[Adjuntó evidencia: ${req.file.originalname}] ${comentarioAdjunto}`
            }
        });
        res.status(201).json(evidencia);
    }
    catch (error) {
        res.status(500).json({ error: 'Error cargando la evidencia' });
    }
});
exports.default = router;
