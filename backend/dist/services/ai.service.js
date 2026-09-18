"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generarRespuestaDirectaChat = exports.generarRespuestaFinalChat = exports.responderConsultaChat = exports.prechequearEvidencia = exports.clasificarYEnrutarAlerta = exports.generarBorradorReporte = void 0;
const generative_ai_1 = require("@google/generative-ai");
// Instancia de Gemini inicializada de forma perezosa (lazy)
let genAI = null;
const obtenerClienteGemini = () => {
    if (genAI)
        return genAI;
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (apiKey) {
        genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        return genAI;
    }
    return null;
};
// FunciÃ³n auxiliar para limpiar y parsear JSON retornado por LLMs (evitando markdown ticks)
const parseSafeJSON = (text) => {
    let cleanText = text.trim();
    // Remover bloques de cÃ³digo markdown si el LLM los incluye
    if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
    }
    else if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();
    // Intentar buscar el primer '{' y el Ãºltimo '}' por si hay texto extra
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(cleanText);
};
// Helper de reintentos automÃ¡ticos para mitigar errores 503 (Servicio temporalmente no disponible) o 429 (Cuotas)
const ejecutarConReintentos = async (fn, reintentos = 3, retraso = 1000) => {
    try {
        return await fn();
    }
    catch (error) {
        const esErrorTemporal = error?.status === 503 ||
            error?.status === 429 ||
            String(error).includes('503') ||
            String(error).includes('429') ||
            String(error).includes('high demand') ||
            String(error).includes('busy');
        if (reintentos > 0 && esErrorTemporal) {
            console.warn(`[Gemini API] âš ï¸ Servidor con alta demanda o lÃ­mite excedido (503/429). Reintentando en ${retraso}ms... (Intentos restantes: ${reintentos})`);
            await new Promise(resolve => setTimeout(resolve, retraso));
            return ejecutarConReintentos(fn, reintentos - 1, retraso * 2);
        }
        throw error;
    }
};
/**
 * 1. GENERACIÃ“N ASISTIDA DE REPORTES NARRATIVOS
 */
const generarBorradorReporte = async (localidadNombre, objetivoNombre, cifrasActividades, alertasActivas, comentarios, actividadesRezagadas, alertasFichaResultados) => {
    const totalAvance = cifrasActividades.reduce((sum, act) => sum + act.avance, 0) / (cifrasActividades.length || 1);
    const fallbackAvances = `En la localidad de ${localidadNombre}, el objetivo "${objetivoNombre}" presenta un avance consolidado promedio del ${totalAvance.toFixed(1)}%. Se destaca la ejecuciÃ³n de ${cifrasActividades.filter(a => a.estado === 'COMPLETADA' || a.avance === 100).length} actividades completadas de un total de ${cifrasActividades.length} programadas.`;
    const fallbackAlertas = `Se registran ${alertasActivas.length} cuellos de botella activos en el periodo. Se sugiere priorizar la revisiÃ³n de evidencias pendientes y la articulaciÃ³n con los responsables asignados.`;
    const client = obtenerClienteGemini();
    if (!client) {
        return { avancesDraft: `[Borrador local] ${fallbackAvances}`, alertasDraft: `[Borrador local] ${fallbackAlertas}` };
    }
    try {
        const model = client.getGenerativeModel({
            model: 'gemini-flash-latest',
            generationConfig: { responseMimeType: 'application/json' }
        });
        const prompt = `
        ActÃºa como un analista experto en polÃ­ticas pÃºblicas para el sistema RADAR.
        Genera un borrador de reporte cualitativo mensual para la localidad de "${localidadNombre}" sobre el objetivo estratÃ©gico: "${objetivoNombre}".

        1. Cifras de Actividades (programado vs ejecutado):
        ${JSON.stringify(cifrasActividades, null, 2)}

        2. Comentarios / Reportes registrados en las actividades:
        ${comentarios.length > 0 ? comentarios.map(c => `- ${c}`).join('\n') : 'No hay comentarios registrados.'}

        3. Actividades Vencidas / Rezagadas (Con retraso acumulado):
        ${actividadesRezagadas.length > 0 ? actividadesRezagadas.map(a => `- Actividad ${a.codigo}: "${a.nombre}" (Retraso acumulado de ${a.diasRetraso} dÃ­as)`).join('\n') : 'No hay actividades rezagadas.'}

        4. Alertas del panel de alertas (FichaAlerta):
        ${JSON.stringify(alertasActivas, null, 2)}

        5. Observaciones/alertas de la Ficha de Resultados para este objetivo:
        ${alertasFichaResultados || 'No hay alertas registradas en la Ficha de Resultados.'}

        Genera dos secciones estructuradas en formato JSON plano:
        {
          "avances": "RedacciÃ³n clara, formal y ejecutiva de los principales logros (mÃ¡ximo 150 palabras). Sintetiza los avances numÃ©ricos y analiza cualitativamente los comentarios de las actividades para resaltar lo ejecutado.",
          "alertas": "IdentificaciÃ³n analÃ­tica de los cuellos de botella y recomendaciones especÃ­ficas de mitigaciÃ³n (mÃ¡ximo 150 palabras). Relaciona las actividades rezagadas, las alertas del panel y las observaciones de la Ficha de Resultados."
        }
        `;
        const response = await ejecutarConReintentos(() => model.generateContent(prompt));
        const result = parseSafeJSON(response.response.text() || '{}');
        return {
            avancesDraft: result.avances || fallbackAvances,
            alertasDraft: result.alertas || fallbackAlertas
        };
    }
    catch (error) {
        console.error("[AIService] Error generando borradores cualitativos:", error);
        // DegradaciÃ³n graciosa (graceful degradation) para no bloquear la experiencia del usuario
        return {
            avancesDraft: `[Borrador - Fallback por alta demanda de IA] ${fallbackAvances}`,
            alertasDraft: `[Borrador - Fallback por alta demanda de IA] ${fallbackAlertas}`
        };
    }
};
exports.generarBorradorReporte = generarBorradorReporte;
/**
 * 2. CLASIFICACIÃ“N Y ENRUTAMIENTO DE ALERTAS
 */
