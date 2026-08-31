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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const aiService = __importStar(require("../services/ai.service"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * 1. POST /api/ia/reportes/generar-borrador
 * Genera el borrador preliminar de avances y alertas.
 */
router.post('/reportes/generar-borrador', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const { objetivoId, localidadId, corteId } = req.body;
        if (!objetivoId || !localidadId || !corteId) {
            return res.status(400).json({ error: 'Faltan parámetros objetivoId, localidadId o corteId' });
        }
        // 1. Obtener la localidad y el objetivo
        const localidad = await prisma.localidad.findUnique({ where: { id: localidadId } });
        const objetivo = await prisma.objetivoEstrategico.findUnique({ where: { id: objetivoId } });
        if (!localidad || !objetivo) {
            return res.status(404).json({ error: 'Localidad u Objetivo estratégico no encontrado' });
        }
        // 2. Obtener cifras y comentarios de actividades para este objetivo y localidad
        const asignaciones = await prisma.asignacionLocalidad.findMany({
            where: {
                localidadId,
                actividad: {
                    hito: {
                        programa: {
                            objetivoId
                        }
                    }
                }
            },
            include: {
                actividad: {
                    include: {
                        comentarios: {
                            where: { localidadId }
                        }
                    }
                }
            }
        });
        const cifras = asignaciones.map(a => ({
            codigo: a.actividad.codigoCompleto,
            nombre: a.actividad.nombre,
            avance: a.porcentajeAvance,
            estado: a.estadoLocal || 'NO_INICIADA'
        }));
        // Cosechar todos los comentarios
        const comentarios = [];
        for (const a of asignaciones) {
            if (a.actividad.comentarios) {
                for (const c of a.actividad.comentarios) {
                    if (c.texto && c.texto.trim()) {
                        comentarios.push(`[Actividad ${a.actividad.codigoCompleto}] ${c.texto}`);
                    }
                }
            }
        }
        // Calcular actividades vencidas / rezagadas
        const ahora = new Date();
        const rezagadas = asignaciones
            .filter(a => {
            if (!a.actividad.fechaLimite)
                return false;
            const limite = new Date(a.actividad.fechaLimite);
            return limite < ahora && a.porcentajeAvance < 100 && a.estadoLocal !== 'COMPLETA_SIN_VALIDAR';
        })
            .map(a => {
            const diasRetraso = Math.floor((ahora.getTime() - new Date(a.actividad.fechaLimite).getTime()) / (1000 * 60 * 60 * 24));
            return {
                codigo: a.actividad.codigoCompleto,
                nombre: a.actividad.nombre,
                diasRetraso
            };
        });
        // 3. Obtener alertas activas desde FichaAlerta (las reales de Panel de Alertas) para todas las localidades
        const alertasFicha = await prisma.fichaAlerta.findMany({
            where: {
                objetivoId,
                estado: { in: ['ABIERTA', 'ESCALADA_DESPACHO'] }
            },
            include: {
                localidad: true
            }
        });
        const alertasSimplificadas = alertasFicha.map(a => ({
            tipo: a.tipo,
            descripcion: `${a.descripcion} (Localidad: ${a.localidad?.nombre || 'Global'})`,
            nivel: a.tipo === 'BLOQUEO_ALTO_NIVEL' ? 'CRITICA' : 'MODERADA'
        }));
        // Obtener alerta del objetivo desde FichaResultados
        const latestFichaRes = await prisma.fichaResultados.findFirst({
            orderBy: { periodo: 'desc' }
        });
        let alertaFichaResultados = "";
        if (latestFichaRes) {
            const objCodigo = objetivo.codigo;
            if (objCodigo === 'O1')
                alertaFichaResultados = latestFichaRes.alertaEjecucion || "";
            else if (objCodigo === 'O2')
                alertaFichaResultados = latestFichaRes.alertaObras || "";
            else if (objCodigo === 'O3')
                alertaFichaResultados = `${latestFichaRes.alertaEspacioResiduos || ""} ${latestFichaRes.alertaEspacioVenta || ""}`.trim();
            else if (objCodigo === 'O4')
                alertaFichaResultados = latestFichaRes.alertaConvivencia || "";
            else if (objCodigo === 'O5')
                alertaFichaResultados = latestFichaRes.alertaRollos || "";
            else if (objCodigo === 'OV1')
                alertaFichaResultados = latestFichaRes.alertaEstrategias || "";
            else if (objCodigo === 'O6')
                alertaFichaResultados = latestFichaRes.alertaActuaciones || "";
        }
        // 4. Llamar al servicio de IA con los nuevos datos consolidados
        const borrador = await aiService.generarBorradorReporte(localidad.nombre, objetivo.nombre, cifras, alertasSimplificadas, comentarios, rezagadas, alertaFichaResultados);
        // 5. Guardar en la base de datos como borrador
        const reporte = await prisma.reporteCualitativo.upsert({
            where: {
                objetivoId_corteId: { objetivoId, corteId }
            },
            create: {
                objetivoId,
                corteId,
                principalesAvancesDraft: borrador.avancesDraft,
                alertasRecomendacionesDraft: borrador.alertasDraft,
                estadoRevisionAvances: 'BORRADOR_GENERADO',
                estadoRevisionAlertas: 'BORRADOR_GENERADO',
                generadoPorIA: true,
                fechaGeneracionIA: new Date()
            },
            update: {
                principalesAvancesDraft: borrador.avancesDraft,
                alertasRecomendacionesDraft: borrador.alertasDraft,
                estadoRevisionAvances: 'BORRADOR_GENERADO',
                estadoRevisionAlertas: 'BORRADOR_GENERADO',
                generadoPorIA: true,
                fechaGeneracionIA: new Date()
            }
        });
        res.json(reporte);
    }
    catch (error) {
        console.error('[AI Routes] Error en generar-borrador:', error);
        res.status(500).json({ error: 'Error interno generando borrador con IA' });
    }
});
/**
 * 2. PUT /api/ia/reportes/guardar-edicion
 * Guarda los textos editados por el Administrador antes de publicar.
 */
