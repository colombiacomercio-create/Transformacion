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

// FunciÃ³n auxiliar para limpiar y parsear JSON retornado por LLMs (evitando markdown ticks)
const parseSafeJSON = (text: string): any => {
    let cleanText = text.trim();
    
    // Remover bloques de cÃ³digo markdown si el LLM los incluye
    if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith('```')) {
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
        Actúa como un analista experto en políticas públicas para el sistema RADAR.
        Debes generar un borrador narrativo de los "Principales Avances" y "Alertas y Recomendaciones" del objetivo: "${objetivoNombre}" para la localidad de "${localidadNombre}".
        
        INSTRUCCIONES CLAVE:
        1. Debes MENCIONAR EXPLÍCITAMENTE la localidad ("${localidadNombre}") en ambos textos (avances y alertas), indicando qué ocurre específicamente allí.
        2. Si hay múltiples observaciones, divídelas en varios PÁRRAFOS utilizando saltos de línea dobles para facilitar la lectura. No entregues un solo bloque de texto.
        3. Escribe de manera ejecutiva, clara y directa.

        DATOS DISPONIBLES:
        - Avance promedio local: ${totalAvance.toFixed(1)}%
        - Actividades completadas: ${cifrasActividades.filter(a => a.estado === 'COMPLETADA' || a.avance === 100).length} de ${cifrasActividades.length}
        - Alertas activas: ${JSON.stringify(alertasActivas)}
        - Actividades rezagadas: ${JSON.stringify(actividadesRezagadas)}
        - Comentarios del equipo: ${comentarios.join(' | ')}
        - Alerta Ficha Resultados (Global): ${alertasFichaResultados}

        Devuelve ÚNICAMENTE un JSON con este formato (asegúrate de escapar las comillas si es necesario):
        {
          "avances": "texto con los avances, mencionando la localidad, separado en párrafos cortos...",
          "alertas": "texto con las alertas y recomendaciones, mencionando la localidad, separado en párrafos cortos..."
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
        // DegradaciÃ³n graciosa (graceful degradation) para no bloquear la experiencia del usuario
        return {
            avancesDraft: `[Borrador - Fallback por alta demanda de IA] ${fallbackAvances}`,
            alertasDraft: `[Borrador - Fallback por alta demanda de IA] ${fallbackAlertas}`
        };
    }
};

/**
 * 2. CLASIFICACIÃ“N Y ENRUTAMIENTO DE ALERTAS
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
        Actúa como un analista experto en políticas públicas para el sistema RADAR.
        Debes generar un borrador narrativo de los "Principales Avances" y "Alertas y Recomendaciones" del objetivo: "${objetivoNombre}" para la localidad de "${localidadNombre}".
        
        INSTRUCCIONES CLAVE:
        1. Debes MENCIONAR EXPLÍCITAMENTE la localidad ("${localidadNombre}") en ambos textos (avances y alertas), indicando qué ocurre específicamente allí.
        2. Si hay múltiples observaciones, divídelas en varios PÁRRAFOS utilizando saltos de línea dobles para facilitar la lectura. No entregues un solo bloque de texto.
        3. Escribe de manera ejecutiva, clara y directa.

        DATOS DISPONIBLES:
        - Avance promedio local: ${totalAvance.toFixed(1)}%
        - Actividades completadas: ${cifrasActividades.filter(a => a.estado === 'COMPLETADA' || a.avance === 100).length} de ${cifrasActividades.length}
        - Alertas activas: ${JSON.stringify(alertasActivas)}
        - Actividades rezagadas: ${JSON.stringify(actividadesRezagadas)}
        - Comentarios del equipo: ${comentarios.join(' | ')}
        - Alerta Ficha Resultados (Global): ${alertasFichaResultados}

        Devuelve ÚNICAMENTE un JSON con este formato (asegúrate de escapar las comillas si es necesario):
        {
          "avances": "texto con los avances, mencionando la localidad, separado en párrafos cortos...",
          "alertas": "texto con las alertas y recomendaciones, mencionando la localidad, separado en párrafos cortos..."
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
        Actúa como un analista experto en políticas públicas para el sistema RADAR.
        Debes generar un borrador narrativo de los "Principales Avances" y "Alertas y Recomendaciones" del objetivo: "${objetivoNombre}" para la localidad de "${localidadNombre}".
        
        INSTRUCCIONES CLAVE:
        1. Debes MENCIONAR EXPLÍCITAMENTE la localidad ("${localidadNombre}") en ambos textos (avances y alertas), indicando qué ocurre específicamente allí.
        2. Si hay múltiples observaciones, divídelas en varios PÁRRAFOS utilizando saltos de línea dobles para facilitar la lectura. No entregues un solo bloque de texto.
        3. Escribe de manera ejecutiva, clara y directa.

        DATOS DISPONIBLES:
        - Avance promedio local: ${totalAvance.toFixed(1)}%
        - Actividades completadas: ${cifrasActividades.filter(a => a.estado === 'COMPLETADA' || a.avance === 100).length} de ${cifrasActividades.length}
        - Alertas activas: ${JSON.stringify(alertasActivas)}
        - Actividades rezagadas: ${JSON.stringify(actividadesRezagadas)}
        - Comentarios del equipo: ${comentarios.join(' | ')}
        - Alerta Ficha Resultados (Global): ${alertasFichaResultados}

        Devuelve ÚNICAMENTE un JSON con este formato (asegúrate de escapar las comillas si es necesario):
        {
          "avances": "texto con los avances, mencionando la localidad, separado en párrafos cortos...",
          "alertas": "texto con las alertas y recomendaciones, mencionando la localidad, separado en párrafos cortos..."
        }
        `;

        const response = await ejecutarConReintentos(() => model.generateContent([filePart, prompt]));
        return parseSafeJSON(response.response.text() || '{}');
    } catch (error) {
        console.error("[AIService] Error pre-chequeando evidencia:", error);
        return {
            prechequeoEstado: 'DUDOSO',
            prechequeoPuntaje: 50.0,
            prechequeoFeedback: `Servicio de IA saturado temporalmente. El pre-chequeo visual se reprogramarÃ¡ de forma automÃ¡tica. Detalle tÃ©cnico: ${error instanceof Error ? error.message : String(error)}`
        };
    }
};

/**
 * 4. CONSULTA EN LENGUAJE NATURAL (ASISTENTE RADAR)
 */
