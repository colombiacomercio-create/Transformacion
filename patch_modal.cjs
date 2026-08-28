const fs = require('fs');
let file = fs.readFileSync('D:/Transformacion/frontend/src/components/gestion/ModalFichaResultados.tsx', 'utf8');

const newSecciones = `const SECCIONES = [
  {
    id: 'ejecucion', titulo: '1. Ejecución del Plan de Desarrollo',
    campos: [
      { key: 'compromisosPct', label: 'Compromisos - Avance Real %', type: 'number', step: '0.1' },
      { key: 'metaCompromisosPct', label: 'Compromisos - Programado al corte %', type: 'number', step: '0.1' },
      { key: 'girosPct', label: 'Giros - Avance Real %', type: 'number', step: '0.1' },
      { key: 'metaGirosPct', label: 'Giros - Programado al corte %', type: 'number', step: '0.1' },
      { key: 'procesosMonitoreados', label: 'Procesos Monitoreados', type: 'number' },
      { key: 'procesosRequierenComite', label: 'Procesos requieren comité', type: 'number' },
      { key: 'avancesEjecucion', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaEjecucion', label: 'Alertas (rezago, impacto, acción)', type: 'textarea' },
    ],
  },
  {
    id: 'obras', titulo: '2. Obras Locales',
    campos: [
      { key: 'metaObras', label: 'Meta anual de obras', type: 'number' },
      { key: 'obrasProgramadasAlCorte', label: 'Intervenciones programadas al corte', type: 'number' },
      { key: 'intervencionesFinalizadas', label: 'Intervenciones finalizadas (real)', type: 'number' },
      { key: 'kmCarrilIntervenido', label: 'Km-carril intervenidos', type: 'number', step: '0.1' },
      { key: 'kmIntervenidos', label: 'M2 intervenidos (kmIntervenidos/m2)', type: 'number', step: '0.1' },
      { key: 'avancesObras', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaObras', label: 'Alertas', type: 'textarea' },
    ],
  },
  {
    id: 'rollos', titulo: '3. Rollos Legendarios',
    campos: [
      { key: 'totalRollos', label: 'Total de rollos', type: 'number' },
      { key: 'rollosResueltos', label: 'Rollos resueltos (real)', type: 'number' },
      { key: 'rollosEnCurso', label: 'Rollos en curso', type: 'number' },
      { key: 'rollosAvancesSignificativos', label: 'Rollos con avances significativos', type: 'number' },
      { key: 'rollosProgramadosAlCorte', label: 'Rollos programados al corte', type: 'number' },
      { key: 'avancesRollos', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaRollos', label: 'Alertas', type: 'textarea' },
    ],
  },
  {
    id: 'espacioResid', titulo: '4. Espacio Público - Residuos',
    campos: [
      { key: 'puntosCriticosPriorizados', label: 'Total Puntos Críticos Priorizados', type: 'number' },
      { key: 'puntosSostenidosProgramados', label: 'Puntos programados para estar sostenidos', type: 'number' },
      { key: 'puntosSostenidos', label: 'Puntos sostenidos a la fecha (real)', type: 'number' },
      { key: 'personasSensibilizadas', label: 'Personas sensibilizadas (real)', type: 'number' },
      { key: 'personasSensibilizadasProgramadas', label: 'Personas sensibilizadas (programado)', type: 'number' },
      { key: 'operativosIVC', label: 'Operativos IVC (real)', type: 'number' },
      { key: 'operativosIVCProgramados', label: 'Operativos IVC (programado)', type: 'number' },
      { key: 'accionesReportadas', label: 'Intervenciones reportadas', type: 'number' },
      { key: 'residuosM3', label: 'Residuos recolectados (m³)', type: 'number', step: '0.1' },
      { key: 'espacioPublicoM2', label: 'M² recuperados', type: 'number', step: '0.1' },
      { key: 'avancesResiduos', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaEspacioResiduos', label: 'Alertas', type: 'textarea' },
    ],
  },
  {
    id: 'ventaInformal', titulo: '5. Organización Espacio y Venta Informal',
    campos: [
      { key: 'puntosVerificados', label: 'Total Puntos Priorizados/Verificados', type: 'number' },
      { key: 'puntosProgramadosSostenibilidad', label: 'Puntos programados para sostenibilidad', type: 'number' },
      { key: 'puntosSostenibilidadEfectiva', label: 'Puntos con sostenibilidad efectiva (real)', type: 'number' },
      { key: 'puntosIntervenidos', label: 'Intervenciones reportadas', type: 'number' },
      { key: 'm2RecuperadosInformal', label: 'M² recuperados', type: 'number', step: '0.1' },
      { key: 'personasReubicadas', label: 'Personas reubicadas', type: 'number' },
      { key: 'orgParqueo', label: 'Operativos de org. parqueo', type: 'number' },
      { key: 'ventaInformal', label: 'Operativos de venta informal', type: 'number' },
      { key: 'avancesVenta', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaEspacioVenta', label: 'Alertas', type: 'textarea' },
    ],
  },
  {
    id: 'actuaciones', titulo: '6. Actuaciones Administrativas',
    campos: [
      { key: 'metaArchivos', label: 'Archivos - Meta Anual', type: 'number' },
      { key: 'archivosProgramadosCorte', label: 'Archivos - Programado al corte', type: 'number', step: '0.1' },
      { key: 'archivosPct', label: 'Archivos - Resultado acumulado', type: 'number', step: '0.1' },
      { key: 'metaFallos', label: 'Fallos 1ª Instancia - Meta Anual', type: 'number' },
      { key: 'fallosProgramadosCorte', label: 'Fallos - Programado al corte', type: 'number', step: '0.1' },
      { key: 'fallosPrimeraEstanciaPct', label: 'Fallos - Resultado acumulado', type: 'number', step: '0.1' },
      { key: 'avancesActuaciones', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaActuaciones', label: 'Alertas', type: 'textarea' },
    ],
  },
  {
    id: 'convivencia', titulo: '7. Convivencia y Seguridad',
    campos: [
      { key: 'motosMetaTotal', label: 'Meta total de Motos', type: 'number' },
      { key: 'motosProgramadasCorte', label: 'Motos programadas al corte', type: 'number' },
      { key: 'motosEntregadasPolicia', label: 'Entregadas a Policía', type: 'number' },
      { key: 'motosEntregadas', label: 'Entregadas a SDSCJ', type: 'number' },
      { key: 'motosAlmacenFdl', label: 'En almacén FDL', type: 'number' },
      { key: 'motosPendientesFdl', label: 'Pendientes entrega FDL', type: 'number' },
      { key: 'avancesConvivencia', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaConvivencia', label: 'Alertas', type: 'textarea' },
    ],
  },
  {
    id: 'memoria', titulo: '8. Estrategias de Memoria',
    campos: [
      { key: 'estrategiasTotal', label: 'Total de Estrategias', type: 'number' },
      { key: 'estrategiasProgramadasCorte', label: 'Estrategias programadas al corte', type: 'number' },
      { key: 'estrategiasResueltas', label: 'Estrategias finalizadas', type: 'number' },
      { key: 'estrategiasFormulacion', label: 'En formulación', type: 'number' },
      { key: 'estrategiasAjustes', label: 'Con ajustes solicitados', type: 'number' },
      { key: 'estrategiasValidacionTecnica', label: 'En validación técnica', type: 'number' },
      { key: 'avancesEstrategias', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaEstrategias', label: 'Alertas', type: 'textarea' },
    ],
  },
];`;

file = file.replace(/const SECCIONES = \[[\s\S]*?\];\n\nexport default/, newSecciones + '\n\nexport default');
fs.writeFileSync('D:/Transformacion/frontend/src/components/gestion/ModalFichaResultados.tsx', file);
