import { GoogleGenerativeAI } from '@google/generative-ai';

// Instancia de Gemini inicializada de forma perezosa (lazy)
let genAI: GoogleGenerativeAI | null = null;

const obtenerClienteGemini = (): GoogleGenerativeAI | null => {
    if (genAI) return genAI;
    
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (apiKey) {
        genAI = new GoogleGenerativeAI(apiKey);
        return genAI;
    }
    return null;
};

// Función auxiliar para limpiar y parsear JSON retornado por LLMs (evitando markdown ticks)
const parseSafeJSON = (text: string): any => {
    let cleanText = text.trim();
    
    // Remover bloques de código markdown si el LLM los incluye
    if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3);
    }
    
    if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    
    cleanText = cleanText.trim();
    
    // Intentar buscar el primer '{' y el último '}' por si hay texto extra
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
    
    return JSON.parse(cleanText);
};

// Helper de reintentos automáticos para mitigar errores 503 (Servicio temporalmente no disponible) o 429 (Cuotas)
const ejecutarConReintentos = async <T>(fn: () => Promise<T>, reintentos = 3, retraso = 1000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        const esErrorTemporal = 
            error?.status === 503 || 
            error?.status === 429 || 
            String(error).includes('503') || 
            String(error).includes('429') || 
            String(error).includes('high demand') ||
            String(error).includes('busy');

        if (reintentos > 0 && esErrorTemporal) {
            console.warn(`[Gemini API] ⚠️ Servidor con alta demanda o límite excedido (503/429). Reintentando en ${retraso}ms... (Intentos restantes: ${reintentos})`);
            await new Promise(resolve => setTimeout(resolve, retraso));
            return ejecutarConReintentos(fn, reintentos - 1, retraso * 2);
        }
        throw error;
    }
};

/**
 * 1. GENERACIÓN ASISTIDA DE REPORTES NARRATIVOS
 */
