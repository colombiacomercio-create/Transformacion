import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, requireRole, AuthRequest } from '../middlewares/auth.middleware';
import * as aiService from '../services/ai.service';

const router = Router();
const prisma = new PrismaClient();

/**
 * 1. POST /api/ia/reportes/generar-borrador
 * Genera el borrador preliminar de avances y alertas.
 */
router.post('/reportes/generar-borrador', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
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

    // 2. Obtener cifras de actividades para este objetivo y localidad
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
        actividad: true
      }
    });

    const cifras = asignaciones.map(a => ({
      codigo: a.actividad.codigoCompleto,
      nombre: a.actividad.nombre,
      avance: a.porcentajeAvance,
      estado: a.estadoLocal
    }));

    // 3. Obtener alertas activas
    const alertas = await prisma.alerta.findMany({
      where: {
        localidadId,
        activa: true,
        actividad: {
          hito: {
            programa: {
              objetivoId
            }
          }
        }
      }
    });

    const alertasSimplificadas = alertas.map(a => ({
      tipo: a.tipo.toString(),
      descripcion: a.descripcion,
      nivel: a.nivel.toString()
    }));

    // 4. Llamar al servicio de IA
    const borrador = await aiService.generarBorradorReporte(
      localidad.nombre,
      objetivo.nombre,
      cifras,
      alertasSimplificadas
    );

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
  } catch (error) {
    console.error('[AI Routes] Error en generar-borrador:', error);
    res.status(500).json({ error: 'Error interno generando borrador con IA' });
  }
});

/**
 * 2. PUT /api/ia/reportes/guardar-edicion
 * Guarda los textos editados por el Administrador antes de publicar.
 */
router.put('/reportes/guardar-edicion', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
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
  } catch (error) {
    console.error('[AI Routes] Error en guardar-edicion:', error);
    res.status(500).json({ error: 'Error guardando edición del reporte' });
  }
});

/**
 * 3. POST /api/ia/reportes/publicar
 * Publica los textos consolidados y los hace visibles en el Tablero de Control.
 */
router.post('/reportes/publicar', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
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
  } catch (error) {
    console.error('[AI Routes] Error en publicar:', error);
    res.status(500).json({ error: 'Error publicando reporte cualitativo' });
  }
});

/**
 * 4. POST /api/ia/alertas/analizar-preliminar
 * Sugiere severidad, responsable e identifica alertas similares.
 */
router.post('/alertas/analizar-preliminar', azureADAuth, async (req: AuthRequest, res) => {
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
    const sugerencias = await aiService.clasificarYEnrutarAlerta(
      descripcion,
      localidadId,
      usuarios
    );

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
  } catch (error) {
    console.error('[AI Routes] Error en analizar-preliminar:', error);
    res.status(500).json({ error: 'Error analizando alerta con IA' });
  }
});

/**
 * 5. POST /api/ia/evidencias/prechequear
 * Dispara el análisis de pre-chequeo sobre una evidencia cargada en Supabase.
 */
router.post('/evidencias/prechequear', azureADAuth, async (req: AuthRequest, res) => {
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
    let fileBase64: string | null = null;
    let mimeType: string | null = null;

    if (evidencia.urlArchivo && !evidencia.urlArchivo.includes('simulado')) {
      try {
        // Fetch del buffer de Supabase Storage para enviarlo a Gemini
        const fileResponse = await fetch(evidencia.urlArchivo);
        const arrayBuffer = await fileResponse.arrayBuffer();
        fileBase64 = Buffer.from(arrayBuffer).toString('base64');
        mimeType = fileResponse.headers.get('content-type');
      } catch (err) {
        console.warn('⚠️ No se pudo descargar el archivo de Supabase. Corriendo en modo texto.', err);
      }
    }

    const prechequeo = await aiService.prechequearEvidencia(
      evidencia.actividad.descripcion || evidencia.actividad.nombre,
      evidencia.actividad.tiposEvidenciaRequeridos,
      fileBase64,
      mimeType,
      evidencia.comentarioAdjunto || ''
    );

    // Persistir el resultado
    const evidenciaActualizada = await prisma.evidencia.update({
      where: { id: evidenciaId },
      data: {
        prechequeoEstado: prechequeo.prechequeoEstado as any,
        prechequeoPuntaje: prechequeo.prechequeoPuntaje,
        prechequeoFeedback: prechequeo.prechequeoFeedback,
        fechaAnalisisIA: new Date()
      }
    });

    res.json(evidenciaActualizada);
  } catch (error) {
    console.error('[AI Routes] Error en prechequear evidencia:', error);
    res.status(500).json({ error: 'Error analizando evidencia con IA' });
  }
});

