"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
// Cualquier usuario autenticado puede cargar evidencia y comentar avance sobre una actividad
router.post('/upload/:actividadId', auth_middleware_1.azureADAuth, upload.single('archivo'), async (req, res) => {
    try {
        const { actividadId } = req.params;
        const { tipoEvidencia, descripcion, localidadId, comentarioAdjunto, nuevoEstado } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: 'No se envió ningún archivo' });
        }
        if (!comentarioAdjunto || comentarioAdjunto.trim() === '') {
            return res.status(400).json({ error: 'Debe agregar un comentario obligatorio describiendo la ejecución' });
        }
        // Resolver localidadId de manera robusta (evita errores con 'undefined' o strings no-UUID)
        let locFinalId = '';
        const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
        if (isUuid(localidadId)) {
            locFinalId = localidadId.trim();
        }
        else {
            const asig = await prisma.asignacionLocalidad.findFirst({
                where: { actividadId },
                select: { localidadId: true }
            });
            if (asig?.localidadId) {
                locFinalId = asig.localidadId;
            }
            else {
                const primeraLoc = await prisma.localidad.findFirst({ select: { id: true } });
                locFinalId = primeraLoc?.id || '';
            }
        }
        if (!locFinalId) {
            return res.status(400).json({ error: 'No se encontró localidad asociada para registrar la evidencia' });
        }
        console.log(`Subiendo archivo de ${Math.round(req.file.size / 1024 / 1024)} MB a Supabase Storage...`);
        // Aquí ocurre la magia: Mandamos el buffer en memoria directo al Bucket de Supabase
        const cloudUrlStr = await (0, supabase_service_1.uploadFileToSupabase)(req.file.originalname, req.file.buffer, req.file.mimetype);
        // Opción B: Si el usuario que sube evidencia es OBSERVADOR promover a GESTOR y sumarlo a correosNotificacion
        const userEmailLower = (req.user?.email || '').toLowerCase().trim();
        if (userEmailLower) {
            if (req.user?.rol === 'OBSERVADOR') {
                await prisma.usuario.update({
                    where: { id: req.user.id },
                    data: { rol: 'GESTOR' }
                });
                req.user.rol = 'GESTOR';
            }
            const act = await prisma.actividad.findUnique({ where: { id: actividadId } });
            if (act) {
                const correosActuales = (act.correosNotificacion || []).map((c) => c.toLowerCase().trim());
                if (!correosActuales.includes(userEmailLower)) {
                    await prisma.actividad.update({
                        where: { id: actividadId },
                        data: { correosNotificacion: [...correosActuales, userEmailLower] }
                    });
                }
            }
        }
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
        // Registrar comentario en el hilo de chat con el archivo adjunto
        await prisma.comentario.create({
            data: {
                texto: `📎 Evidencia adjunta: ${req.file.originalname}\n${comentarioAdjunto}`,
                actividadId,
                localidadId: locFinalId,
                autorId: req.user.id
            }
        });
        // Si se especificó cambio de estado al cargar la evidencia
        if (nuevoEstado) {
            let normalizedEstado = 'NO_INICIADA';
            let actEstado = 'PENDIENTE';
            if (nuevoEstado === 'COMPLETA_SIN_VALIDAR' || nuevoEstado === 'COMPLETADA') {
                normalizedEstado = 'COMPLETA_SIN_VALIDAR';
                actEstado = 'COMPLETADA';
            }
            else if (nuevoEstado === 'EN_CURSO_SIN_VALIDAR' || nuevoEstado === 'EN_CURSO') {
                normalizedEstado = 'EN_CURSO_SIN_VALIDAR';
                actEstado = 'EN_PROGRESO';
            }
            else {
                normalizedEstado = 'NO_INICIADA';
                actEstado = 'PENDIENTE';
            }
            const asig = await prisma.asignacionLocalidad.findFirst({
                where: { actividadId, ...(locFinalId ? { localidadId: locFinalId } : {}) }
            });
            if (asig) {
                const act = await prisma.actividad.findUnique({ where: { id: actividadId } });
                const meta = act?.indicadorMeta || 0;
                let avance = 0;
                if (normalizedEstado === 'COMPLETA_SIN_VALIDAR')
                    avance = meta;
                else if (normalizedEstado === 'EN_CURSO_SIN_VALIDAR')
                    avance = meta * 0.5;
                await prisma.asignacionLocalidad.update({
                    where: { id: asig.id },
                    data: {
                        estadoLocal: normalizedEstado,
                        ...(asig.estadoValidacion === 'PENDIENTE_REVISION' ? { porcentajeAvance: avance } : {})
                    }
                });
                await prisma.actividad.update({
                    where: { id: actividadId },
                    data: { estado: actEstado }
                });
            }
        }
        // Disparar prechequeo de IA de forma asíncrona en segundo plano sin bloquear respuesta HTTP
        Promise.resolve().then(() => __importStar(require('../services/ai.service'))).then(async (aiService) => {
            try {
                const actividad = await prisma.actividad.findUnique({ where: { id: actividadId } });
                if (actividad) {
                    const fileBase64 = req.file?.buffer.toString('base64') || null;
                    const mimeType = req.file?.mimetype || null;
                    const prechequeo = await aiService.prechequearEvidencia(actividad.descripcion || actividad.nombre, actividad.tiposEvidenciaRequeridos, fileBase64, mimeType, comentarioAdjunto);
                    await prisma.evidencia.update({
                        where: { id: evidencia.id },
                        data: {
                            prechequeoEstado: prechequeo.prechequeoEstado,
                            prechequeoPuntaje: prechequeo.prechequeoPuntaje,
                            prechequeoFeedback: prechequeo.prechequeoFeedback,
                            fechaAnalisisIA: new Date()
                        }
                    });
                    console.log(`[IA Prechequeo] Evidencia ${evidencia.id} procesada. Resultado: ${prechequeo.prechequeoEstado}`);
                }
            }
            catch (err) {
                console.error("⚠️ Error disparando pre-chequeo automático de IA:", err);
            }
        }).catch(err => console.error("⚠️ Error importando servicio de IA para prechequeo:", err));
        res.status(201).json(evidencia);
    }
    catch (error) {
        console.error('[Evidencias Upload Error]:', error);
        res.status(500).json({
            error: 'Error cargando la evidencia',
            detalles: error?.message || String(error)
        });
    }
});
exports.default = router;