export const generarBorradorReporte = async (
    localidadNombre: string,
    objetivoNombre: string,
    cifrasActividades: Array<{ codigo: string; nombre: string; avance: number; estado: string }>,
    alertasActivas: Array<{ tipo: string; descripcion: string; nivel: string }>,
    comentarios: string[],
    actividadesRezagadas: Array<{ codigo: string; nombre: string; diasRetraso: number }>,
    alertasFichaResultados: string
): Promise<{ avancesDraft: string; alertasDraft: string }> => {
    const totalAvance = cifrasActividades.reduce((sum, act) => sum + act.avance, 0) / (cifrasActividades.length || 1);
    const fallbackAvances = `En la localidad de ${localidadNombre}, el objetivo "${objetivoNombre}" presenta un avance consolidado promedio del ${totalAvance.toFixed(1)}%. Se destaca la ejecución de ${cifrasActividades.filter(a => a.estado === 'COMPLETADA' || a.avance === 100).length} actividades completadas de un total de ${cifrasActividades.length} programadas.`;
    const fallbackAlertas = `Se registran ${alertasActivas.length} cuellos de botella activos en el periodo. Se sugiere priorizar la revisión de evidencias pendientes y la articulación con los responsables asignados.`;

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
        Actúa como un analista experto en políticas públicas para el sistema SITRA.
        Genera un borrador de reporte cualitativo mensual para la localidad de "${localidadNombre}" sobre el objetivo estratégico: "${objetivoNombre}".

        1. Cifras de Actividades (programado vs ejecutado):
        ${JSON.stringify(cifrasActividades, null, 2)}

        2. Comentarios / Reportes registrados en las actividades:
        ${comentarios.length > 0 ? comentarios.map(c => `- ${c}`).join('\n') : 'No hay comentarios registrados.'}

        3. Actividades Vencidas / Rezagadas (Con retraso acumulado):
        ${actividadesRezagadas.length > 0 ? actividadesRezagadas.map(a => `- Actividad ${a.codigo}: "${a.nombre}" (Retraso acumulado de ${a.diasRetraso} días)`).join('\n') : 'No hay actividades rezagadas.'}

        4. Alertas del panel de alertas (FichaAlerta):
        ${JSON.stringify(alertasActivas, null, 2)}

        5. Observaciones/alertas de la Ficha de Resultados para este objetivo:
        ${alertasFichaResultados || 'No hay alertas registradas en la Ficha de Resultados.'}

        Genera dos secciones estructuradas en formato JSON plano:
        {
          "avances": "Redacción clara, formal y ejecutiva de los principales logros (máximo 150 palabras). Sintetiza los avances numéricos y analiza cualitativamente los comentarios de las actividades para resaltar lo ejecutado.",
          "alertas": "Identificación analítica de los cuellos de botella y recomendaciones específicas de mitigación (máximo 150 palabras). Relaciona las actividades rezagadas, las alertas del panel y las observaciones de la Ficha de Resultados."
        }
        `;

        const response = await ejecutarConReintentos(() => model.generateContent(prompt));
        const result = parseSafeJSON(response.response.text() || '{}');
        return {
            avancesDraft: result.avances || fallbackAvances,
            alertasDraft: result.alertas || fallbackAlertas
        };
    } catch (error) {
        console.error("[AIService] Error generando borradores cualitativos:", error);
        // Degradación graciosa (graceful degradation) para no bloquear la experiencia del usuario
        return {
            avancesDraft: `[Borrador - Fallback por alta demanda de IA] ${fallbackAvances}`,
            alertasDraft: `[Borrador - Fallback por alta demanda de IA] ${fallbackAlertas}`
        };
    }
};

/**
 * 2. CLASIFICACIÓN Y ENRUTAMIENTO DE ALERTAS
 */
export const clasificarYEnrutarAlerta = async (
    descripcionAlerta: string,
    localidadId: string,
    usuariosDisponibles: Array<{ id: string; nombre: string; rol: string; email: string }>
): Promise<{ severidadSugerida: string; responsableSugeridoId: string | null; tipoSugerido: string }> => {
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
        Analiza el siguiente cuello de botella reportado en la gestión local de SITRA:
        "${descripcionAlerta}"

        Lista de Usuarios Disponibles para asignación (con rol e id):
        ${JSON.stringify(usuariosDisponibles, null, 2)}

        Clasifica la alerta en base a las siguientes directrices:
        1. Severidad: "CRITICA" (bloqueo total, riesgos legales/sociales), "MODERADA" (retraso manejable), o "INFORMATIVA".
        2. Responsable: Sugiere el ID del usuario más idóneo según la naturaleza del problema.
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
    } catch (error) {
        console.error("[AIService] Error clasificando alerta:", error);
        return fallbackResult;
    }
};

/**
 * 3. PRE-CHEQUEO DE EVIDENCIAS EN KANBAN
 */
export const prechequearEvidencia = async (
    actividadDescripcion: string,
    tiposEvidenciaRequeridos: string[],
    archivoBase64: string | null,
    mimeType: string | null,
    comentarioAdjunto: string
): Promise<{ prechequeoEstado: 'APTO' | 'DUDOSO' | 'NO_APTO'; prechequeoPuntaje: number; prechequeoFeedback: string }> => {
    const coherente = comentarioAdjunto.length > 10;
    const fallbackResult = {
        prechequeoEstado: coherente ? 'APTO' as const : 'DUDOSO' as const,
        prechequeoPuntaje: coherente ? 85.0 : 40.0,
        prechequeoFeedback: '[Análisis local] La evidencia se evalúa de manera preliminar en base a comentarios del gestor. Diagnóstico automatizado pendiente de validación visual de la IA.'
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
        Actúa como auditor técnico de evidencias para SITRA.
        Debes verificar si el documento/imagen adjunto corresponde a la evidencia requerida para la siguiente actividad:

        Descripción de la Actividad: "${actividadDescripcion}"
        Tipos de Evidencia Solicitados: ${tiposEvidenciaRequeridos.join(', ')}
        Comentario del Gestor: "${comentarioAdjunto}"

        Evalúa el archivo adjunto y determina:
        1. Estado de Coherencia:
           - "APTO" si el archivo adjunto es claramente una prueba válida de lo solicitado.
           - "NO_APTO" si es un archivo vacío, corrupto, una hoja en blanco, un meme, o totalmente ajeno a la actividad.
           - "DUDOSO" si el archivo guarda relación pero es incompleto, borroso o requiere criterio humano.
        2. Puntaje numérico de compatibilidad (de 0.0 a 100.0).
        3. Explicación breve (Feedback) de por qué se tomó la decisión.

        Retorna un objeto JSON con la siguiente estructura exacta:
        {
          "prechequeoEstado": "APTO" | "DUDOSO" | "NO_APTO",
          "prechequeoPuntaje": 85.5,
          "prechequeoFeedback": "Texto explicativo detallado en español."
        }
        `;

        const response = await ejecutarConReintentos(() => model.generateContent([filePart, prompt]));
        return parseSafeJSON(response.response.text() || '{}');
    } catch (error) {
        console.error("[AIService] Error pre-chequeando evidencia:", error);
        return {
            prechequeoEstado: 'DUDOSO',
            prechequeoPuntaje: 50.0,
            prechequeoFeedback: `Servicio de IA saturado temporalmente. El pre-chequeo visual se reprogramará de forma automática. Detalle técnico: ${error instanceof Error ? error.message : String(error)}`
        };
    }
};