/**
 * 6. POST /api/ia/chat/mensaje
 * Endpoint del Asistente SITRA conversacional.
 */
router.post('/chat/mensaje', azureADAuth, async (req: AuthRequest, res) => {
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

    const chatResponse = await aiService.responderConsultaChat(
      query,
      req.user.rol,
      contextoData
    );

    let respuestaFinal = chatResponse.respuesta;
    let datosReales = "";

    if (chatResponse.parametrosFiltro && Object.keys(chatResponse.parametrosFiltro).length > 0) {
      const filtros = chatResponse.parametrosFiltro;
      let asignaciones: any[] = [];
      let alertas: any[] = [];

      // 1. Filtrar por Localidad si se detecta nombre
      let localidadId = filtros.localidadId;
      const targetLocalidad = filtros.localidadNombre || filtros.localidad || (query.toLowerCase().includes('usaquen') ? 'Usaquén' : null);
      if (targetLocalidad) {
        const loc = await prisma.localidad.findFirst({
          where: { nombre: { contains: targetLocalidad, mode: 'insensitive' } }
        });
        if (loc) {
          localidadId = loc.id;
        }
      }

      // 2. Query Asignaciones/Avances
      const whereAsig: any = {};
      if (localidadId) whereAsig.localidadId = localidadId;
      if (filtros.estadoActividad) {
        whereAsig.actividad = { estado: filtros.estadoActividad };
      }

      asignaciones = await prisma.asignacionLocalidad.findMany({
        where: whereAsig,
        include: {
          actividad: true,
          localidad: true
        }
      });

      // 3. Query Alertas
      const whereAlerta: any = {};
      if (localidadId) whereAlerta.localidadId = localidadId;
      if (filtros.estadoAlerta) whereAlerta.estado = filtros.estadoAlerta;

      alertas = await prisma.fichaAlerta.findMany({
        where: whereAlerta,
        include: {
          localidad: true
        }
      });

      if (asignaciones.length > 0 || alertas.length > 0) {
        datosReales = `
          DATOS REALES OBTENIDOS DE LA BASE DE DATOS:
          Asignaciones/Actividades de la localidad (${asignaciones.length} encontradas):
          ${asignaciones.map(a => `- Actividad ${a.actividad.codigoCompleto || a.actividad.id}: "${a.actividad.nombre}" en la localidad "${a.localidad.nombre}" tiene un avance del ${a.porcentajeAvance}% y estado local "${a.estadoLocal || 'PENDIENTE'}".`).join('\n')}
          
          Alertas activas (${alertas.length} encontradas):
          ${alertas.map(al => `- Alerta [${al.tipo}]: "${al.descripcion}" en localidad "${al.localidad?.nombre || 'Global'}" (Responsable: ${al.responsable}, Estado: ${al.estado}).`).join('\n')}
        `;

        // Generamos la respuesta sintetizada final en base a la información real
        respuestaFinal = await aiService.generarRespuestaFinalChat(query, datosReales);
      } else {
        respuestaFinal = `He consultado los datos de SITRA aplicando el filtro para la localidad de "${targetLocalidad || 'especificada'}" pero actualmente no existen registros de actividades asignadas o alertas creadas en esta sección.`;
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
  } catch (error) {
    console.error('[AI Routes] Error en chat/mensaje:', error);
    res.status(500).json({ error: 'Error procesando consulta conversacional' });
  }
});

export default router;