router.put('/reportes/guardar-edicion', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const { reporteId, avances, alertas } = req.body;
        if (!reporteId) {
            return res.status(400).json({ error: 'Falta parámetro reporteId' });
        }
        const reporte = await prisma.reporteCualitativo.update({
            where: { id: reporteId },
            data: {
                principalesAvancesDraft: avances,
                alertasRecomendacionesDraft: alertas,
                estadoRevisionAvances: 'EN_REVISION',
                estadoRevisionAlertas: 'EN_REVISION',
                editadoPorId: req.user.id,
                fechaUltimaEdicion: new Date()
            }
        });
        res.json(reporte);
    }
    catch (error) {
        console.error('[AI Routes] Error en guardar-edicion:', error);
        res.status(500).json({ error: 'Error guardando edición del reporte' });
    }
});
/**
 * 3. POST /api/ia/reportes/publicar
 * Publica los textos consolidados y los hace visibles en el Tablero de Control.
 */
router.post('/reportes/publicar', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const { reporteId } = req.body;
        if (!reporteId) {
            return res.status(400).json({ error: 'Falta parámetro reporteId' });
        }
        const draft = await prisma.reporteCualitativo.findUnique({ where: { id: reporteId } });
        if (!draft) {
            return res.status(404).json({ error: 'Reporte cualitativo no encontrado' });
        }
        const reporte = await prisma.reporteCualitativo.update({
            where: { id: reporteId },
            data: {
                principalesAvances: draft.principalesAvancesDraft,
                alertasRecomendaciones: draft.alertasRecomendacionesDraft,
                estadoRevisionAvances: 'APROBADO_PUBLICADO',
                estadoRevisionAlertas: 'APROBADO_PUBLICADO',
                fechaUltimaEdicion: new Date()
            }
        });
        res.json(reporte);
    }
    catch (error) {
        console.error('[AI Routes] Error en publicar:', error);
        res.status(500).json({ error: 'Error publicando reporte cualitativo' });
    }
});
/**
 * 4. POST /api/ia/alertas/analizar-preliminar
 * Sugiere severidad, responsable e identifica alertas similares.
 */