const clasificarYEnrutarAlerta = async (descripcionAlerta, localidadId, usuariosDisponibles) => {
    const esCritica = descripcionAlerta.toLowerCase().includes('urgente') || descripcionAlerta.toLowerCase().includes('bloqueo') || descripcionAlerta.toLowerCase().includes('comunidad');
    const fallbackResult = {
        severidadSugerida: esCritica ? 'CRITICA' : 'MODERADA',
        responsableSugeridoId: usuariosDisponibles[0]?.id || null,
        tipoSugerido: 'RIESGO_EXTERNO'
    };
    const client = obtenerClienteGemini();
    if (!client) {
        return fallbackResult;
    }
    try {
        const model = client.getGenerativeModel({
            model: 'gemini-flash-latest',
            generationConfig: { responseMimeType: 'application/json' }
        });
        const prompt = `
        Analiza el siguiente cuello de botella reportado en la gestiÃ³n local de RADAR:
        "${descripcionAlerta}"

        Lista de Usuarios Disponibles para asignaciÃ³n (con rol e id):
        ${JSON.stringify(usuariosDisponibles, null, 2)}

        Clasifica la alerta en base a las siguientes directrices:
        1. Severidad: "CRITICA" (bloqueo total, riesgos legales/sociales), "MODERADA" (retraso manejable), o "INFORMATIVA".
        2. Responsable: Sugiere el ID del usuario mÃ¡s idÃ³neo segÃºn la naturaleza del problema.
        3. Tipo: "VENCIMIENTO", "SIN_EVIDENCIA", "BAJO_AVANCE", "RIESGO_EXTERNO".

        Retorna un objeto JSON con la siguiente estructura exacta:
        {
          "severidadSugerida": "CRITICA" | "MODERADA" | "INFORMATIVA",
          "responsableSugeridoId": "id_del_usuario_sugerido" | null,
          "tipoSugerido": "VENCIMIENTO" | "SIN_EVIDENCIA" | "BAJO_AVANCE" | "RIESGO_EXTERNO"
        }
        `;
        const response = await ejecutarConReintentos(() => model.generateContent(prompt));
        return parseSafeJSON(response.response.text() || '{}');
    }
    catch (error) {
        console.error("[AIService] Error clasificando alerta:", error);
        return fallbackResult;
    }
};
exports.clasificarYEnrutarAlerta = clasificarYEnrutarAlerta;
/**
 * 3. PRE-CHEQUEO DE EVIDENCIAS EN KANBAN
 */
