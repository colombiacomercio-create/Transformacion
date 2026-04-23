"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Importando la integración con Supabase Storage (1GB Gratuito)
const supabase_service_1 = require("../services/supabase.service");
// Pasamos de disco local a Memoria (RAM) para enviar directo a la nube sin tocar disco
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    // LÍMITE ESTRICTO APLICADO: 20 Megabytes máximo por archivo permitido
    limits: { fileSize: 20 * 1024 * 1024 }
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
        const locFinalId = localidadId || (await prisma.localidad.findFirst())?.id;
        console.log(`Subiendo archivo de ${Math.round(req.file.size / 1024 / 1024)} MB a Supabase Storage...`);
        // Aquí ocurre la magia: Mandamos el buffer en memoria directo al Bucket de Supabase
        const cloudUrlStr = await (0, supabase_service_1.uploadFileToSupabase)(req.file.originalname, req.file.buffer, req.file.mimetype);
        const evidencia = await prisma.evidencia.create({
            data: {
                actividadId,
                localidadId: locFinalId,
                subidoPorId: req.user.id,
                tipoEvidencia: tipoEvidencia || 'documento',
                nombreArchivo: req.file.originalname,
                urlArchivo: cloudUrlStr, // Guardamos la URL pública nativa de Supabase Storage
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
                texto: `[Adjuntó evidencia en la Nube Corporativa: ${req.file.originalname}] ${comentarioAdjunto}`
            }
        });
        res.status(201).json(evidencia);
    }
    catch (error) {
        res.status(500).json({ error: 'Error cargando la evidencia' });
    }
});
exports.default = router;
