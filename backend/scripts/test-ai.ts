import * as aiService from '../src/services/ai.service';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno del backend
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log("=================================================");
  console.log("🧪 INICIANDO PRUEBAS DE SERVICIOS DE IA (SITRA)");
  console.log("=================================================\n");

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    console.log("🟢 Clave de API detectada. Conectando con Gemini API...");
  } else {
    console.log("🟡 GEMINI_API_KEY no detectada en .env. Corriendo pruebas en MODO SIMULADO.");
  }

  // -----------------------------------------------------------
  // Prueba 1: Generación asistida de reportes narrativos
  // -----------------------------------------------------------
  console.log("\n--- [Prueba 1] Generación de Reportes Cualitativos ---");
  const cifrasMock = [
    { codigo: 'P01.H1.A1', nombre: 'Pavimentación de vías secundarias', avance: 95.0, estado: 'COMPLETADA' },
    { codigo: 'P01.H1.A2', nombre: 'Instalación de luminarias LED', avance: 45.0, estado: 'EN_PROGRESO' },
    { codigo: 'P01.H2.A1', nombre: 'Estudio de movilidad local', avance: 10.0, estado: 'PENDIENTE' }
  ];
  const alertasMock = [
    { tipo: 'SIN_EVIDENCIA', descripcion: 'El contratista de luminarias no ha subido actas de vecindad', nivel: 'MODERADA' }
  ];

  try {
    const reporte = await aiService.generarBorradorReporte(
      "Suba",
      "Objetivo 1: Infraestructura y Conectividad",
      cifrasMock,
      alertasMock
    );
    console.log("✅ Borrador de Avances:");
    console.log(reporte.avancesDraft);
    console.log("\n✅ Borrador de Alertas/Recomendaciones:");
    console.log(reporte.alertasDraft);
  } catch (err) {
    console.error("❌ Error en Prueba 1:", err);
  }

  // -----------------------------------------------------------
  // Prueba 2: Clasificación y enrutamiento de alertas
  // -----------------------------------------------------------
  console.log("\n--- [Prueba 2] Clasificación e Enrutamiento de Alertas ---");
  const alertaTexto = "La comunidad bloqueó el acceso a la obra de la calle 170 por ruidos molestos en horario nocturno y exigen reunión con el alcalde local.";
  const usuariosMock = [
    { id: 'usr-1', nombre: 'Carlos Gómez', rol: 'ADMIN', email: 'carlos@localidad.gov.co' },
    { id: 'usr-2', nombre: 'Ing. Laura Silva', rol: 'GESTOR', email: 'laura@localidad.gov.co' }
  ];

  try {
    const clasificacion = await aiService.clasificarYEnrutarAlerta(alertaTexto, "suba-uuid", usuariosMock);
    console.log("✅ Clasificación sugerida:");
    console.log(`   - Severidad: ${clasificacion.severidadSugerida}`);
    console.log(`   - Tipo: ${clasificacion.tipoSugerido}`);
    console.log(`   - Responsable sugerido (ID): ${clasificacion.responsableSugeridoId}`);
  } catch (err) {
    console.error("❌ Error en Prueba 2:", err);
  }

  // -----------------------------------------------------------
  // Prueba 3: Pre-chequeo de evidencias (Usa un PNG de 1x1 transparente)
  // -----------------------------------------------------------
  console.log("\n--- [Prueba 3] Pre-chequeo de Evidencias ---");
  const actividadDesc = "El contratista debe entregar el acta firmada por el supervisor y el registro fotográfico de las 5 calles pavimentadas.";
  const tiposEvidenciaReq = ["acta", "registro fotográfico"];
  
  // PNG de 1x1 transparente válido
  const archivoSimuladoBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const mimeType = "image/png";
  const comentarioGestor = "Adjunto el acta final firmada y fotos de la calle 170 y 171 terminadas.";

  try {
    const prechequeo = await aiService.prechequearEvidencia(
      actividadDesc,
      tiposEvidenciaReq,
      archivoSimuladoBase64,
      mimeType,
      comentarioGestor
    );
    console.log("✅ Resultado pre-chequeo:");
    console.log(`   - Estado: ${prechequeo.prechequeoEstado}`);
    console.log(`   - Puntaje: ${prechequeo.prechequeoPuntaje}%`);
    console.log(`   - Feedback: ${prechequeo.prechequeoFeedback}`);
  } catch (err) {
    console.error("❌ Error en Prueba 3:", err);
  }

  // -----------------------------------------------------------
  // Prueba 4: Asistente conversacional de chat
  // -----------------------------------------------------------
  console.log("\n--- [Prueba 4] Consulta en Lenguaje Natural (Chat) ---");
  const pregunta = "¿Qué actividades de infraestructura están vencidas en la localidad de Suba?";
  const schemaContext = `
    - Actividad (id, codigoCompleto, nombre, estado: PENDIENTE/EN_PROGRESO/COMPLETADA/CON_ALERTA/VENCIDA, prioridad)
    - Localidad (id, nombre)
    - AsignacionLocalidad (actividadId, localidadId, porcentajeAvance, estadoLocal, estadoValidacion)
  `;

  try {
    const queryResult = await aiService.responderConsultaChat(pregunta, "OBSERVADOR", schemaContext);
    console.log("✅ Respuesta del Asistente:");
    console.log(queryResult.respuesta);
    console.log("\n✅ Filtros deducidos en JSON:");
    console.log(JSON.stringify(queryResult.parametrosFiltro, null, 2));
  } catch (err) {
    console.error("❌ Error en Prueba 4:", err);
  }

  console.log("\n=================================================");
  console.log("🧪 PRUEBAS FINALIZADAS");
  console.log("=================================================");
}

runTests();