/**
 * 4. CONSULTA EN LENGUAJE NATURAL (ASISTENTE SITRA)
 */
export const responderConsultaChat = async (
    pregunta: string,
    usuarioRol: string,
    contextoData: string
): Promise<{ respuesta: string; parametrosFiltro: any }> => {
    const client = obtenerClienteGemini();
    if (!client) {
        return {
            respuesta: `Hola. Tu sesión se encuentra en modo sin login. No tengo conexión a la clave API de Gemini.`,
            parametrosFiltro: {}
        };
    }

    try {
        const model = client.getGenerativeModel({ 
            model: 'gemini-flash-latest',
            generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `
        Eres el Asistente Inteligente de SITRA. Tu labor es responder consultas operativas en lenguaje natural.
        Para evitar inyecciones SQL u operaciones dañinas, tu tarea inicial es traducir la pregunta del usuario en un filtro JSON estructurado de consulta, y proveer una respuesta preliminar.

        Pregunta del usuario: "${pregunta}"
        Rol del usuario: "${usuarioRol}"
        
        Datos consolidados en BD (Esquema conceptual y entidades del contexto):
        ${contextoData}

        Genera una respuesta estructurada en JSON con:
        1. "respuesta": Explicación ejecutiva y clara de la respuesta utilizando el contexto disponible.
        2. "parametrosFiltro": Un objeto JSON que represente los filtros de búsqueda que el backend debería aplicar en Prisma para verificar los datos (ej: { "localidad": "Suba", "estadoActividad": "VENCIDA" }).

        Retorna un objeto JSON con la estructura exacta:
        {
          "respuesta": "Texto de la respuesta en español.",
          "parametrosFiltro": {}
        }
        `;

        const response = await ejecutarConReintentos(() => model.generateContent(prompt));
        return parseSafeJSON(response.response.text() || '{}');
    } catch (error) {
        console.error("[AIService] Error en asistente conversacional:", error);
        return {
            respuesta: `El asistente de inteligencia artificial está experimentando una alta demanda temporal y no pudo completar la respuesta. Por favor reintenta la consulta en unos momentos.`,
            parametrosFiltro: {}
        };
    }
};

/**
 * 4b. SINTETIZAR RESPUESTA FINAL DE CHAT CON DATOS REALES
 */
export const generarRespuestaFinalChat = async (
    pregunta: string,
    stats: {
      liderNombre: string;
      liderPorcentaje: number;
      completas: number;
      enCurso: number;
      noIniciadas: number;
      totalAsignaciones: number;
      totalAlertas: number;
      ejemplosCompletas: string[];
      alertasTexto: string;
      objetivoEspecifico?: {
        nombre: string;
        total: number;
        completas: number;
        enCurso: number;
        noIniciadas: number;
        alertasCount: number;
        ejemplosCompletas: string[];
        alertasTexto: string;
      }
    }
): Promise<string> => {
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
          Eres el Asistente Inteligente de SITRA. El usuario preguntó: "${pregunta}"
          Estamos respondiendo específicamente sobre la aspiración/objetivo: "${obj.nombre}"
          
          Datos reales de la base de datos para esta aspiración:
          - Total de actividades programadas: ${obj.total}
          - Actividades logradas (completadas): ${obj.completas}
          - Actividades en curso: ${obj.enCurso}
          - Actividades no iniciadas: ${obj.noIniciadas}
          - Alertas activas asociadas: ${obj.alertasCount}
          - Ejemplos de actividades logradas: ${obj.ejemplosCompletas.join(', ')}
          - Alertas asociadas en detalle: ${obj.alertasTexto}
          
          Por favor genera la respuesta final en español enfocándote ÚNICAMENTE en esta aspiración. Utiliza el siguiente formato ejecutivo EXACTO (viñetas cortas, negritas y cursivas):
          
          Resumen Cuantitativo:
          * **Aspiración**: ${obj.nombre} (con ${obj.total} actividades programadas, de las cuales se han logrado **${obj.completas}**).
          * **Estado de Actividades**: ${obj.completas} en **COMPLETA_SIN_VALIDAR**, ${obj.enCurso} en **EN_CURSO_SIN_VALIDAR** y ${obj.noIniciadas} en **NO_INICIADA**.
          * **Alertas Activas**: **${obj.alertasCount}** alertas directamente vinculadas a esta aspiración.
          
          Aspecto Cualitativo:
          * **Impulsores**: Cumplimiento total en acciones clave de esta aspiración como ${obj.ejemplosCompletas.map(e => `*${e}*`).join(', ')}.
          * **Obstáculo Principal**: [Describir muy brevemente en una sola frase el obstáculo principal basándose únicamente en las alertas activas asociadas. Si no hay alertas asociadas, indicar textualmente que la aspiración avanza sin novedades de bloqueo].
          
          No agregues introducciones ni conclusiones innecesarias, ve directo a los dos bloques.
          `;
        } else {
          prompt = `
          Eres el Asistente Inteligente de SITRA. El usuario preguntó: "${pregunta}"
          Hemos calculado las estadísticas reales globales de la base de datos para la localidad de Suba:
          - Total de asignaciones: ${stats.totalAsignaciones}
          - Estado de Actividades: ${stats.completas} en COMPLETA_SIN_VALIDAR, ${stats.enCurso} en EN_CURSO_SIN_VALIDAR y ${stats.noIniciadas} en NO_INICIADA.
          - Aspiración líder: "${stats.liderNombre}" con ${stats.liderPorcentaje}% de ejecución.
          - Alertas activas totales: ${stats.totalAlertas}.
          - Ejemplos de actividades completadas: ${stats.ejemplosCompletas.join(', ')}.
          - Detalle de alertas: ${stats.alertasTexto}.
          
          Por favor genera la respuesta final en español con el siguiente formato ejecutivo EXACTO (viñetas cortas, negritas y cursivas):
          
          Resumen Cuantitativo:
          * **Aspiración Líder**: ${stats.liderNombre} (${stats.liderPorcentaje}% de ejecución).
          * **Estado de Actividades (Suba)**: ${stats.completas} en **COMPLETA_SIN_VALIDAR**, ${stats.enCurso} en **EN_CURSO_SIN_VALIDAR** y ${stats.noIniciadas} en **NO_INICIADA**.
          * **Alertas Activas**: **${stats.totalAlertas}** registradas en el sistema.
          
          Aspecto Cualitativo:
          * **Impulsores**: Cumplimiento total en acciones clave como ${stats.ejemplosCompletas.map(e => `*${e}*`).join(', ')}.
          * **Obstáculo Principal**: [Describir muy brevemente en una sola frase el obstáculo principal basándose en las alertas activas, por ejemplo: dificultades con PONAL para comparendos de residuos o falta de IDs actualizadas].
          
          No agregues introducciones ni conclusiones innecesarias, ve directo a los dos bloques (Resumen Cuantitativo y Aspecto Cualitativo).
          `;
        }

        const response = await ejecutarConReintentos(() => model.generateContent(prompt));
        return response.response.text() || "Sin respuesta generada por el asistente.";
    } catch (error) {
        console.error("[AIService] Error sintetizando respuesta final de chat:", error);
        return `Resumen Cuantitativo:\nAspiración Líder: ${stats.liderNombre} (${stats.liderPorcentaje}%).\nEstado: ${stats.completas} completas, ${stats.enCurso} en curso, ${stats.noIniciadas} no iniciadas.\nAlertas: ${stats.totalAlertas}.`;
    }
};

/**
 * 4c. GENERAR RESPUESTA DIRECTA Y CONCISA PARA CONSULTAS ESPECÍFICAS
 */
export const generarRespuestaDirectaChat = async (
    pregunta: string,
    datosReales: string
): Promise<string> => {
    const client = obtenerClienteGemini();
    if (!client) {
        return "Modo local activo. No se pudo sintetizar con Gemini.";
    }

    try {
        const model = client.getGenerativeModel({ 
            model: 'gemini-flash-latest'
        });

        const prompt = `
        Eres el Asistente Inteligente de SITRA. El usuario hizo una pregunta específica: "${pregunta}"
        Hemos consultado la base de datos de SITRA y obtuvimos los siguientes registros reales vinculados a su pregunta:
        
        ${datosReales}
        
        Por favor genera una respuesta directa, concisa y ejecutiva en español (máximo 80-100 palabras) respondiendo puntualmente a la pregunta del usuario utilizando los datos provistos.
        No uses plantillas de tablero general (no menciones "Aspiración Líder" ni estadísticas globales de la localidad a menos que el usuario lo haya solicitado).
        Usa negritas y viñetas cortas para mayor claridad.
        `;

        const response = await ejecutarConReintentos(() => model.generateContent(prompt));
        return response.response.text() || "Sin respuesta generada por el asistente.";
    } catch (error) {
        console.error("[AIService] Error en respuesta directa de chat:", error);
        return `Detalle de datos obtenidos para su consulta:\n${datosReales}`;
    }
};