const prechequearEvidencia = async (actividadDescripcion, tiposEvidenciaRequeridos, archivoBase64, mimeType, comentarioAdjunto) => {
    const coherente = comentarioAdjunto.length > 10;
    const fallbackResult = {
        prechequeoEstado: coherente ? 'APTO' : 'DUDOSO',
        prechequeoPuntaje: coherente ? 85.0 : 40.0,
        prechequeoFeedback: '[AnÃ¡lisis local] La evidencia se evalÃºa de manera preliminar en base a comentarios del gestor. DiagnÃ³stico automatizado pendiente de validaciÃ³n visual de la IA.'
    };
    const client = obtenerClienteGemini();
    if (!client || !archivoBase64 || !mimeType) {
        return fallbackResult;
    }
    try {
        const model = client.getGenerativeModel({
            model: 'gemini-flash-latest',
            generationConfig: { responseMimeType: 'application/json' }
        });
        // Preparar partes para el modelo multimodal de Gemini
        const filePart = {
            inlineData: {
                data: archivoBase64,
                mimeType: mimeType
            }
        };
        const prompt = `
        ActÃºa como auditor tÃ©cnico de evidencias para RADAR.
        Debes verificar si el documento/imagen adjunto corresponde a la evidencia requerida para la siguiente actividad:

        DescripciÃ³n de la Actividad: "${actividadDescripcion}"
        Tipos de Evidencia Solicitados: ${tiposEvidenciaRequeridos.join(', ')}
        Comentario del Gestor: "${comentarioAdjunto}"

        EvalÃºa el archivo adjunto y determina:
        1. Estado de Coherencia:
           - "APTO" si el archivo adjunto es claramente una prueba vÃ¡lida de lo solicitado.
           - "NO_APTO" si es un archivo vacÃ­o, corrupto, una hoja en blanco, un meme, o totalmente ajeno a la actividad.
           - "DUDOSO" si el archivo guarda relaciÃ³n pero es incompleto, borroso o requiere criterio humano.
        2. Puntaje numÃ©rico de compatibilidad (de 0.0 a 100.0).
        3. ExplicaciÃ³n breve (Feedback) de por quÃ© se tomÃ³ la decisiÃ³n.

        Retorna un objeto JSON con la siguiente estructura exacta:
        {
          "prechequeoEstado": "APTO" | "DUDOSO" | "NO_APTO",
          "prechequeoPuntaje": 85.5,
          "prechequeoFeedback": "Texto explicativo detallado en espaÃ±ol."
        }
        `;
        const response = await ejecutarConReintentos(() => model.generateContent([filePart, prompt]));
        return parseSafeJSON(response.response.text() || '{}');
    }
    catch (error) {
        console.error("[AIService] Error pre-chequeando evidencia:", error);
        return {
            prechequeoEstado: 'DUDOSO',
            prechequeoPuntaje: 50.0,
            prechequeoFeedback: `Servicio de IA saturado temporalmente. El pre-chequeo visual se reprogramarÃ¡ de forma automÃ¡tica. Detalle tÃ©cnico: ${error instanceof Error ? error.message : String(error)}`
        };
    }
};
exports.prechequearEvidencia = prechequearEvidencia;
/**
 * 4. CONSULTA EN LENGUAJE NATURAL (ASISTENTE RADAR)
 */
