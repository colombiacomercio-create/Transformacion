import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  ultimaFicha: any;
}

export default function FichasDecoradas({ ultimaFicha }: Props) {
  if (!ultimaFicha) return null;

  // Helpers
  const getColor = (real: number | undefined, prog: number | undefined): string => {
    if (!prog || prog === 0) return '#e5e7eb';
    const pct = (real || 0) / prog * 100;
    if (pct < 50) return '#dc2626'; // Red
    if (pct < 80) return '#d97706'; // Orange
    return '#16a34a'; // Green
  };

  const getAvancePct = (real: number | undefined, prog: number | undefined): number => {
    if (!prog || prog === 0) return 0;
    return Math.round(((real || 0) / prog) * 100);
  };

  const renderNeedle = (pct: number = 0, radius: number = 60) => {
    const safePct = Math.min(100, Math.max(0, pct));
    const rotateDeg = (safePct * 180 / 100) - 90;
    return (
      <div 
        className="absolute z-10 pointer-events-none"
        style={{
          bottom: 0, left: '50%', width: '2px', height: `${radius + 5}px`,
          transformOrigin: 'bottom center', transform: `translateX(-50%) rotate(${rotateDeg}deg)`,
          borderLeft: '2px dashed #000'
        }}
      />
    );
  };

  const parseVinetas = (texto: string | null | undefined) => {
    if (!texto) return <p className="text-[10px] text-gray-300 italic">No reportado aún</p>;
    const lineas = texto.split('\n').filter((l: string) => l.trim().length > 0);
    return (
      <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
        {lineas.map((l: string, i: number) => <li key={i}>{l.replace(/^[-*•]\s*/, '')}</li>)}
      </ul>
    );
  };

  const parseListItems = (texto: string | null | undefined) => {
    if (!texto) return <span className="text-gray-400 italic text-xs">Ninguno reportado</span>;
    const lineas = texto.split('\n').filter((l: string) => l.trim().length > 0);
    return (
      <ul className="list-disc pl-4 text-[10px] text-gray-700 space-y-0.5">
        {lineas.map((l: string, i: number) => <li key={i}>{l.replace(/^[-*•]\s*/, '')}</li>)}
      </ul>
    );
  };

  const renderCard = (title: string, color: string, children: React.ReactNode, avances: string | null | undefined, alertas: string | null | undefined) => (
    <div className="rounded-xl overflow-hidden shadow-sm border-2 mb-6 flex flex-col" style={{ borderColor: color, breakInside: 'avoid' }}>
      <h3 className="text-white text-center font-bold text-sm py-2 uppercase tracking-wide flex items-center justify-center gap-2" style={{ backgroundColor: color }}>
        {title}
      </h3>
      <div className="bg-white p-4 flex flex-col flex-1">
        <div className="flex-1 pb-2">
          {children}
        </div>
        
        {/* Avances */}
        <div className="mt-3 border border-green-500 rounded-lg overflow-hidden shrink-0">
            <div className="bg-green-50 text-green-800 text-[10px] font-bold px-3 py-1 flex items-center gap-2 border-b border-green-200">
              ✅ PRINCIPALES AVANCES DEL CORTE
            </div>
            <div className="p-2 bg-white min-h-[44px]">
              {parseVinetas(avances)}
            </div>
        </div>

        {/* Alertas */}
        <div className="mt-2 border border-red-400 rounded-lg overflow-hidden shrink-0">
            <div className="bg-red-50 text-red-700 text-[10px] font-bold px-3 py-1 flex items-center gap-2 border-b border-red-200">
              ⚠️ ALERTAS
            </div>
            <div className="p-2 bg-white text-xs text-gray-700 min-h-[44px]">
              {alertas && alertas.trim().length > 0 ? (
                <p className="whitespace-pre-wrap">{alertas}</p>
              ) : (
                <p className="text-[10px] text-gray-300 italic">No reportado aún</p>
              )}
            </div>
        </div>
      </div>
    </div>
  );

  const renderGauge = (real: number | undefined, prog: number | undefined, color: string) => {
    const val = getAvancePct(real, prog);
    const data = [
      { value: val, color },
      { value: Math.max(0, 100 - val), color: '#e5e7eb' }
    ];
    return (
      <div className="relative h-20 w-32 mx-auto mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={35} outerRadius={55} paddingAngle={0} dataKey="value" stroke="none">
              {data.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {renderNeedle(Math.min(100, prog ?? 0), 55)}
        <div className="absolute bottom-0 left-0 w-full text-center mb-[-8px]">
           <span className="text-xl font-black" style={{ color }}>{val}%</span>
        </div>
      </div>
    );
  };

  // Colors
  const c1Color = getColor(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct);
  const c2Color = getColor(ultimaFicha.girosPct, ultimaFicha.metaGirosPct);
  const ejecucionColor = c1Color === '#dc2626' || c2Color === '#dc2626' ? '#dc2626' : c1Color === '#d97706' || c2Color === '#d97706' ? '#d97706' : '#16a34a'; // Green/Red logic
  const obrasColor = '#16a34a'; // Green as requested
  const rollosColor = '#dc2626'; // Red as requested
  const residColor = '#d97706'; // Orange as requested
  const orgColor = '#dc2626'; // Red as requested
  const actColor = '#d97706'; // Orange as requested
  const convColor = '#16a34a'; // Green as requested
  const memColor = '#dc2626'; // Red as requested

  // Convivencia: Entregadas = Policia + SDSCJ
  const vehiculosReal = (ultimaFicha.vehiculosEntregadosPolicia || 0) + (ultimaFicha.vehiculosEntregadosSdscj || 0);

  const renderHeader = () => (
    <div className="flex justify-between items-start mb-6 border-b-4 border-red-600 pb-2">
      <div>
        <h1 className="text-4xl font-extrabold text-[#1a3622] tracking-tighter uppercase">Transformación Local</h1>
        <h2 className="text-2xl font-light text-gray-500">Unidad de Transformación</h2>
      </div>
      <img src="/Logo_sede_electronica_SDG.png" alt="Alcaldía de Bogotá" className="h-10 object-contain" />
    </div>
  );

  return (
    <div className="w-full bg-gray-100 font-sans p-4 flex flex-col gap-4">
      {/* PAGE 1 */}
      <div className="bg-white w-[210mm] min-h-[297mm] mx-auto p-8 shadow-md">
        {renderHeader()}
        <div className="grid grid-cols-2 gap-6">
          
          {/* 1. EJECUCION PRESUPUESTAL (Green) */}
          {renderCard('1. EJECUCIÓN PRESUPUESTAL', ejecucionColor, (
            <div className="flex justify-around items-end">
               <div className="text-center flex-1">
                  <span className="font-bold text-xs block mb-2 text-gray-700">COMPROMISOS</span>
                  {renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, c1Color)}
                  <div className="mt-4 text-[10px] font-bold text-gray-700">
                    <span className="block text-gray-500">{ultimaFicha.metaCompromisosPct || 0}% Programado</span>
                  </div>
               </div>
               <div className="text-center flex-1">
                  <span className="font-bold text-xs block mb-2 text-gray-700">GIROS</span>
                  {renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, c2Color)}
                  <div className="mt-4 text-[10px] font-bold text-gray-700">
                    <span className="block text-gray-500">{ultimaFicha.metaGirosPct || 0}% Programado</span>
                  </div>
               </div>
            </div>
          ), ultimaFicha.avancesEjecucion, ultimaFicha.alertaEjecucion)}

          {/* 2. OBRAS LOCALES (Green) */}
          {renderCard('2. OBRAS LOCALES', obrasColor, (
            <div>
               <div className="grid grid-cols-3 gap-2 text-center border-b pb-4 mb-4">
                  <div><span className="text-[10px] text-gray-500 font-bold block">META ANUAL</span><span className="text-xl font-black">{ultimaFicha.metaObras || 0}</span></div>
                  <div className="border-l border-r"><span className="text-[10px] text-gray-500 font-bold block">PROG. AL CORTE</span><span className="text-xl font-black">{ultimaFicha.obrasProgramadasAlCorte || 0}</span></div>
                  <div><span className="text-[10px] text-gray-500 font-bold block">FINALIZADAS</span><span className="text-xl font-black" style={{ color: obrasColor }}>{ultimaFicha.intervencionesFinalizadas || 0}</span></div>
               </div>
               
               <div className="grid grid-cols-2 gap-2 text-[10px] mb-4">
                 {[
                   { label: 'Malla Vial', val: ultimaFicha.obrasMallaVial },
                   { label: 'Espacio Público', val: ultimaFicha.obrasEspacioPublico },
                   { label: 'Vivienda Rural', val: ultimaFicha.obrasViviendaRural },
                   { label: 'Parques', val: ultimaFicha.obrasParque },
                   { label: 'Salón Comunal', val: ultimaFicha.obrasSalonComunal },
                   { label: 'Otras', val: ultimaFicha.obrasOtras }
                 ].map(({ label, val }) => (
                   <div key={label} className="border border-gray-100 bg-gray-50 p-1.5 rounded flex justify-between items-center">
                     <span className="text-gray-500 font-bold">{label}</span>
                     <span className="font-black text-sm">{val || 0}</span>
                   </div>
                 ))}
               </div>
            </div>
          ), ultimaFicha.avancesObras, ultimaFicha.alertaObras)}

          {/* 3. ROLLOS LEGENDARIOS (Red) */}
          {renderCard('3. ROLLOS LEGENDARIOS', rollosColor, (
            <div>
              <div className="flex justify-between items-center mb-4">
                 <div className="text-center w-1/3">
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Total Rollos</span>
                    <span className="text-2xl font-black">{ultimaFicha.totalRollos || 0}</span>
                 </div>
                 <div className="text-center w-1/3 border-l border-r border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Prog. al Corte</span>
                    <span className="text-2xl font-black">{ultimaFicha.rollosProgramadosAlCorte || 0}</span>
                 </div>
                 <div className="text-center w-1/3">
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Resueltos</span>
                    <span className="text-2xl font-black" style={{ color: rollosColor }}>{ultimaFicha.rollosResueltos || 0}</span>
                 </div>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-2">
                 <div className="border border-gray-100 bg-gray-50 rounded p-2">
                    <h4 className="text-[10px] font-bold text-green-700 mb-1">✅ DESENROLLADOS</h4>
                    {parseListItems(ultimaFicha.rollosDesenrolladosLista)}
                 </div>
                 <div className="border border-gray-100 bg-gray-50 rounded p-2">
                    <h4 className="text-[10px] font-bold text-yellow-600 mb-1">⏳ DESENROLLÁNDOSE</h4>
                    {parseListItems(ultimaFicha.rollosDesenrollandoseLista)}
                 </div>
                 <div className="border border-gray-100 bg-gray-50 rounded p-2">
                    <h4 className="text-[10px] font-bold text-red-600 mb-1">❌ SIN DESENROLLARSE</h4>
                    {parseListItems(ultimaFicha.rollosSinDesenrollarseLista)}
                 </div>
              </div>
            </div>
          ), ultimaFicha.avancesRollos, ultimaFicha.alertaRollos)}

          {/* 4. ESPACIO PÚBLICO - RESIDUOS (Orange) */}
          {renderCard('4. ESPACIO PÚBLICO - RESIDUOS', residColor, (
            <div>
               <div className="grid grid-cols-2 gap-4 text-center border-b pb-4 mb-4">
                  <div>
                     <span className="text-[10px] text-gray-500 font-bold block uppercase">Puntos Priorizados</span>
                     <span className="text-2xl font-black">{ultimaFicha.puntosCriticosPriorizados || 0}</span>
                  </div>
                  <div className="border-l">
                     <span className="text-[10px] text-gray-500 font-bold block uppercase">Puntos Sostenidos</span>
                     <span className="text-2xl font-black" style={{ color: residColor }}>{ultimaFicha.puntosSostenidos || 0}</span>
                  </div>
               </div>
               
               <div className="flex justify-between text-[10px] font-bold mb-1 px-2">
                 <span>0%</span>
                 <span style={{ color: residColor }}>{getAvancePct(ultimaFicha.puntosSostenidos, (ultimaFicha.puntosSostenidosProgramados||0))} vs Programado</span>
                 <span>100%</span>
               </div>
               <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-4">
                  <div className="h-full" style={{ width: `${Math.min(100, getAvancePct(ultimaFicha.puntosSostenidos, ultimaFicha.puntosSostenidosProgramados))}%`, backgroundColor: residColor }}></div>
               </div>

               <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="border border-gray-100 p-2 rounded bg-gray-50">
                    <span className="block font-bold text-lg" style={{ color: residColor }}>{ultimaFicha.personasSensibilizadas || 0}</span>
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Personas sensibilizadas</span>
                  </div>
                  <div className="border border-gray-100 p-2 rounded bg-gray-50">
                    <span className="block font-bold text-lg" style={{ color: residColor }}>{ultimaFicha.operativosIVC || 0}</span>
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Operativos IVC</span>
                  </div>
                  <div className="border border-gray-100 p-2 rounded bg-gray-50">
                    <span className="block font-bold text-lg" style={{ color: residColor }}>{ultimaFicha.accionesReportadas || 0}</span>
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Intervenciones reportadas</span>
                  </div>
               </div>
            </div>
          ), ultimaFicha.avancesResiduos, ultimaFicha.alertaEspacioResiduos)}

        </div>
      </div>

      {/* PAGE 2 */}
      <div className="bg-white w-[210mm] min-h-[297mm] mx-auto p-8 shadow-md">
        {renderHeader()}
        <div className="grid grid-cols-2 gap-6">

          {/* 5. ORGANIZACIÓN Y RECUPERACIÓN ESPACIO PÚBLICO (Red) */}
          <div className="col-span-2">
             {renderCard('5. ORGANIZACIÓN Y RECUPERACIÓN ESPACIO PÚBLICO', orgColor, (
               <div className="grid grid-cols-3 gap-6 items-center">
                  <div className="text-center border-r pr-4">
                     <span className="text-[10px] font-bold text-gray-500 block uppercase mb-2">Sostenibilidad Efectiva</span>
                     {renderGauge(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad || 0, orgColor)}
                     <div className="mt-4">
                       <span className="font-bold text-lg" style={{ color: orgColor }}>{ultimaFicha.puntosSostenibilidadEfectiva || 0} de {ultimaFicha.puntosVerificados || 0}</span>
                       <span className="block text-[10px] text-gray-500">puntos con sostenibilidad</span>
                     </div>
                  </div>
                  <div className="text-center border-r pr-4">
                     <span className="text-[10px] font-bold text-gray-500 block uppercase mb-2">Distribución Operativos</span>
                     <div className="h-24 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={[
                              { value: ultimaFicha.orgParqueo || 0, color: '#f59e0b' },
                              { value: ultimaFicha.ventaInformal || 0, color: '#dc2626' }
                            ]} innerRadius={25} outerRadius={40} dataKey="value" stroke="none">
                              {[{color:'#f59e0b'}, {color:'#dc2626'}].map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="flex justify-around text-[10px] font-bold mt-2">
                        <div className="text-yellow-600">Org parqueo: {ultimaFicha.orgParqueo || 0}</div>
                        <div className="text-red-600">Venta informal: {ultimaFicha.ventaInformal || 0}</div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between border-b pb-2">
                       <span className="text-xs font-bold text-gray-600">Intervenciones reportadas</span>
                       <span className="font-black text-lg" style={{ color: orgColor }}>{ultimaFicha.puntosIntervenidos || 0}</span>
                     </div>
                     <div className="flex justify-between border-b pb-2">
                       <span className="text-xs font-bold text-gray-600">M² recuperados</span>
                       <span className="font-black text-lg" style={{ color: orgColor }}>{ultimaFicha.m2RecuperadosInformal || 0}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-xs font-bold text-gray-600">Personas reubicadas</span>
                       <span className="font-black text-lg" style={{ color: orgColor }}>{ultimaFicha.personasReubicadas || 0}</span>
                     </div>
                  </div>
               </div>
             ), ultimaFicha.avancesVenta, ultimaFicha.alertaEspacioVenta)}
          </div>

          {/* 6. ACTUACIONES ADMINISTRATIVAS (Orange) */}
          {renderCard('6. ACTUACIONES ADMINISTRATIVAS', actColor, (
            <div className="flex justify-around items-end mt-2">
               <div className="text-center flex-1">
                  <span className="font-bold text-xs block mb-2 text-gray-700">ARCHIVOS</span>
                  {renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, actColor)}
                  <div className="mt-4 text-[10px] font-bold text-gray-700">
                    <span className="block text-gray-500">Meta anual: {ultimaFicha.metaArchivos || 0}</span>
                  </div>
               </div>
               <div className="text-center flex-1">
                  <span className="font-bold text-xs block mb-2 text-gray-700">FALLOS 1ª INSTANCIA</span>
                  {renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, actColor)}
                  <div className="mt-4 text-[10px] font-bold text-gray-700">
                    <span className="block text-gray-500">Meta anual: {ultimaFicha.metaFallos || 0}</span>
                  </div>
               </div>
            </div>
          ), ultimaFicha.avancesActuaciones, ultimaFicha.alertaActuaciones)}

          {/* 7. CONVIVENCIA Y SEGURIDAD (Green) */}
          {renderCard('7. CONVIVENCIA Y SEGURIDAD', convColor, (
            <div>
               <div className="grid grid-cols-2 gap-4 text-center border-b pb-4 mb-4">
                  <div>
                     <span className="text-[10px] text-gray-500 font-bold block uppercase">Meta Vehículos</span>
                     <span className="text-2xl font-black">{ultimaFicha.vehiculosMetaTotal || 0}</span>
                  </div>
                  <div className="border-l">
                     <span className="text-[10px] text-gray-500 font-bold block uppercase">Avance de entrega</span>
                     <span className="text-2xl font-black" style={{ color: convColor }}>
                       {getAvancePct(vehiculosReal, ultimaFicha.vehiculosProgramadosCorte)}%
                     </span>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-2 text-[10px]">
                 {[
                   { label: 'Entregados Policía', val: ultimaFicha.vehiculosEntregadosPolicia, dot: '#16a34a' },
                   { label: 'Entregados SDSCJ', val: ultimaFicha.vehiculosEntregadosSdscj, dot: '#f59e0b' },
                   { label: 'Almacén FDL', val: ultimaFicha.vehiculosEntregadosAlmacen, dot: '#92400e' },
                   { label: 'Pendientes Entrega', val: ultimaFicha.vehiculosPendienteEntrega, dot: '#9ca3af' },
                 ].map(({ label, val, dot }) => (
                   <div key={label} className="border border-gray-100 bg-gray-50 p-1.5 rounded flex justify-between items-center">
                     <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                       <span className="text-gray-600 font-bold uppercase">{label}</span>
                     </div>
                     <span className="font-black text-sm">{val || 0}</span>
                   </div>
                 ))}
               </div>
            </div>
          ), ultimaFicha.avancesConvivencia, ultimaFicha.alertaConvivencia)}

          {/* 8. ESTRATEGIAS DE MEMORIA (Red) */}
          <div className="col-span-2">
            {renderCard('8. ESTRATEGIAS DE MEMORIA', memColor, (
              <div className="flex items-center gap-6 mt-2">
                 <div className="text-center w-40">
                    <span className="font-bold text-xs block mb-2 text-gray-700">ESTRATEGIAS</span>
                    {renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte || ultimaFicha.estrategiasTotal, memColor)}
                 </div>
                 <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-3">
                    <div className="flex justify-between items-center border-b pb-1 border-gray-200">
                       <span className="text-xs font-bold text-gray-600 uppercase">Total</span>
                       <span className="text-lg font-black">{ultimaFicha.estrategiasTotal || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1 border-gray-200">
                       <span className="text-xs font-bold text-gray-600 uppercase">Resueltas</span>
                       <span className="text-lg font-black" style={{ color: memColor }}>{ultimaFicha.estrategiasResueltas || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1 border-gray-200">
                       <span className="text-xs font-bold text-gray-600 uppercase">En formulación</span>
                       <span className="text-lg font-black">{ultimaFicha.estrategiasFormulacion || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1 border-gray-200">
                       <span className="text-xs font-bold text-gray-600 uppercase">Con ajustes</span>
                       <span className="text-lg font-black">{ultimaFicha.estrategiasAjustes || 0}</span>
                    </div>
                 </div>
              </div>
            ), ultimaFicha.avancesEstrategias, ultimaFicha.alertaEstrategias)}
          </div>
          
        </div>
      </div>
    </div>
  );
}
