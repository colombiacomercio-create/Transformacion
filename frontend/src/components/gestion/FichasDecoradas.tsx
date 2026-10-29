import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { LOGO_BOGOTA_BASE64, LOGO_SDG_BASE64 } from '../../utils/logos';

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
    if (pct < 80) return '#d97706'; // Naranja - En ejecución / moderado
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

  // Tacómetro Recharts con dimensiones fijas en píxeles para evitar colapsos
  const renderGauge = (real: number | undefined, prog: number | undefined, color: string, label?: string) => {
    const val = getAvancePct(real, prog);
    const data = [
      { value: val, color },
      { value: Math.max(0, 100 - val), color: '#f1f5f9' }
    ];
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
            <span className="text-base font-black leading-none" style={{ color }}>{val}%</span>
          </div>
        </div>
        {prog !== undefined && (
          <span className="text-[8.5px] font-bold text-slate-500 mt-0.5">
            Meta al corte: {prog}%
          </span>
        )}
      </div>
    );
  };

  // Parser de viñetas con limpieza de caracteres basura (□, •, -, etc.)
  const parseVinetas = (texto: string | null | undefined) => {
    if (!texto || !texto.trim()) {
      return <p className="text-[10px] text-slate-400 italic py-0.5">Sin avances registrados en el corte</p>;
    }
    const lineas = texto.split('\n').filter((l: string) => l.trim().length > 0);
    return (
      <ul className="list-disc pl-3.5 text-[10px] text-slate-900 space-y-1 font-normal">
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
        <span className="text-[9.5px] text-emerald-800 font-semibold flex items-center gap-1.5 py-0.5">
          <span className="text-emerald-600 font-bold">✓</span> Sin alertas activas en el corte
        </span>
      );
    }
    const lineas = texto.split('\n').filter((l: string) => l.trim().length > 0);
    return (
      <div className="space-y-1 text-[10px] text-slate-900 leading-snug font-normal">
        {lineas.map((l: string, i: number) => {
          const limpia = l.replace(/^[-*•\s\u25A0\u25A1\u25B6\u25CF]+\s*/, '');
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-amber-700 font-bold shrink-0 mt-0.5 text-xs">▪</span>
              <span>{limpia}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const parseListItems = (texto: string | null | undefined) => {
    if (!texto || !texto.trim()) return <span className="text-slate-400 italic text-[9px]">Ninguno</span>;
    const lineas = texto.split('\n').filter((l: string) => l.trim().length > 0);
    return (
      <ul className="list-disc pl-3 text-[9px] text-slate-800 space-y-0.5 font-normal">
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

  // Renderizador de Franja Horizontal (Alternativa 4: [Gráfico 28%] | [Cifras 24%] | [Avances y Alertas 48%])
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

    return (
      <div className={`w-full bg-white rounded-lg border border-slate-300 shadow-xs flex flex-col overflow-hidden ${customClass}`}>
        {/* Cabecera de la Franja */}
        <div 
          className="px-3 py-1 text-white font-black text-[11px] uppercase tracking-wide flex items-center justify-between shrink-0"
          style={{ backgroundColor: themeColor }}
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
            {title}
          </span>
          <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[9px] font-bold tracking-normal backdrop-blur-xs">
            {badgeText}
          </span>
        </div>

        {/* Contenido en 3 Columnas Horizontales */}
        <div className="flex-1 grid grid-cols-12 gap-3 p-2 items-stretch overflow-hidden">
          
          {/* Columna 1: Gráfico Visual Recharts (30% del ancho) */}
          <div className="col-span-3 border-r border-slate-200 pr-2 flex flex-col justify-center items-center">
            {graficoContent}
          </div>

          {/* Columna 2: Cifras y Métricas Clave (25% del ancho) */}
          <div className="col-span-3 border-r border-slate-200 pr-2 flex flex-col justify-center">
            {cifrasContent}
          </div>

          {/* Columna 3: Avances y Alertas (45% del ancho) */}
          <div className="col-span-6 flex flex-col gap-1.5 justify-between overflow-hidden">
            {/* Caja Avances */}
            <div className="bg-emerald-50/80 border border-emerald-300 rounded p-1.5 flex-1 overflow-auto">
              <div className="text-[9px] font-black text-emerald-950 flex items-center gap-1.5 mb-1 shrink-0 uppercase tracking-wide">
                <span className="text-emerald-600 font-bold">✓</span> AVANCES DEL CORTE
              </div>
              <div>{parseVinetas(avances)}</div>
            </div>

            {/* Caja Alertas */}
            <div className={`border rounded p-1.5 overflow-auto ${
              hasAlertas ? 'bg-amber-50/90 border-amber-300 flex-1' : 'bg-slate-50 border-slate-200 py-1'
            }`}>
              <div className={`text-[9px] font-black flex items-center gap-1.5 mb-0.5 shrink-0 uppercase tracking-wide ${
                hasAlertas ? 'text-amber-950' : 'text-slate-600'
              }`}>
                <span>{hasAlertas ? '⚠️' : '🛡️'}</span> ALERTAS
              </div>
              <div>{renderAlertasText(alertas)}</div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  // Cabecera institucional para Carta Horizontal (Landscape)
  const renderHeader = (numPagina: number, subtituloPagina: string) => {
    const fechaCorte = ultimaFicha?.periodo 
      ? new Date(ultimaFicha.periodo).toLocaleDateString('es-CO', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' })
      : 'Corte General';

    return (
      <div className="flex justify-between items-center pb-2 mb-2 border-b-2 border-red-600 shrink-0">
        <div className="flex items-center gap-3">
          <img src={LOGO_BOGOTA_BASE64} alt="Alcaldía Mayor de Bogotá" className="h-9 object-contain" />
          <div className="h-7 w-px bg-slate-300" />
          <img src={LOGO_SDG_BASE64} alt="Secretaría de Gobierno" className="h-8 object-contain" />
          <div className="ml-1 border-l pl-2 border-slate-300">
            <h1 className="text-xs font-black text-slate-900 tracking-tight uppercase leading-none">
              Transformación Local — Boletín de Resultados
            </h1>
            <p className="text-[10px] font-bold text-red-700 leading-tight">
              Unidad de Transformación · {subtituloPagina}
            </p>
            <p className="text-[8px] text-slate-600 font-semibold">
              SGL · Espacio Público · RADAR
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block bg-slate-100 text-slate-900 border border-slate-300 rounded px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider mb-0.5">
            FICHA DE RESULTADOS · TAMAÑO CARTA
          </div>
          <p className="text-[10px] font-black text-slate-800 leading-tight">Corte Oficial: {fechaCorte}</p>
          <p className="text-[8.5px] text-slate-500 font-medium">Página {numPagina} de 3 · Formato Apaisado (Landscape)</p>
        </div>
      </div>
    );
  };

  // Pie de página institucional
  const renderFooter = (numPagina: number) => (
    <div className="pt-1.5 mt-auto border-t border-slate-200 flex justify-between items-center text-[8.5px] text-slate-600 font-medium shrink-0">
      <span>Alcaldía Mayor de Bogotá D.C. · Secretaría Distrital de Gobierno · Unidad de Transformación</span>
      <span className="font-bold text-slate-800">Página {numPagina} de 3 · Formato Carta Apaisada (279.4 × 215.9 mm)</span>
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
        {renderHeader(1, 'Inversión Presupuestal, Obras Locales y Residuos')}

        <div className="flex-1 flex flex-col gap-2 my-1 overflow-hidden justify-between">
          
          {/* 1. EJECUCIÓN PRESUPUESTAL */}
          {renderFranjaHorizontal(
            '1. Ejecución del Plan de Desarrollo (Presupuesto)',
            ejecucionColor,
            `Compromisos: ${ultimaFicha.compromisosPct || 0}% | Giros: ${ultimaFicha.girosPct || 0}%`,
            <div className="flex items-center justify-around w-full gap-2">
              {renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, c1Color, 'Compromisos')}
              <div className="h-14 w-px bg-slate-200" />
              {renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, c2Color, 'Giros')}
            </div>,
            <div className="space-y-1.5 text-[9.5px]">
              <div className="bg-slate-50 border border-slate-200 rounded p-1.5 flex justify-between items-center">
                <span className="font-bold text-slate-600">Procesos Monitoreados:</span>
                <span className="font-black text-sm text-slate-900">{ultimaFicha.procesosMonitoreados || 0}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-1.5 flex justify-between items-center">
                <span className="font-bold text-slate-600">Requieren Comité:</span>
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
              <span className="text-[8.5px] font-bold text-slate-500 mt-0.5">
                Prog. al corte: {ultimaFicha.obrasProgramadasAlCorte || 0}
              </span>
            </div>,
            <div className="space-y-1 text-[8.5px]">
              <div className="grid grid-cols-3 gap-1 text-center border-b border-slate-200 pb-1 mb-1">
                <div><span className="text-slate-500 font-bold block text-[8px]">META</span><span className="font-black text-xs text-slate-900">{ultimaFicha.metaObras || 0}</span></div>
                <div><span className="text-slate-500 font-bold block text-[8px]">PROG.</span><span className="font-black text-xs text-slate-900">{ultimaFicha.obrasProgramadasAlCorte || 0}</span></div>
                <div><span className="text-slate-500 font-bold block text-[8px]">REAL</span><span className="font-black text-xs" style={{ color: obrasColor }}>{ultimaFicha.intervencionesFinalizadas || 0}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[8px]">
                <div className="border border-slate-200 bg-slate-50 px-1 py-0.5 rounded flex justify-between"><span>Malla Vial</span><b>{ultimaFicha.obrasMallaVial || 0}</b></div>
                <div className="border border-slate-200 bg-slate-50 px-1 py-0.5 rounded flex justify-between"><span>Esp. Público</span><b>{ultimaFicha.obrasEspacioPublico || 0}</b></div>
                <div className="border border-slate-200 bg-slate-50 px-1 py-0.5 rounded flex justify-between"><span>Vivienda Rural</span><b>{ultimaFicha.obrasViviendaRural || 0}</b></div>
                <div className="border border-slate-200 bg-slate-50 px-1 py-0.5 rounded flex justify-between"><span>Parques</span><b>{ultimaFicha.obrasParque || 0}</b></div>
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
              <span className="text-[8.5px] font-bold text-slate-500 mt-0.5">
                {ultimaFicha.puntosSostenidos || 0} de {ultimaFicha.puntosCriticosPriorizados || 0} puntos
              </span>
            </div>,
            <div className="space-y-1.5 text-[9px]">
              <div className="bg-slate-50 border border-slate-200 rounded p-1 flex justify-between items-center">
                <span className="font-bold text-slate-600">Personas Sensibilizadas:</span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.personasSensibilizadas?.toLocaleString('es-CO') || 0}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-1 flex justify-between items-center">
                <span className="font-bold text-slate-600">Operativos IVC:</span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.operativosIVC || 0}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-1 flex justify-between items-center">
                <span className="font-bold text-slate-600">Intervenciones Reportadas:</span>
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
        {renderHeader(2, 'Rollos Legendarios y Organización del Espacio Público')}

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
              <div className="flex justify-around w-full text-[9px] font-bold mt-1">
                <span className="text-slate-600">Total: {ultimaFicha.totalRollos || 0}</span>
                <span className="text-red-700">Resueltos: {ultimaFicha.rollosResueltos || 0}</span>
              </div>
            </div>,
            <div className="flex flex-col gap-1 text-[8.5px]">
              <div className="border border-green-300 bg-green-50/60 rounded p-1">
                <span className="font-black text-green-900 block text-[8px] uppercase">✓ Desenrollados</span>
                {parseListItems(ultimaFicha.rollosDesenrolladosLista)}
              </div>
              <div className="border border-yellow-300 bg-yellow-50/60 rounded p-1">
                <span className="font-black text-yellow-900 block text-[8px] uppercase">⏳ En Curso</span>
                {parseListItems(ultimaFicha.rollosDesenrollandoseLista)}
              </div>
              <div className="border border-red-300 bg-red-50/60 rounded p-1">
                <span className="font-black text-red-900 block text-[8px] uppercase">✕ Sin Desenrollar</span>
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
            <div className="space-y-1.5 text-[9px]">
              <div className="bg-slate-50 border border-slate-200 rounded p-1 flex justify-between items-center">
                <span className="font-bold text-slate-600">Intervenciones:</span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.puntosIntervenidos || 0}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-1 flex justify-between items-center">
                <span className="font-bold text-slate-600">M² Recuperados:</span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.m2RecuperadosInformal?.toLocaleString('es-CO') || 0} m²</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-1 flex justify-between items-center">
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
        {renderHeader(3, 'Seguridad, Actuaciones Administrativas y Memoria')}

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
              <span className="text-[8.5px] font-bold text-slate-500 mt-0.5">
                Meta Total: {ultimaFicha.vehiculosMetaTotal || 0} veh.
              </span>
            </div>,
            <div className="grid grid-cols-2 gap-1 text-[8.5px]">
              <div className="border border-slate-200 bg-slate-50 p-1 rounded flex justify-between items-center">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>Policía
                </span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.vehiculosEntregadosPolicia || 0}</span>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-1 rounded flex justify-between items-center">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>SDSCJ
                </span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.vehiculosEntregadosSdscj || 0}</span>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-1 rounded flex justify-between items-center">
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-amber-800 inline-block"></span>Almacén FDL
                </span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.vehiculosEntregadosAlmacen || 0}</span>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-1 rounded flex justify-between items-center">
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
              <div className="h-14 w-px bg-slate-200" />
              {renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, actColor, 'Fallos 1ª')}
            </div>,
            <div className="space-y-1.5 text-[9.5px]">
              <div className="bg-slate-50 border border-slate-200 rounded p-1.5 flex justify-between items-center">
                <span className="font-bold text-slate-600">Meta Anual Archivos:</span>
                <span className="font-black text-xs text-slate-900">{ultimaFicha.metaArchivos || 0}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-1.5 flex justify-between items-center">
                <span className="font-bold text-slate-600">Meta Anual Fallos:</span>
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
              <span className="text-[8.5px] font-bold text-slate-500 mt-0.5">
                Total: {ultimaFicha.estrategiasTotal || 0}
              </span>
            </div>,
            <div className="space-y-1 text-[8.5px]">
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