const responderConsultaChat = async (pregunta, usuarioRol, contextoData) => {
    const client = obtenerClienteGemini();
    if (!client) {
        return {
            respuesta: `Hola. Tu sesiÃ³n se encuentra en modo sin login. No tengo conexiÃ³n a la clave API de Gemini.`,
            parametrosFiltro: {}
        };
    }
    try {
        const model = client.getGenerativeModel({
            model: 'gemini-flash-latest',
            generationConfig: { responseMimeType: 'application/json' }
        });
        const prompt = `
        Eres el Asistente Inteligente de RADAR. Tu labor es responder consultas operativas en lenguaje natural.
        Para evitar inyecciones SQL u operaciones daÃ±inas, tu tarea inicial es traducir la pregunta del usuario en un filtro JSON estructurado de consulta, y proveer una respuesta preliminar.

        Pregunta del usuario: "${pregunta}"
        Rol del usuario: "${usuarioRol}"
        
        Datos consolidados en BD (Esquema conceptual y entidades del contexto):
        ${contextoData}

        Genera una respuesta estructurada en JSON con:
        1. "respuesta": ExplicaciÃ³n ejecutiva y clara de la respuesta utilizando el contexto disponible.
        2. "parametrosFiltro": Un objeto JSON que represente los filtros de bÃºsqueda que el backend deberÃ­a aplicar en Prisma para verificar los datos (ej: { "localidad": "Suba", "estadoActividad": "VENCIDA" }).

        Retorna un objeto JSON con la estructura exacta:
        {
          "respuesta": "Texto de la respuesta en espaÃ±ol.",
          "parametrosFiltro": {}
        }
        `;
        const response = await ejecutarConReintentos(() => model.generateContent(prompt));
        return parseSafeJSON(response.response.text() || '{}');
    }
    catch (error) {
        console.error("[AIService] Error en asistente conversacional:", error);
        return {
            respuesta: `El asistente de inteligencia artificial estÃ¡ experimentando una alta demanda temporal y no pudo completar la respuesta. Por favor reintenta la consulta en unos momentos.`,
            parametrosFiltro: {}
        };
    }
};
exports.responderConsultaChat = responderConsultaChat;
/**
 * 4b. SINTETIZAR RESPUESTA FINAL DE CHAT CON DATOS REALES
 */
const generarRespuestaFinalChat = async (pregunta, stats) => {
    const client = obtenerClienteGemini();
    if (!client) {
        return "Modo local activo. No se pudo sintetizar con Gemini.";
    }
    try {
        const model = client.getGenerativeModel({
            model: 'gemini-flash-latest'
        });
        let prompt = "";
        if (stats.objetivoEspecifico) {
            const obj = stats.objetivoEspecifico;
            prompt = `
          Eres el Asistente Inteligente de RADAR. El usuario preguntÃ³: "${pregunta}"
          Estamos respondiendo especÃ­ficamente sobre la aspiraciÃ³n/objetivo: "${obj.nombre}"
          
          Datos reales de la base de datos para esta aspiraciÃ³n:
          - Total de actividades programadas: ${obj.total}
          - Actividades logradas (completadas): ${obj.completas}
          - Actividades en curso: ${obj.enCurso}
          - Actividades no iniciadas: ${obj.noIniciadas}
          - Alertas activas asociadas: ${obj.alertasCount}
          - Ejemplos de actividades logradas: ${obj.ejemplosCompletas.join(', ')}
          - Alertas asociadas en detalle: ${obj.alertasTexto}
          
          Por favor genera la respuesta final en espaÃ±ol enfocÃ¡ndote ÃšNICAMENTE en esta aspiraciÃ³n. Utiliza el siguiente formato ejecutivo EXACTO (viÃ±etas cortas, negritas y cursivas):
          
          Resumen Cuantitativo:
          * **AspiraciÃ³n**: ${obj.nombre} (con ${obj.total} actividades programadas, de las cuales se han logrado **${obj.completas}**).
          * **Estado de Actividades**: ${obj.completas} en **COMPLETA_SIN_VALIDAR**, ${obj.enCurso} en **EN_CURSO_SIN_VALIDAR** y ${obj.noIniciadas} en **NO_INICIADA**.
          * **Alertas Activas**: **${obj.alertasCount}** alertas directamente vinculadas a esta aspiraciÃ³n.
          
          Aspecto Cualitativo:
          * **Impulsores**: Cumplimiento total en acciones clave de esta aspiraciÃ³n como ${obj.ejemplosCompletas.map(e => `*${e}*`).join(', ')}.
          * **ObstÃ¡culo Principal**: [Describir muy brevemente en una sola frase el obstÃ¡culo principal basÃ¡ndose Ãºnicamente en las alertas activas asociadas. Si no hay alertas asociadas, indicar textualmente que la aspiraciÃ³n avanza sin novedades de bloqueo].
          
          No agregues introducciones ni conclusiones innecesarias, ve directo a los dos bloques.
          `;
        }
        else {
            prompt = `
          Eres el Asistente Inteligente de RADAR. El usuario preguntÃ³: "${pregunta}"
          Hemos calculado las estadÃ­sticas reales globales de la base de datos para la localidad de Suba:
          - Total de asignaciones: ${stats.totalAsignaciones}
          - Estado de Actividades: ${stats.completas} en COMPLETA_SIN_VALIDAR, ${stats.enCurso} en EN_CURSO_SIN_VALIDAR y ${stats.noIniciadas} en NO_INICIADA.
          - AspiraciÃ³n lÃ­der: "${stats.liderNombre}" con ${stats.liderPorcentaje}% de ejecuciÃ³n.
          - Alertas activas totales: ${stats.totalAlertas}.
          - Ejemplos de actividades completadas: ${stats.ejemplosCompletas.join(', ')}.
          - Detalle de alertas: ${stats.alertasTexto}.
          
          Por favor genera la respuesta final en espaÃ±ol con el siguiente formato ejecutivo EXACTO (viÃ±etas cortas, negritas y cursivas):
          
          Resumen Cuantitativo:
          * **AspiraciÃ³n LÃ­der**: ${stats.liderNombre} (${stats.liderPorcentaje}% de ejecuciÃ³n).
          * **Estado de Actividades (Suba)**: ${stats.completas} en **COMPLETA_SIN_VALIDAR**, ${stats.enCurso} en **EN_CURSO_SIN_VALIDAR** y ${stats.noIniciadas} en **NO_INICIADA**.
          * **Alertas Activas**: **${stats.totalAlertas}** registradas en el sistema.
          
          Aspecto Cualitativo:
          * **Impulsores**: Cumplimiento total en acciones clave como ${stats.ejemplosCompletas.map(e => `*${e}*`).join(', ')}.
          * **ObstÃ¡culo Principal**: [Describir muy brevemente en una sola frase el obstÃ¡culo principal basÃ¡ndose en las alertas activas, por ejemplo: dificultades con PONAL para comparendos de residuos o falta de IDs actualizadas].
          
          No agregues introducciones ni conclusiones innecesarias, ve directo a los dos bloques (Resumen Cuantitativo y Aspecto Cualitativo).
          `;
        }
        const response = await ejecutarConReintentos(() => model.generateContent(prompt));
        return response.response.text() || "Sin respuesta generada por el asistente.";
    }
    catch (error) {
        console.error("[AIService] Error sintetizando respuesta final de chat:", error);
        return `Resumen Cuantitativo:\nAspiraciÃ³n LÃ­der: ${stats.liderNombre} (${stats.liderPorcentaje}%).\nEstado: ${stats.completas} completas, ${stats.enCurso} en curso, ${stats.noIniciadas} no iniciadas.\nAlertas: ${stats.totalAlertas}.`;
    }
};
exports.generarRespuestaFinalChat = generarRespuestaFinalChat;
/**
 * 4c. GENERAR RESPUESTA DIRECTA Y CONCISA PARA CONSULTAS ESPECÃFICAS
 */
