import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  ultimaFicha: any;
}

export default function FichasDecoradas({ ultimaFicha }: Props) {
  if (!ultimaFicha) return null;

  // Helpers
  const getColor = (real: number | undefined, prog: number | undefined) => {
    if (!prog || prog === 0) return '#e5e7eb';
    const pct = (real || 0) / prog * 100;
    if (pct < 50) return '#e3182d'; // Rojo
    if (pct < 80) return '#f59e0b'; // Amarillo
    return '#16a34a'; // Verde
  };

  const getAvancePct = (real: number | undefined, prog: number | undefined) => {
    if (!prog || prog === 0) return 0;
    return Math.round(((real || 0) / prog) * 100);
  };

  const renderNeedle = (pct = 0, radius = 60) => {
    const safePct = Math.min(100, Math.max(0, pct));
    const rotateDeg = (safePct * 180 / 100) - 90;
    const length = radius + 5;
    return (
      <div 
        className="absolute z-10"
        style={{
          bottom: 0, left: '50%', width: '2px', height: `${length}px`,
          transformOrigin: 'bottom center', transform: `translateX(-50%) rotate(${rotateDeg}deg)`,
          borderLeft: '2px dashed #000'
        }}
      />
    );
  };

  const parseVinetas = (texto: string) => {
    if (!texto) return null;
    const lineas = texto.split('\n').filter(l => l.trim().length > 0);
    return (
      <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
        {lineas.map((l, i) => <li key={i}>{l.replace(/^[-*•]\s*/, '')}</li>)}
      </ul>
    );
  };

  const renderCard = (title: string, color: string, children: React.ReactNode, avances: string, alertas: string) => (
    <div className="rounded-xl overflow-hidden shadow-sm border-2 mb-6" style={{ borderColor: color, breakInside: 'avoid' }}>
      <h3 className="text-white text-center font-bold text-lg py-2 uppercase tracking-wide flex items-center justify-center gap-2" style={{ backgroundColor: color }}>
        {title}
      </h3>
      <div className="bg-white p-4 flex flex-col h-full">
        <div className="flex-1">
          {children}
        </div>
        
        {/* Avances */}
        {avances && (
          <div className="mt-4 border border-green-500 rounded-lg overflow-hidden shrink-0">
             <div className="bg-green-50 text-green-800 text-xs font-bold px-3 py-1 flex items-center gap-2">
                ✅ PRINCIPALES AVANCES DEL CORTE
             </div>
             <div className="p-3 bg-white">
                {parseVinetas(avances)}
             </div>
          </div>
        )}

        {/* Alertas */}
        {alertas && (
          <div className="mt-3 border border-red-400 rounded-lg overflow-hidden shrink-0">
             <div className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1 flex items-center gap-2">
                ⚠️ ALERTAS
             </div>
             <div className="p-3 bg-white text-xs text-gray-700 font-medium">
                {alertas}
             </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderGauge = (real: number | undefined, prog: number | undefined, color: string) => {
    const val = getAvancePct(real, prog);
    const safeProg = prog || 0;
    
    // Validar si los datos tienen sentido matemático
    const inconsistente = safeProg > 0 && real !== undefined && real > safeProg;
    
    const data = [
      { value: Math.min(100, val), color },
      { value: Math.max(0, 100 - val), color: '#e5e7eb' }
    ];
    return (
      <div className="relative h-20 w-32 mx-auto mt-2">
        {inconsistente && (
           <div className="absolute -top-4 -right-12 bg-red-600 text-white text-[9px] font-bold px-1 py-0.5 rounded shadow z-20">
              Dato por validar
           </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={35} outerRadius={55} paddingAngle={0} dataKey="value" stroke="none">
              {data.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {safeProg > 0 && renderNeedle(100, 55)}
        <div className="absolute bottom-0 left-0 w-full text-center mb-[-8px]">
           <span className="text-xl font-black" style={{ color }}>{val}%</span>
        </div>
      </div>
    );
  };

  const c1Color = getColor(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct);
  const c2Color = getColor(ultimaFicha.girosPct, ultimaFicha.metaGirosPct);
  const ejecucionColor = c1Color === '#e3182d' || c2Color === '#e3182d' ? '#e3182d' : c1Color === '#f59e0b' || c2Color === '#f59e0b' ? '#f59e0b' : '#16a34a';
  
  const obrasColor = getColor(ultimaFicha.intervencionesFinalizadas, ultimaFicha.obrasProgramadasAlCorte);
  const rollosColor = getColor(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte);
  
  // Residuos: Puntos Sostenidos programados vs reales
  const residColor = getColor(ultimaFicha.puntosSostenidos, ultimaFicha.puntosSostenidosProgramados);
  const orgColor = getColor(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad);
  
  const archColor = getColor(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte);
  const fallosColor = getColor(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte);
  const actColor = archColor === '#e3182d' || fallosColor === '#e3182d' ? '#e3182d' : archColor === '#f59e0b' || fallosColor === '#f59e0b' ? '#f59e0b' : '#16a34a';

  const motosReal = (ultimaFicha.motosEntregadasPolicia || 0) + (ultimaFicha.motosEntregadas || 0);
  const convColor = getColor(motosReal, ultimaFicha.motosProgramadasCorte);

  const memColor = getColor(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte);

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
      <div className="bg-white w-[210mm] min-h-[297mm] mx-auto p-8 shadow-md relative page-break-after-always">
        {renderHeader()}
        <div className="grid grid-cols-2 gap-6">
          
          {/* 1. EJECUCION */}
          {renderCard('1. EJECUCIÓN PRESUPUESTAL', ejecucionColor, (
            <div className="flex justify-around items-end h-32">
               <div className="text-center">
                  <span className="font-bold text-[10px] block mb-1 text-gray-500">COMPROMISOS</span>
                  {renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, c1Color)}
                  <div className="mt-4 text-xs font-bold text-gray-700">
                    {ultimaFicha.metaCompromisosPct === undefined || ultimaFicha.metaCompromisosPct === null ? (
                       <span className="block text-red-500 text-[10px]">Programado al corte no reportado</span>
                    ) : (
                       <span className="block text-gray-500">{ultimaFicha.metaCompromisosPct}% Prog. al corte</span>
                    )}
                  </div>
               </div>
               <div className="text-center">
                  <span className="font-bold text-[10px] block mb-1 text-gray-500">GIROS</span>
                  {renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, c2Color)}
                  <div className="mt-4 text-xs font-bold text-gray-700">
                    {ultimaFicha.metaGirosPct === undefined || ultimaFicha.metaGirosPct === null ? (
                       <span className="block text-red-500 text-[10px]">Programado al corte no reportado</span>
                    ) : (
                       <span className="block text-gray-500">{ultimaFicha.metaGirosPct}% Prog. al corte</span>
                    )}
                  </div>
               </div>
            </div>
          ), ultimaFicha.avancesEjecucion, ultimaFicha.alertaEjecucion)}

          {/* 2. OBRAS */}
          {renderCard('2. OBRAS LOCALES', obrasColor, (
            <div>
               <div className="grid grid-cols-3 gap-2 text-center border-b pb-2 mb-2">
                  <div><span className="text-[10px] text-gray-500 font-bold block leading-tight">META<br/>ANUAL</span><span className="text-xl font-black">{ultimaFicha.metaObras || 0}</span></div>
                  <div className="border-l border-r"><span className="text-[10px] text-gray-500 font-bold block leading-tight">PROG. AL<br/>CORTE</span>
                     {ultimaFicha.obrasProgramadasAlCorte === undefined || ultimaFicha.obrasProgramadasAlCorte === null ? (
                        <span className="block text-red-500 text-[8px] leading-none mt-1 font-normal">No reportado</span>
                     ) : <span className="text-xl font-black">{ultimaFicha.obrasProgramadasAlCorte}</span>}
                  </div>
                  <div><span className="text-[10px] text-gray-500 font-bold block leading-tight">FINALIZ.<br/>(REAL)</span><span className="text-xl font-black">{ultimaFicha.intervencionesFinalizadas || 0}</span></div>
               </div>
               <div className="flex justify-between items-center mb-1 px-2 mt-4">
                  <span className="text-[10px] font-bold text-gray-500">AVANCE RESPECTO A PROGRAMADO</span>
                  <span className="text-xl font-black" style={{ color: obrasColor }}>{getAvancePct(ultimaFicha.intervencionesFinalizadas, ultimaFicha.obrasProgramadasAlCorte)}%</span>
               </div>
               <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-4">
                  <div className="h-full" style={{ width: `${Math.min(100, getAvancePct(ultimaFicha.intervencionesFinalizadas, ultimaFicha.obrasProgramadasAlCorte))}%`, backgroundColor: obrasColor }}></div>
               </div>
               <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="border border-gray-100 bg-gray-50 rounded-lg p-2">
                     <span className="text-[10px] text-gray-500 font-bold block">KM CARRIL INTERVENIDO</span>
                     <span className="text-xl font-black">{ultimaFicha.kmCarrilIntervenido || 0}</span>
                  </div>
                  <div className="border border-gray-100 bg-gray-50 rounded-lg p-2">
                     <span className="text-[10px] text-gray-500 font-bold block">M² INTERVENIDOS</span>
                     <span className="text-xl font-black">{ultimaFicha.kmIntervenidos?.toLocaleString('es-CO') || 0}</span>
                  </div>
               </div>
            </div>
          ), ultimaFicha.avancesObras, ultimaFicha.alertaObras)}

          {/* 3. ROLLOS */}
          {renderCard('3. ROLLOS LEGENDARIOS', rollosColor, (
            <div className="flex items-center gap-4">
               <div className="text-center w-36">
                  {renderGauge(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte, rollosColor)}
                  {ultimaFicha.rollosProgramadosAlCorte === undefined || ultimaFicha.rollosProgramadosAlCorte === null ? (
                     <span className="block text-red-500 text-[10px] mt-4 font-bold">Programado al corte no reportado</span>
                  ) : <span className="block text-gray-500 text-[10px] mt-4 font-bold">{ultimaFicha.rollosProgramadosAlCorte} Programados</span>}
               </div>
               <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                     <span className="text-xs font-bold text-gray-500">Total rollos</span>
                     <span className="text-lg font-black">{ultimaFicha.totalRollos || 0}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                     <span className="text-xs font-bold text-gray-500">Resueltos (real)</span>
                     <span className="text-lg font-black">{ultimaFicha.rollosResueltos || 0}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                     <span className="text-xs font-bold text-gray-500">Avances signif.</span>
                     <span className="text-lg font-black">{ultimaFicha.rollosAvancesSignificativos || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                     <span className="text-xs font-bold text-gray-500">En curso</span>
                     <span className="text-lg font-black text-gray-400">{ultimaFicha.rollosEnCurso || 0}</span>
                  </div>
               </div>
            </div>
          ), ultimaFicha.avancesRollos, ultimaFicha.alertaRollos)}

          {/* 4. RESIDUOS */}
          {renderCard('4. ESPACIO PÚBLICO - RESIDUOS', residColor, (
            <div>
               <div className="grid grid-cols-2 gap-4 text-center border-b border-gray-100 pb-2 mb-2">
                  <div>
                     <span className="text-[10px] text-gray-500 font-bold block uppercase leading-tight">Puntos Críticos<br/>Priorizados</span>
                     <span className="text-2xl font-black">{ultimaFicha.puntosCriticosPriorizados || 0}</span>
                  </div>
                  <div className="border-l border-gray-100">
                     <span className="text-[10px] text-gray-500 font-bold block uppercase leading-tight">Puntos sostenidos<br/>(Real)</span>
                     <span className="text-2xl font-black">{ultimaFicha.puntosSostenidos || 0}</span>
                  </div>
               </div>
               
               <div className="flex justify-between text-[10px] font-bold mb-1 px-1">
                 <span className="text-gray-400">0%</span>
                 <span style={{ color: residColor }}>{getAvancePct(ultimaFicha.puntosSostenidos, ultimaFicha.puntosSostenidosProgramados)}% Cumplimiento al corte</span>
                 <span className="text-gray-400">100%</span>
               </div>
               <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-2 relative">
                  <div className="h-full" style={{ width: `${Math.min(100, getAvancePct(ultimaFicha.puntosSostenidos, ultimaFicha.puntosSostenidosProgramados))}%`, backgroundColor: residColor }}></div>
                  {ultimaFicha.puntosSostenidosProgramados === undefined || ultimaFicha.puntosSostenidosProgramados === null ? (
                     <div className="absolute inset-0 bg-red-100 flex items-center justify-center text-red-500 text-[8px] font-bold">Prog. no reportado</div>
                  ) : null}
               </div>

               <div className="grid grid-cols-2 gap-2 text-center text-[10px] mb-2">
                  <div className="border border-gray-100 bg-gray-50 p-1.5 rounded flex justify-between items-center">
                    <span className="text-gray-500 font-bold">Personas sensib.</span>
                    <span className="font-black text-sm">{ultimaFicha.personasSensibilizadas?.toLocaleString('es-CO') || 0}</span>
                  </div>
                  <div className="border border-gray-100 bg-gray-50 p-1.5 rounded flex justify-between items-center">
                    <span className="text-gray-500 font-bold">Operativos IVC</span>
                    <span className="font-black text-sm">{ultimaFicha.operativosIVC?.toLocaleString('es-CO') || 0}</span>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                  <div className="border border-gray-100 bg-gray-50 p-1.5 rounded flex justify-between items-center">
                    <span className="text-gray-500 font-bold">Intervenciones rep.</span>
                    <span className="font-black text-sm">{ultimaFicha.accionesReportadas?.toLocaleString('es-CO') || 0}</span>
                  </div>
                  <div className="border border-gray-100 bg-gray-50 p-1.5 rounded flex justify-between items-center">
                    <span className="text-gray-500 font-bold">M³ recolectados</span>
                    <span className="font-black text-sm">{ultimaFicha.residuosM3?.toLocaleString('es-CO') || 0}</span>
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

          {/* 5. VENTA INFORMAL (Ocupa las 2 columnas) */}
          <div className="col-span-2">
             {renderCard('5. ORGANIZACIÓN Y RECUPERACIÓN ESPACIO PÚBLICO', orgColor, (
               <div className="grid grid-cols-3 gap-6 items-center">
                  <div className="text-center border-r border-gray-100 pr-4">
                     <span className="text-[10px] font-bold text-gray-500 block uppercase mb-1">Puntos con Sostenibilidad Efectiva</span>
                     {renderGauge(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad, orgColor)}
                     <div className="mt-4">
                       <span className="font-bold text-lg" style={{ color: orgColor }}>{ultimaFicha.puntosSostenibilidadEfectiva || 0}</span>
                       <span className="text-[10px] text-gray-500"> reales de </span>
                       <span className="font-bold text-sm text-gray-700">{ultimaFicha.puntosProgramadosSostenibilidad || 0}</span>
                       <span className="text-[10px] text-gray-500"> prog. al corte</span>
                       {ultimaFicha.puntosProgramadosSostenibilidad === undefined || ultimaFicha.puntosProgramadosSostenibilidad === null ? (
                          <span className="block text-red-500 text-[10px] font-bold">Programado al corte no reportado</span>
                       ) : null}
                     </div>
                  </div>
                  <div className="text-center border-r border-gray-100 pr-4">
                     <span className="text-[10px] font-bold text-gray-500 block uppercase mb-2">Distribución Operativos</span>
                     <div className="h-20 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={[
                              { value: ultimaFicha.orgParqueo || 0, color: '#f59e0b' },
                              { value: ultimaFicha.ventaInformal || 0, color: '#e3182d' }
                            ]} innerRadius={20} outerRadius={35} dataKey="value" stroke="none">
                              {[{color:'#f59e0b'}, {color:'#e3182d'}].map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="flex justify-around text-[10px] font-bold mt-2">
                        <div className="text-yellow-600">Org parqueo: {ultimaFicha.orgParqueo || 0}</div>
                        <div className="text-red-600">Venta informal: {ultimaFicha.ventaInformal || 0}</div>
                     </div>
                  </div>
                  <div className="space-y-3">
                     <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                       <span className="text-xs font-bold text-gray-500">Puntos verificados totales</span>
                       <span className="font-black text-lg">{ultimaFicha.puntosVerificados || 0}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                       <span className="text-xs font-bold text-gray-500">Intervenciones reportadas</span>
                       <span className="font-black text-lg">{ultimaFicha.puntosIntervenidos || 0}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                       <span className="text-xs font-bold text-gray-500">M² recuperados</span>
                       <span className="font-black text-lg">{ultimaFicha.m2RecuperadosInformal?.toLocaleString('es-CO') || 0}</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-xs font-bold text-gray-500">Personas reubicadas</span>
                       <span className="font-black text-lg">{ultimaFicha.personasReubicadas?.toLocaleString('es-CO') || 0}</span>
                     </div>
                  </div>
               </div>
             ), ultimaFicha.avancesVenta, ultimaFicha.alertaEspacioVenta)}
          </div>

          {/* 6. ACTUACIONES */}
          {renderCard('6. ACTUACIONES ADMINISTRATIVAS', actColor, (
            <div className="flex justify-around items-end h-32">
               <div className="text-center">
                  <span className="font-bold text-[10px] block mb-1 text-gray-500">ARCHIVOS</span>
                  {renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, archColor)}
                  <div className="mt-4 text-[10px] font-bold text-gray-700">
                    {ultimaFicha.archivosProgramadosCorte === undefined || ultimaFicha.archivosProgramadosCorte === null ? (
                       <span className="block text-red-500">Programado al corte no reportado</span>
                    ) : (
                       <span className="block text-gray-500">{ultimaFicha.archivosProgramadosCorte} Prog. al corte</span>
                    )}
                    <span className="block text-gray-400 mt-1">Meta anual: {ultimaFicha.metaArchivos || 0}</span>
                  </div>
               </div>
               <div className="text-center">
                  <span className="font-bold text-[10px] block mb-1 text-gray-500">FALLOS 1ª INSTANCIA</span>
                  {renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, fallosColor)}
                  <div className="mt-4 text-[10px] font-bold text-gray-700">
                    {ultimaFicha.fallosProgramadosCorte === undefined || ultimaFicha.fallosProgramadosCorte === null ? (
                       <span className="block text-red-500">Programado al corte no reportado</span>
                    ) : (
                       <span className="block text-gray-500">{ultimaFicha.fallosProgramadosCorte} Prog. al corte</span>
                    )}
                    <span className="block text-gray-400 mt-1">Meta anual: {ultimaFicha.metaFallos || 0}</span>
                  </div>
               </div>
            </div>
          ), ultimaFicha.avancesActuaciones, ultimaFicha.alertaActuaciones)}

          {/* 7. CONVIVENCIA */}
          {renderCard('7. CONVIVENCIA Y SEGURIDAD', convColor, (
            <div>
               <div className="grid grid-cols-2 gap-4 text-center border-b border-gray-100 pb-2 mb-2">
                  <div>
                     <span className="text-[10px] text-gray-500 font-bold block uppercase leading-tight">Motos programadas<br/>al corte</span>
                     {ultimaFicha.motosProgramadasCorte === undefined || ultimaFicha.motosProgramadasCorte === null ? (
                        <span className="block text-red-500 text-[10px] mt-1 font-bold">No reportado</span>
                     ) : <span className="text-2xl font-black">{ultimaFicha.motosProgramadasCorte}</span>}
                  </div>
                  <div className="border-l border-gray-100">
                     <span className="text-[10px] text-gray-500 font-bold block uppercase leading-tight">Avance de entrega<br/>(Real)</span>
                     <span className="text-2xl font-black" style={{ color: convColor }}>{getAvancePct(motosReal, ultimaFicha.motosProgramadasCorte)}%</span>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-2 text-[9px] mb-2">
                  <div className="border border-gray-100 bg-gray-50 p-1 rounded flex justify-between items-center">
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>Entregadas Policía</div>
                    <span className="font-bold text-sm">{ultimaFicha.motosEntregadasPolicia || 0}</span>
                  </div>
                  <div className="border border-gray-100 bg-gray-50 p-1 rounded flex justify-between items-center">
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>Entregadas SDSCJ</div>
                    <span className="font-bold text-sm">{ultimaFicha.motosEntregadas || 0}</span>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div className="border border-gray-100 bg-gray-50 p-1 rounded flex justify-between items-center">
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>Almacén FDL</div>
                    <span className="font-bold text-sm">{ultimaFicha.motosAlmacenFdl || 0}</span>
                  </div>
                  <div className="border border-gray-100 bg-gray-50 p-1 rounded flex justify-between items-center">
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>Pendientes FDL</div>
                    <span className="font-bold text-sm text-gray-400">{ultimaFicha.motosPendientesFdl || 0}</span>
                  </div>
               </div>
               <div className="text-center mt-3 text-[10px] text-gray-400 font-medium border-t border-gray-100 pt-1">
                  Meta Total: {ultimaFicha.motosMetaTotal || 0} motos
               </div>
            </div>
          ), ultimaFicha.avancesConvivencia, ultimaFicha.alertaConvivencia)}

          {/* 8. ESTRATEGIAS (Debe estar de ultimo en pagina 2 por instruccion) */}
          <div className="col-span-2">
            {renderCard('8. ESTRATEGIAS DE MEMORIA', memColor, (
              <div className="flex items-center gap-6 h-28">
                 <div className="text-center w-36">
                    {renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte, memColor)}
                    <div className="mt-4 text-[10px] font-bold text-gray-700">
                      {ultimaFicha.estrategiasProgramadasCorte === undefined || ultimaFicha.estrategiasProgramadasCorte === null ? (
                         <span className="block text-red-500">Prog. no reportado</span>
                      ) : (
                         <span className="block text-gray-500">{ultimaFicha.estrategiasProgramadasCorte} Prog. al corte</span>
                      )}
                    </div>
                 </div>
                 <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-2">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                       <span className="text-xs font-bold text-gray-500">Total estrategias</span>
                       <span className="text-lg font-black">{ultimaFicha.estrategiasTotal || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                       <span className="text-xs font-bold text-gray-500">Resueltas (Finalizadas)</span>
                       <span className="text-lg font-black" style={{ color: memColor }}>{ultimaFicha.estrategiasResueltas || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                       <span className="text-xs font-bold text-gray-500">En formulación</span>
                       <span className="text-lg font-black">{ultimaFicha.estrategiasFormulacion || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                       <span className="text-xs font-bold text-gray-500">En validación técnica</span>
                       <span className="text-lg font-black">{ultimaFicha.estrategiasValidacionTecnica || 0}</span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                       <span className="text-xs font-bold text-gray-500">Con ajustes solic.</span>
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
