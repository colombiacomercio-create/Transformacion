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
// Helper para calcular el estado y porcentaje normalizado de una asignación igual que en el Tablero de Control
const calcularAvanceAsignacion = (asig, act) => {
    const completada = asig?.estadoLocal === 'COMPLETA_SIN_VALIDAR' ||
        asig?.estadoValidacion === 'VALIDADA_COMPLETADA' ||
        asig?.estadoLocal === 'COMPLETADA_LOCAL' ||
        act?.estado === 'COMPLETADA';
    const enCurso = asig?.estadoLocal === 'EN_CURSO_SIN_VALIDAR' ||
        asig?.estadoValidacion === 'VALIDADA_EN_CURSO' ||
        act?.estado === 'EN_PROGRESO';
    let valAvance = 0;
    if (completada) {
        valAvance = 100;
    }
    else if (enCurso) {
        valAvance = 50;
    }
    else if (typeof asig?.porcentajeAvance === 'number' && asig.porcentajeAvance > 0) {
        valAvance = Math.min(100, asig.porcentajeAvance);
    }
    const estado = completada ? 'COMPLETADA' : enCurso ? 'EN_CURSO' : 'NO_INICIADA';
    return { estado, avance: valAvance };
};
const mapAspiracionByCodigo = (codigo) => {
    const c = codigo || '';
    const p = c.split('.')[0] || '';
    if (p === 'P01' || p === 'P02')
        return 'A1. Presupuesto';
    if (p === 'P03' || p === 'P04' || p === 'P05')
        return 'A2. Experiencia Ciudad';
    if (p === 'P06' || p === 'P07')
        return 'A3. Seguridad';
    if (p === 'P08' || c.includes('[P05') || c.includes('H2') || c.includes('P2') || c.includes('P08'))
        return 'A4. Rollo Legendario';
    if (p === 'P09' || p === 'P10')
        return 'A5. Bogotaneidad';
    if (p.startsWith('PV') && p !== 'PV4')
        return 'A6. DDHH';
    if (p === 'PV4')
        return 'A7. Cercanía ciudadano';
    return 'A4. Rollo Legendario';
};
/**
 * 1. POST /api/ia/reportes/generar-borrador
 * Genera el borrador ejecutivo resumiendo TODAS las actividades, avances y alertas
 * (Soporta vista Global Distrital 'TODAS' o una localidad específica, y un objetivo o todos).
 * Exclusivo para ADMIN.
 */
