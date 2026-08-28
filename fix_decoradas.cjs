const fs = require('fs');

const code = import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  ultimaFicha: any;
}

export default function FichasDecoradas({ ultimaFicha }: Props) {
  if (!ultimaFicha) return null;

  // Helpers
  const getColor = (real, prog) => {
    if (!prog || prog === 0) return '#e5e7eb';
    const pct = (real || 0) / prog * 100;
    if (pct < 50) return '#e3182d';
    if (pct < 80) return '#f59e0b';
    return '#16a34a';
  };

  const getAvancePct = (real, prog) => {
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
          bottom: 0, left: '50%', width: '2px', height: \\px\,
          transformOrigin: 'bottom center', transform: \	ranslateX(-50%) rotate(\deg)\,
          borderLeft: '2px dashed #000'
        }}
      />
    );
  };

  const parseVinetas = (texto) => {
    if (!texto) return null;
    const lineas = texto.split('\\n').filter(l => l.trim().length > 0);
    return (
      <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
        {lineas.map((l, i) => <li key={i}>{l.replace(/^[-*•]\\s*/, '')}</li>)}
      </ul>
    );
  };

  const renderCard = (title, color, children, avances, alertas) => (
    <div className="rounded-xl overflow-hidden shadow-sm border-2 mb-6" style={{ borderColor: color, breakInside: 'avoid' }}>
      <h3 className="text-white text-center font-bold text-lg py-2 uppercase tracking-wide flex items-center justify-center gap-2" style={{ backgroundColor: color }}>
        {title}
      </h3>
      <div className="bg-white p-4">
        {children}
        
        {/* Avances */}
        {avances && (
          <div className="mt-4 border border-green-500 rounded-lg overflow-hidden">
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
          <div className="mt-3 border border-red-400 rounded-lg overflow-hidden">
             <div className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1 flex items-center gap-2">
                ⚠️ ALERTAS
             </div>
             <div className="p-3 bg-white text-xs text-gray-700">
                {alertas}
             </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderGauge = (real, prog, color) => {
    const val = getAvancePct(real, prog);
    const data = [
      { value: val, color },
      { value: Math.max(0, 100 - val), color: '#e5e7eb' }
    ];
    return (
      <div className="relative h-20 w-32 mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={35} outerRadius={55} paddingAngle={0} dataKey="value" stroke="none">
              {data.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {renderNeedle(Math.min(100, prog), 55)}
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
  const residColor = getColor(ultimaFicha.puntosSostenidos, ultimaFicha.puntosSostenidosProgramados * 0.85); // 85% meta
  const orgColor = getColor(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad * 0.85);
  
  const archColor = getColor(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte);
  const fallosColor = getColor(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte);
  const actColor = archColor === '#e3182d' || fallosColor === '#e3182d' ? '#e3182d' : archColor === '#f59e0b' || fallosColor === '#f59e0b' ? '#f59e0b' : '#16a34a';

  // Convivencia: Entregadas = Policia + SDSCJ
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
      <div className="bg-white w-[210mm] min-h-[297mm] mx-auto p-8 shadow-md">
        {renderHeader()}
        <div className="grid grid-cols-2 gap-6">
          
          {/* 1. EJECUCION */}
          {renderCard('1. EJECUCIÓN PRESUPUESTAL', ejecucionColor, (
            <div className="flex justify-around items-end">
               <div className="text-center">
                  <span className="font-bold text-sm block mb-2">COMPROMISOS</span>
                  {renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, c1Color)}
                  <div className="mt-4 text-xs font-bold text-gray-700">
                    <span className="block text-gray-500">{ultimaFicha.metaCompromisosPct || 0}% Programado</span>
                  </div>
               </div>
               <div className="text-center">
                  <span className="font-bold text-sm block mb-2">GIROS</span>
                  {renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, c2Color)}
                  <div className="mt-4 text-xs font-bold text-gray-700">
                    <span className="block text-gray-500">{ultimaFicha.metaGirosPct || 0}% Programado</span>
                  </div>
               </div>
            </div>
          ), ultimaFicha.avancesEjecucion, ultimaFicha.alertaEjecucion)}

          {/* 2. OBRAS */}
          {renderCard('2. OBRAS LOCALES', obrasColor, (
            <div>
               <div className="grid grid-cols-3 gap-2 text-center border-b pb-4 mb-4">
                  <div><span className="text-xs text-gray-500 font-bold block">META ANUAL</span><span className="text-2xl font-black">{ultimaFicha.metaObras || 0}</span></div>
                  <div className="border-l border-r"><span className="text-xs text-gray-500 font-bold block">PROGRAMADAS AL CORTE</span><span className="text-2xl font-black">{ultimaFicha.obrasProgramadasAlCorte || 0}</span></div>
                  <div><span className="text-xs text-gray-500 font-bold block">FINALIZADAS</span><span className="text-2xl font-black">{ultimaFicha.intervencionesFinalizadas || 0}</span></div>
               </div>
               <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-xs font-bold">AVANCE RESPECTO A PROGRAMADO</span>
                  <span className="text-2xl font-black" style={{ color: obrasColor }}>{getAvancePct(ultimaFicha.intervencionesFinalizadas, ultimaFicha.obrasProgramadasAlCorte)}%</span>
               </div>
               <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-6">
                  <div className="h-full" style={{ width: \\%\, backgroundColor: obrasColor }}></div>
               </div>
               <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="border border-gray-200 rounded-lg p-2">
                     <span className="text-xs text-gray-500 font-bold block">KM CARRIL INTERVENIDO</span>
                     <span className="text-2xl font-black">{ultimaFicha.kmCarrilIntervenido || 0}</span>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-2">
                     <span className="text-xs text-gray-500 font-bold block">M² INTERVENIDOS</span>
                     <span className="text-2xl font-black">{ultimaFicha.kmIntervenidos || 0}</span>
                  </div>
               </div>
            </div>
          ), ultimaFicha.avancesObras, ultimaFicha.alertaObras)}

          {/* 3. ROLLOS */}
          {renderCard('3. ROLLOS LEGENDARIOS', rollosColor, (
            <div className="flex items-center gap-6">
               {renderGauge(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte || ultimaFicha.totalRollos, rollosColor)}
               <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-center border-b pb-1">
                     <span className="text-sm font-bold text-gray-700">Total rollos</span>
                     <span className="text-xl font-black">{ultimaFicha.totalRollos || 0}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-1">
                     <span className="text-sm font-bold text-gray-700">Resueltos</span>
                     <span className="text-xl font-black text-red-600">{ultimaFicha.rollosResueltos || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                     <span className="text-sm font-bold text-gray-700">En curso</span>
                     <span className="text-xl font-black text-red-600">{ultimaFicha.rollosEnCurso || 0}</span>
                  </div>
               </div>
            </div>
          ), ultimaFicha.avancesRollos, ultimaFicha.alertaRollos)}

          {/* 4. RESIDUOS */}
          {renderCard('4. ESPACIO PÚBLICO - RESIDUOS', residColor, (
            <div>
               <div className="grid grid-cols-2 gap-4 text-center border-b pb-4 mb-4">
                  <div>
                     <span className="text-xs text-gray-500 font-bold block uppercase">Puntos Priorizados</span>
                     <span className="text-3xl font-black text-red-600">{ultimaFicha.puntosCriticosPriorizados || 0}</span>
                  </div>
                  <div className="border-l">
                     <span className="text-xs text-gray-500 font-bold block uppercase">Puntos Sostenidos</span>
                     <span className="text-3xl font-black text-red-600">{ultimaFicha.puntosSostenidos || 0}</span>
                  </div>
               </div>
               
               <div className="flex justify-between text-xs font-bold mb-1 px-2">
                 <span>0%</span>
                 <span style={{ color: residColor }}>{getAvancePct(ultimaFicha.puntosSostenidos, (ultimaFicha.puntosSostenidosProgramados||0)*0.85)}% (Cumplimiento)</span>
                 <span>100%</span>
               </div>
               <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-4">
                  <div className="h-full" style={{ width: \\%\, backgroundColor: residColor }}></div>
               </div>

               <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="border p-2 rounded">
                    <span className="block font-bold text-red-600 text-lg">{ultimaFicha.personasSensibilizadas || 0}</span>
                    <span className="text-[10px] text-gray-500">Personas sensibilizadas</span>
                  </div>
                  <div className="border p-2 rounded">
                    <span className="block font-bold text-red-600 text-lg">{ultimaFicha.operativosIVC || 0}</span>
                    <span className="text-[10px] text-gray-500">Operativos IVC</span>
                  </div>
                  <div className="border p-2 rounded">
                    <span className="block font-bold text-red-600 text-lg">{ultimaFicha.accionesReportadas || 0}</span>
                    <span className="text-[10px] text-gray-500">Intervenciones reportadas</span>
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
                  <div className="text-center border-r pr-4">
                     <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Sostenibilidad Efectiva</span>
                     {renderGauge(ultimaFicha.puntosSostenibilidadEfectiva, (ultimaFicha.puntosProgramadosSostenibilidad || 0) * 0.85, orgColor)}
                     <div className="mt-4">
                       <span className="font-bold text-lg text-red-600">{ultimaFicha.puntosSostenibilidadEfectiva || 0} de {ultimaFicha.puntosVerificados || 0}</span>
                       <span className="block text-[10px] text-gray-500">puntos con sostenibilidad</span>
                     </div>
                  </div>
                  <div className="text-center border-r pr-4">
                     <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Distribución Operativos</span>
                     <div className="h-24 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={[
                              { value: ultimaFicha.orgParqueo || 0, color: '#FFCD00' },
                              { value: ultimaFicha.ventaInformal || 0, color: '#dc2626' }
                            ]} innerRadius={25} outerRadius={40} dataKey="value" stroke="none">
                              {[{color:'#FFCD00'}, {color:'#dc2626'}].map((e, i) => <Cell key={i} fill={e.color} />)}
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
                       <span className="text-xs font-bold">Intervenciones reportadas</span>
                       <span className="font-black text-red-600 text-lg">{ultimaFicha.puntosIntervenidos || 0}</span>
                     </div>
                     <div className="flex justify-between border-b pb-2">
                       <span className="text-xs font-bold">M² recuperados</span>
                       <span className="font-black text-red-600 text-lg">{ultimaFicha.m2RecuperadosInformal || 0}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-xs font-bold">Personas reubicadas</span>
                       <span className="font-black text-red-600 text-lg">{ultimaFicha.personasReubicadas || 0}</span>
                     </div>
                  </div>
               </div>
             ), ultimaFicha.avancesVenta, ultimaFicha.alertaEspacioVenta)}
          </div>

          {/* 6. ACTUACIONES */}
          {renderCard('6. ACTUACIONES ADMINISTRATIVAS', actColor, (
            <div className="flex justify-around items-end">
               <div className="text-center">
                  <span className="font-bold text-sm block mb-2">ARCHIVOS</span>
                  {renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, archColor)}
                  <div className="mt-4 text-[10px] font-bold text-gray-700">
                    <span className="block text-gray-500">Meta anual: {ultimaFicha.metaArchivos || 0}</span>
                  </div>
               </div>
               <div className="text-center">
                  <span className="font-bold text-sm block mb-2">FALLOS 1ª INSTANCIA</span>
                  {renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, fallosColor)}
                  <div className="mt-4 text-[10px] font-bold text-gray-700">
                    <span className="block text-gray-500">Meta anual: {ultimaFicha.metaFallos || 0}</span>
                  </div>
               </div>
            </div>
          ), ultimaFicha.avancesActuaciones, ultimaFicha.alertaActuaciones)}

          {/* 7. CONVIVENCIA */}
          {renderCard('7. CONVIVENCIA Y SEGURIDAD', convColor, (
            <div>
               <div className="grid grid-cols-2 gap-4 text-center border-b pb-4 mb-4">
                  <div>
                     <span className="text-[10px] text-gray-500 font-bold block uppercase">Meta Total</span>
                     <span className="text-3xl font-black text-red-600">{ultimaFicha.motosMetaTotal || 0}</span>
                  </div>
                  <div className="border-l">
                     <span className="text-[10px] text-gray-500 font-bold block uppercase">Avance de entrega</span>
                     <span className="text-3xl font-black" style={{ color: convColor }}>{getAvancePct(motosReal, ultimaFicha.motosProgramadasCorte)}%</span>
                  </div>
               </div>
               <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                  <div className="border border-gray-100 bg-gray-50 p-1 rounded">
                    <div className="w-2 h-2 bg-green-600 rounded-full mx-auto mb-1"></div>
                    Entregadas Policía<br/><span className="font-bold text-sm">{ultimaFicha.motosEntregadasPolicia || 0}</span>
                  </div>
                  <div className="border border-gray-100 bg-gray-50 p-1 rounded">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mx-auto mb-1"></div>
                    Entregadas SDSCJ<br/><span className="font-bold text-sm">{ultimaFicha.motosEntregadas || 0}</span>
                  </div>
                  <div className="border border-gray-100 bg-gray-50 p-1 rounded">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mx-auto mb-1"></div>
                    Almacén FDL<br/><span className="font-bold text-sm">{ultimaFicha.motosAlmacenFdl || 0}</span>
                  </div>
                  <div className="border border-gray-100 bg-gray-50 p-1 rounded">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mx-auto mb-1"></div>
                    Pendientes FDL<br/><span className="font-bold text-sm">{ultimaFicha.motosPendientesFdl || 0}</span>
                  </div>
               </div>
            </div>
          ), ultimaFicha.avancesConvivencia, ultimaFicha.alertaConvivencia)}

          {/* 8. ESTRATEGIAS (Debe estar de ultimo en pagina 2 por instruccion) */}
          <div className="col-span-2">
            {renderCard('8. ESTRATEGIAS DE MEMORIA', memColor, (
              <div className="flex items-center gap-6">
                 {renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte || ultimaFicha.estrategiasTotal, memColor)}
                 <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center border-b pb-1">
                       <span className="text-sm font-bold text-gray-700">Total</span>
                       <span className="text-xl font-black">{ultimaFicha.estrategiasTotal || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1">
                       <span className="text-sm font-bold text-gray-700">Resueltas</span>
                       <span className="text-xl font-black text-red-600">{ultimaFicha.estrategiasResueltas || 0}</span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                       <span className="text-sm font-bold text-gray-700">En formulación</span>
                       <span className="text-xl font-black text-red-600">{ultimaFicha.estrategiasFormulacion || 0}</span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                       <span className="text-sm font-bold text-gray-700">Con ajustes</span>
                       <span className="text-xl font-black text-red-600">{ultimaFicha.estrategiasAjustes || 0}</span>
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
\;

fs.writeFileSync('D:/Transformacion/frontend/src/components/gestion/FichasDecoradas.tsx', code);
console.log('FichasDecoradas replaced');