router.post('/alertas/analizar-preliminar', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const { descripcion, localidadId } = req.body;
        if (!descripcion || !localidadId) {
            return res.status(400).json({ error: 'Faltan parámetros descripcion o localidadId' });
        }
        // Obtener usuarios disponibles en la localidad o administradores
        const usuarios = await prisma.usuario.findMany({
            select: { id: true, nombre: true, rol: true, email: true }
        });
        // Llamar a IA para clasificar
        const sugerencias = await aiService.clasificarYEnrutarAlerta(descripcion, localidadId, usuarios);
        // Buscar alertas similares en la base de datos (similitud semántica/palabras clave básica)
        const alertasPasadas = await prisma.fichaAlerta.findMany({
            where: { localidadId },
            take: 5,
            orderBy: { fechaCreacion: 'desc' }
        });
        // Simular puntaje de coincidencia básica usando palabras en común para no complejizar en el piloto sin base vectorial
        const alertasRelacionadas = alertasPasadas.map(a => {
            const palabrasComunes = a.descripcion.split(' ').filter(w => w.length > 4 && descripcion.includes(w));
            const score = palabrasComunes.length > 0 ? 0.5 + (palabrasComunes.length * 0.1) : 0.0;
            return {
                alertaId: a.id,
                scoreSimilitud: Math.min(score, 0.95),
                descripcion: a.descripcion
            };
        }).filter(r => r.scoreSimilitud > 0.4);
        res.json({
            ...sugerencias,
            alertasRelacionadas
        });
    }
    catch (error) {
        console.error('[AI Routes] Error en analizar-preliminar:', error);
        res.status(500).json({ error: 'Error analizando alerta con IA' });
    }
});
/**
 * 5. POST /api/ia/evidencias/prechequear
 * Dispara el análisis de pre-chequeo sobre una evidencia cargada en Supabase.
 */
router.post('/evidencias/prechequear', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const { evidenciaId } = req.body;
        if (!evidenciaId) {
            return res.status(400).json({ error: 'Falta el parámetro evidenciaId' });
        }
        const evidencia = await prisma.evidencia.findUnique({
            where: { id: evidenciaId },
            include: { actividad: true }
        });
        if (!evidencia) {
            return res.status(404).json({ error: 'Evidencia no encontrada' });
        }
        // Para el piloto, si no hay archivo binario directo, leemos la metadata y simulamos con su URL.
        // En caso real, haríamos fetch del archivo desde Supabase usando su URL.
        let fileBase64 = null;
        let mimeType = null;
        if (evidencia.urlArchivo && !evidencia.urlArchivo.includes('simulado')) {
            try {
                // Fetch del buffer de Supabase Storage para enviarlo a Gemini
                const fileResponse = await fetch(evidencia.urlArchivo);
                const arrayBuffer = await fileResponse.arrayBuffer();
                fileBase64 = Buffer.from(arrayBuffer).toString('base64');
                mimeType = fileResponse.headers.get('content-type');
            }
            catch (err) {
                console.warn('⚠️ No se pudo descargar el archivo de Supabase. Corriendo en modo texto.', err);
            }
        }
        const prechequeo = await aiService.prechequearEvidencia(evidencia.actividad.descripcion || evidencia.actividad.nombre, evidencia.actividad.tiposEvidenciaRequeridos, fileBase64, mimeType, evidencia.comentarioAdjunto || '');
        // Persistir el resultado
        const evidenciaActualizada = await prisma.evidencia.update({
            where: { id: evidenciaId },
            data: {
                prechequeoEstado: prechequeo.prechequeoEstado,
                prechequeoPuntaje: prechequeo.prechequeoPuntaje,
                prechequeoFeedback: prechequeo.prechequeoFeedback,
                fechaAnalisisIA: new Date()
            }
        });
        res.json(evidenciaActualizada);
    }
    catch (error) {
        console.error('[AI Routes] Error en prechequear evidencia:', error);
        res.status(500).json({ error: 'Error analizando evidencia con IA' });
    }
});
/**
 * 6. POST /api/ia/chat/mensaje
 * Endpoint del Asistente SITRA conversacional.
 */