router.post('/reportes/generar-borrador', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const { objetivoId, localidadId, corteId } = req.body;
        if (!corteId) {
            return res.status(400).json({ error: 'Falta parámetro corteId' });
        }
        const esGlobalLocalidad = !localidadId || localidadId === 'TODAS' || localidadId === 'GLOBAL';
        let localidadNombre = 'TODAS (Balance General Distrital)';
        if (!esGlobalLocalidad) {
            const localidad = await prisma.localidad.findUnique({ where: { id: localidadId } });
            if (localidad) {
                localidadNombre = localidad.nombre;
            }
        }
        let objetivo = null;
        if (objetivoId && objetivoId !== 'TODOS') {
            objetivo = await prisma.objetivoEstrategico.findUnique({ where: { id: objetivoId } });
        }
        if (!objetivo) {
            // Buscar el primer objetivo con actividades o el primero disponible para asociar el reporte
            const actConObj = await prisma.actividad.findFirst({
                include: { hito: { include: { programa: { include: { objetivo: true } } } } }
            });
            objetivo = actConObj?.hito?.programa?.objetivo || (await prisma.objetivoEstrategico.findFirst());
        }
        if (!objetivo) {
            return res.status(404).json({ error: 'No se encontró objetivo estratégico en la base de datos' });
        }
        const corte = await prisma.corteMensual.findUnique({ where: { id: corteId } });
        const fechaCorte = corte?.fechaLimite ? new Date(corte.fechaLimite) : new Date();
        // Obtener TODAS las actividades del sistema con sus asignaciones, comentarios y evidencias
        const todasActividades = await prisma.actividad.findMany({
            include: {
                hito: { include: { programa: { include: { objetivo: true } } } },
                asignaciones: {
                    where: esGlobalLocalidad ? {} : { localidadId },
                    include: { localidad: true }
                },
                comentarios: {
                    where: esGlobalLocalidad ? {} : { localidadId },
                    orderBy: { fechaCreacion: 'desc' },
                    take: 5
                },
                evidencias: {
                    where: esGlobalLocalidad ? {} : { localidadId }
                }
            },
            orderBy: { codigoCompleto: 'asc' }
        });
        // Construir el resumen de TODAS las actividades y sus avances
        const cifras = [];
        const comentarios = [];
        const rezagadas = [];
        for (const act of todasActividades) {
            const asigs = act.asignaciones || [];
            if (asigs.length === 0)
                continue;
            let sumAvanceAct = 0;
            let compAct = 0;
            let curAct = 0;
            for (const asig of asigs) {
                const { estado, avance } = calcularAvanceAsignacion(asig, act);
                sumAvanceAct += avance;
                if (estado === 'COMPLETADA')
                    compAct++;
                else if (estado === 'EN_CURSO')
                    curAct++;
            }
            const promAct = Math.round(sumAvanceAct / asigs.length);
            const estadoConsolidado = compAct === asigs.length || promAct >= 100
                ? 'COMPLETADA'
                : compAct > 0 || curAct > 0 || promAct > 0
                    ? 'EN_CURSO'
                    : 'NO_INICIADA';
            cifras.push({
                codigo: act.codigoCompleto,
                nombre: act.nombre,
                avance: promAct,
                estado: estadoConsolidado,
                localidad: esGlobalLocalidad ? `${compAct}/${asigs.length} loc. completas` : localidadNombre,
                producto: act.hito?.programa?.codigo || act.codigoCompleto.split('.')[0] || 'General'
            });
            if (act.comentarios && act.comentarios.length > 0) {
                for (const c of act.comentarios) {
                    if (c.texto && c.texto.trim()) {
                        comentarios.push(`[${act.codigoCompleto} - ${act.nombre}] ${c.texto.replace(/\n/g, ' ')}`);
                    }
                }
            }
            const esProgramada = !act.fechaLimite || new Date(act.fechaLimite) <= fechaCorte;
            if (esProgramada && estadoConsolidado !== 'COMPLETADA') {
                const refDate = act.fechaLimite ? new Date(act.fechaLimite) : fechaCorte;
                const diasRetraso = Math.max(0, Math.floor((fechaCorte.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24)));
                rezagadas.push({
                    codigo: act.codigoCompleto,
                    nombre: act.nombre,
                    diasRetraso,
                    localidad: esGlobalLocalidad ? 'Distrital' : localidadNombre
                });
            }
        }
        // Obtener TODAS las alertas activas desde FichaAlerta (Gestor de Alertas)
        const alertasFicha = await prisma.fichaAlerta.findMany({
            where: {
                estado: { in: ['ABIERTA', 'ESCALADA_DESPACHO', 'ESCALADA_GABINETE'] },
                ...(esGlobalLocalidad ? {} : { OR: [{ localidadId }, { localidadId: null }] })
            },
            include: {
                localidad: true,
                objetivo: true
            },
            orderBy: { fechaCreacion: 'desc' }
        });
        const alertasSimplificadas = alertasFicha.map(a => ({
            tipo: a.tipo,
            descripcion: `${a.descripcion} (Localidad: ${a.localidad?.nombre || 'Global'}, Responsable: ${a.responsable || 'N/A'}, Estado: ${a.estado})`,
            nivel: a.tipo === 'BLOQUEO_ALTO_NIVEL' || a.tipo === 'ESTRUCTURAL' ? 'CRITICA' : 'MODERADA'
        }));
        // Obtener alertas consolidada de FichaResultados
        const latestFichaRes = await prisma.fichaResultados.findFirst({
            orderBy: { periodo: 'desc' }
        });
        let alertaFichaResultados = '';
        if (latestFichaRes) {
            const partesAlertaFicha = [
                latestFichaRes.alertaRollos ? `[Rollos] ${latestFichaRes.alertaRollos}` : '',
                latestFichaRes.alertaEjecucion ? `[Presupuesto] ${latestFichaRes.alertaEjecucion}` : '',
                latestFichaRes.alertaObras ? `[Obras] ${latestFichaRes.alertaObras}` : '',
                latestFichaRes.alertaEspacioResiduos ? `[Residuos P04] ${latestFichaRes.alertaEspacioResiduos}` : '',
                latestFichaRes.alertaEspacioVenta ? `[Espacio Público P05] ${latestFichaRes.alertaEspacioVenta}` : '',
                latestFichaRes.alertaConvivencia ? `[Convivencia] ${latestFichaRes.alertaConvivencia}` : '',
                latestFichaRes.alertaActuaciones ? `[Actuaciones] ${latestFichaRes.alertaActuaciones}` : '',
                latestFichaRes.alertaEstrategias ? `[Estrategias] ${latestFichaRes.alertaEstrategias}` : ''
            ].filter(Boolean);
            alertaFichaResultados = partesAlertaFicha.join(' | ');
        }
        const tituloAlcance = `Tablero de Control — ${objetivo.nombre} (Todas las actividades, avances y alertas)`;
        const borrador = await aiService.generarBorradorReporte(localidadNombre, tituloAlcance, cifras, alertasSimplificadas, comentarios, rezagadas, alertaFichaResultados);
        const reporte = await prisma.reporteCualitativo.upsert({
            where: {
                objetivoId_corteId: { objetivoId: objetivo.id, corteId }
            },
            create: {
                objetivoId: objetivo.id,
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
 * Sugiere severidad, responsable e identifica alertas similares. (Solo ADMIN)
 */
router.post('/alertas/analizar-preliminar', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const { descripcion, localidadId } = req.body;
        if (!descripcion || !localidadId) {
            return res.status(400).json({ error: 'Faltan parámetros descripcion o localidadId' });
        }
        const usuarios = await prisma.usuario.findMany({
            select: { id: true, nombre: true, rol: true, email: true }
        });
        const sugerencias = await aiService.clasificarYEnrutarAlerta(descripcion, localidadId, usuarios);
        const whereClause = localidadId === 'todos' ? {} : { localidadId };
        const alertasPasadas = await prisma.fichaAlerta.findMany({
            where: whereClause,
            take: 5,
            orderBy: { fechaCreacion: 'desc' }
        });
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
 * Dispara el análisis de pre-chequeo sobre una evidencia cargada en Supabase. (Solo ADMIN)
 */
router.post('/evidencias/prechequear', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
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
        let fileBase64 = null;
        let mimeType = null;
        if (evidencia.urlArchivo && !evidencia.urlArchivo.includes('simulado')) {
            try {
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
 * Endpoint del Asistente Estratégico RADAR (Solo ADMIN).
 * Extrae datos del Tablero de Resultados (Ficha de Resultados) y del módulo específico consultado,
 * respondiendo de forma sucinta y estratégica por producto (a menos que el usuario solicite detalle).
 */
router.post('/chat/mensaje', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Falta el parámetro query' });
        }
        const queryLower = String(query).toLowerCase();
        const queryNorm = queryLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // 1. Detectar si el usuario solicita explícitamente un reporte detallado
        const pideDetalle = queryNorm.includes('detalle') ||
            queryNorm.includes('detallad') ||
            queryNorm.includes('lista completa') ||
            queryNorm.includes('desglos') ||
            queryNorm.includes('profundiz') ||
            queryNorm.includes('amplia') ||
            queryNorm.includes('exhaustiv') ||
            queryNorm.includes('todos los contratos') ||
            queryNorm.includes('todas las localidades') ||
            queryNorm.includes('frente por frente');
        const detectarTema = (q) => {
            if (q.includes('obra') ||
                q.includes('p03') ||
                q.includes('malla vial') ||
                q.includes('salon comunal') ||
                q.includes('salones comunales') ||
                q.includes('vivienda rural') ||
                q.includes('parque') ||
                q.includes('senalizacion') ||
                q.includes('frente de obra') ||
                q.includes('frentes de obra')) {
                return 'OBRAS';
            }
            if (q.includes('presupuest') ||
                q.includes('ejecucion presupuestal') ||
                q.includes('giro') ||
                q.includes('ingenieria de detalle') ||
                q.includes('comite de contratacion') ||
                q.includes('comites de contratacion') ||
                q.includes('p01') ||
                q.includes('p02') ||
                (q.includes('compromiso') && !q.includes('acta') && !q.includes('reunion'))) {
                return 'PRESUPUESTO';
            }
            if (q.includes('sostenibilidad') ||
                q.includes('isp') ||
                q.includes('recaida') ||
                q.includes('accion focalizada') ||
                q.includes('survey123')) {
                return 'SOSTENIBILIDAD';
            }
            if (q.includes('residuo') ||
                q.includes('basura') ||
                q.includes('punto critico') ||
                q.includes('puntos criticos') ||
                q.includes('lrec') ||
                q.includes('p04') ||
                q.includes('ivc') ||
                q.includes('sensibiliza')) {
                return 'RESIDUOS_P04';
            }
            if (q.includes('espacio publico') ||
                q.includes('venta informal') ||
                q.includes('ventas informales') ||
                q.includes('vendedor') ||
                q.includes('parqueo') ||
                q.includes('p05') ||
                q.includes('m2 recuperado') ||
                q.includes('zona de manejo') ||
                q.includes('zonas de manejo') ||
                q.includes('decreto 117')) {
                return 'ESPACIO_PUBLICO_P05';
            }
            if (q.includes('convivencia') ||
                q.includes('seguridad') ||
                q.includes('vehiculo') ||
                q.includes('moto') ||
                q.includes('camioneta') ||
                q.includes('policia') ||
                q.includes('sdscj') ||
                q.includes('parque automotor') ||
                q.includes('dotacion') ||
                q.includes('p06')) {
                return 'CONVIVENCIA_SEGURIDAD';
            }
            if (q.includes('actuacion') ||
                q.includes('archivo') ||
                q.includes('fallo') ||
                q.includes('primera instancia') ||
                q.includes('querella') ||
                q.includes('descongestion')) {
                return 'ACTUACIONES';
            }
            if (q.includes('memoria') ||
                q.includes('paz') ||
                q.includes('reconciliacion') ||
                q.includes('victima') ||
                q.includes('estrategias de memoria') ||
                q.includes('pv1') ||
                q.includes('ov1')) {
                return 'ESTRATEGIAS_MEMORIA';
            }
            if (q.includes('rollo') || q.includes('legendario') || q.includes('desenroll') || q.includes('p08')) {
                return 'ROLLOS';
            }
            if (q.includes('reunion') || q.includes('sesion') || q.includes('mesa de trabajo') || q.includes('mesas de trabajo') || q.includes('stocktake') || q.includes('acta')) {
                return 'SESIONES_REUNIONES';
            }
            if (q.includes('informe') || q.includes('boletin') || q.includes('oap') || q.includes('reporte sdg')) {
                return 'INFORMES';
            }
            if (q.includes('evento') || q.includes('conectar para transformar')) {
                return 'EVENTOS';
            }
            if (q.includes('normativ') || q.includes('decreto') || q.includes('proyecto de ley')) {
                return 'NORMATIVO';
            }
            if (q.includes('otro espacio') || q.includes('otros espacios') || q.includes('circulo de calidad')) {
                return 'OTROS_ESPACIOS';
            }
            if (q.includes('kanban') || q.includes('evidencia') || q.includes('panel de actividades')) {
                return 'ACTIVIDADES_KANBAN';
            }
            if (q.includes('gestor de alerta') || (q.includes('alerta') && !q.includes('tablero') && !q.includes('resumen'))) {
                return 'ALERTAS';
            }
            return 'TABLERO_CONTROL';
        };
        const tema = detectarTema(queryNorm);
        const ficha = await prisma.fichaResultados.findFirst({ orderBy: { periodo: 'desc' } });
        const fechaCorteFicha = ficha?.periodo
            ? new Date(ficha.periodo).toLocaleDateString('es-CO', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' })
            : 'Corte Vigente';
        const pct = (real, prog) => prog && prog > 0 ? Math.round(((real || 0) / prog) * 100) : 0;
        const cleanBullets = (txt) => (txt || '')
            .split('\n')
            .map(l => l.replace(/^[-*•✓✔\s\u25A0\u25A1\u25B6\u25CF\uF0FC\u00FC]+/g, '').trim())
            .filter(Boolean);
        let contextoFocalizado = '';
        let resumenFallback = '';
        const modoRespuesta = tema === 'TABLERO_CONTROL' && !pideDetalle
            ? 'TABLERO_CONTROL'
            : pideDetalle
                ? 'DETALLADO'
                : 'SUCINTO_ESTRATEGICO';
        // ─── CONSTRUCCIÓN DE CONTEXTO Y REPORTE SUCINTO POR PRODUCTO (DESDE FICHA DE RESULTADOS) ───
        if (tema === 'OBRAS') {
            const [frentesObra, alertasObra, metaObra] = await Promise.all([
                prisma.frenteObra.findMany(),
                prisma.alertaObra.findMany(),
                prisma.metadatoObra.findFirst()
            ]);
            const metaAnual = ficha?.metaObras ?? 1700;
            const progCorte = ficha?.obrasProgramadasAlCorte ?? 1285;
            const finalizadas = ficha?.intervencionesFinalizadas ?? 1160;
            const avanceCortePct = pct(finalizadas, progCorte);
            const avanceAnualPct = pct(finalizadas, metaAnual);
            const desgloseTipos = `Malla Vial: ${ficha?.obrasMallaVial ?? 542}, Espacio Público: ${ficha?.obrasEspacioPublico ?? 258}, Vivienda Rural: ${ficha?.obrasViviendaRural ?? 144}, Parques: ${ficha?.obrasParque ?? 80}, Salones Comunales: ${ficha?.obrasSalonComunal ?? 26}, Otras: ${ficha?.obrasOtras ?? 107}`;
            const alertaObrasTexto = cleanBullets(ficha?.alertaObras).join(' ') ||
                'Sin alertas críticas registradas en la Ficha de Resultados para Obras Locales.';
            const avanceObrasTexto = cleanBullets(ficha?.avancesObras).join(' ') ||
                `Ejecución del ${avanceCortePct}% frente a lo programado al corte (${finalizadas.toLocaleString('es-CO')} obras finalizadas), concentradas principalmente en Malla Vial (${ficha?.obrasMallaVial ?? 542}) y Espacio Público (${ficha?.obrasEspacioPublico ?? 258}).`;
            const obrasPorEstado = {};
            for (const f of frentesObra) {
                const est = f.estado || 'SIN_ESTADO';
                obrasPorEstado[est] = (obrasPorEstado[est] || 0) + 1;
            }
            contextoFocalizado = `
      PRODUCTO CONSULTADO: 2. OBRAS LOCALES — FICHA DE RESULTADOS (Corte: ${fechaCorteFicha})
      - Meta Anual Total: ${metaAnual} obras
      - Obras Programadas al Corte: ${progCorte} obras
      - Intervenciones Finalizadas: ${finalizadas} obras
      - Cumplimiento al Corte: ${avanceCortePct}% (${avanceAnualPct}% de la meta anual)
      - Distribución por Tipología (Ficha de Resultados): ${desgloseTipos}
      - Avance Estratégico reportado en Ficha: ${avanceObrasTexto}
      - Alerta Principal reportada en Ficha: ${alertaObrasTexto}
      ${pideDetalle
                ? `- Tablero de Frentes de Obra (${metaObra?.fecha_corte || 'Corte actual'}): ${frentesObra.length} frentes registrados (${Object.entries(obrasPorEstado).map(([k, v]) => `${k}: ${v}`).join(', ')}).
      - Contratos con Alerta Técnica (${alertasObra.length}):
        ${alertasObra.slice(0, 15).map(ao => `* ${ao.localidad || 'N/A'} (Contrato ${ao.contrato || 'N/A'}): ${ao.estado_general || ''} - ${ao.observacion_tecnica || ''}`).join('\n        ')}`
                : ''}
      `;
            resumenFallback = `**🏗️ Reporte Estratégico — Obras Locales (Ficha de Resultados · ${fechaCorteFicha})**

* **📊 Avance al Corte**: **${finalizadas.toLocaleString('es-CO')} intervenciones finalizadas** de **${progCorte.toLocaleString('es-CO')} programadas al corte** (**${avanceCortePct}% de cumplimiento al corte** y **${avanceAnualPct}%** frente a la meta anual de **${metaAnual.toLocaleString('es-CO')}**).
* **✅ Avance Principal**: Intervenciones concentradas en **Malla Vial (${ficha?.obrasMallaVial ?? 542})**, **Espacio Público (${ficha?.obrasEspacioPublico ?? 258})**, **Vivienda Rural (${ficha?.obrasViviendaRural ?? 144})**, **Parques (${ficha?.obrasParque ?? 80})**, **Salones Comunales (${ficha?.obrasSalonComunal ?? 26})** y **Otras (${ficha?.obrasOtras ?? 107})**.
* **⚠️ Alerta Principal**: ${alertaObrasTexto}${pideDetalle && alertasObra.length > 0
                ? `\n\n**Detalle de Contratos con Alerta en Tablero de Obras (${alertasObra.length}):**\n${alertasObra
                    .slice(0, 10)
                    .map(ao => `* **${ao.localidad}** (Contrato ${ao.contrato}): ${ao.estado_general} — ${ao.observacion_tecnica || 'En seguimiento'}`)
                    .join('\n')}`
                : '\n\n*Si requieres el desglose detallado por localidad o contrato, solicítalo indicando «con detalle».*'}`;
        }
        else if (tema === 'PRESUPUESTO') {
            const compReal = ficha?.compromisosPct ?? 58;
            const compMeta = ficha?.metaCompromisosPct ?? 73;
            const compCump = pct(compReal, compMeta);
            const girosReal = ficha?.girosPct ?? 40;
            const girosMeta = ficha?.metaGirosPct ?? 40;
            const girosCump = pct(girosReal, girosMeta);
            const procMon = ficha?.procesosMonitoreados ?? 640;
            const procCom = ficha?.procesosRequierenComite ?? 602;
            const avancesEj = cleanBullets(ficha?.avancesEjecucion).join(' · ') || 'Sin avances registrados.';
            const alertaEj = cleanBullets(ficha?.alertaEjecucion).join(' · ') || 'Sin alertas registradas.';
            contextoFocalizado = `
      PRODUCTO CONSULTADO: 1. EJECUCIÓN PRESUPUESTAL — FICHA DE RESULTADOS (Corte: ${fechaCorteFicha})
      - Compromisos: ${compReal}% ejecutado vs ${compMeta}% programado (${compCump}% de cumplimiento relativo al corte)
      - Giros: ${girosReal}% ejecutado vs ${girosMeta}% programado (${girosCump}% de cumplimiento relativo al corte)
      - Contratación FDL: ${procMon} procesos monitoreados (${procCom} requieren comité de contratación)
      - Principales Avances: ${avancesEj}
      - Alerta Principal: ${alertaEj}
      `;
            resumenFallback = `**💰 Reporte Estratégico — Ejecución Presupuestal (Ficha de Resultados · ${fechaCorteFicha})**

* **📊 Avance al Corte**: **Compromisos en ${compReal}%** vs **${compMeta}% programado** (**${compCump}% de cumplimiento**) y **Giros en ${girosReal}%** vs **${girosMeta}% programado** (**${girosCump}% de cumplimiento**). Monitoreo activo sobre **${procMon} procesos** (**${procCom} requieren comité**).
* **✅ Avance Principal**: ${avancesEj}
* **⚠️ Alerta Principal**: ${alertaEj}`;
        }
        else if (tema === 'RESIDUOS_P04') {
            const priorizados = ficha?.puntosCriticosPriorizados ?? 58;
            const sostenidos = ficha?.puntosSostenidos ?? 41;
            const progSost = ficha?.puntosSostenidosProgramados || priorizados;
            const cumpRes = pct(sostenidos, progSost);
            const sensibilizados = ficha?.personasSensibilizadas ?? 25383;
            const ivc = ficha?.operativosIVC ?? 1451;
            const interv = ficha?.accionesReportadas ?? 1888;
            const alertaRes = cleanBullets(ficha?.alertaEspacioResiduos).join(' ') || 'Sin alertas críticas reportadas.';
            const avanceRes = cleanBullets(ficha?.avancesResiduos).join(' ') ||
                `${sostenidos} de ${priorizados} puntos críticos sostenidos (${cumpRes}%), con ${ivc.toLocaleString('es-CO')} operativos IVC, ${sensibilizados.toLocaleString('es-CO')} personas sensibilizadas y ${interv.toLocaleString('es-CO')} intervenciones.`;
            contextoFocalizado = `
      PRODUCTO CONSULTADO: 3. ESPACIO PÚBLICO — RESIDUOS Y PUNTOS CRÍTICOS (P04) — FICHA DE RESULTADOS (Corte: ${fechaCorteFicha})
      - Puntos Críticos Priorizados: ${priorizados} | Puntos Sostenidos: ${sostenidos} (${cumpRes}% de cumplimiento)
      - Operativos IVC: ${ivc} (Meta programada: ${ficha?.operativosIVCProgramados ?? 800})
      - Personas Sensibilizadas: ${sensibilizados} | Intervenciones Ejecutadas: ${interv} (${ficha?.residuosM3 ?? 13864} m³)
      - Avance Principal: ${avanceRes}
      - Alerta Principal: ${alertaRes}
      `;
            resumenFallback = `**♻️ Reporte Estratégico — Residuos y Puntos Críticos P04 (Ficha de Resultados · ${fechaCorteFicha})**

* **📊 Avance al Corte**: **${sostenidos} puntos sostenidos** de **${priorizados} priorizados** (**${cumpRes}% de cumplimiento**).
* **✅ Avance Principal**: **${ivc.toLocaleString('es-CO')} operativos IVC**, **${sensibilizados.toLocaleString('es-CO')} personas sensibilizadas** y **${interv.toLocaleString('es-CO')} intervenciones** ejecutadas (**${(ficha?.residuosM3 ?? 13864).toLocaleString('es-CO')} m³** retirados).
* **⚠️ Alerta Principal**: ${alertaRes}`;
        }
        else if (tema === 'ESPACIO_PUBLICO_P05') {
            const verif = ficha?.puntosVerificados ?? 57;
            const sostEf = ficha?.puntosSostenibilidadEfectiva ?? 16;
            const cumpOrg = pct(sostEf, verif);
            const m2Rec = ficha?.m2RecuperadosInformal ?? 104158;
            const interv = ficha?.puntosIntervenidos ?? 1179;
            const ventaInf = ficha?.ventaInformal ?? 763;
            const parqueo = ficha?.orgParqueo ?? 416;
            const reubic = ficha?.personasReubicadas ?? 1959;
            const avanceVen = cleanBullets(ficha?.avancesVenta).join(' ') || 'Avance en operativos de recuperación y organización.';
            const alertaVen = cleanBullets(ficha?.alertaEspacioVenta).join(' ') || 'Sin alertas registradas.';
            contextoFocalizado = `
      PRODUCTO CONSULTADO: 5. ORGANIZACIÓN DEL ESPACIO PÚBLICO Y VENTA INFORMAL (P05) — FICHA DE RESULTADOS (Corte: ${fechaCorteFicha})
      - Sostenibilidad Efectiva: ${sostEf} de ${verif} puntos verificados (${cumpOrg}% de cumplimiento)
      - Espacio Recuperado: ${m2Rec} m² | Personas Reubicadas: ${reubic}
      - Intervenciones Totales: ${interv} (Venta Informal: ${ventaInf} | Organización Parqueo: ${parqueo})
      - Avance Principal: ${avanceVen}
      - Alerta Principal: ${alertaVen}
      `;
            resumenFallback = `**🏙️ Reporte Estratégico — Espacio Público y Venta Informal P05 (Ficha de Resultados · ${fechaCorteFicha})**

* **📊 Avance al Corte**: **${sostEf} puntos con sostenibilidad efectiva** de **${verif} verificados** (**${cumpOrg}%**), **${m2Rec.toLocaleString('es-CO')} m² recuperados** y **${reubic.toLocaleString('es-CO')} personas reubicadas** en **${interv.toLocaleString('es-CO')} intervenciones** (**${ventaInf}** venta informal y **${parqueo}** parqueo).
* **✅ Avance Principal**: ${avanceVen}
* **⚠️ Alerta Principal**: ${alertaVen}`;
        }
        else if (tema === 'SOSTENIBILIDAD') {
            const sostenibilidadSnap = await prisma.sostenibilidadSnapshot.findFirst({ orderBy: { ultimaLectura: 'desc' } });
            const sData = sostenibilidadSnap?.datosJson || {};
            const p04 = sData.puntosP04 || [];
            const p05 = sData.puntosP05 || [];
            const p04S = p04.filter(x => x.cls === 'S').length;
            const p04A = p04.filter(x => x.cls === 'A').length;
            const p04N = p04.filter(x => x.cls === 'N').length;
            const p05S = p05.filter(x => x.cls === 'S').length;
            const p05A = p05.filter(x => x.cls === 'A').length;
            const p05N = p05.filter(x => x.cls === 'N').length;
            const recaidas = [...p04, ...p05].filter(x => x.cls === 'N');
            contextoFocalizado = `
      MÓDULO CONSULTADO: SOSTENIBILIDAD DE LA OPERACIÓN DE ESPACIO PÚBLICO (P04 Y P05)
      - Total Puntos Priorizados: ${sostenibilidadSnap?.totalPriorizados ?? 116} (P04 Residuos: ${p04.length} | P05 Espacio Público: ${p05.length})
      - P04 Residuos: ${p04S} Sostenidos, ${p04A} En riesgo, ${p04N} en Recaída Confirmada. (21 puntos en Acción Focalizada Octubre en confirmación UAESP).
      - P05 Espacio Público: ${p05S} Sostenidos, ${p05A} En riesgo, ${p05N} en Recaída Confirmada.
      - Puntos en Recaída Confirmada (${recaidas.length}): ${recaidas.map(r => `${r.prod} ${r.ld} (${r.d})`).join('; ')}
      `;
            resumenFallback = `**🌿 Reporte Estratégico — Sostenibilidad Espacio Público (P04 y P05)**

* **📊 Estado al Corte**: **${sostenibilidadSnap?.totalPriorizados ?? 116} puntos priorizados** (**${p04.length} en P04 Residuos** y **${p05.length} en P05 Espacio Público**).
* **✅ Balance de Sostenimiento**: En **P04 Residuos**: **${p04S}** sostenidos, **${p04A}** en riesgo y **${p04N}** en recaída (**21 puntos** en Acción Focalizada Octubre con UAESP). En **P05 Espacio Público**: **${p05S}** sostenidos, **${p05A}** en riesgo y **${p05N}** en recaída.
* **⚠️ Alerta de Recaída (${recaidas.length} puntos Clase N)**: Requieren reintervención prioritaria: ${recaidas.map(r => `**${r.ld}** (${r.d})`).join(', ') || 'Ninguno'}.`;
        }
        else if (tema === 'CONVIVENCIA_SEGURIDAD') {
            const metaVeh = ficha?.vehiculosMetaTotal ?? 369;
            const progVeh = ficha?.vehiculosProgramadosCorte ?? metaVeh;
            const entPol = ficha?.vehiculosEntregadosPolicia ?? 264;
            const entSdscj = ficha?.vehiculosEntregadosSdscj ?? 9;
            const entTotal = entPol + entSdscj;
            const almFdl = ficha?.vehiculosEntregadosAlmacen ?? 39;
            const pendVeh = ficha?.vehiculosPendienteEntrega ?? 57;
            const cumpVeh = pct(entTotal, progVeh);
            const avanceConv = cleanBullets(ficha?.avancesConvivencia).join(' ') || 'Avances en entrega de parque automotor.';
            const alertaConv = cleanBullets(ficha?.alertaConvivencia).join(' · ') || 'Sin alertas registradas.';
            contextoFocalizado = `
      PRODUCTO CONSULTADO: 6. CONVIVENCIA Y SEGURIDAD (DOTACIÓN DE VEHÍCULOS Y MOTOS) — FICHA DE RESULTADOS (Corte: ${fechaCorteFicha})
      - Meta Total Vehículos: ${metaVeh} | Programados al Corte: ${progVeh}
      - Vehículos Entregados en Operación: ${entTotal} (${cumpVeh}% de cumplimiento al corte) -> Policía: ${entPol}, SDSCJ: ${entSdscj}
      - En Almacén FDL: ${almFdl} | Pendientes de Entrega: ${pendVeh}
      - Avance Principal: ${avanceConv}
      - Alerta Principal: ${alertaConv}
      `;
            resumenFallback = `**🚓 Reporte Estratégico — Convivencia y Seguridad (Ficha de Resultados · ${fechaCorteFicha})**

* **📊 Avance al Corte**: **${entTotal} vehículos entregados** (**${entPol} a Policía** y **${entSdscj} a SDSCJ**) de **${progVeh} programados** (**${cumpVeh}% de cumplimiento**). **${almFdl}** en almacén FDL y **${pendVeh}** pendientes de entrega.
* **✅ Avance Principal**: ${avanceConv}
* **⚠️ Alerta Principal**: ${alertaConv}`;
        }
        else if (tema === 'ACTUACIONES') {
            const archPct = ficha?.archivosPct ?? 0;
            const fallosPct = ficha?.fallosPrimeraEstanciaPct ?? 0;
            const avanceAct = cleanBullets(ficha?.avancesActuaciones).join(' ') || 'Seguimiento a metas de descongestión de actuaciones administrativas en las 20 alcaldías locales.';
            const alertaAct = cleanBullets(ficha?.alertaActuaciones).join(' ') || 'Sin alertas críticas reportadas en el corte actual.';
            contextoFocalizado = `
      PRODUCTO CONSULTADO: 7. ACTUACIONES ADMINISTRATIVAS (DESCONGESTIÓN) — FICHA DE RESULTADOS (Corte: ${fechaCorteFicha})
      - Avance Archivos: ${archPct}% (Real: ${ficha?.archivosReal ?? 'En consolidación'} / Meta: ${ficha?.metaArchivos ?? 'N/A'})
      - Avance Fallos 1ª Instancia: ${fallosPct}% (Real: ${ficha?.fallosReal ?? 'En consolidación'} / Meta: ${ficha?.metaFallos ?? 'N/A'})
      - Avance Principal: ${avanceAct}
      - Alerta Principal: ${alertaAct}
      `;
            resumenFallback = `**⚖️ Reporte Estratégico — Actuaciones Administrativas (Ficha de Resultados · ${fechaCorteFicha})**

* **📊 Avance al Corte**: **Archivos en ${archPct}%** y **Fallos de 1ª Instancia en ${fallosPct}%**.
* **✅ Avance Principal**: ${avanceAct}
* **⚠️ Alerta Principal**: ${alertaAct}`;
        }
        else if (tema === 'ESTRATEGIAS_MEMORIA') {
            const totalEst = ficha?.estrategiasTotal ?? 0;
            const resEst = ficha?.estrategiasResueltas ?? 0;
            const formEst = ficha?.estrategiasFormulacion ?? 0;
            const cumpEst = pct(resEst, ficha?.estrategiasProgramadasCorte || totalEst);
            const avanceEst = cleanBullets(ficha?.avancesEstrategias).join(' ') || 'Seguimiento a la formulación e implementación de estrategias de memoria institucional.';
            const alertaEst = cleanBullets(ficha?.alertaEstrategias).join(' ') || 'Sin alertas críticas reportadas en el corte actual.';
            contextoFocalizado = `
      PRODUCTO CONSULTADO: 8. ESTRATEGIAS DE MEMORIA INSTITUCIONAL — FICHA DE RESULTADOS (Corte: ${fechaCorteFicha})
      - Total Estrategias: ${totalEst} | Resueltas: ${resEst} (${cumpEst}%) | En Formulación: ${formEst}
      - Avance Principal: ${avanceEst}
      - Alerta Principal: ${alertaEst}
      `;
            resumenFallback = `**🕊️ Reporte Estratégico — Estrategias de Memoria Institucional (Ficha de Resultados · ${fechaCorteFicha})**

* **📊 Avance al Corte**: **${resEst} estrategias finalizadas** de **${totalEst} registradas** (**${cumpEst}% de avance**; **${formEst}** en formulación).
* **✅ Avance Principal**: ${avanceEst}
* **⚠️ Alerta Principal**: ${alertaEst}`;
        }
        else if (tema === 'ROLLOS') {
            const totalRollos = ficha?.totalRollos ?? 18;
            const progRollos = ficha?.rollosProgramadosAlCorte ?? 19;
            const resueltos = ficha?.rollosResueltos ?? 1;
            const conAvanceSig = ficha?.rollosAvancesSignificativos ?? 5;
            const cumpRollos = pct(resueltos, progRollos);
            const avancesR = cleanBullets(ficha?.avancesRollos).slice(0, pideDetalle ? 12 : 4).join(' · ') || 'Sin avances registrados.';
            const alertasR = cleanBullets(ficha?.alertaRollos).slice(0, pideDetalle ? 12 : 4).join(' · ') || 'Sin alertas registradas.';
            contextoFocalizado = `
      PRODUCTO CONSULTADO: 4. ROLLOS LEGENDARIOS — FICHA DE RESULTADOS (Corte: ${fechaCorteFicha})
      - Total Rollos: ${totalRollos} | Programados al Corte: ${progRollos} | Desenrollados: ${resueltos} (${cumpRollos}%) | Con Avances Significativos: ${conAvanceSig}
      - Desenrollados: ${ficha?.rollosDesenrolladosLista || 'Tunjuelito'}
      - En Curso: ${ficha?.rollosDesenrollandoseLista || '17 localidades'}
      - Sin Desenrollar: ${ficha?.rollosSinDesenrollarseLista || 'Barrios Unidos, Suba, Usme'}
      - Avances Principales: ${cleanBullets(ficha?.avancesRollos).join(' | ')}
      - Alertas Principales: ${cleanBullets(ficha?.alertaRollos).join(' | ')}
      `;
            resumenFallback = `**🌀 Reporte Estratégico — Rollos Legendarios (Ficha de Resultados · ${fechaCorteFicha})**

* **📊 Avance al Corte**: **${resueltos} desenrollado** (*${(ficha?.rollosDesenrolladosLista || 'Tunjuelito').trim()}*) y **${conAvanceSig} con ruta definida y avance significativo** sobre **${progRollos} programados al corte**; **3 sin desenrollarse** (*${(ficha?.rollosSinDesenrollarseLista || 'Barrios Unidos, Suba, Usme').trim()}*).
* **✅ Avance Principal**: ${avancesR}
* **⚠️ Alerta Principal**: ${alertasR}`;
        }
        else if (tema === 'SESIONES_REUNIONES') {
            const [reuniones, compPend, compTotal] = await Promise.all([
                prisma.reunion.findMany({ orderBy: { fecha: 'desc' }, take: 15, include: { compromisos: true } }),
                prisma.compromisoReunion.count({ where: { cumplido: false } }),
                prisma.compromisoReunion.count()
            ]);
            const compCump = compTotal - compPend;
            contextoFocalizado = `
      MÓDULO CONSULTADO: SESIONES Y MESAS DE TRABAJO
      - Compromisos en Actas: ${compTotal} totales (${compCump} cumplidos y ${compPend} pendientes).
      - Últimas Sesiones Registradas (${reuniones.length}):
        ${reuniones.slice(0, 8).map(r => `* [${new Date(r.fecha).toLocaleDateString('es-CO')}] ${r.tipoReunion} (${r.tematica}): "${r.objeto}" - Resp: ${r.responsable}`).join('\n        ')}
      `;
            resumenFallback = `**🤝 Reporte Estratégico — Sesiones y Mesas de Trabajo**

* **📊 Seguimiento de Acuerdos**: **${compTotal} compromisos registrados** en actas (**${compCump} cumplidos** y **${compPend} pendientes**).
* **✅ Últimas Sesiones**: ${reuniones.slice(0, 3).map(r => `**${r.tipoReunion}** (${r.tematica}: *${r.objeto}*)`).join(' · ') || 'Sin sesiones recientes'}.`;
        }
        else if (tema === 'INFORMES' || tema === 'EVENTOS' || tema === 'NORMATIVO' || tema === 'OTROS_ESPACIOS') {
            const [informes, eventos, normativos, otrosEspacios] = await Promise.all([
                prisma.informe.findMany({ orderBy: { fechaCreacion: 'desc' }, take: 10 }),
                prisma.evento.findMany({ orderBy: { fecha: 'desc' }, take: 10 }),
                prisma.seguimientoNormativo.findMany({ orderBy: { fechaCreacion: 'desc' }, take: 10 }),
                prisma.otroEspacioArticulacion.findMany({ orderBy: { fecha: 'desc' }, take: 10 })
            ]);
            contextoFocalizado = `
      MÓDULO CONSULTADO: ${tema}
      - Informes (${informes.length}): ${informes.map(i => `[${i.tipo}] ${i.titulo} (${i.periodo})`).join(' | ')}
      - Eventos (${eventos.length}): ${eventos.map(e => `${e.nombre} (${e.tipo}, ${e.lugar})`).join(' | ')}
      - Seguimiento Normativo (${normativos.length}): ${normativos.map(n => `[${n.tipo} - ${n.estado}] ${n.nombre}: ${n.avances || ''}`).join(' | ')}
      - Otros Espacios (${otrosEspacios.length}): ${otrosEspacios.map(o => `[${o.tipo}] ${o.nombre}: ${o.resultados || ''}`).join(' | ')}
      `;
            resumenFallback = `**📋 Reporte Estratégico — Gestión y Articulación (${tema})**

* **📊 Registros Activos**: **${informes.length}** informes, **${eventos.length}** eventos, **${normativos.length}** seguimientos normativos y **${otrosEspacios.length}** espacios de articulación.
* **✅ Destacados Recientes**: ${tema === 'INFORMES'
                ? informes.slice(0, 3).map(i => `**${i.titulo}** (${i.periodo})`).join(' · ') || 'Sin informes registrados.'
                : tema === 'EVENTOS'
                    ? eventos.slice(0, 3).map(e => `**${e.nombre}** (${e.lugar})`).join(' · ') || 'Sin eventos registrados.'
                    : tema === 'NORMATIVO'
                        ? normativos.slice(0, 3).map(n => `**${n.nombre}** (*${n.estado}*)`).join(' · ') || 'Sin seguimientos normativos.'
                        : otrosEspacios.slice(0, 3).map(o => `**${o.nombre}** (*${o.tipo}*)`).join(' · ') || 'Sin otros espacios.'}`;
        }
        else if (tema === 'ALERTAS') {
            const fichasAlertas = await prisma.fichaAlerta.findMany({
                include: { localidad: true, objetivo: true },
                orderBy: { fechaCreacion: 'desc' }
            });
            const activas = fichasAlertas.filter(a => a.estado !== 'RESUELTA');
            contextoFocalizado = `
      MÓDULO CONSULTADO: GESTOR DE ALERTAS Y ALERTAS ESTRATÉGICAS DE FICHA DE RESULTADOS
      - Alertas Activas en Gestor de Alertas: ${activas.length} (Abiertas: ${fichasAlertas.filter(a => a.estado === 'ABIERTA').length}, Despacho: ${fichasAlertas.filter(a => a.estado === 'ESCALADA_DESPACHO').length}, Gabinete: ${fichasAlertas.filter(a => a.estado === 'ESCALADA_GABINETE').length})
      - Alertas Estratégicas por Producto (Ficha de Resultados):
        * Presupuesto: ${cleanBullets(ficha?.alertaEjecucion).join(' ')}
        * Obras Locales: ${cleanBullets(ficha?.alertaObras).join(' ')}
        * Residuos P04: ${cleanBullets(ficha?.alertaEspacioResiduos).join(' ')}
        * Espacio Público P05: ${cleanBullets(ficha?.alertaEspacioVenta).join(' ')}
        * Convivencia/Vehículos: ${cleanBullets(ficha?.alertaConvivencia).join(' ')}
        * Rollos Legendarios: ${cleanBullets(ficha?.alertaRollos).join(' ')}
      - Detalle Gestor de Alertas:
        ${activas.slice(0, 15).map(a => `* [${a.tipo}] ${a.localidad?.nombre || 'Global'}: ${a.descripcion.substring(0, 180)}`).join('\n        ')}
      `;
            resumenFallback = `**🚨 Reporte Estratégico — Alertas Prioritarias (Ficha de Resultados y Gestor)**

* **💰 Presupuesto**: ${cleanBullets(ficha?.alertaEjecucion)[0] || 'Rezago en compromisos e Ingeniería de Detalle pendiente.'}
* **🏗️ Obras Locales**: ${cleanBullets(ficha?.alertaObras)[0] || '173 frentes pendientes de señalización en 7 localidades.'}
* **♻️ Espacio Público y Residuos**: **96 puntos** en verificación por UAESP (P04) y requerimiento de acompañamiento policial permanente en Zonas de Manejo Especial (P05).
* **🚓 Convivencia y Rollos**: Pendientes de entrega de motos/vans en 7 FDL y **${activas.length} alertas activas** en el Gestor de Alertas.`;
        }
        else {
            // TABLERO_CONTROL o ACTIVIDADES_KANBAN (Resumen ejecutivo general)
            const [actividades, fichasAlertas] = await Promise.all([
                prisma.actividad.findMany({ include: { asignaciones: true } }),
                prisma.fichaAlerta.findMany({ where: { estado: { not: 'RESUELTA' } } })
            ]);
            let totalAsig = 0;
            let compAsig = 0;
            let curAsig = 0;
            let sumAv = 0;
            for (const act of actividades) {
                for (const asig of act.asignaciones || []) {
                    totalAsig++;
                    const { estado, avance } = calcularAvanceAsignacion(asig, act);
                    sumAv += avance;
                    if (estado === 'COMPLETADA')
                        compAsig++;
                    else if (estado === 'EN_CURSO')
                        curAsig++;
                }
            }
            const promGlobal = totalAsig > 0 ? Math.round(sumAv / totalAsig) : 0;
            const noInic = Math.max(0, totalAsig - compAsig - curAsig);
            const obrasFin = ficha?.intervencionesFinalizadas ?? 1160;
            const obrasProg = ficha?.obrasProgramadasAlCorte ?? 1285;
            const obrasPct = pct(obrasFin, obrasProg);
            const vehEnt = (ficha?.vehiculosEntregadosPolicia ?? 264) + (ficha?.vehiculosEntregadosSdscj ?? 9);
            const vehProg = ficha?.vehiculosProgramadosCorte ?? 369;
            const vehPct = pct(vehEnt, vehProg);
            contextoFocalizado = `
      RESUMEN EJECUTIVO INTEGRAL — TABLERO DE RESULTADOS (FICHA) Y TABLERO DE CONTROL (Corte: ${fechaCorteFicha})
      1. Indicadores Estratégicos por Producto (Ficha de Resultados):
         - Presupuesto: Compromisos ${ficha?.compromisosPct ?? 58}% (Meta: ${ficha?.metaCompromisosPct ?? 73}%), Giros ${ficha?.girosPct ?? 40}% (Meta: ${ficha?.metaGirosPct ?? 40}%).
         - Obras Locales: ${obrasFin} finalizadas de ${obrasProg} programadas al corte (${obrasPct}% de cumplimiento; Meta anual: ${ficha?.metaObras ?? 1700}).
         - Residuos P04: ${ficha?.puntosSostenidos ?? 41}/${ficha?.puntosCriticosPriorizados ?? 58} puntos sostenidos (${pct(ficha?.puntosSostenidos, ficha?.puntosCriticosPriorizados)}%), ${ficha?.operativosIVC ?? 1451} operativos IVC.
         - Espacio Público P05: ${ficha?.puntosSostenibilidadEfectiva ?? 16}/${ficha?.puntosVerificados ?? 57} puntos sostenibles (${pct(ficha?.puntosSostenibilidadEfectiva, ficha?.puntosVerificados)}%), ${ficha?.m2RecuperadosInformal ?? 104158} m² recuperados.
         - Convivencia y Seguridad: ${vehEnt}/${vehProg} vehículos entregados (${vehPct}%).
         - Rollos Legendarios: ${ficha?.rollosResueltos ?? 1} desenrollado y ${ficha?.rollosAvancesSignificativos ?? 5} con avances significativos de ${ficha?.rollosProgramadosAlCorte ?? 19}.
      2. Panel de Actividades (Tablero de Control):
         - Avance promedio: ${promGlobal}% sobre ${actividades.length} actividades (${totalAsig} asignaciones: ${compAsig} completadas, ${curAsig} en curso, ${noInic} sin iniciar).
      3. Alertas Estratégicas Principales:
         - Presupuesto: Falta ID por $180.018 M y rezago en compromisos.
         - Obras: 173 frentes pendientes de señalización en 7 localidades.
         - Gestor de Alertas: ${fichasAlertas.length} alertas activas en seguimiento.
      `;
            resumenFallback = `**📊 Resumen Estratégico RADAR — Ficha de Resultados y Tablero de Control (${fechaCorteFicha})**

* **💰 Presupuesto**: Compromisos en **${ficha?.compromisosPct ?? 58}%** (meta **${ficha?.metaCompromisosPct ?? 73}%**) y Giros en **${ficha?.girosPct ?? 40}%** (**100%** de la meta al corte).
* **🏗️ Obras Locales**: **${obrasFin.toLocaleString('es-CO')} finalizadas** de **${obrasProg.toLocaleString('es-CO')} programadas** (**${obrasPct}% de cumplimiento al corte**).
* **♻️ Espacio Público (P04 y P05)**: **${ficha?.puntosSostenidos ?? 41}/${ficha?.puntosCriticosPriorizados ?? 58}** puntos críticos de residuos sostenidos (**${pct(ficha?.puntosSostenidos, ficha?.puntosCriticosPriorizados)}%**) y **${(ficha?.m2RecuperadosInformal ?? 104158).toLocaleString('es-CO')} m²** recuperados en P05.
* **🚓 Seguridad y 🌀 Rollos**: **${vehEnt}/${vehProg}** vehículos entregados (**${vehPct}%**); **${ficha?.rollosResueltos ?? 1}** rollo desenrollado y **${ficha?.rollosAvancesSignificativos ?? 5}** con avance significativo. Panel de Actividades en **${promGlobal}%** de avance (**${fichasAlertas.length} alertas activas**).`;
        }
        const respuestaFinal = await aiService.responderConsultaOmnicanalRadar(query, contextoFocalizado, modoRespuesta, resumenFallback);
        // Registrar en el historial de chat para auditoría
        await prisma.historialChat.create({
            data: {
                usuarioId: req.user.id,
                consulta: query,
                respuesta: respuestaFinal,
                exitoSQL: true,
                sentenciaSQL: JSON.stringify({ tema, modoRespuesta, pideDetalle }),
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
