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
    
    if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3);
    }
    
    if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    
    cleanText = cleanText.trim();
    
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
    
    return JSON.parse(cleanText);
};

// Ejecuta una llamada a Gemini intentando primero con gemini-flash-lite-latest y luego con gemini-flash-latest
const generarConModeloResiliente = async (
    client: GoogleGenerativeAI,
    contents: any,
    jsonMode = false
): Promise<string> => {
    const modelos = ['gemini-flash-lite-latest', 'gemini-flash-latest'];
    let ultimoError: any = null;

    for (const nombreModelo of modelos) {
        try {
            const model = client.getGenerativeModel({
                model: nombreModelo,
                ...(jsonMode ? { generationConfig: { responseMimeType: 'application/json' } } : {})
            });
            const response = await model.generateContent(contents);
            const text = response.response.text();
            if (text && text.trim()) {
                return text;
            }
        } catch (error: any) {
            ultimoError = error;
            console.warn(`[Gemini API] Modelo ${nombreModelo} no disponible (${error?.status || 'error'}). Probando siguiente opción...`);
        }
    }

    throw ultimoError || new Error('Ningún modelo Gemini disponible');
};

/**
 * 1. GENERACIÓN ASISTIDA DE REPORTES NARRATIVOS EN TABLERO DE CONTROL
 * Resume todas las actividades, avances y alertas (Global Distrital o por Localidad / Objetivo)
 */