router.post('/chat/mensaje', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Falta el parámetro query' });
        }
        // Generamos un resumen del esquema para el contexto de la IA de forma segura
        const contextoData = `
      SITRA Data Model:
      - Actividad (id, codigoCompleto, nombre, descripcion, estado: PENDIENTE/EN_PROGRESO/COMPLETADA/CON_ALERTA/VENCIDA, prioridad)
      - Localidad (id, nombre)
      - AsignacionLocalidad (actividadId, localidadId, porcentajeAvance, estadoLocal, estadoValidacion)
      - Alerta (id, tipo, descripcion, nivel: CRITICA/MODERADA/INFORMATIVA, activa)
      - Comentario (id, actividadId, localidadId, texto, esAlerta)
      - HistorialCambios (id, actividadId, localidadId, campoModificado, valorAnterior, valorNuevo, justificacion, fechaCambio)
    `;
        const chatResponse = await aiService.responderConsultaChat(query, req.user.rol, contextoData);
        let respuestaFinal = chatResponse.respuesta;
        let datosReales = "";
        if (chatResponse.parametrosFiltro && Object.keys(chatResponse.parametrosFiltro).length > 0) {
            const filtros = chatResponse.parametrosFiltro;
            let asignaciones = [];
            let alertas = [];
            // 1. Filtrar por Localidad si se detecta nombre
            let localidadId = filtros.localidadId;
            const targetLocalidad = filtros.localidadNombre || filtros.localidad || (query.toLowerCase().includes('usaquen') ? 'Usaquén' : 'Suba');
            if (targetLocalidad) {
                const loc = await prisma.localidad.findFirst({
                    where: { nombre: { contains: targetLocalidad, mode: 'insensitive' } }
                });
                if (loc) {
                    localidadId = loc.id;
                }
            }
            // Detectar tipo de consulta
            const queryLower = query.toLowerCase();
            const queryNorm = queryLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const esConsultaVencidas = queryNorm.includes('extempora') ||
                queryNorm.includes('retraso') ||
                queryNorm.includes('retrasada') ||
                queryNorm.includes('vencida') ||
                queryNorm.includes('tarde') ||
                queryNorm.includes('fuera de fecha');
            const esConsultaGeneralStatus = queryNorm.includes('avance') ||
                queryNorm.includes('resumen') ||
                queryNorm.includes('como vamos') ||
                queryNorm.includes('como va') ||
                queryNorm.includes('estado de la localidad') ||
                queryNorm.includes('reporte general') ||
                queryNorm.includes('aspiracion') ||
                queryNorm.includes('aspiración') ||
                queryNorm.includes('objetivo') ||
                queryNorm.includes('mayor avance') ||
                queryNorm.includes('lider') ||
                queryNorm.includes('líder') ||
                queryNorm.includes('mejor');
            if (esConsultaVencidas) {
                const whereAsig = {};
                if (localidadId)
                    whereAsig.localidadId = localidadId;
                const allAsig = await prisma.asignacionLocalidad.findMany({
                    where: whereAsig,
                    include: {
                        actividad: true,
                        localidad: true,
                        responsable: true
                    }
                });
                const ahora = new Date();
                const vencidas = allAsig.filter((a) => {
                    if (!a.actividad.fechaLimite)
                        return false;
                    const limite = new Date(a.actividad.fechaLimite);
                    return limite < ahora && a.porcentajeAvance < 100 && a.estadoLocal !== 'COMPLETA_SIN_VALIDAR';
                });
                // Ordenar por mayor extemporaneidad (más antiguas primero)
                vencidas.sort((x, y) => {
                    return new Date(x.actividad.fechaLimite).getTime() - new Date(y.actividad.fechaLimite).getTime();
                });
                if (vencidas.length > 0) {
                    datosReales = `
            ACTIVIDADES VENCIDAS O EXTEMPORÁNEAS EN ${targetLocalidad}:
            Total vencidas: ${vencidas.length}
            
            Lista de actividades con mayor extemporaneidad (delays):
            ${vencidas.slice(0, 10).map((v) => {
                        const diasRetraso = Math.floor((ahora.getTime() - new Date(v.actividad.fechaLimite).getTime()) / (1000 * 60 * 60 * 24));
                        return `- Actividad ${v.actividad.codigoCompleto || v.actividad.id}: "${v.actividad.nombre}" (Vencimiento: ${new Date(v.actividad.fechaLimite).toLocaleDateString()}, Retraso: ${diasRetraso} días, Avance: ${v.porcentajeAvance}%, Estado local: ${v.estadoLocal || 'NO_INICIADA'}, Responsable: ${v.responsable?.nombre || 'No asignado'})`;
                    }).join('\n')}
          `;
                    respuestaFinal = await aiService.generarRespuestaDirectaChat(query, datosReales);
                }
                else {
                    respuestaFinal = `He consultado la base de datos de SITRA y actualmente no existen actividades con extemporaneidad o retraso en la localidad de "${targetLocalidad}".`;
                }
            }
            else if (esConsultaGeneralStatus) {
                // 2. Query Asignaciones/Avances
                const whereAsig = {};
                if (localidadId)
                    whereAsig.localidadId = localidadId;
                if (filtros.estadoActividad) {
                    whereAsig.actividad = { estado: filtros.estadoActividad };
                }
                asignaciones = await prisma.asignacionLocalidad.findMany({
                    where: whereAsig,
                    include: {
                        actividad: {
                            include: {
                                hito: {
                                    include: {
                                        programa: {
                                            include: {
                                                objetivo: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        localidad: true
                    }
                });
                // 3. Query Alertas
                const whereAlerta = {};
                if (localidadId) {
                    whereAlerta.OR = [
                        { localidadId: localidadId },
                        { localidadId: null }
                    ];
                }
                if (filtros.estadoAlerta) {
                    whereAlerta.estado = filtros.estadoAlerta;
                }
                else {
                    whereAlerta.estado = { in: ['ABIERTA', 'ESCALADA_DESPACHO'] };
                }
                alertas = await prisma.fichaAlerta.findMany({
                    where: whereAlerta,
                    include: {
                        localidad: true
                    }
                });
                if (asignaciones.length > 0 || alertas.length > 0) {
                    let completas = 0;
                    let enCurso = 0;
                    let noIniciadas = 0;
                    const ejemplosCompletas = [];
                    const objProgress = {};
                    for (const a of asignaciones) {
                        const estado = a.estadoLocal || 'NO_INICIADA';
                        if (estado === 'COMPLETA_SIN_VALIDAR' || a.porcentajeAvance === 100) {
                            completas++;
                            if (ejemplosCompletas.length < 3) {
                                ejemplosCompletas.push(a.actividad.nombre);
                            }
                        }
                        else if (estado === 'EN_CURSO_SIN_VALIDAR' || a.porcentajeAvance === 50) {
                            enCurso++;
                        }
                        else {
                            noIniciadas++;
                        }
                        const objetivo = a.actividad.hito?.programa?.objetivo;
                        if (objetivo) {
                            const objId = objetivo.id;
                            if (!objProgress[objId]) {
                                objProgress[objId] = { total: 0, sum: 0, nombre: objetivo.nombre };
                            }
                            objProgress[objId].total++;
                            objProgress[objId].sum += a.porcentajeAvance || 0;
                        }
                    }
                    let liderNombre = "Ninguna";
                    let liderPorcentaje = -1;
                    let liderObjId = "";
                    for (const key in objProgress) {
                        const avg = objProgress[key].sum / objProgress[key].total;
                        if (avg > liderPorcentaje) {
                            liderPorcentaje = Math.round(avg);
                            liderNombre = objProgress[key].nombre;
                            liderObjId = key;
                        }
                    }
                    if (liderNombre === "Ninguna" && Object.keys(objProgress).length > 0) {
                        const firstKey = Object.keys(objProgress)[0];
                        liderNombre = objProgress[firstKey].nombre;
                        liderPorcentaje = 0;
                        liderObjId = firstKey;
                    }
                    // 1. Detectar si la pregunta está orientada a una aspiración específica o a la líder
                    let targetObjetivoId = null;
                    let targetObjetivoNombre = "";
                    const keyWordsMap = {
                        'O1': ['presupuestal', 'presupuesto', 'presupuesta', 'o1', 'gasto', 'inversion'],
                        'O2': ['obras', 'locales', 'construccion', 'obra', 'o2', 'infraestructura'],
                        'O3': ['espacio', 'publico', 'residuos', 'ventas', 'basura', 'vendedores', 'o3'],
                        'O4': ['seguridad', 'convivencia', 'policia', 'ponal', 'delito', 'o4'],
                        'O5': ['rollos', 'rolos', 'legendarios', 'o5'],
                        'O6': ['bogotaneidad', 'cultura', 'ciudadania', 'o6'],
                        'OV1': ['estrategias', 'memoria', 'paz', 'victimas', 'ov1'],
                        'OV2': ['canales', 'atencion', 'ov2']
                    };
                    for (const key in objProgress) {
                        const nombreObj = objProgress[key].nombre.toLowerCase();
                        const codeParts = objProgress[key].nombre.split('.');
                        const codeRaw = (codeParts[0] || '').trim().toUpperCase();
                        const nombreNormalizado = nombreObj.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        const queryNormalizado = queryLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        const keywords = keyWordsMap[codeRaw] || [];
                        const matchesKeyword = keywords.some(kw => queryNormalizado.includes(kw));
                        if (queryNormalizado.includes(nombreNormalizado) || matchesKeyword) {
                            targetObjetivoId = key;
                            targetObjetivoNombre = objProgress[key].nombre;
                            break;
                        }
                    }
                    if (!targetObjetivoId && liderObjId) {
                        targetObjetivoId = liderObjId;
                        targetObjetivoNombre = liderNombre;
                    }
                    let objetivoEspecifico = undefined;
                    if (targetObjetivoId) {
                        let totalObj = 0;
                        let completasObj = 0;
                        let enCursoObj = 0;
                        let noIniciadasObj = 0;
                        const ejemplosCompletasObj = [];
                        for (const a of asignaciones) {
                            const objetivo = a.actividad.hito?.programa?.objetivo;
                            if (objetivo && objetivo.id === targetObjetivoId) {
                                totalObj++;
                                const estado = a.estadoLocal || 'NO_INICIADA';
                                if (estado === 'COMPLETA_SIN_VALIDAR' || a.porcentajeAvance === 100) {
                                    completasObj++;
                                    if (ejemplosCompletasObj.length < 3) {
                                        ejemplosCompletasObj.push(a.actividad.nombre);
                                    }
                                }
                                else if (estado === 'EN_CURSO_SIN_VALIDAR' || a.porcentajeAvance === 50) {
                                    enCursoObj++;
                                }
                                else {
                                    noIniciadasObj++;
                                }
                            }
                        }
                        const alSub = alertas.filter(al => al.objetivoId === targetObjetivoId);
                        const alertasTextoObj = alSub.length > 0
                            ? alSub.map(al => `- [${al.tipo}] ${al.descripcion} (Responsable: ${al.responsable}, Estado: ${al.estado})`).join('\n')
                            : "No hay alertas activas para esta aspiración.";
                        objetivoEspecifico = {
                            nombre: targetObjetivoNombre,
                            total: totalObj,
                            completas: completasObj,
                            enCurso: enCursoObj,
                            noIniciadas: noIniciadasObj,
                            alertasCount: alSub.length,
                            ejemplosCompletas: ejemplosCompletasObj,
                            alertasTexto: alertasTextoObj
                        };
                    }
                    const alertasTexto = alertas.map(al => `- [${al.tipo}] ${al.descripcion} (Localidad: ${al.localidad?.nombre || 'Global'}, Responsable: ${al.responsable}, Estado: ${al.estado})`).join('\n');
                    respuestaFinal = await aiService.generarRespuestaFinalChat(query, {
                        liderNombre,
                        liderPorcentaje,
                        completas,
                        enCurso,
                        noIniciadas,
                        totalAsignaciones: asignaciones.length,
                        totalAlertas: alertas.length,
                        ejemplosCompletas,
                        alertasTexto,
                        objetivoEspecifico
                    });
                }
                else {
                    respuestaFinal = `He consultado los datos de SITRA aplicando el filtro para la localidad de "${targetLocalidad || 'especificada'}" pero actualmente no existen registros de actividades asignadas o alertas creadas en esta sección.`;
                }
            }
            else {
                // Consulta genérica específica
                const whereAsig = {};
                if (localidadId)
                    whereAsig.localidadId = localidadId;
                const allAsig = await prisma.asignacionLocalidad.findMany({
                    where: whereAsig,
                    include: {
                        actividad: true,
                        localidad: true,
                        responsable: true
                    }
                });
                const allAlerts = await prisma.fichaAlerta.findMany({
                    where: { estado: { in: ['ABIERTA', 'ESCALADA_DESPACHO'] } },
                    include: { localidad: true }
                });
                datosReales = `
          DATOS DISPONIBLES EN SISTEMA SITRA PARA ${targetLocalidad}:
          Asignaciones (${allAsig.length} encontradas):
          ${allAsig.slice(0, 15).map(a => `- Actividad ${a.actividad.codigoCompleto || a.actividad.id}: "${a.actividad.nombre}" (Avance: ${a.porcentajeAvance}%, Estado: ${a.estadoLocal || 'NO_INICIADA'}, Responsable: ${a.responsable?.nombre || 'No asignado'})`).join('\n')}
          
          Alertas Activas (${allAlerts.length} encontradas):
          ${allAlerts.map(al => `- [${al.tipo}] "${al.descripcion}" (Responsable: ${al.responsable}, Estado: ${al.estado}, Localidad: ${al.localidad?.nombre || 'Global'})`).join('\n')}
        `;
                respuestaFinal = await aiService.generarRespuestaDirectaChat(query, datosReales);
            }
        }
        // Registrar en el historial de chat para auditoría
        await prisma.historialChat.create({
            data: {
                usuarioId: req.user.id,
                consulta: query,
                respuesta: respuestaFinal,
                exitoSQL: true,
                sentenciaSQL: JSON.stringify(chatResponse.parametrosFiltro),
                fechaConsulta: new Date()
            }
        });
        res.json({
            respuesta: respuestaFinal,
            referencias: []
        });
    }
    catch (error) {
        console.error('[AI Routes] Error en chat/mensaje:', error);
        res.status(500).json({ error: 'Error procesando consulta conversacional' });
    }
});
exports.default = router;
