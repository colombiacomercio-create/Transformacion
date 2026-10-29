import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { LOGO_BOGOTA_BASE64, LOGO_SDG_BASE64, LOGO_RADAR_BASE64 } from '../../utils/logos';

interface Props {
  ultimaFicha: any;
}

export default function FichasDecoradas({ ultimaFicha }: Props) {
  if (!ultimaFicha) return null;

  // Helpers de color semántico según porcentaje de avance real vs programado
  const getColor = (real: number | undefined, prog: number | undefined): string => {
    if (!prog || prog === 0) return '#64748b'; // Slate neutro si no hay meta
    const pct = ((real || 0) / prog) * 100;
    if (pct < 50) return '#dc2626'; // Rojo - Rezago crítico
    if (pct < 80) return '#d97706'; // Naranja - En proceso
    return '#16a34a'; // Verde - Cumplido o sobre meta
  };

  const getAvancePct = (real: number | undefined, prog: number | undefined): number => {
    if (!prog || prog === 0) return 0;
    return Math.round(((real || 0) / prog) * 100);
  };

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
          height: `${radius + 3}px`,
          transformOrigin: 'bottom center', 
          transform: `translateX(-50%) rotate(${rotateDeg}deg)`,
          borderLeft: '2px dashed #0f172a'
        }}
      />
    );
  };

  // Tacómetro Recharts con dimensiones fijas para evitar colapsos y diseño tipo infografía
  const renderGauge = (real: number | undefined, prog: number | undefined, color: string, label?: string) => {
    const val = getAvancePct(real, prog);
    const data = [
      { value: val, color },
      { value: Math.max(0, 100 - val), color: '#f1f5f9' }
    ];

    const statusBadge = val >= 80 
      ? { text: 'Meta Cumplida', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
      : val >= 50
      ? { text: 'En Proceso', bg: 'bg-amber-100 text-amber-800 border-amber-300' }
      : { text: 'En Rezago', bg: 'bg-red-100 text-red-800 border-red-300' };

    return (
      <div className="flex flex-col items-center justify-center">
        {label && <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight mb-0.5">{label}</span>}
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
          {renderNeedle(Math.min(100, prog ?? 0), 45)}
          <div className="absolute bottom-0 left-0 w-full text-center mb-[-3px]">
            <span className="text-lg font-black leading-none" style={{ color }}>{val}%</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full border ${statusBadge.bg}`}>
            {statusBadge.text}
          </span>
          {prog !== undefined && (
            <span className="text-[8px] font-semibold text-slate-500">
              Meta: {prog}%
            </span>
          )}
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

  // Colores dinámicos por temática según el nivel de avance real
  const c1Color = getColor(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct);
  const c2Color = getColor(ultimaFicha.girosPct, ultimaFicha.metaGirosPct);
  const ejecucionColor = (c1Color === '#dc2626' || c2Color === '#dc2626') ? '#dc2626' : (c1Color === '#d97706' || c2Color === '#d97706') ? '#d97706' : '#16a34a';

  const obrasAvancePct = getAvancePct(ultimaFicha.intervencionesFinalizadas, ultimaFicha.obrasProgramadasAlCorte);
  const obrasColor = obrasAvancePct < 50 ? '#dc2626' : obrasAvancePct < 80 ? '#d97706' : '#16a34a';

  const rollosAvancePct = getAvancePct(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte);
  const rollosColor = rollosAvancePct < 50 ? '#dc2626' : rollosAvancePct < 80 ? '#d97706' : '#16a34a';

  const residAvancePct = getAvancePct(ultimaFicha.puntosSostenidos, ultimaFicha.puntosSostenidosProgramados);
  const residColor = residAvancePct < 50 ? '#dc2626' : residAvancePct < 80 ? '#d97706' : '#16a34a';

  const orgAvancePct = getAvancePct(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad);
  const orgColor = orgAvancePct < 50 ? '#dc2626' : orgAvancePct < 80 ? '#d97706' : '#16a34a';

  const actColor = getColor(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte);

  const vehiculosReal = (ultimaFicha.vehiculosEntregadosPolicia || 0) + (ultimaFicha.vehiculosEntregadosSdscj || 0);
  const convAvancePct = getAvancePct(vehiculosReal, ultimaFicha.vehiculosProgramadosCorte);
  const convColor = convAvancePct < 50 ? '#dc2626' : convAvancePct < 80 ? '#d97706' : '#16a34a';

  const memAvancePct = getAvancePct(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte || ultimaFicha.estrategiasTotal);
  const memColor = memAvancePct < 50 ? '#dc2626' : memAvancePct < 80 ? '#d97706' : '#16a34a';

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
        {/* Cabecera Infográfica con gradiente vibrante y badge flotante */}
        <div className={`px-3 py-1 bg-gradient-to-r ${gradient} text-white font-black text-[11px] uppercase tracking-wide flex items-center justify-between shrink-0 shadow-xs`}>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white/90 inline-block shadow-xs"></span>
            {title}
          </span>
          <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[8.5px] font-bold tracking-tight backdrop-blur-xs border border-white/25">
            {badgeText}
          </span>
        </div>

        {/* Contenido en 3 Columnas Horizontales */}
        <div className="flex-1 grid grid-cols-12 gap-2.5 p-2 items-stretch overflow-hidden">
          
          {/* Columna 1: Gráfico Visual Recharts (30% del ancho) */}
          <div className="col-span-3 bg-slate-50/70 border-r border-slate-200/80 pr-2 rounded-l-lg flex flex-col justify-center items-center">
            {graficoContent}
          </div>

          {/* Columna 2: Cifras y Métricas Clave (24% del ancho) */}
          <div className="col-span-3 border-r border-slate-200/80 pr-2 flex flex-col justify-center">
            {cifrasContent}
          </div>

          {/* Columna 3: Avances y Alertas estilo Infografía (46% del ancho) */}
          <div className="col-span-6 flex flex-col gap-1.5 justify-between overflow-hidden">
            {/* Tarjeta de Avances */}
            <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/50 border border-emerald-200/90 rounded-lg p-1.5 flex-1 overflow-auto shadow-2xs">
              <div className="text-[8.5px] font-black text-emerald-950 flex items-center gap-1 mb-0.5 shrink-0 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                PRINCIPALES AVANCES DEL CORTE
              </div>
              <div>{parseVinetas(avances)}</div>
            </div>

            {/* Tarjeta de Alertas */}
            <div className={`border rounded-lg p-1.5 overflow-auto shadow-2xs ${
              hasAlertas 
                ? 'bg-gradient-to-r from-amber-50/90 to-orange-50/50 border-amber-200/90 flex-1' 
                : 'bg-slate-50/80 border-slate-200/80 py-0.5'
            }`}>
              <div className={`text-[8.5px] font-black flex items-center gap-1 mb-0.5 shrink-0 uppercase tracking-wider ${
                hasAlertas ? 'text-amber-950' : 'text-slate-600'
              }`}>
                <span>{hasAlertas ? '⚠️' : '🛡️'}</span> ALERTAS & CONDICIONANTES
              </div>
              <div>{renderAlertasText(alertas)}</div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  // Cabecera institucional oficial Alcaldía de Bogotá + Secretaría de Gobierno + RADAR
  const renderHeader = (numPagina: number, subtituloPagina: string) => {
    const fechaCorte = ultimaFicha?.periodo 
      ? new Date(ultimaFicha.periodo).toLocaleDateString('es-CO', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' })
      : 'Corte General';

    return (
      <div className="flex justify-between items-center pb-2 mb-1.5 border-b-2 border-red-600 shrink-0">
        <div className="flex items-center gap-2.5">
          <img src={LOGO_BOGOTA_BASE64} alt="Alcaldía Mayor de Bogotá" className="h-9 object-contain" />
          <div className="h-7 w-px bg-slate-200" />
          <img src={LOGO_SDG_BASE64} alt="Secretaría de Gobierno" className="h-8 object-contain" />
          <div className="h-7 w-px bg-slate-200" />
          <img src={LOGO_RADAR_BASE64} alt="RADAR" className="h-7 object-contain" />
          <div className="ml-0.5 border-l pl-2 border-slate-200">
            <h1 className="text-[11px] font-black text-slate-900 tracking-tight uppercase leading-none">
              ALCALDÍA MAYOR DE BOGOTÁ
            </h1>
            <p className="text-[9.5px] font-bold text-red-700 leading-tight">
              Secretaría de Gobierno · Unidad de Transformación
            </p>
            <p className="text-[8px] text-slate-600 font-extrabold uppercase tracking-widest">
              RADAR
            </p>
          </div>
        </div>

        {/* Título Central Infográfico */}
        <div className="text-center">
          <div className="text-xs font-black uppercase tracking-wide text-slate-900">
            Boletín Ejecutivo de Resultados y Seguimiento
          </div>
          <span className="inline-block bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-0.2 text-[8px] font-bold uppercase tracking-wider mt-0.5">
            {subtituloPagina}
          </span>
        </div>

        {/* Bloque Derecho: Fecha y Paginación limpia */}
        <div className="text-right">
          <div className="inline-block bg-slate-100 text-slate-800 border border-slate-200 rounded-md px-2 py-0.5 text-[8.5px] font-bold">
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
        {renderHeader(1, 'Eje 1: Inversión, Infraestructura y Residuos')}

        <div className="flex-1 flex flex-col gap-2 my-1 overflow-hidden justify-between">
          
          {/* 1. EJECUCIÓN PRESUPUESTAL */}
          {renderFranjaHorizontal(
            '1. Ejecución del Plan de Desarrollo (Presupuesto)',
            ejecucionColor,
            `Compromisos: ${ultimaFicha.compromisosPct || 0}% | Giros: ${ultimaFicha.girosPct || 0}%`,
            <div className="flex items-center justify-around w-full gap-2">
              {renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, c1Color, 'Compromisos')}
              <div className="h-12 w-px bg-slate-200" />
              {renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, c2Color, 'Giros')}
            </div>,
            <div className="space-y-1.5 text-[9px]">
              <div className="bg-slate-50 border-l-3 border-indigo-500 rounded p-1.5 flex justify-between items-center shadow-2xs">
                <div>
                  <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Monitoreo</span>
                  <span className="font-bold text-slate-700">Procesos Monitoreados</span>
                </div>
                <span className="font-black text-sm text-slate-900">{ultimaFicha.procesosMonitoreados || 0}</span>
              </div>
              <div className="bg-slate-50 border-l-3 border-red-500 rounded p-1.5 flex justify-between items-center shadow-2xs">
                <div>
                  <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Atención Requerida</span>
                  <span className="font-bold text-slate-700">Requieren Comité</span>
                </div>
                <span className="font-black text-sm text-red-600">{ultimaFicha.procesosRequierenComite || 0}</span>
              </div>
            </div>,
            ultimaFicha.avancesEjecucion,
            ultimaFicha.alertaEjecucion
          )}

          {/* 2. OBRAS LOCALES */}
          {renderFranjaHorizontal(
            '2. Obras Locales (Intervenciones en Territorio)',
            obrasColor,
            `Cumplimiento: ${obrasAvancePct}% (${ultimaFicha.intervencionesFinalizadas || 0} finalizadas)`,
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight mb-0.5">Avance de Obras</span>
              <div className="relative" style={{ width: '120px', height: '64px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                    <Pie 
                      data={[
                        { value: obrasAvancePct, color: obrasColor },
                        { value: Math.max(0, 100 - obrasAvancePct), color: '#f1f5f9' }
                      ]} 
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
                      <Cell fill={obrasColor} />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {renderNeedle(Math.min(100, obrasAvancePct), 45)}
                <div className="absolute bottom-0 left-0 w-full text-center mb-[-3px]">
                  <span className="text-base font-black leading-none" style={{ color: obrasColor }}>{obrasAvancePct}%</span>
                </div>
              </div>
              <span className="text-[8px] font-bold text-slate-500 mt-0.5">
                Prog. al corte: {ultimaFicha.obrasProgramadasAlCorte || 0}
              </span>
            </div>,
            <div className="space-y-1 text-[8px]">
              <div className="grid grid-cols-3 gap-1 text-center border-b border-slate-200 pb-1 mb-1">
                <div className="bg-slate-50 p-1 rounded"><span className="text-slate-500 font-bold block text-[7.5px] uppercase">META</span><span className="font-black text-xs text-slate-900">{ultimaFicha.metaObras || 0}</span></div>
                <div className="bg-slate-50 p-1 rounded"><span className="text-slate-500 font-bold block text-[7.5px] uppercase">PROG.</span><span className="font-black text-xs text-slate-900">{ultimaFicha.obrasProgramadasAlCorte || 0}</span></div>
                <div className="bg-emerald-50 p-1 rounded border border-emerald-200"><span className="text-emerald-800 font-bold block text-[7.5px] uppercase">FINAL</span><span className="font-black text-xs" style={{ color: obrasColor }}>{ultimaFicha.intervencionesFinalizadas || 0}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[8px]">
                <div className="border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded flex justify-between items-center"><span>🛣️ Malla Vial</span><b>{ultimaFicha.obrasMallaVial || 0}</b></div>
                <div className="border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded flex justify-between items-center"><span>🏛️ Esp. Público</span><b>{ultimaFicha.obrasEspacioPublico || 0}</b></div>
                <div className="border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded flex justify-between items-center"><span>🏠 Viv. Rural</span><b>{ultimaFicha.obrasViviendaRural || 0}</b></div>
                <div className="border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded flex justify-between items-center"><span>🌳 Parques</span><b>{ultimaFicha.obrasParque || 0}</b></div>
              </div>
            </div>,
            ultimaFicha.avancesObras,
            ultimaFicha.alertaObras
          )}

          {/* 3. ESPACIO PÚBLICO - RESIDUOS */}
          {renderFranjaHorizontal(
            '3. Espacio Público — Residuos y Puntos Críticos',
            residColor,
            `Puntos sostenidos: ${ultimaFicha.puntosSostenidos || 0} de ${ultimaFicha.puntosCriticosPriorizados || 0} priorizados`,
            <div className="flex flex-col items-center justify-center w-full">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight mb-0.5">Sostenimiento de Puntos</span>
              <div className="relative" style={{ width: '120px', height: '64px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                    <Pie 
                      data={[
                        { value: residAvancePct, color: residColor },
                        { value: Math.max(0, 100 - residAvancePct), color: '#f1f5f9' }
                      ]} 
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
                      <Cell fill={residColor} />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {renderNeedle(Math.min(100, residAvancePct), 45)}
                <div className="absolute bottom-0 left-0 w-full text-center mb-[-3px]">
                  <span className="text-base font-black leading-none" style={{ color: residColor }}>{residAvancePct}%</span>
                </div>
              </div>
              <span className="text-[8px] font-bold text-slate-500 mt-0.5">
                {ultimaFicha.puntosSostenidos || 0} de {ultimaFicha.puntosCriticosPriorizados || 0} puntos
              </span>
            </div>,
            <div className="space-y-1 text-[8.5px]">
              <div className="bg-slate-50 border-l-3 border-amber-500 rounded p-1 flex justify-between items-center shadow-2xs">
                <div>
                  <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Sensibilización</span>
                  <span className="font-bold text-slate-700">👥 Personas</span>
                </div>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.personasSensibilizadas?.toLocaleString('es-CO') || 0}</span>
              </div>
              <div className="bg-slate-50 border-l-3 border-blue-500 rounded p-1 flex justify-between items-center shadow-2xs">
                <div>
                  <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Vigilancia</span>
                  <span className="font-bold text-slate-700">🛡️ Operativos IVC</span>
                </div>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.operativosIVC || 0}</span>
              </div>
              <div className="bg-slate-50 border-l-3 border-emerald-500 rounded p-1 flex justify-between items-center shadow-2xs">
                <div>
                  <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Ejecución</span>
                  <span className="font-bold text-slate-700">🧹 Intervenciones</span>
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
        {renderHeader(2, 'Eje 2: Rollos Legendarios y Recuperación del Espacio Público')}

        <div className="flex-1 flex flex-col gap-2.5 my-1 overflow-hidden justify-between">

          {/* 4. ROLLOS LEGENDARIOS (Franja amplia con 3 columnas de localidades y todos los avances) */}
          {renderFranjaHorizontal(
            '4. Rollos Legendarios (Desenrollando la Ciudad)',
            rollosColor,
            `Total: ${ultimaFicha.totalRollos || 0} | Prog. corte: ${ultimaFicha.rollosProgramadosAlCorte || 0} | Resueltos: ${ultimaFicha.rollosResueltos || 0}`,
            <div className="flex flex-col items-center justify-center w-full">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight mb-1">Efectividad Rollos</span>
              <div className="relative" style={{ width: '120px', height: '64px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                    <Pie 
                      data={[
                        { value: rollosAvancePct, color: rollosColor },
                        { value: Math.max(0, 100 - rollosAvancePct), color: '#f1f5f9' }
                      ]} 
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
                      <Cell fill={rollosColor} />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {renderNeedle(Math.min(100, rollosAvancePct), 45)}
                <div className="absolute bottom-0 left-0 w-full text-center mb-[-3px]">
                  <span className="text-base font-black leading-none" style={{ color: rollosColor }}>{rollosAvancePct}%</span>
                </div>
              </div>
              <div className="flex justify-around w-full text-[8.5px] font-bold mt-1">
                <span className="text-slate-600">Total: {ultimaFicha.totalRollos || 0}</span>
                <span className="text-red-700">Resueltos: {ultimaFicha.rollosResueltos || 0}</span>
              </div>
            </div>,
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

          {/* 5. ORGANIZACIÓN ESPACIO PÚBLICO (Venta Informal) */}
          {renderFranjaHorizontal(
            '5. Organización del Espacio Público y Venta Informal',
            orgColor,
            `Sostenibilidad: ${orgAvancePct}% (${ultimaFicha.puntosSostenibilidadEfectiva || 0} de ${ultimaFicha.puntosVerificados || 0} puntos)`,
            <div className="flex items-center justify-around w-full gap-2">
              <div className="flex flex-col items-center">
                <span className="text-[9.5px] font-black text-slate-800 uppercase tracking-tight mb-0.5">Sostenibilidad</span>
                <div className="relative" style={{ width: '100px', height: '54px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                      <Pie 
                        data={[
                          { value: orgAvancePct, color: orgColor },
                          { value: Math.max(0, 100 - orgAvancePct), color: '#f1f5f9' }
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
                  {renderNeedle(Math.min(100, orgAvancePct), 36)}
                  <div className="absolute bottom-0 left-0 w-full text-center mb-[-2px]">
                    <span className="text-xs font-black leading-none" style={{ color: orgColor }}>{orgAvancePct}%</span>
                  </div>
                </div>
                <span className="text-[8px] font-bold text-slate-500 mt-0.5">{ultimaFicha.puntosSostenibilidadEfectiva || 0} puntos</span>
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
              <div className="bg-slate-50 border-l-3 border-amber-500 rounded p-1 flex justify-between items-center shadow-2xs">
                <span className="font-bold text-slate-600">Intervenciones:</span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.puntosIntervenidos || 0}</span>
              </div>
              <div className="bg-slate-50 border-l-3 border-blue-500 rounded p-1 flex justify-between items-center shadow-2xs">
                <span className="font-bold text-slate-600">M² Recuperados:</span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.m2RecuperadosInformal?.toLocaleString('es-CO') || 0} m²</span>
              </div>
              <div className="bg-slate-50 border-l-3 border-emerald-500 rounded p-1 flex justify-between items-center shadow-2xs">
                <span className="font-bold text-slate-600">Personas Reubicadas:</span>
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
        {renderHeader(3, 'Eje 3: Seguridad, Gobernanza y Memoria')}

        <div className="flex-1 flex flex-col gap-2 my-1 overflow-hidden justify-between">
          
          {/* 6. CONVIVENCIA Y SEGURIDAD */}
          {renderFranjaHorizontal(
            '6. Convivencia y Seguridad (Dotación de Vehículos)',
            convColor,
            `Avance de Entrega: ${convAvancePct}% (${vehiculosReal} de ${ultimaFicha.vehiculosProgramadosCorte || ultimaFicha.vehiculosMetaTotal || 0} veh.)`,
            <div className="flex flex-col items-center justify-center w-full">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight mb-0.5">Avance Entregas</span>
              <div className="relative" style={{ width: '120px', height: '64px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                    <Pie 
                      data={[
                        { value: convAvancePct, color: convColor },
                        { value: Math.max(0, 100 - convAvancePct), color: '#f1f5f9' }
                      ]} 
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
                      <Cell fill={convColor} />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {renderNeedle(Math.min(100, convAvancePct), 45)}
                <div className="absolute bottom-0 left-0 w-full text-center mb-[-3px]">
                  <span className="text-base font-black leading-none" style={{ color: convColor }}>{convAvancePct}%</span>
                </div>
              </div>
              <span className="text-[8px] font-bold text-slate-500 mt-0.5">
                Meta Total: {ultimaFicha.vehiculosMetaTotal || 0} veh.
              </span>
            </div>,
            <div className="grid grid-cols-2 gap-1 text-[8px]">
              <div className="border border-slate-200 bg-slate-50 p-1 rounded flex justify-between items-center shadow-2xs">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>Policía
                </span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.vehiculosEntregadosPolicia || 0}</span>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-1 rounded flex justify-between items-center shadow-2xs">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>SDSCJ
                </span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.vehiculosEntregadosSdscj || 0}</span>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-1 rounded flex justify-between items-center shadow-2xs">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-amber-800 inline-block"></span>Almacén FDL
                </span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.vehiculosEntregadosAlmacen || 0}</span>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-1 rounded flex justify-between items-center shadow-2xs">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>Pendientes
                </span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.vehiculosPendienteEntrega || 0}</span>
              </div>
            </div>,
            ultimaFicha.avancesConvivencia,
            ultimaFicha.alertaConvivencia
          )}

          {/* 7. ACTUACIONES ADMINISTRATIVAS */}
          {renderFranjaHorizontal(
            '7. Actuaciones Administrativas (Descongestión)',
            actColor,
            `Archivos: ${ultimaFicha.archivosPct || 0}% | Fallos: ${ultimaFicha.fallosPrimeraEstanciaPct || 0}%`,
            <div className="flex items-center justify-around w-full gap-2">
              {renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, actColor, 'Archivos')}
              <div className="h-12 w-px bg-slate-200" />
              {renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, actColor, 'Fallos 1ª')}
            </div>,
            <div className="space-y-1.5 text-[9px]">
              <div className="bg-slate-50 border-l-3 border-amber-500 rounded p-1.5 flex justify-between items-center shadow-2xs">
                <div>
                  <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Trámite</span>
                  <span className="font-bold text-slate-700">Meta Anual Archivos</span>
                </div>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.metaArchivos || 0}</span>
              </div>
              <div className="bg-slate-50 border-l-3 border-indigo-500 rounded p-1.5 flex justify-between items-center shadow-2xs">
                <div>
                  <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Resolución</span>
                  <span className="font-bold text-slate-700">Meta Anual Fallos</span>
                </div>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.metaFallos || 0}</span>
              </div>
            </div>,
            ultimaFicha.avancesActuaciones,
            ultimaFicha.alertaActuaciones
          )}

          {/* 8. ESTRATEGIAS DE MEMORIA */}
          {renderFranjaHorizontal(
            '8. Estrategias de Memoria Institucional',
            memColor,
            `Finalizadas: ${ultimaFicha.estrategiasResueltas || 0} de ${ultimaFicha.estrategiasTotal || 0}`,
            <div className="flex flex-col items-center justify-center w-full">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight mb-0.5">Estrategias Resueltas</span>
              <div className="relative" style={{ width: '120px', height: '64px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                    <Pie 
                      data={[
                        { value: memAvancePct, color: memColor },
                        { value: Math.max(0, 100 - memAvancePct), color: '#f1f5f9' }
                      ]} 
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
                      <Cell fill={memColor} />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {renderNeedle(Math.min(100, memAvancePct), 45)}
                <div className="absolute bottom-0 left-0 w-full text-center mb-[-3px]">
                  <span className="text-base font-black leading-none" style={{ color: memColor }}>{memAvancePct}%</span>
                </div>
              </div>
              <span className="text-[8px] font-bold text-slate-500 mt-0.5">
                Total: {ultimaFicha.estrategiasTotal || 0}
              </span>
            </div>,
            <div className="space-y-1 text-[8px]">
              <div className="flex justify-between border-b border-slate-200 pb-0.5">
                <span className="font-bold text-slate-600">Total Estrategias:</span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.estrategiasTotal || 0}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-0.5">
                <span className="font-bold text-slate-600">Resueltas:</span>
                <span className="font-black text-xs" style={{ color: memColor }}>{ultimaFicha.estrategiasResueltas || 0}</span>
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
