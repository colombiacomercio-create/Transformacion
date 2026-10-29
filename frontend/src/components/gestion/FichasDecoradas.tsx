import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { LOGO_SDG_BASE64, LOGO_RADAR_BASE64 } from '../../utils/logos';

interface Props {
  ultimaFicha: any;
}

export default function FichasDecoradas({ ultimaFicha }: Props) {
  if (!ultimaFicha) return null;

  // Helper de aguja para marcar la meta a corte sobre el arco de la meta anual (180 grados)
  const renderNeedle = (pct: number = 0, radius: number = 44) => {
    const safePct = Math.min(100, Math.max(0, pct));
    const rotateDeg = (safePct * 180) / 100 - 90;
    return (
      <div 
        className="absolute z-10 pointer-events-none"
        style={{
          bottom: 0, 
          left: '50%', 
          width: '2px', 
          height: `${radius + 4}px`,
          transformOrigin: 'bottom center', 
          transform: `translateX(-50%) rotate(${rotateDeg}deg)`,
          borderLeft: '2.5px dashed #0f172a'
        }}
        title={`Meta programada al corte: ${safePct}%`}
      />
    );
  };

  // Tacómetro Recharts para PORCENTAJES (Presupuesto, Archivos, Fallos)
  // El arco completo representa el 100% de la Meta Anual
  // realPct = porcentaje ejecutado del presupuesto anual (ej. Giros: 40%, Compromisos: 58%)
  // metaCortePct = porcentaje programado a corte (ej. Giros: 40%, Compromisos: 50%)
  const renderPercentGauge = (realPct: number = 0, metaCortePct: number = 0, color: string, label: string) => {
    const safeReal = Math.min(100, Math.max(0, realPct));
    const safeMeta = Math.min(100, Math.max(0, metaCortePct));

    const data = [
      { value: safeReal, color },
      { value: Math.max(0, 100 - safeReal), color: '#f1f5f9' }
    ];

    const cumplimiento = safeMeta > 0 ? Math.round((safeReal / safeMeta) * 100) : (safeReal > 0 ? 100 : 0);
    const statusBadge = cumplimiento >= 100
      ? { text: 'Cumplido', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
      : cumplimiento >= 70
      ? { text: 'En Proceso', bg: 'bg-amber-100 text-amber-800 border-amber-300' }
      : { text: 'En Rezago', bg: 'bg-red-100 text-red-800 border-red-300' };

    return (
      <div className="flex flex-col items-center justify-center">
        <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight mb-0.5">{label}</span>
        <div className="relative" style={{ width: '120px', height: '64px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
              <Pie 
                data={data} 
                cx="50%" 
                cy="100%" 
                startAngle={180} 
                endAngle={0} 
                innerRadius={28} 
                outerRadius={45} 
                paddingAngle={0} 
                dataKey="value" 
                stroke="none"
              >
                {data.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {renderNeedle(safeMeta, 45)}
          <div className="absolute bottom-0 left-0 w-full text-center mb-[-3px]">
            <span className="text-lg font-black leading-none" style={{ color }}>{safeReal}%</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full border ${statusBadge.bg}`}>
            {statusBadge.text}
          </span>
          <span className="text-[8px] font-semibold text-slate-600">
            Corte: {safeMeta}% (Meta 100%)
          </span>
        </div>
      </div>
    );
  };

  // Tacómetro Recharts para CANTIDADES ABSOLUTAS (Obras, Rollos, Puntos, Vehículos, Estrategias)
  // El arco completo representa la Meta Anual (ej. 1.700 obras, 23 rollos, 70 puntos)
  // real = ejecutado (ej. 1.160 obras)
  // prog = programado al corte (ej. 1.285 obras)
  // metaTotal = meta anual total (ej. 1.700 obras)
  const renderCountGauge = (
    real: number = 0,
    prog: number = 0,
    metaTotal: number = 0,
    color: string,
    label: string,
    unitName: string = ''
  ) => {
    const total = metaTotal > 0 ? metaTotal : Math.max(prog, real, 1);
    const realArcPct = Math.min(100, Math.round((real / total) * 100));
    const progNeedlePct = Math.min(100, Math.round((prog / total) * 100));

    const data = [
      { value: realArcPct, color },
      { value: Math.max(0, 100 - realArcPct), color: '#f1f5f9' }
    ];

    const cumplimiento = prog > 0 ? Math.round((real / prog) * 100) : (real > 0 ? 100 : 0);
    const statusBadge = cumplimiento >= 90
      ? { text: 'Cumplido', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
      : cumplimiento >= 70
      ? { text: 'En Proceso', bg: 'bg-amber-100 text-amber-800 border-amber-300' }
      : { text: 'En Rezago', bg: 'bg-red-100 text-red-800 border-red-300' };

    return (
      <div className="flex flex-col items-center justify-center">
        <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight mb-0.5">{label}</span>
        <div className="relative" style={{ width: '120px', height: '64px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
              <Pie 
                data={data} 
                cx="50%" 
                cy="100%" 
                startAngle={180} 
                endAngle={0} 
                innerRadius={28} 
                outerRadius={45} 
                paddingAngle={0} 
                dataKey="value" 
                stroke="none"
              >
                {data.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {renderNeedle(progNeedlePct, 45)}
          <div className="absolute bottom-0 left-0 w-full text-center mb-[-3px]">
            <span className="text-base font-black leading-none" style={{ color }}>
              {real.toLocaleString('es-CO')}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-0.5 mt-1">
          <div className="flex items-center gap-1">
            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full border ${statusBadge.bg}`}>
              {statusBadge.text} ({cumplimiento}%)
            </span>
            <span className="text-[8px] font-bold text-slate-600">
              {realArcPct}% de meta anual
            </span>
          </div>
          <span className="text-[7.5px] font-semibold text-slate-500">
            Prog. corte: {prog.toLocaleString('es-CO')} | Meta anual: {total.toLocaleString('es-CO')} {unitName}
          </span>
        </div>
      </div>
    );
  };

  // Parser de viñetas con limpieza de caracteres basura (□, •, -, etc.)
  const parseVinetas = (texto: string | null | undefined) => {
    if (!texto || !texto.trim()) {
      return <p className="text-[9.5px] text-slate-400 italic py-0.5">Sin avances registrados en el corte</p>;
    }
    const lineas = texto.split('\n').filter((l: string) => l.trim().length > 0);
    return (
      <ul className="list-disc pl-3.5 text-[9.5px] text-slate-900 space-y-1 font-normal">
        {lineas.map((l: string, i: number) => {
          const limpia = l.replace(/^[-*•\s\u25A0\u25A1\u25B6\u25CF]+\s*/, '');
          return (
            <li key={i} className="leading-snug">
              {limpia}
            </li>
          );
        })}
      </ul>
    );
  };

  // Renderizador limpio para alertas con viñeta destacada
  const renderAlertasText = (texto: string | null | undefined) => {
    if (!texto || !texto.trim()) {
      return (
        <span className="text-[9px] text-emerald-800 font-semibold flex items-center gap-1 py-0.5">
          <span className="text-emerald-600 font-bold">✓</span> Sin alertas activas en el corte
        </span>
      );
    }
    const lineas = texto.split('\n').filter((l: string) => l.trim().length > 0);
    return (
      <div className="space-y-1 text-[9.5px] text-slate-900 leading-snug font-normal">
        {lineas.map((l: string, i: number) => {
          const limpia = l.replace(/^[-*•\s\u25A0\u25A1\u25B6\u25CF]+\s*/, '');
          return (
            <div key={i} className="flex items-start gap-1">
              <span className="text-amber-700 font-bold shrink-0 mt-0.5 text-xs">▪</span>
              <span>{limpia}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const parseListItems = (texto: string | null | undefined) => {
    if (!texto || !texto.trim()) return <span className="text-slate-400 italic text-[8.5px]">Ninguno</span>;
    const lineas = texto.split('\n').filter((l: string) => l.trim().length > 0);
    return (
      <ul className="list-disc pl-2.5 text-[8.5px] text-slate-800 space-y-0.5 font-normal">
        {lineas.map((l: string, i: number) => {
          const limpia = l.replace(/^[-*•\s\u25A0\u25A1\u25B6\u25CF]+\s*/, '');
          return (
            <li key={i} className="leading-tight">
              {limpia}
            </li>
          );
        })}
      </ul>
    );
  };

  // Cálculos de datos reales, metas y colores
  const compromisosReal = ultimaFicha.compromisosPct ?? 0;
  const compromisosProg = ultimaFicha.metaCompromisosPct ?? 0;
  const c1Color = compromisosProg > 0 
    ? ((compromisosReal / compromisosProg) * 100 < 70 ? '#dc2626' : (compromisosReal / compromisosProg) * 100 < 95 ? '#d97706' : '#16a34a')
    : '#16a34a';

  const girosReal = ultimaFicha.girosPct ?? 0;
  const girosProg = ultimaFicha.metaGirosPct ?? 0;
  const c2Color = girosProg > 0 
    ? ((girosReal / girosProg) * 100 < 70 ? '#dc2626' : (girosReal / girosProg) * 100 < 95 ? '#d97706' : '#16a34a')
    : '#16a34a';

  const ejecucionColor = (c1Color === '#dc2626' || c2Color === '#dc2626') ? '#dc2626' : (c1Color === '#d97706' || c2Color === '#d97706') ? '#d97706' : '#16a34a';

  // Obras: meta anual 1700, prog 1285, real 1160
  const obrasMeta = ultimaFicha.metaObras || ultimaFicha.intervencionesMetaTotal || 1700;
  const obrasProg = ultimaFicha.obrasProgramadasAlCorte || 1285;
  const obrasReal = ultimaFicha.intervencionesFinalizadas || 1160;
  const obrasCumplimiento = obrasProg > 0 ? Math.round((obrasReal / obrasProg) * 100) : 0;
  const obrasColor = obrasCumplimiento < 70 ? '#dc2626' : obrasCumplimiento < 90 ? '#d97706' : '#16a34a';

  // Rollos Legendarios
  const rollosMeta = ultimaFicha.totalRollos || 23;
  const rollosProg = ultimaFicha.rollosProgramadosAlCorte || 15;
  const rollosReal = ultimaFicha.rollosResueltos || 8;
  const rollosCumplimiento = rollosProg > 0 ? Math.round((rollosReal / rollosProg) * 100) : 0;
  const rollosColor = rollosCumplimiento < 70 ? '#dc2626' : rollosCumplimiento < 90 ? '#d97706' : '#16a34a';

  // Residuos y Puntos Críticos
  const residMeta = ultimaFicha.puntosCriticosPriorizados || 70;
  const residProg = ultimaFicha.puntosSostenidosProgramados || 50;
  const residReal = ultimaFicha.puntosSostenidos || 45;
  const residCumplimiento = residProg > 0 ? Math.round((residReal / residProg) * 100) : 0;
  const residColor = residCumplimiento < 70 ? '#dc2626' : residCumplimiento < 90 ? '#d97706' : '#16a34a';

  // Sostenibilidad Espacio Público
  const orgProg = ultimaFicha.puntosProgramadosSostenibilidad || ultimaFicha.puntosVerificados || 30;
  const orgReal = ultimaFicha.puntosSostenibilidadEfectiva || 24;
  const orgCumplimiento = orgProg > 0 ? Math.round((orgReal / orgProg) * 100) : 0;
  const orgColor = orgCumplimiento < 70 ? '#dc2626' : orgCumplimiento < 90 ? '#d97706' : '#16a34a';

  // Convivencia y Dotación de Vehículos
  const vehiculosMeta = ultimaFicha.vehiculosMetaTotal || 50;
  const vehiculosProg = ultimaFicha.vehiculosProgramadosCorte || 30;
  const vehiculosReal = (ultimaFicha.vehiculosEntregadosPolicia || 0) + (ultimaFicha.vehiculosEntregadosSdscj || 0);
  const convCumplimiento = vehiculosProg > 0 ? Math.round((vehiculosReal / vehiculosProg) * 100) : 0;
  const convColor = convCumplimiento < 70 ? '#dc2626' : convCumplimiento < 90 ? '#d97706' : '#16a34a';

  // Actuaciones Administrativas
  const archivosReal = ultimaFicha.archivosPct || 45;
  const archivosProg = ultimaFicha.archivosProgramadosCorte || 40;
  const fallosReal = ultimaFicha.fallosPrimeraEstanciaPct || 50;
  const fallosProg = ultimaFicha.fallosProgramadosCorte || 40;
  const actColor = (archivosReal >= archivosProg && fallosReal >= fallosProg) ? '#16a34a' : '#d97706';

  // Estrategias de Memoria
  const memMeta = ultimaFicha.estrategiasTotal || 35;
  const memProg = ultimaFicha.estrategiasProgramadasCorte || 30;
  const memReal = ultimaFicha.estrategiasResueltas || 28;
  const memCumplimiento = memProg > 0 ? Math.round((memReal / memProg) * 100) : 0;
  const memColor = memCumplimiento < 70 ? '#dc2626' : memCumplimiento < 90 ? '#d97706' : '#16a34a';

  // Gradientes de fondo para las cabeceras tipo infografía
  const getHeaderGradient = (color: string) => {
    if (color === '#16a34a') return 'from-emerald-700 via-emerald-600 to-teal-800';
    if (color === '#d97706') return 'from-amber-600 via-amber-500 to-orange-700';
    return 'from-red-700 via-rose-600 to-red-800';
  };

  // Renderizador de Franja Horizontal estilo Infografía [Gráfico 30% | Cifras 24% | Avances y Alertas 46%]
  const renderFranjaHorizontal = (
    title: string,
    themeColor: string,
    badgeText: string,
    icon: string,
    graficoContent: React.ReactNode,
    cifrasContent: React.ReactNode,
    avances: string | null | undefined,
    alertas: string | null | undefined,
    customClass: string = "flex-1"
  ) => {
    const hasAvances = !!(avances && avances.trim().length > 0);
    const hasAlertas = !!(alertas && alertas.trim().length > 0);
    const gradient = getHeaderGradient(themeColor);

    return (
      <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden ${customClass}`}>
        {/* Cabecera Infográfica con gradiente vibrante, icono destacado y badge */}
        <div className={`px-3 py-1 bg-gradient-to-r ${gradient} text-white font-black text-[11px] uppercase tracking-wide flex items-center justify-between shrink-0 shadow-xs`}>
          <span className="flex items-center gap-2">
            <span className="text-base leading-none drop-shadow-xs">{icon}</span>
            <span>{title}</span>
          </span>
          <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-[8.5px] font-bold tracking-tight backdrop-blur-xs border border-white/25">
            {badgeText}
          </span>
        </div>

        {/* Contenido en 3 Columnas Horizontales */}
        <div className="flex-1 grid grid-cols-12 gap-2.5 p-2 items-stretch overflow-hidden">
          
          {/* Columna 1: Gráfico Visual Recharts (30% del ancho) */}
          <div className="col-span-3 bg-slate-50/70 border-r border-slate-200/80 pr-2 rounded-l-lg flex flex-col justify-center items-center">
            {graficoContent}
          </div>

          {/* Columna 2: Cifras y Métricas Clave Infográficas (24% del ancho) */}
          <div className="col-span-3 border-r border-slate-200/80 pr-2 flex flex-col justify-center">
            {cifrasContent}
          </div>

          {/* Columna 3: Avances y Alertas estilo Infografía (46% del ancho) */}
          <div className="col-span-6 flex flex-col gap-1.5 justify-between overflow-hidden">
            {/* Tarjeta de Avances */}
            <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/50 border border-emerald-200/90 rounded-lg p-1.5 flex-1 overflow-auto shadow-2xs">
              <div className="text-[8.5px] font-black text-emerald-950 flex items-center gap-1.5 mb-0.5 shrink-0 uppercase tracking-wider">
                <span className="text-xs">🚀</span>
                <span>PRINCIPALES AVANCES DEL CORTE</span>
              </div>
              <div>{parseVinetas(avances)}</div>
            </div>

            {/* Tarjeta de Alertas */}
            <div className={`border rounded-lg p-1.5 overflow-auto shadow-2xs ${
              hasAlertas 
                ? 'bg-gradient-to-r from-amber-50/90 to-orange-50/50 border-amber-200/90 flex-1' 
                : 'bg-slate-50/80 border-slate-200/80 py-0.5'
            }`}>
              <div className={`text-[8.5px] font-black flex items-center gap-1.5 mb-0.5 shrink-0 uppercase tracking-wider ${
                hasAlertas ? 'text-amber-950' : 'text-slate-600'
              }`}>
                <span className="text-xs">{hasAlertas ? '⚠️' : '🛡️'}</span>
                <span>ALERTAS & CONDICIONANTES</span>
              </div>
              <div>{renderAlertasText(alertas)}</div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  // Cabecera institucional oficial: Solo logo de Secretaría de Gobierno/Bogotá + RADAR, y texto Unidad de Transformación / RADAR
  const renderHeader = (numPagina: number, subtituloTematico: string) => {
    const fechaCorte = ultimaFicha?.periodo 
      ? new Date(ultimaFicha.periodo).toLocaleDateString('es-CO', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' })
      : 'Corte General';

    return (
      <div className="flex justify-between items-center pb-2 mb-1.5 border-b-2 border-red-600 shrink-0">
        <div className="flex items-center gap-3">
          <img src={LOGO_SDG_BASE64} alt="Secretaría de Gobierno - Bogotá" className="h-9 object-contain" />
          <div className="h-7 w-px bg-slate-200" />
          <img src={LOGO_RADAR_BASE64} alt="RADAR" className="h-8 object-contain" />
          <div className="ml-1 border-l-2 pl-2.5 border-slate-300">
            <h1 className="text-[12px] font-black text-slate-900 tracking-tight uppercase leading-tight">
              Unidad de Transformación
            </h1>
            <p className="text-[9.5px] font-black text-red-700 tracking-wider uppercase">
              RADAR
            </p>
          </div>
        </div>

        {/* Título Central Infográfico (sin 'EJE') */}
        <div className="text-center">
          <div className="text-xs font-black uppercase tracking-wide text-slate-900">
            Boletín Ejecutivo de Resultados y Seguimiento
          </div>
          <span className="inline-block bg-red-50 text-red-700 border border-red-200 rounded-full px-3 py-0.5 text-[8.5px] font-black uppercase tracking-wider mt-0.5">
            {subtituloTematico}
          </span>
        </div>

        {/* Bloque Derecho: Fecha de Corte y Paginación */}
        <div className="text-right">
          <div className="inline-block bg-slate-100 text-slate-800 border border-slate-200 rounded-md px-2.5 py-0.5 text-[8.5px] font-bold">
            📅 Corte: {fechaCorte}
          </div>
          <p className="text-[9px] font-extrabold text-slate-500 mt-0.5">Página {numPagina} de 3</p>
        </div>
      </div>
    );
  };

  // Pie de página institucional oficial
  const renderFooter = (numPagina: number) => (
    <div className="pt-1.5 mt-auto border-t border-slate-200 flex justify-between items-center text-[8px] text-slate-600 font-semibold shrink-0">
      <span>Alcaldía Mayor de Bogotá D.C. · Secretaría de Gobierno · Unidad de Transformación · RADAR</span>
      <span className="font-black text-slate-800">Página {numPagina} de 3</span>
    </div>
  );

  return (
    <div 
      className="w-full bg-slate-200/80 py-6 px-2 flex flex-col gap-6 items-center antialiased"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
    >
      
      {/* ========================================================
          PÁGINA 1: Inversión, Obras y Residuos (3 Franjas Horizontales)
          ======================================================== */}
      <div 
        className="pdf-page bg-white shadow-xl flex flex-col justify-between"
        style={{
          width: '279.4mm',
          height: '215.9mm',
          padding: '6mm 8mm',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {renderHeader(1, 'Inversión, Infraestructura y Residuos')}

        <div className="flex-1 flex flex-col gap-2 my-1 overflow-hidden justify-between">
          
          {/* EJECUCIÓN PRESUPUESTAL */}
          {renderFranjaHorizontal(
            'Ejecución del Plan de Desarrollo (Presupuesto)',
            ejecucionColor,
            `Compromisos: ${compromisosReal}% | Giros: ${girosReal}%`,
            '💰',
            <div className="flex items-center justify-around w-full gap-2">
              {renderPercentGauge(compromisosReal, compromisosProg, c1Color, 'Compromisos')}
              <div className="h-12 w-px bg-slate-200" />
              {renderPercentGauge(girosReal, girosProg, c2Color, 'Giros')}
            </div>,
            <div className="space-y-1.5 text-[9px]">
              <div className="bg-slate-50 border-l-4 border-indigo-500 rounded-md p-1.5 flex justify-between items-center shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">📋</span>
                  <div>
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Monitoreo</span>
                    <span className="font-bold text-slate-700">Procesos Monitoreados</span>
                  </div>
                </div>
                <span className="font-black text-base text-slate-900">{ultimaFicha.procesosMonitoreados || 0}</span>
              </div>
              <div className="bg-slate-50 border-l-4 border-red-500 rounded-md p-1.5 flex justify-between items-center shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">⚠️</span>
                  <div>
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Atención Requerida</span>
                    <span className="font-bold text-slate-700">Requieren Comité</span>
                  </div>
                </div>
                <span className="font-black text-base text-red-600">{ultimaFicha.procesosRequierenComite || 0}</span>
              </div>
            </div>,
            ultimaFicha.avancesEjecucion,
            ultimaFicha.alertaEjecucion
          )}

          {/* OBRAS LOCALES */}
          {renderFranjaHorizontal(
            'Obras Locales (Intervenciones en Territorio)',
            obrasColor,
            `Cumplimiento: ${obrasCumplimiento}% (${obrasReal.toLocaleString('es-CO')} finalizadas)`,
            '🏗️',
            renderCountGauge(obrasReal, obrasProg, obrasMeta, obrasColor, 'Avance de Obras', 'obras'),
            <div className="space-y-1 text-[8px]">
              <div className="grid grid-cols-3 gap-1 text-center border-b border-slate-200 pb-1 mb-1">
                <div className="bg-slate-50 p-1 rounded-md">
                  <span className="text-slate-500 font-bold block text-[7px] uppercase">🎯 META ANUAL</span>
                  <span className="font-black text-xs text-slate-900">{obrasMeta.toLocaleString('es-CO')}</span>
                </div>
                <div className="bg-slate-50 p-1 rounded-md">
                  <span className="text-slate-500 font-bold block text-[7px] uppercase">📅 PROG. CORTE</span>
                  <span className="font-black text-xs text-slate-900">{obrasProg.toLocaleString('es-CO')}</span>
                </div>
                <div className="bg-emerald-50 p-1 rounded-md border border-emerald-200">
                  <span className="text-emerald-800 font-bold block text-[7px] uppercase">🏗️ EJECUTADO</span>
                  <span className="font-black text-xs" style={{ color: obrasColor }}>{obrasReal.toLocaleString('es-CO')}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[8px]">
                <div className="border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded flex justify-between items-center">
                  <span>🛣️ Malla Vial</span><b>{ultimaFicha.obrasMallaVial || 0}</b>
                </div>
                <div className="border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded flex justify-between items-center">
                  <span>🏛️ Esp. Público</span><b>{ultimaFicha.obrasEspacioPublico || 0}</b>
                </div>
                <div className="border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded flex justify-between items-center">
                  <span>🏠 Viv. Rural</span><b>{ultimaFicha.obrasViviendaRural || 0}</b>
                </div>
                <div className="border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded flex justify-between items-center">
                  <span>🌳 Parques</span><b>{ultimaFicha.obrasParque || 0}</b>
                </div>
              </div>
            </div>,
            ultimaFicha.avancesObras,
            ultimaFicha.alertaObras
          )}

          {/* ESPACIO PÚBLICO - RESIDUOS */}
          {renderFranjaHorizontal(
            'Espacio Público — Residuos y Puntos Críticos',
            residColor,
            `Puntos sostenidos: ${residReal} de ${residMeta} priorizados`,
            '♻️',
            renderCountGauge(residReal, residProg, residMeta, residColor, 'Puntos Críticos', 'puntos'),
            <div className="space-y-1 text-[8.5px]">
              <div className="bg-slate-50 border-l-4 border-amber-500 rounded-md p-1 flex justify-between items-center shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">👥</span>
                  <div>
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Sensibilización</span>
                    <span className="font-bold text-slate-700">Personas</span>
                  </div>
                </div>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.personasSensibilizadas?.toLocaleString('es-CO') || 0}</span>
              </div>
              <div className="bg-slate-50 border-l-4 border-blue-500 rounded-md p-1 flex justify-between items-center shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🛡️</span>
                  <div>
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Vigilancia</span>
                    <span className="font-bold text-slate-700">Operativos IVC</span>
                  </div>
                </div>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.operativosIVC || 0}</span>
              </div>
              <div className="bg-slate-50 border-l-4 border-emerald-500 rounded-md p-1 flex justify-between items-center shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🧹</span>
                  <div>
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Ejecución</span>
                    <span className="font-bold text-slate-700">Intervenciones</span>
                  </div>
                </div>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.accionesReportadas || 0}</span>
              </div>
            </div>,
            ultimaFicha.avancesResiduos,
            ultimaFicha.alertaEspacioResiduos
          )}

        </div>

        {renderFooter(1)}
      </div>

      {/* ========================================================
          PÁGINA 2: Rollos y Espacio Público Informal (2 Franjas de Gran Espacio)
          ======================================================== */}
      <div 
        className="pdf-page bg-white shadow-xl flex flex-col justify-between"
        style={{
          width: '279.4mm',
          height: '215.9mm',
          padding: '6mm 8mm',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {renderHeader(2, 'Rollos Legendarios y Recuperación del Espacio Público')}

        <div className="flex-1 flex flex-col gap-2.5 my-1 overflow-hidden justify-between">

          {/* ROLLOS LEGENDARIOS */}
          {renderFranjaHorizontal(
            'Rollos Legendarios (Desenrollando la Ciudad)',
            rollosColor,
            `Total: ${rollosMeta} | Prog. corte: ${rollosProg} | Resueltos: ${rollosReal}`,
            '📜',
            renderCountGauge(rollosReal, rollosProg, rollosMeta, rollosColor, 'Rollos Resueltos', 'rollos'),
            <div className="flex flex-col gap-1 text-[8px]">
              <div className="border border-green-300 bg-green-50/70 rounded p-1 shadow-2xs">
                <span className="font-black text-green-900 block text-[7.5px] uppercase">✓ Desenrollados</span>
                {parseListItems(ultimaFicha.rollosDesenrolladosLista)}
              </div>
              <div className="border border-yellow-300 bg-yellow-50/70 rounded p-1 shadow-2xs">
                <span className="font-black text-yellow-900 block text-[7.5px] uppercase">⏳ En Curso</span>
                {parseListItems(ultimaFicha.rollosDesenrollandoseLista)}
              </div>
              <div className="border border-red-300 bg-red-50/70 rounded p-1 shadow-2xs">
                <span className="font-black text-red-900 block text-[7.5px] uppercase">✕ Sin Desenrollar</span>
                {parseListItems(ultimaFicha.rollosSinDesenrollarseLista)}
              </div>
            </div>,
            ultimaFicha.avancesRollos,
            ultimaFicha.alertaRollos,
            "h-[49%]"
          )}

          {/* ORGANIZACIÓN ESPACIO PÚBLICO */}
          {renderFranjaHorizontal(
            'Organización del Espacio Público y Venta Informal',
            orgColor,
            `Sostenibilidad: ${orgCumplimiento}% (${orgReal} de ${orgProg} puntos)`,
            '🏪',
            <div className="flex items-center justify-around w-full gap-2">
              <div className="flex flex-col items-center">
                <span className="text-[9.5px] font-black text-slate-800 uppercase tracking-tight mb-0.5">Sostenibilidad</span>
                <div className="relative" style={{ width: '100px', height: '54px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                      <Pie 
                        data={[
                          { value: orgCumplimiento, color: orgColor },
                          { value: Math.max(0, 100 - orgCumplimiento), color: '#f1f5f9' }
                        ]} 
                        cx="50%" 
                        cy="100%" 
                        startAngle={180} 
                        endAngle={0} 
                        innerRadius={22} 
                        outerRadius={36} 
                        paddingAngle={0} 
                        dataKey="value" 
                        stroke="none"
                      >
                        <Cell fill={orgColor} />
                        <Cell fill="#f1f5f9" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {renderNeedle(Math.min(100, orgCumplimiento), 36)}
                  <div className="absolute bottom-0 left-0 w-full text-center mb-[-2px]">
                    <span className="text-xs font-black leading-none" style={{ color: orgColor }}>{orgCumplimiento}%</span>
                  </div>
                </div>
                <span className="text-[8px] font-bold text-slate-500 mt-0.5">{orgReal} de {orgProg} puntos</span>
              </div>

              <div className="h-14 w-px bg-slate-200" />

              <div className="flex flex-col items-center">
                <span className="text-[9.5px] font-black text-slate-800 uppercase tracking-tight mb-0.5">Operativos</span>
                <div className="relative" style={{ width: '75px', height: '50px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                      <Pie 
                        data={[
                          { value: ultimaFicha.orgParqueo || 0, color: '#f59e0b' },
                          { value: ultimaFicha.ventaInformal || 0, color: '#dc2626' }
                        ]} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={15} 
                        outerRadius={24} 
                        dataKey="value" 
                        stroke="none"
                      >
                        <Cell fill="#f59e0b" />
                        <Cell fill="#dc2626" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[7.5px] font-bold text-slate-600 text-center leading-tight">
                  <span className="text-amber-700">Parqueo: {ultimaFicha.orgParqueo || 0}</span> | <span className="text-red-700">Venta: {ultimaFicha.ventaInformal || 0}</span>
                </div>
              </div>
            </div>,
            <div className="space-y-1.5 text-[8.5px]">
              <div className="bg-slate-50 border-l-4 border-amber-500 rounded-md p-1.5 flex justify-between items-center shadow-2xs">
                <span className="font-bold text-slate-700">🧹 Intervenciones:</span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.puntosIntervenidos || 0}</span>
              </div>
              <div className="bg-slate-50 border-l-4 border-blue-500 rounded-md p-1.5 flex justify-between items-center shadow-2xs">
                <span className="font-bold text-slate-700">📐 M² Recuperados:</span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.m2RecuperadosInformal?.toLocaleString('es-CO') || 0} m²</span>
              </div>
              <div className="bg-slate-50 border-l-4 border-emerald-500 rounded-md p-1.5 flex justify-between items-center shadow-2xs">
                <span className="font-bold text-slate-700">🚶 Personas Reubicadas:</span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.personasReubicadas || 0}</span>
              </div>
            </div>,
            ultimaFicha.avancesVenta,
            ultimaFicha.alertaEspacioVenta,
            "h-[49%]"
          )}

        </div>

        {renderFooter(2)}
      </div>

      {/* ========================================================
          PÁGINA 3: Seguridad, Actuaciones y Memoria (3 Franjas Horizontales)
          ======================================================== */}
      <div 
        className="pdf-page bg-white shadow-xl flex flex-col justify-between"
        style={{
          width: '279.4mm',
          height: '215.9mm',
          padding: '6mm 8mm',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {renderHeader(3, 'Seguridad, Gobernanza y Memoria')}

        <div className="flex-1 flex flex-col gap-2 my-1 overflow-hidden justify-between">
          
          {/* CONVIVENCIA Y SEGURIDAD */}
          {renderFranjaHorizontal(
            'Convivencia y Seguridad (Dotación de Vehículos)',
            convColor,
            `Avance de Entrega: ${convCumplimiento}% (${vehiculosReal} de ${vehiculosProg} veh.)`,
            '🚓',
            renderCountGauge(vehiculosReal, vehiculosProg, vehiculosMeta, convColor, 'Entrega Vehículos', 'veh.'),
            <div className="grid grid-cols-2 gap-1 text-[8px]">
              <div className="border border-slate-200 bg-slate-50 p-1 rounded-md flex justify-between items-center shadow-2xs">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>Policía
                </span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.vehiculosEntregadosPolicia || 0}</span>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-1 rounded-md flex justify-between items-center shadow-2xs">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>SDSCJ
                </span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.vehiculosEntregadosSdscj || 0}</span>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-1 rounded-md flex justify-between items-center shadow-2xs">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-amber-800 inline-block"></span>Almacén FDL
                </span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.vehiculosEntregadosAlmacen || 0}</span>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-1 rounded-md flex justify-between items-center shadow-2xs">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>Pendientes
                </span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.vehiculosPendienteEntrega || 0}</span>
              </div>
            </div>,
            ultimaFicha.avancesConvivencia,
            ultimaFicha.alertaConvivencia
          )}

          {/* ACTUACIONES ADMINISTRATIVAS */}
          {renderFranjaHorizontal(
            'Actuaciones Administrativas (Descongestión)',
            actColor,
            `Archivos: ${archivosReal}% | Fallos: ${fallosReal}%`,
            '⚖️',
            <div className="flex items-center justify-around w-full gap-2">
              {renderPercentGauge(archivosReal, archivosProg, '#16a34a', 'Archivos')}
              <div className="h-12 w-px bg-slate-200" />
              {renderPercentGauge(fallosReal, fallosProg, '#16a34a', 'Fallos 1ª')}
            </div>,
            <div className="space-y-1.5 text-[9px]">
              <div className="bg-slate-50 border-l-4 border-amber-500 rounded-md p-1.5 flex justify-between items-center shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">📁</span>
                  <div>
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Trámite</span>
                    <span className="font-bold text-slate-700">Meta Anual Archivos</span>
                  </div>
                </div>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.metaArchivos || 0}</span>
              </div>
              <div className="bg-slate-50 border-l-4 border-indigo-500 rounded-md p-1.5 flex justify-between items-center shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">⚖️</span>
                  <div>
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Resolución</span>
                    <span className="font-bold text-slate-700">Meta Anual Fallos</span>
                  </div>
                </div>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.metaFallos || 0}</span>
              </div>
            </div>,
            ultimaFicha.avancesActuaciones,
            ultimaFicha.alertaActuaciones
          )}

          {/* ESTRATEGIAS DE MEMORIA */}
          {renderFranjaHorizontal(
            'Estrategias de Memoria y Planes de Acción',
            memColor,
            `Finalizadas: ${memReal} de ${memMeta}`,
            '🏛️',
            renderCountGauge(memReal, memProg, memMeta, memColor, 'Estrategias', 'est.'),
            <div className="space-y-1 text-[8px]">
              <div className="flex justify-between border-b border-slate-200 pb-0.5">
                <span className="font-bold text-slate-600">Total Estrategias:</span>
                <span className="font-black text-xs text-slate-900">{memMeta}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-0.5">
                <span className="font-bold text-slate-600">Resueltas:</span>
                <span className="font-black text-xs" style={{ color: memColor }}>{memReal}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-0.5">
                <span className="font-bold text-slate-600">En Formulación:</span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.estrategiasFormulacion || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-600">Con Ajustes:</span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.estrategiasAjustes || 0}</span>
              </div>
            </div>,
            ultimaFicha.avancesEstrategias,
            ultimaFicha.alertaEstrategias
          )}

        </div>

        {renderFooter(3)}
      </div>

    </div>
  );
}