export const responderConsultaChat = async (
    pregunta: string,
    usuarioRol: string,
    contextoData: string
): Promise<{ respuesta: string; parametrosFiltro: any }> => {
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
        Actúa como un analista experto en políticas públicas para el sistema RADAR.
        Debes generar un borrador narrativo de los "Principales Avances" y "Alertas y Recomendaciones" del objetivo: "${objetivoNombre}" para la localidad de "${localidadNombre}".
        
        INSTRUCCIONES CLAVE:
        1. Debes MENCIONAR EXPLÍCITAMENTE la localidad ("${localidadNombre}") en ambos textos (avances y alertas), indicando qué ocurre específicamente allí.
        2. Si hay múltiples observaciones, divídelas en varios PÁRRAFOS utilizando saltos de línea dobles para facilitar la lectura. No entregues un solo bloque de texto.
        3. Escribe de manera ejecutiva, clara y directa.

        DATOS DISPONIBLES:
        - Avance promedio local: ${totalAvance.toFixed(1)}%
        - Actividades completadas: ${cifrasActividades.filter(a => a.estado === 'COMPLETADA' || a.avance === 100).length} de ${cifrasActividades.length}
        - Alertas activas: ${JSON.stringify(alertasActivas)}
        - Actividades rezagadas: ${JSON.stringify(actividadesRezagadas)}
        - Comentarios del equipo: ${comentarios.join(' | ')}
        - Alerta Ficha Resultados (Global): ${alertasFichaResultados}

        Devuelve ÚNICAMENTE un JSON con este formato (asegúrate de escapar las comillas si es necesario):
        {
          "avances": "texto con los avances, mencionando la localidad, separado en párrafos cortos...",
          "alertas": "texto con las alertas y recomendaciones, mencionando la localidad, separado en párrafos cortos..."
        }
        `;

        const response = await ejecutarConReintentos(() => model.generateContent(prompt));
        return parseSafeJSON(response.response.text() || '{}');
    } catch (error) {
        console.error("[AIService] Error en asistente conversacional:", error);
        return {
            respuesta: `El asistente de inteligencia artificial estÃ¡ experimentando una alta demanda temporal y no pudo completar la respuesta. Por favor reintenta la consulta en unos momentos.`,
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
        } else {
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
    } catch (error) {
        console.error("[AIService] Error sintetizando respuesta final de chat:", error);
        return `Resumen Cuantitativo:\nAspiraciÃ³n LÃ­der: ${stats.liderNombre} (${stats.liderPorcentaje}%).\nEstado: ${stats.completas} completas, ${stats.enCurso} en curso, ${stats.noIniciadas} no iniciadas.\nAlertas: ${stats.totalAlertas}.`;
    }
};

/**
 * 4c. GENERAR RESPUESTA DIRECTA Y CONCISA PARA CONSULTAS ESPECÃFICAS
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
        Actúa como un analista experto en políticas públicas para el sistema RADAR.
        Debes generar un borrador narrativo de los "Principales Avances" y "Alertas y Recomendaciones" del objetivo: "${objetivoNombre}" para la localidad de "${localidadNombre}".
        
        INSTRUCCIONES CLAVE:
        1. Debes MENCIONAR EXPLÍCITAMENTE la localidad ("${localidadNombre}") en ambos textos (avances y alertas), indicando qué ocurre específicamente allí.
        2. Si hay múltiples observaciones, divídelas en varios PÁRRAFOS utilizando saltos de línea dobles para facilitar la lectura. No entregues un solo bloque de texto.
        3. Escribe de manera ejecutiva, clara y directa.

        DATOS DISPONIBLES:
        - Avance promedio local: ${totalAvance.toFixed(1)}%
        - Actividades completadas: ${cifrasActividades.filter(a => a.estado === 'COMPLETADA' || a.avance === 100).length} de ${cifrasActividades.length}
        - Alertas activas: ${JSON.stringify(alertasActivas)}
        - Actividades rezagadas: ${JSON.stringify(actividadesRezagadas)}
        - Comentarios del equipo: ${comentarios.join(' | ')}
        - Alerta Ficha Resultados (Global): ${alertasFichaResultados}

        Devuelve ÚNICAMENTE un JSON con este formato (asegúrate de escapar las comillas si es necesario):
        {
          "avances": "texto con los avances, mencionando la localidad, separado en párrafos cortos...",
          "alertas": "texto con las alertas y recomendaciones, mencionando la localidad, separado en párrafos cortos..."
        }
        `;

        const response = await ejecutarConReintentos(() => model.generateContent(prompt));
        return response.response.text() || "Sin respuesta generada por el asistente.";
    } catch (error) {
        console.error("[AIService] Error en respuesta directa de chat:", error);
        return `Detalle de datos obtenidos para su consulta:\n${datosReales}`;
    }
};
