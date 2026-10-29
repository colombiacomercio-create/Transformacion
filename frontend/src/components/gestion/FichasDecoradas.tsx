import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { LOGO_BOGOTA_BASE64, LOGO_SDG_BASE64 } from '../../utils/logos';

interface Props {
  ultimaFicha: any;
}

export default function FichasDecoradas({ ultimaFicha }: Props) {
  if (!ultimaFicha) return null;

  // Helpers de color y cálculo de avance
  const getColor = (real: number | undefined, prog: number | undefined): string => {
    if (!prog || prog === 0) return '#e5e7eb';
    const pct = ((real || 0) / prog) * 100;
    if (pct < 50) return '#dc2626'; // Rojo
    if (pct < 80) return '#d97706'; // Naranja
    return '#16a34a'; // Verde
  };

  const getAvancePct = (real: number | undefined, prog: number | undefined): number => {
    if (!prog || prog === 0) return 0;
    return Math.round(((real || 0) / prog) * 100);
  };

  const renderNeedle = (pct: number = 0, radius: number = 48) => {
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
          borderLeft: '2px dashed #1e293b'
        }}
      />
    );
  };

  const parseVinetas = (texto: string | null | undefined) => {
    if (!texto || !texto.trim()) {
      return <p className="text-[9.5px] text-gray-400 italic py-0.5">Sin avances registrados en el corte</p>;
    }
    const lineas = texto.split('\n').filter((l: string) => l.trim().length > 0);
    return (
      <ul className="list-disc pl-3 text-[9.5px] text-gray-700 space-y-0.5">
        {lineas.slice(0, 5).map((l: string, i: number) => (
          <li key={i} className="leading-tight">{l.replace(/^[-*•]\s*/, '')}</li>
        ))}
      </ul>
    );
  };

  const parseListItems = (texto: string | null | undefined) => {
    if (!texto || !texto.trim()) return <span className="text-gray-400 italic text-[8.5px]">Ninguno</span>;
    const lineas = texto.split('\n').filter((l: string) => l.trim().length > 0);
    return (
      <ul className="list-disc pl-2.5 text-[8.5px] text-gray-700 space-y-0.5">
        {lineas.slice(0, 4).map((l: string, i: number) => (
          <li key={i} className="leading-tight">{l.replace(/^[-*•]\s*/, '')}</li>
        ))}
      </ul>
    );
  };

  // Renderizador unificado de tarjeta con Opción 1: Avances y Alertas en 2 Columnas
  const renderCard = (
    title: string, 
    color: string, 
    children: React.ReactNode, 
    avances: string | null | undefined, 
    alertas: string | null | undefined
  ) => {
    const hasAvances = !!(avances && avances.trim().length > 0);
    const hasAlertas = !!(alertas && alertas.trim().length > 0);

    return (
      <div 
        className="rounded-lg overflow-hidden border border-slate-200 bg-white flex flex-col shadow-xs" 
        style={{ breakInside: 'avoid' }}
      >
        <div 
          className="text-white font-bold text-[11px] py-1 px-2.5 uppercase tracking-wide flex items-center justify-between" 
          style={{ backgroundColor: color }}
        >
          <span className="truncate">{title}</span>
        </div>

        <div className="p-2 flex flex-col flex-1 justify-between bg-white">
          <div className="flex-1 pb-1">
            {children}
          </div>
          
          {/* Opción 1: Avances y Alertas lado a lado en 2 columnas al pie de la caja */}
          <div className="grid grid-cols-2 gap-1.5 mt-1.5 pt-1.5 border-t border-slate-100">
            {/* Columna Avances */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded p-1.5 flex flex-col justify-between min-h-[50px] max-h-[75px] overflow-hidden">
              <div className="text-[8.5px] font-bold text-emerald-800 flex items-center gap-1 mb-0.5 shrink-0">
                <span className="text-emerald-600">✓</span> AVANCES DEL CORTE
              </div>
              <div className="flex-1 overflow-hidden">
                {hasAvances ? (
                  parseVinetas(avances)
                ) : (
                  <span className="text-[9px] text-slate-400 italic">Sin avances reportados</span>
                )}
              </div>
            </div>

            {/* Columna Alertas */}
            <div className={`border rounded p-1.5 flex flex-col justify-between min-h-[50px] max-h-[75px] overflow-hidden ${
              hasAlertas 
                ? 'bg-amber-50/70 border-amber-300' 
                : 'bg-slate-50/70 border-slate-200'
            }`}>
              <div className={`text-[8.5px] font-bold flex items-center gap-1 mb-0.5 shrink-0 ${
                hasAlertas ? 'text-amber-800' : 'text-slate-600'
              }`}>
                <span>{hasAlertas ? '⚠️' : '🛡️'}</span> ALERTAS
              </div>
              <div className="flex-1 overflow-hidden">
                {hasAlertas ? (
                  <p className="text-[9.5px] text-amber-950 leading-tight whitespace-pre-wrap line-clamp-3">
                    {alertas}
                  </p>
                ) : (
                  <span className="text-[9px] text-emerald-700 italic flex items-center gap-1">
                    ✓ Sin alertas activas
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tacómetro Recharts
  const renderGauge = (real: number | undefined, prog: number | undefined, color: string) => {
    const val = getAvancePct(real, prog);
    const data = [
      { value: val, color },
      { value: Math.max(0, 100 - val), color: '#e5e7eb' }
    ];
    return (
      <div className="relative h-16 w-28 mx-auto mt-0.5">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
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
        <div className="absolute bottom-0 left-0 w-full text-center mb-[-4px]">
           <span className="text-base font-black leading-none" style={{ color }}>{val}%</span>
        </div>
      </div>
    );
  };

  // Paleta institucional por temática
  const c1Color = getColor(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct);
  const c2Color = getColor(ultimaFicha.girosPct, ultimaFicha.metaGirosPct);
  const ejecucionColor = (c1Color === '#dc2626' || c2Color === '#dc2626') ? '#dc2626' : (c1Color === '#d97706' || c2Color === '#d97706') ? '#d97706' : '#16a34a';
  const obrasColor = '#16a34a';
  const rollosColor = '#dc2626';
  const residColor = '#d97706';
  const orgColor = '#dc2626';
  const actColor = '#d97706';
  const convColor = '#16a34a';
  const memColor = '#dc2626';

  const vehiculosReal = (ultimaFicha.vehiculosEntregadosPolicia || 0) + (ultimaFicha.vehiculosEntregadosSdscj || 0);

  // Cabecera institucional nítida con logos oficiales en Base64
  const renderHeader = (numPagina: number) => {
    const fechaCorte = ultimaFicha?.periodo 
      ? new Date(ultimaFicha.periodo).toLocaleDateString('es-CO', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' })
      : 'Corte General';

    return (
      <div className="flex justify-between items-center pb-2 mb-2 border-b-2 border-red-600">
        <div className="flex items-center gap-2.5">
          <img src={LOGO_BOGOTA_BASE64} alt="Alcaldía Mayor de Bogotá" className="h-9 object-contain" />
          <div className="h-7 w-px bg-slate-300" />
          <img src={LOGO_SDG_BASE64} alt="Secretaría de Gobierno" className="h-8 object-contain" />
          <div className="ml-1 border-l pl-2 border-slate-300">
            <h1 className="text-[11px] font-black text-slate-900 tracking-tight uppercase leading-none">
              Transformación Local
            </h1>
            <p className="text-[9.5px] font-bold text-red-700 leading-tight">
              Unidad de Transformación
            </p>
            <p className="text-[8px] text-slate-500 font-medium">
              SGL · Espacio Público · RADAR
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block bg-slate-100 text-slate-800 border border-slate-300 rounded px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider mb-0.5">
            FICHA DE RESULTADOS
          </div>
          <p className="text-[9.5px] font-bold text-slate-700 leading-tight">Corte: {fechaCorte}</p>
          <p className="text-[8px] text-slate-400">Página {numPagina} de 2 · Formato Carta</p>
        </div>
      </div>
    );
  };

  const renderFooter = (numPagina: number) => (
    <div className="pt-1.5 mt-auto border-t border-slate-200 flex justify-between items-center text-[8px] text-slate-500">
      <span>Alcaldía Mayor de Bogotá · Secretaría Distrital de Gobierno · Unidad de Transformación</span>
      <span className="font-semibold text-slate-600">Página {numPagina} de 2 · Tamaño Carta (215.9 × 279.4 mm)</span>
    </div>
  );

  return (
    <div className="w-full bg-slate-200/80 py-6 px-2 flex flex-col gap-6 items-center">
      
      {/* ========================================================
          PÁGINA 1 (Formato Carta: 215.9mm x 279.4mm)
          ======================================================== */}
      <div 
        className="pdf-page bg-white shadow-xl flex flex-col justify-between"
        style={{
          width: '215.9mm',
          minHeight: '279.4mm',
          maxHeight: '279.4mm',
          padding: '7mm 9mm 6mm 9mm',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        <div className="flex flex-col">
          {renderHeader(1)}

          <div className="grid grid-cols-2 gap-2">
            
            {/* 1. EJECUCIÓN PRESUPUESTAL */}
            {renderCard('1. EJECUCIÓN PRESUPUESTAL', ejecucionColor, (
              <div className="flex justify-around items-end pt-0.5">
                <div className="text-center flex-1">
                  <span className="font-bold text-[9.5px] block mb-1 text-gray-700">COMPROMISOS</span>
                  {renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, c1Color)}
                  <div className="mt-1 text-[8.5px] font-bold text-gray-700">
                    <span className="text-gray-500">{ultimaFicha.metaCompromisosPct || 0}% Programado</span>
                  </div>
                </div>
                <div className="text-center flex-1 border-l border-slate-100">
                  <span className="font-bold text-[9.5px] block mb-1 text-gray-700">GIROS</span>
                  {renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, c2Color)}
                  <div className="mt-1 text-[8.5px] font-bold text-gray-700">
                    <span className="text-gray-500">{ultimaFicha.metaGirosPct || 0}% Programado</span>
                  </div>
                </div>
              </div>
            ), ultimaFicha.avancesEjecucion, ultimaFicha.alertaEjecucion)}

            {/* 2. OBRAS LOCALES */}
            {renderCard('2. OBRAS LOCALES', obrasColor, (
              <div>
                <div className="grid grid-cols-3 gap-1 text-center border-b border-slate-100 pb-1.5 mb-1.5">
                  <div>
                    <span className="text-[8.5px] text-gray-500 font-bold block">META ANUAL</span>
                    <span className="text-base font-black">{ultimaFicha.metaObras || 0}</span>
                  </div>
                  <div className="border-l border-r border-slate-100">
                    <span className="text-[8.5px] text-gray-500 font-bold block">PROG. CORTE</span>
                    <span className="text-base font-black">{ultimaFicha.obrasProgramadasAlCorte || 0}</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] text-gray-500 font-bold block">FINALIZADAS</span>
                    <span className="text-base font-black" style={{ color: obrasColor }}>
                      {ultimaFicha.intervencionesFinalizadas || 0}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-1 text-[8.5px]">
                  {[
                    { label: 'Malla Vial', val: ultimaFicha.obrasMallaVial },
                    { label: 'Espacio Público', val: ultimaFicha.obrasEspacioPublico },
                    { label: 'Vivienda Rural', val: ultimaFicha.obrasViviendaRural },
                    { label: 'Parques', val: ultimaFicha.obrasParque },
                    { label: 'Salón Comunal', val: ultimaFicha.obrasSalonComunal },
                    { label: 'Otras', val: ultimaFicha.obrasOtras }
                  ].map(({ label, val }) => (
                    <div key={label} className="border border-gray-100 bg-gray-50 px-1.5 py-0.5 rounded flex justify-between items-center">
                      <span className="text-gray-500 font-bold">{label}</span>
                      <span className="font-black text-[10px]">{val || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            ), ultimaFicha.avancesObras, ultimaFicha.alertaObras)}

            {/* 3. ROLLOS LEGENDARIOS */}
            {renderCard('3. ROLLOS LEGENDARIOS', rollosColor, (
              <div>
                <div className="flex justify-between items-center mb-1.5 px-1 border-b border-slate-100 pb-1">
                  <div className="text-center w-1/3">
                    <span className="text-[8.5px] font-bold text-gray-500 block uppercase">Total Rollos</span>
                    <span className="text-lg font-black text-gray-800">{ultimaFicha.totalRollos || 0}</span>
                  </div>
                  <div className="text-center w-1/3 border-l border-r border-gray-200">
                    <span className="text-[8.5px] font-bold text-gray-500 block uppercase">Prog. Corte</span>
                    <span className="text-lg font-black text-gray-800">{ultimaFicha.rollosProgramadosAlCorte || 0}</span>
                  </div>
                  <div className="text-center w-1/3">
                    <span className="text-[8.5px] font-bold text-gray-500 block uppercase">Resueltos</span>
                    <span className="text-lg font-black" style={{ color: rollosColor }}>
                      {ultimaFicha.rollosResueltos || 0}
                    </span>
                  </div>
                </div>

                {/* Subgrid 3 columnas para rollos */}
                <div className="grid grid-cols-3 gap-1 mt-1">
                  <div className="border border-green-200 bg-green-50/40 rounded p-1">
                    <h4 className="text-[8px] font-bold text-green-700 mb-0.5">✓ RESUELTOS</h4>
                    {parseListItems(ultimaFicha.rollosDesenrolladosLista)}
                  </div>
                  <div className="border border-yellow-200 bg-yellow-50/40 rounded p-1">
                    <h4 className="text-[8px] font-bold text-yellow-700 mb-0.5">⏳ EN CURSO</h4>
                    {parseListItems(ultimaFicha.rollosDesenrollandoseLista)}
                  </div>
                  <div className="border border-red-200 bg-red-50/40 rounded p-1">
                    <h4 className="text-[8px] font-bold text-red-700 mb-0.5">✕ PENDIENTES</h4>
                    {parseListItems(ultimaFicha.rollosSinDesenrollarseLista)}
                  </div>
                </div>
              </div>
            ), ultimaFicha.avancesRollos, ultimaFicha.alertaRollos)}

            {/* 4. ESPACIO PÚBLICO - RESIDUOS */}
            {renderCard('4. ESPACIO PÚBLICO - RESIDUOS', residColor, (
              <div>
                <div className="grid grid-cols-2 gap-2 text-center border-b border-slate-100 pb-1.5 mb-1.5">
                  <div>
                    <span className="text-[8.5px] text-gray-500 font-bold block uppercase">Puntos Priorizados</span>
                    <span className="text-lg font-black">{ultimaFicha.puntosCriticosPriorizados || 0}</span>
                  </div>
                  <div className="border-l border-slate-100">
                    <span className="text-[8.5px] text-gray-500 font-bold block uppercase">Puntos Sostenidos</span>
                    <span className="text-lg font-black" style={{ color: residColor }}>
                      {ultimaFicha.puntosSostenidos || 0}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between text-[8.5px] font-bold mb-0.5 px-1">
                  <span>0%</span>
                  <span style={{ color: residColor }}>
                    {getAvancePct(ultimaFicha.puntosSostenidos, (ultimaFicha.puntosSostenidosProgramados || 0))}% vs Programado
                  </span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full transition-all" 
                    style={{ 
                      width: `${Math.min(100, getAvancePct(ultimaFicha.puntosSostenidos, ultimaFicha.puntosSostenidosProgramados))}%`, 
                      backgroundColor: residColor 
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-1 text-center text-[8.5px]">
                  <div className="border border-gray-100 p-1 rounded bg-gray-50">
                    <span className="block font-bold text-xs" style={{ color: residColor }}>
                      {ultimaFicha.personasSensibilizadas || 0}
                    </span>
                    <span className="text-[7.5px] text-gray-500 font-bold uppercase leading-tight">Personas sensibilizadas</span>
                  </div>
                  <div className="border border-gray-100 p-1 rounded bg-gray-50">
                    <span className="block font-bold text-xs" style={{ color: residColor }}>
                      {ultimaFicha.operativosIVC || 0}
                    </span>
                    <span className="text-[7.5px] text-gray-500 font-bold uppercase leading-tight">Operativos IVC</span>
                  </div>
                  <div className="border border-gray-100 p-1 rounded bg-gray-50">
                    <span className="block font-bold text-xs" style={{ color: residColor }}>
                      {ultimaFicha.accionesReportadas || 0}
                    </span>
                    <span className="text-[7.5px] text-gray-500 font-bold uppercase leading-tight">Intervenciones reportadas</span>
                  </div>
                </div>
              </div>
            ), ultimaFicha.avancesResiduos, ultimaFicha.alertaEspacioResiduos)}

          </div>
        </div>

        {renderFooter(1)}
      </div>

      {/* ========================================================
          PÁGINA 2 (Formato Carta: 215.9mm x 279.4mm)
          ======================================================== */}
      <div 
        className="pdf-page bg-white shadow-xl flex flex-col justify-between"
        style={{
          width: '215.9mm',
          minHeight: '279.4mm',
          maxHeight: '279.4mm',
          padding: '7mm 9mm 6mm 9mm',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        <div className="flex flex-col">
          {renderHeader(2)}

          <div className="grid grid-cols-2 gap-2">

            {/* 5. ORGANIZACIÓN Y RECUPERACIÓN ESPACIO PÚBLICO (Ancho completo) */}
            <div className="col-span-2">
              {renderCard('5. ORGANIZACIÓN Y RECUPERACIÓN ESPACIO PÚBLICO', orgColor, (
                <div className="grid grid-cols-3 gap-3 items-center">
                  <div className="text-center border-r border-slate-100 pr-2">
                    <span className="text-[8.5px] font-bold text-gray-500 block uppercase mb-1">Sostenibilidad Efectiva</span>
                    {renderGauge(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad || 0, orgColor)}
                    <div className="mt-1">
                      <span className="font-bold text-sm" style={{ color: orgColor }}>
                        {ultimaFicha.puntosSostenibilidadEfectiva || 0} de {ultimaFicha.puntosVerificados || 0}
                      </span>
                      <span className="block text-[8px] text-gray-500">puntos sostenibles</span>
                    </div>
                  </div>

                  <div className="text-center border-r border-slate-100 pr-2">
                    <span className="text-[8.5px] font-bold text-gray-500 block uppercase mb-1">Distribución Operativos</span>
                    <div className="h-16 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={[
                              { value: ultimaFicha.orgParqueo || 0, color: '#f59e0b' },
                              { value: ultimaFicha.ventaInformal || 0, color: '#dc2626' }
                            ]} 
                            innerRadius={20} 
                            outerRadius={32} 
                            dataKey="value" 
                            stroke="none"
                          >
                            {[{ color: '#f59e0b' }, { color: '#dc2626' }].map((e, i) => (
                              <Cell key={i} fill={e.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-around text-[8.5px] font-bold mt-1">
                      <div className="text-yellow-600">Org. parqueo: {ultimaFicha.orgParqueo || 0}</div>
                      <div className="text-red-600">Venta informal: {ultimaFicha.ventaInformal || 0}</div>
                    </div>
                  </div>

                  <div className="space-y-1 text-[9px]">
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-gray-600">Intervenciones reportadas</span>
                      <span className="font-black text-sm" style={{ color: orgColor }}>{ultimaFicha.puntosIntervenidos || 0}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-gray-600">M² recuperados</span>
                      <span className="font-black text-sm" style={{ color: orgColor }}>{ultimaFicha.m2RecuperadosInformal || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-600">Personas reubicadas</span>
                      <span className="font-black text-sm" style={{ color: orgColor }}>{ultimaFicha.personasReubicadas || 0}</span>
                    </div>
                  </div>
                </div>
              ), ultimaFicha.avancesVenta, ultimaFicha.alertaEspacioVenta)}
            </div>

            {/* 6. ACTUACIONES ADMINISTRATIVAS */}
            {renderCard('6. ACTUACIONES ADMINISTRATIVAS', actColor, (
              <div className="flex justify-around items-end pt-0.5">
                <div className="text-center flex-1">
                  <span className="font-bold text-[9.5px] block mb-1 text-gray-700">ARCHIVOS</span>
                  {renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, actColor)}
                  <div className="mt-1 text-[8.5px] font-bold text-gray-700">
                    <span className="block text-gray-500">Meta anual: {ultimaFicha.metaArchivos || 0}</span>
                  </div>
                </div>
                <div className="text-center flex-1 border-l border-slate-100">
                  <span className="font-bold text-[9.5px] block mb-1 text-gray-700">FALLOS 1ª INSTANCIA</span>
                  {renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, actColor)}
                  <div className="mt-1 text-[8.5px] font-bold text-gray-700">
                    <span className="block text-gray-500">Meta anual: {ultimaFicha.metaFallos || 0}</span>
                  </div>
                </div>
              </div>
            ), ultimaFicha.avancesActuaciones, ultimaFicha.alertaActuaciones)}

            {/* 7. CONVIVENCIA Y SEGURIDAD */}
            {renderCard('7. CONVIVENCIA Y SEGURIDAD', convColor, (
              <div>
                <div className="grid grid-cols-2 gap-2 text-center border-b border-slate-100 pb-1 mb-1">
                  <div>
                    <span className="text-[8.5px] text-gray-500 font-bold block uppercase">Meta Vehículos</span>
                    <span className="text-base font-black">{ultimaFicha.vehiculosMetaTotal || 0}</span>
                  </div>
                  <div className="border-l border-slate-100">
                    <span className="text-[8.5px] text-gray-500 font-bold block uppercase">Avance de entrega</span>
                    <span className="text-base font-black" style={{ color: convColor }}>
                      {getAvancePct(vehiculosReal, ultimaFicha.vehiculosProgramadosCorte)}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[8.5px]">
                  {[
                    { label: 'Entregados Policía', val: ultimaFicha.vehiculosEntregadosPolicia, dot: '#16a34a' },
                    { label: 'Entregados SDSCJ', val: ultimaFicha.vehiculosEntregadosSdscj, dot: '#f59e0b' },
                    { label: 'Almacén FDL', val: ultimaFicha.vehiculosEntregadosAlmacen, dot: '#92400e' },
                    { label: 'Pendientes Entrega', val: ultimaFicha.vehiculosPendienteEntrega, dot: '#9ca3af' },
                  ].map(({ label, val, dot }) => (
                    <div key={label} className="border border-gray-100 bg-gray-50 px-1.5 py-0.5 rounded flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                        <span className="text-gray-600 font-bold uppercase text-[8px]">{label}</span>
                      </div>
                      <span className="font-black text-[10px]">{val || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            ), ultimaFicha.avancesConvivencia, ultimaFicha.alertaConvivencia)}

            {/* 8. ESTRATEGIAS DE MEMORIA (Ancho completo) */}
            <div className="col-span-2">
              {renderCard('8. ESTRATEGIAS DE MEMORIA', memColor, (
                <div className="flex items-center gap-4">
                  <div className="text-center w-36 border-r border-slate-100 pr-2">
                    <span className="font-bold text-[9px] block mb-1 text-gray-700">ESTRATEGIAS</span>
                    {renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte || ultimaFicha.estrategiasTotal, memColor)}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1 text-[9px]">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-0.5">
                      <span className="font-bold text-gray-600 uppercase">Total Estrategias</span>
                      <span className="text-sm font-black">{ultimaFicha.estrategiasTotal || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-0.5">
                      <span className="font-bold text-gray-600 uppercase">Resueltas / Finalizadas</span>
                      <span className="text-sm font-black" style={{ color: memColor }}>{ultimaFicha.estrategiasResueltas || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-0.5">
                      <span className="font-bold text-gray-600 uppercase">En formulación</span>
                      <span className="text-sm font-black">{ultimaFicha.estrategiasFormulacion || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-0.5">
                      <span className="font-bold text-gray-600 uppercase">Con ajustes</span>
                      <span className="text-sm font-black">{ultimaFicha.estrategiasAjustes || 0}</span>
                    </div>
                  </div>
                </div>
              ), ultimaFicha.avancesEstrategias, ultimaFicha.alertaEstrategias)}
            </div>

          </div>
        </div>

        {renderFooter(2)}
      </div>

    </div>
  );
}