export const generarBorradorReporte = async (
    localidadNombre: string,
    objetivoNombre: string,
    cifrasActividades: Array<{ codigo: string; nombre: string; avance: number; estado: string; localidad?: string; producto?: string }>,
    alertasActivas: Array<{ tipo: string; descripcion: string; nivel: string; responsable?: string; estado?: string }>,
    comentarios: string[],
    actividadesRezagadas: Array<{ codigo: string; nombre: string; diasRetraso: number; localidad?: string }>,
    alertasFichaResultados: string
): Promise<{ avancesDraft: string; alertasDraft: string }> => {
    const totalActs = cifrasActividades.length;
    const completadasCount = cifrasActividades.filter(a => a.estado.includes('COMPLETA') || a.avance >= 100).length;
    const enCursoCount = cifrasActividades.filter(a => !a.estado.includes('COMPLETA') && a.avance < 100 && (a.estado.includes('CURSO') || a.estado.includes('PROGRESO') || a.avance > 0)).length;
    const noIniciadasCount = Math.max(0, totalActs - completadasCount - enCursoCount);
    const totalAvance = cifrasActividades.reduce((sum, act) => sum + (act.avance || 0), 0) / (totalActs || 1);

    const esGlobal = localidadNombre.toUpperCase().includes('TODAS') || localidadNombre.toUpperCase().includes('GLOBAL') || localidadNombre.toUpperCase().includes('DISTRITAL');
    const ambitoTexto = esGlobal ? 'el Balance General Distrital (todas las localidades)' : `la localidad de ${localidadNombre}`;

    const listaDestacadas = cifrasActividades
        .filter(a => a.estado.includes('COMPLETA') || a.avance >= 50)
        .slice(0, 5)
        .map(a => `${a.codigo} (${a.nombre}: ${Math.round(a.avance)}%)`)
        .join(', ');

    const fallbackAvances = [
        `En ${ambitoTexto}, se registra un avance consolidado del ${totalAvance.toFixed(1)}% sobre ${totalActs} actividades evaluadas (${completadasCount} completadas, ${enCursoCount} en curso y ${noIniciadasCount} sin iniciar).`,
        listaDestacadas ? `Avances principales en: ${listaDestacadas}.` : '',
        comentarios.length > 0 ? `Novedades recientes: ${comentarios.slice(0, 3).join(' | ')}` : ''
    ].filter(Boolean).join('\n\n');

    const fallbackAlertas = [
        `Se registran ${alertasActivas.length} alertas activas y ${actividadesRezagadas.length} actividades pendientes al corte en ${ambitoTexto}.`,
        alertasActivas.length > 0
            ? `Alertas prioritarias: ${alertasActivas.slice(0, 4).map(a => `[${a.tipo}] ${a.descripcion}`).join(' | ')}.`
            : 'Sin bloqueos críticos abiertos en el Gestor de Alertas para este filtro.',
        alertasFichaResultados ? `Alertas estratégicas Ficha de Resultados: ${alertasFichaResultados}` : ''
    ].filter(Boolean).join('\n\n');

    const client = obtenerClienteGemini();
    if (!client) {
        return { avancesDraft: fallbackAvances, alertasDraft: fallbackAlertas };
    }

    try {
        const prompt = `
        Actúa como analista estratégico del sistema RADAR de la Secretaría Distrital de Gobierno de Bogotá.
        Elabora un RESUMEN EJECUTIVO ESTRATÉGICO Y SUCINTO en el Tablero de Control que sintetice las actividades, avances y alertas de "${ambitoTexto}" para "${objetivoNombre}".
        
        INSTRUCCIONES:
        1. En "avances": Sintetiza de forma ejecutiva y concisa (máximo 2 párrafos cortos separados por \\n\\n) el avance global (${totalAvance.toFixed(1)}%), el estado de las ${totalActs} actividades (${completadasCount} completadas, ${enCursoCount} en curso, ${noIniciadasCount} sin iniciar) y los logros más relevantes.
        2. En "alertas": Sintetiza de forma ejecutiva y concisa (máximo 2 párrafos cortos separados por \\n\\n) las alertas activas (${alertasActivas.length}), las actividades rezagadas (${actividadesRezagadas.length}) y las alertas estratégicas de la Ficha de Resultados, con la acción clave de desbloqueo.

        DATOS REALES:
        - Ámbito: ${ambitoTexto} | Avance promedio: ${totalAvance.toFixed(1)}% (Total=${totalActs}, Completadas=${completadasCount}, En Curso=${enCursoCount}, No Iniciadas=${noIniciadasCount})
        - Actividades: ${JSON.stringify(cifrasActividades.slice(0, 40))}
        - Comentarios recientes: ${comentarios.slice(0, 12).join(' | ') || 'Sin comentarios'}
        - Actividades rezagadas: ${JSON.stringify(actividadesRezagadas.slice(0, 20))}
        - Alertas Gestor: ${JSON.stringify(alertasActivas.slice(0, 15))}
        - Alertas Ficha de Resultados: ${alertasFichaResultados || 'Ninguna'}

        Devuelve ÚNICAMENTE un JSON válido:
        {
          "avances": "Resumen estratégico sucinto de avances...",
          "alertas": "Resumen estratégico sucinto de alertas..."
        }
        `;

        const text = await generarConModeloResiliente(client, prompt, true);
        const result = parseSafeJSON(text || '{}');
        return {
            avancesDraft: result.avances || fallbackAvances,
            alertasDraft: result.alertas || fallbackAlertas
        };
    } catch (error) {
        console.error("[AIService] Error generando borradores cualitativos:", error);
        return {
            avancesDraft: fallbackAvances,
            alertasDraft: fallbackAlertas
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
        const prompt = `
        Analiza el siguiente cuello de botella reportado en RADAR:
        "${descripcionAlerta}"

        Usuarios Disponibles:
        ${JSON.stringify(usuariosDisponibles, null, 2)}

        Retorna un JSON exacto:
        {
          "severidadSugerida": "CRITICA" | "MODERADA" | "INFORMATIVA",
          "responsableSugeridoId": "id_del_usuario_sugerido" | null,
          "tipoSugerido": "VENCIMIENTO" | "SIN_EVIDENCIA" | "BAJO_AVANCE" | "RIESGO_EXTERNO"
        }
        `;

        const text = await generarConModeloResiliente(client, prompt, true);
        return parseSafeJSON(text || '{}');
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
        prechequeoFeedback: '[Análisis local] La evidencia se evalúa de manera preliminar con base en los soportes y comentarios del gestor.'
    };

    const client = obtenerClienteGemini();
    if (!client || !archivoBase64 || !mimeType) {
        return fallbackResult;
    }

    try {
        const filePart = {
            inlineData: {
                data: archivoBase64,
                mimeType: mimeType
            }
        };

        const prompt = `
        Actúa como auditor técnico de evidencias para RADAR.
        Verifica si el documento/imagen adjunto corresponde a la evidencia requerida:
        - Actividad: "${actividadDescripcion}"
        - Tipos de Evidencia Solicitados: ${tiposEvidenciaRequeridos.join(', ')}
        - Comentario del Gestor: "${comentarioAdjunto}"

        Retorna un objeto JSON exacto:
        {
          "prechequeoEstado": "APTO" | "DUDOSO" | "NO_APTO",
          "prechequeoPuntaje": 85.5,
          "prechequeoFeedback": "Explicación ejecutiva breve en español."
        }
        `;

        const text = await generarConModeloResiliente(client, [filePart, prompt], true);
        return parseSafeJSON(text || '{}');
    } catch (error) {
        console.error("[AIService] Error pre-chequeando evidencia:", error);
        return fallbackResult;
    }
};

/**
 * 4. ASISTENTE CONVERSACIONAL ESTRATÉGICO RADAR
 * Responde de forma sucinta y focalizada en el producto/módulo consultado (extrayendo datos de la Ficha de Resultados),
 * a menos que el usuario solicite explícitamente un reporte detallado.
 */
export const responderConsultaOmnicanalRadar = async (
    pregunta: string,
    contextoFocalizado: string,
    modoRespuesta: 'SUCINTO_ESTRATEGICO' | 'DETALLADO' | 'TABLERO_CONTROL',
    resumenFallback: string
): Promise<string> => {
    const client = obtenerClienteGemini();
    if (!client) {
        return resumenFallback;
    }

    try {
        let directrizLongitud = '';
        if (modoRespuesta === 'SUCINTO_ESTRATEGICO') {
            directrizLongitud = `
            REGLA ESTRICTA DE BREVEDAD Y ENFOQUE ESTRATÉGICO (MUY IMPORTANTE):
            - El usuario requiere un **REPORTE ESTRATÉGICO SUCINTO Y DIRECTO** (NO pidió detalle).
            - Tu respuesta DEBE tener **máximo 3 a 4 viñetas cortas (entre 45 y 85 palabras en total)**.
            - Responde **ÚNICAMENTE** sobre el producto o tema preguntado, usando los datos de la **Ficha de Resultados / Tablero de Resultados** incluidos en el contexto.
            - **PROHIBIDO** mencionar otros productos (como Rollos Legendarios, Actividades P08, etc.) si el usuario no preguntó por ellos.
            - Estructura obligatoria en 3 viñetas:
              * **📊 Avance al Corte**: Cifra oficial de la Ficha de Resultados (ejecutado vs programado al corte, % de cumplimiento y meta anual).
              * **✅ Avance Principal**: Resumen ejecutivo en 1 sola frase de los logros o distribución principal del producto.
              * **⚠️ Alerta Principal**: Resumen ejecutivo en 1 o 2 frases del condicionante o alerta principal reportada en la Ficha de Resultados para ese producto.
            `;
        } else if (modoRespuesta === 'TABLERO_CONTROL') {
            directrizLongitud = `
            REGLA DE RESUMEN EJECUTIVO DEL TABLERO DE CONTROL:
            - Presenta un resumen estratégico y conciso (máximo 140 palabras) que sintetice:
              1. **Indicadores Clave por Producto (Ficha de Resultados)**: 1 línea por producto estratégico (Presupuesto, Obras Locales, Residuos P04, Espacio Público P05, Convivencia/Vehículos, Rollos Legendarios).
              2. **Panel de Actividades**: Avance global promedio (%), completadas, en curso y sin iniciar.
              3. **Alertas Prioritarias**: Principales alertas estratégicas activas.
            `;
        } else {
            directrizLongitud = `
            REGLA DE REPORTE DETALLADO:
            - El usuario solicitó nivel de detalle explícito. Presenta el desglose completo de cifras, localidades, frentes o actividades disponibles en el contexto para el tema consultado, estructurado con viñetas claras.
            - No mezcles productos distintos al consultado por el usuario.
            `;
        }

        const prompt = `
        Eres el **Asistente Estratégico Oficial de RADAR** de la Secretaría Distrital de Gobierno de Bogotá (uso exclusivo para Administradores).

        Pregunta del Administrador:
        "${pregunta}"

        ${directrizLongitud}

        DATOS OFICIALES DEL PRODUCTO / MÓDULO CONSULTADO:
        ${contextoFocalizado}

        Reglas de formato:
        - Español ejecutivo, directo y sin introducciones ni saludos largos.
        - Usa negritas (**texto**) para cifras, porcentajes y localidades clave.
        `;

        const text = await generarConModeloResiliente(client, prompt, false);
        return text || resumenFallback;
    } catch (error) {
        console.error("[AIService] Error en asistente estratégico RADAR, usando reporte determinístico:", error);
        return resumenFallback;
    }
};