const generarRespuestaDirectaChat = async (pregunta, datosReales) => {
    const client = obtenerClienteGemini();
    if (!client) {
        return "Modo local activo. No se pudo sintetizar con Gemini.";
    }
    try {
        const model = client.getGenerativeModel({
            model: 'gemini-flash-latest'
        });
        const prompt = `
        Eres el Asistente Inteligente de RADAR. El usuario hizo una pregunta especÃ­fica: "${pregunta}"
        Hemos consultado la base de datos de RADAR y obtuvimos los siguientes registros reales vinculados a su pregunta:
        
        ${datosReales}
        
        Por favor genera una respuesta directa, concisa y ejecutiva en espaÃ±ol (mÃ¡ximo 80-100 palabras) respondiendo puntualmente a la pregunta del usuario utilizando los datos provistos.
        No uses plantillas de tablero general (no menciones "AspiraciÃ³n LÃ­der" ni estadÃ­sticas globales de la localidad a menos que el usuario lo haya solicitado).
        Usa negritas y viÃ±etas cortas para mayor claridad.
        `;
        const response = await ejecutarConReintentos(() => model.generateContent(prompt));
        return response.response.text() || "Sin respuesta generada por el asistente.";
    }
    catch (error) {
        console.error("[AIService] Error en respuesta directa de chat:", error);
        return `Detalle de datos obtenidos para su consulta:\n${datosReales}`;
    }
};
exports.generarRespuestaDirectaChat = generarRespuestaDirectaChat;
