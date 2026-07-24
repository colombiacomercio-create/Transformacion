import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  ultimaFicha: any;
}

export default function FichasDecoradas({ ultimaFicha }: Props) {
  if (!ultimaFicha) return null;

  const renderNeedle = (pct: number, radius: number = 60) => {
    const safePct = Math.min(100, Math.max(0, pct));
    const angleDeg = 180 - (safePct * 180 / 100);
    // CSS rotation: 0% = -90deg (left), 50% = 0deg (up), 100% = 90deg (right)
    const rotateDeg = (safePct * 180 / 100) - 90;
    const length = radius + 5;
    
    return (
      <div 
        className="absolute z-10"
        style={{
          bottom: 0,
          left: '50%',
          width: '2px',
          height: `${length}px`,
          transformOrigin: 'bottom center',
          transform: `translateX(-50%) rotate(${rotateDeg}deg)`,
          borderLeft: '2px dashed red'
        }}
      />
    );
  };

  // Donut data: Compromisos
  const compromisosVal = ultimaFicha.compromisosPct ?? 0;
  const compromisosData = [
    { name: 'Avance', value: compromisosVal, color: '#FFCD00' },
    { name: 'Restante', value: 100 - compromisosVal, color: '#e5e7eb' }
  ];

  // Donut data: Giros
  const girosVal = ultimaFicha.girosPct ?? 0;
  const girosData = [
    { name: 'Avance', value: girosVal, color: '#9ca3af' },
    { name: 'Restante', value: 100 - girosVal, color: '#e5e7eb' }
  ];

  // Comites data
  const comRealizados = ultimaFicha.comitesRealizados ?? 0;
  const comMeta = ultimaFicha.comitesMeta ?? 1;
  const comitesData = [
    { name: 'Realizados', value: comRealizados, color: '#FFCD00' },
    { name: 'Pendientes', value: Math.max(0.1, comMeta - comRealizados), color: '#d1d5db' }
  ];

  // Venta informal vs Org parqueo
  const ventaInformal = ultimaFicha.ventaInformal ?? 0;
  const orgParqueo = ultimaFicha.orgParqueo ?? 0;
  const espacioData = [
    { name: 'Venta informal', value: ventaInformal, color: '#dc2626' },
    { name: 'Org parqueo', value: orgParqueo, color: '#FFCD00' }
  ];

  // Convivencia
    const convivenciaData = [
    { name: 'Entregadas a la Policia (2025)', value: ultimaFicha.motosEntregadasPolicia ?? 0, color: '#16a34a' },
    { name: 'Entregadas a SDSCJ (2026)', value: ultimaFicha.motosEntregadas ?? 0, color: '#facc15' },
    { name: 'En almacen FDL', value: ultimaFicha.motosAlmacenFdl ?? 0, color: '#ca8a04' },
    { name: 'Pendientes entrega FDL', value: ultimaFicha.motosPendientesFdl ?? 0, color: '#dc2626' },
  ];

  // Rollos legendarios
  const rollosData = [
    { name: 'Resueltos', value: ultimaFicha.rollosResueltos ?? 0, color: '#FFCD00' },
    { name: 'En curso', value: Math.max(0.1, ultimaFicha.rollosEnCurso ?? 1), color: '#e5e7eb' }
  ];

  // Estrategias
  const estResueltas = ultimaFicha.estrategiasResueltas ?? 0;
  const estForm = Math.max(0.1, ultimaFicha.estrategiasFormulacion ?? 1);
  const estData = [
    { name: 'Resueltas', value: estResueltas, color: '#dc2626' },
    { name: 'En formulación', value: estForm, color: '#e5e7eb' }
  ];

  // Fallos & Archivos (Actuaciones)
  const archVal = ultimaFicha.archivosPct ?? 0;
  const archData = [
    { name: 'Archivos', value: archVal, color: '#dc2626' },
    { name: 'Restante', value: Math.max(0.1, 100 - archVal), color: '#d1d5db' }
  ];
  
  const fallosVal = ultimaFicha.fallosPrimeraEstanciaPct ?? 0;
  const fallosData = [
    { name: 'Fallos 1° estancia', value: fallosVal, color: '#FFCD00' },
    { name: 'Restante', value: Math.max(0.1, 100 - fallosVal), color: '#d1d5db' }
  ];

  return (
    <div className="w-full bg-white font-sans max-w-[1200px] mx-auto rounded-xl p-8 shadow-sm">
      <div className="flex justify-between items-start mb-8 border-b-4 border-red-600 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1a3622] tracking-tighter uppercase">
            Transformación Local
          </h1>
          <h2 className="text-3xl md:text-4xl font-light text-gray-500">
            Unidad de Transformación
          </h2>
        </div>
        <img src="/Logo_sede_electronica_SDG.png" alt="Alcaldía de Bogotá" className="h-14 object-contain" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="space-y-6">
          {/* EJECUCIÓN PRESUPUESTAL & COMITÉS */}
          <div className="bg-[#e3182d] rounded-2xl overflow-hidden shadow-lg border-2 border-[#e3182d]">
            <h3 className="bg-[#e3182d] text-white text-center font-bold text-xl py-3 uppercase tracking-wide">
              Ejecución presupuestal
            </h3>
            
            <div className="p-4">
              <div className="bg-transparent border border-white/40 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center relative">
                    <h4 className="text-white font-black text-lg uppercase tracking-wider text-center drop-shadow-sm mt-2">Compromisos</h4>
                    <div className="relative h-28 w-full mt-2 mb-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={compromisosData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                            {compromisosData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      {ultimaFicha.metaCompromisosPct !== undefined && ultimaFicha.metaCompromisosPct !== null && renderNeedle(ultimaFicha.metaCompromisosPct, 85)}
                    </div>
                    <div className="flex justify-around w-full pb-2">
                       <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-white mb-1">Avance</span>
                          <span className="text-xl font-black text-[#FFCD00] leading-none">{compromisosVal}%</span>
                       </div>
                       <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-white mb-1">Programado</span>
                          <span className="text-xl font-black text-white leading-none">{ultimaFicha.metaCompromisosPct ?? 0}%</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center relative">
                    <h4 className="text-white font-black text-lg uppercase tracking-wider text-center drop-shadow-sm mt-2">Giros</h4>
                    <div className="relative h-28 w-full mt-2 mb-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={girosData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                            {girosData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      {ultimaFicha.metaGirosPct !== undefined && ultimaFicha.metaGirosPct !== null && renderNeedle(ultimaFicha.metaGirosPct, 85)}
                    </div>
                    <div className="flex justify-around w-full pb-2">
                       <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-white mb-1">Avance</span>
                          <span className="text-xl font-black text-[#9ca3af] leading-none">{girosVal}%</span>
                       </div>
                       <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-white mb-1">Programado</span>
                          <span className="text-xl font-black text-white leading-none">{ultimaFicha.metaGirosPct ?? 0}%</span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/40 mt-6 pt-4 relative">
                     <h4 className="text-white font-bold text-sm uppercase tracking-wider text-center mb-4">Procesos contractuales</h4>
                     <div className="flex justify-between items-end text-white text-center">
                      <div className="flex-1">
                         <span className="text-xs font-bold block mb-1">Monitoreados</span>
                         <span className="text-4xl font-black">{ultimaFicha.procesosMonitoreados ?? 0}</span>
                      </div>
                      <div className="flex-1 border-l border-white/30 pl-2">
                         <span className="text-xs font-bold block mb-1 leading-tight">requieren Comité de<br/>Contratación</span>
                         <span className="text-4xl font-black">{ultimaFicha.procesosRequierenComite ?? 0}</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Comités de contratación integrados */}
              <div className="bg-white rounded-xl overflow-hidden mt-4 shadow-sm border border-gray-200">
                <h4 className="bg-[#e3182d] text-white text-center font-bold text-md py-2 uppercase tracking-wide">
                  Comites de contratación
                </h4>
                <div className="p-4 flex flex-col items-center">
                  <div className="relative h-28 w-full mb-2 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={comitesData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                          {comitesData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    {comRealizados > 0 && comMeta > 0 && renderNeedle((comRealizados / comMeta) * 100, 85)}
                  </div>
                  
                  <div className="flex justify-around w-full mt-4">
                     <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-gray-800">Realizados</span>
                        <span className="text-2xl font-black text-[#FFCD00] leading-none">{comRealizados}</span>
                     </div>
                     <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-gray-800">Meta comités</span>
                        <span className="text-2xl font-black text-gray-800 leading-none">{comMeta}</span>
                     </div>
                  </div>
                </div>
                {ultimaFicha.alertaComites && (
                  <div className="bg-gray-100 p-4 text-xs text-gray-800 m-2 rounded">
                    <strong>Alerta:</strong> {ultimaFicha.alertaComites}
                  </div>
                )}
                
              </div>
              
              {/* Alerta ejecución general */}
              {ultimaFicha.alertaEjecucion && (
                <div className="bg-white/10 border border-white/30 text-white p-3 rounded mt-4 text-xs">
                  <strong>Alertas Ejecución:</strong> {ultimaFicha.alertaEjecucion}
                </div>
              )}
            </div>
            
          </div>
          
          {/* ESPACIO PÚBLICO - RESIDUOS */}
          <div className="bg-[#e3182d] rounded-xl overflow-hidden shadow-sm">
             <h3 className="bg-[#e3182d] text-white text-center font-bold text-xl py-3 uppercase tracking-wide">
                Espacio público - Residuos
             </h3>
             <div className="bg-white p-4">
                <div className="border border-[#e3182d] rounded-lg mb-4 overflow-hidden">
                   <div className="flex items-center justify-between p-4 border-b border-[#e3182d]">
                      <span className="text-5xl font-black text-[#e3182d]">{ultimaFicha.accionesReportadas?.toLocaleString('es-CO') ?? 0}</span>
                      <span className="text-right text-gray-700 text-lg leading-tight">Intervenciones<br/>reportadas</span>
                   </div>
                   <div className="flex items-center justify-between p-4 border-b border-[#e3182d]">
                      <span className="text-5xl font-black text-[#e3182d]">{ultimaFicha.residuosM3?.toLocaleString('es-CO') ?? 0} <span className="text-3xl">m³</span></span>
                      <span className="text-right text-gray-700 text-lg leading-tight">Residuos<br/>recolectados</span>
                   </div>
                   <div className="flex items-center justify-between p-4">
                      <span className="text-5xl font-black text-[#e3182d]">{ultimaFicha.espacioPublicoM2?.toLocaleString('es-CO') ?? 0} <span className="text-3xl">m²</span></span>
                      <span className="text-right text-gray-700 text-lg leading-tight">Espacio<br/>público<br/>recuperado</span>
                   </div>
                </div>
              </div>
              {ultimaFicha.alertaEspacioResiduos && (
                <div className="bg-gray-100 p-3 text-xs text-gray-800 mx-4 mb-4 rounded border">
                  <strong>Alertas:</strong> {ultimaFicha.alertaEspacioResiduos}
                </div>
              )}
              
           </div>

          {/* ACTUACIONES */}
          <div className="bg-[#e3182d] rounded-xl overflow-hidden shadow-sm">
             <h3 className="bg-[#e3182d] text-white text-center font-bold text-xl py-3 uppercase tracking-wide">
                Actuaciones Administrativas
             </h3>
             <div className="bg-white p-4 m-4 rounded-xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   
                   {/* Columna Archivos */}
                     <div className="flex flex-col bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
                        <h4 className="text-gray-800 font-black text-lg uppercase tracking-wide text-center mb-2 border-b-2 border-gray-200 pb-2">
                          Archivos
                        </h4>
                      
                      <div className="flex flex-col items-center relative flex-1 justify-end">
                         <div className="relative w-full h-28 mt-2 mb-2">
                           <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                               <Pie data={archData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={55} outerRadius={85} paddingAngle={0} dataKey="value" stroke="none">
                                 {archData.map((e, i) => <Cell key={i} fill={e.color} />)}
                               </Pie>
                             </PieChart>
                           </ResponsiveContainer>
                           {ultimaFicha.metaArchivosPct !== undefined && ultimaFicha.metaArchivosPct !== null && renderNeedle(ultimaFicha.metaArchivosPct, 85)}
                         </div>
                         
                         <div className="flex justify-around w-full pb-2">
                            <div className="flex flex-col items-center">
                               <span className="text-xs font-bold text-gray-800 mb-1">Avance</span>
                               <span className="text-xl font-black text-[#dc2626] leading-none">{archVal}%</span>
                            </div>
                            <div className="flex flex-col items-center">
                               <span className="text-xs font-bold text-gray-800 mb-1">Programado</span>
                               <span className="text-xl font-black text-gray-800 leading-none">{ultimaFicha.metaArchivosPct ?? 0}%</span>
                            </div>
                         </div>
                         
                         <div className="text-xs text-gray-700 font-medium text-center bg-white px-2 py-2 rounded-lg shadow-sm border border-gray-200 w-full mt-2">
                           Meta anual: <strong className="text-sm">{ultimaFicha.metaArchivos?.toLocaleString('es-CO')}</strong>
                         </div>
                      </div>
                   </div>

                   {/* Columna Fallos */}
                     <div className="flex flex-col bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
                        <h4 className="text-gray-800 font-black text-lg uppercase tracking-wide text-center mb-2 border-b-2 border-gray-200 pb-2">
                          Fallos 1ª estancia
                        </h4>
                      
                      <div className="flex flex-col items-center relative flex-1 justify-end">
                         <div className="relative w-full h-28 mt-2 mb-2">
                           <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                               <Pie data={fallosData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={55} outerRadius={85} paddingAngle={0} dataKey="value" stroke="none">
                                 {fallosData.map((e, i) => <Cell key={i} fill={e.color} />)}
                               </Pie>
                             </PieChart>
                           </ResponsiveContainer>
                           {ultimaFicha.metaFallosPct !== undefined && ultimaFicha.metaFallosPct !== null && renderNeedle(ultimaFicha.metaFallosPct, 85)}
                         </div>
                         
                         <div className="flex justify-around w-full pb-2">
                            <div className="flex flex-col items-center">
                               <span className="text-xs font-bold text-gray-800 mb-1">Avance</span>
                               <span className="text-xl font-black text-[#FFCD00] leading-none">{fallosVal}%</span>
                            </div>
                            <div className="flex flex-col items-center">
                               <span className="text-xs font-bold text-gray-800 mb-1">Programado</span>
                               <span className="text-xl font-black text-gray-800 leading-none">{ultimaFicha.metaFallosPct ?? 0}%</span>
                            </div>
                         </div>
                         
                         <div className="text-xs text-gray-700 font-medium text-center bg-white px-2 py-2 rounded-lg shadow-sm border border-gray-200 w-full mt-2">
                           Meta anual: <strong className="text-sm">{ultimaFicha.metaFallos?.toLocaleString('es-CO')}</strong>
                         </div>
                      </div>
                   </div>

                </div>
             </div>
             {ultimaFicha.alertaActuaciones && (
                <div className="bg-gray-100 p-3 text-xs text-gray-800 mx-4 mb-4 rounded border">
                  <strong>Alertas:</strong> {ultimaFicha.alertaActuaciones}
                </div>
              )}
              
          </div>
          {/* ESTRATEGIAS DE MEMORIA */}
          <div className="bg-[#e3182d] rounded-xl overflow-hidden shadow-sm">
             <h3 className="bg-[#e3182d] text-white text-center font-bold text-xl py-3 uppercase tracking-wide">
                Estrategias de memoria
             </h3>
             <div className="bg-white p-6 flex items-center justify-around">
                <div className="w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={estData} innerRadius={35} outerRadius={65} paddingAngle={0} dataKey="value" stroke="none">
                        {estData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-4">
                   <div>
                     <span className="text-sm font-bold text-gray-800 block">Resueltos</span>
                     <span className="text-5xl font-black text-[#e3182d]">{ultimaFicha.estrategiasResueltas}</span>
                   </div>
                   <div>
                     <span className="text-sm font-bold text-gray-800 block">En formulación</span>
                     <span className="text-4xl font-black text-black">{ultimaFicha.estrategiasFormulacion}</span>
                   </div>
                </div>
             </div>
             {ultimaFicha.alertaEstrategias && (
                <div className="bg-gray-100 p-3 text-xs text-gray-800 mx-4 mb-4 rounded border">
                  <strong>Alertas:</strong> {ultimaFicha.alertaEstrategias}
                </div>
             )}
             
          </div>

        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-6">

          {/* OBRAS LOCALES */}
          <div className="bg-[#e3182d] rounded-xl overflow-hidden shadow-sm">
             <h3 className="bg-[#e3182d] text-white text-center font-bold text-xl py-3 uppercase tracking-wide">
                Obras locales
             </h3>
             <div className="bg-white p-6 pb-2">
                <div className="flex flex-col gap-4">
                   <div className="flex items-center justify-between border-b pb-3">
                      <span className="text-lg text-gray-600 font-medium">Meta de<br/>obras</span>
                      <div className="flex-1 mx-4 flex items-center">
                         <div className="h-[2px] w-full bg-[#e3182d]"></div>
                         <div className="w-3 h-3 bg-[#e3182d]"></div>
                      </div>
                      <span className="text-4xl font-black text-[#e3182d]">{ultimaFicha.metaObras?.toLocaleString('es-CO') ?? 0}</span>
                   </div>
                   <div className="flex items-center justify-between border-b pb-3">
                      <span className="text-lg text-gray-600 font-medium">Intervenciones<br/>finalizadas</span>
                      <div className="flex-1 mx-4 flex items-center">
                         <div className="h-[2px] w-full bg-[#e3182d]"></div>
                         <div className="w-3 h-3 bg-[#e3182d]"></div>
                      </div>
                      <span className="text-4xl font-black text-[#e3182d]">{ultimaFicha.intervencionesFinalizadas ?? 0}</span>
                   </div>
                   <div className="flex items-center justify-between border-b pb-3">
                      <span className="text-lg text-gray-600 font-medium">Km carril<br/>intervenido</span>
                      <div className="flex-1 mx-4 flex items-center">
                         <div className="h-[2px] w-full bg-[#e3182d]"></div>
                         <div className="w-3 h-3 bg-[#e3182d]"></div>
                      </div>
                      <span className="text-4xl font-black text-[#e3182d]">{ultimaFicha.kmCarrilIntervenido ?? 0}</span>
                   </div>
                   <div className="flex items-center justify-between pb-3">
                      <span className="text-lg text-gray-600 font-medium">m²<br/>intervenidos</span>
                      <div className="flex-1 mx-4 flex items-center">
                         <div className="h-[4px] w-full bg-[#e3182d]"></div>
                         <div className="w-4 h-4 bg-[#e3182d]"></div>
                      </div>
                      <span className="text-5xl font-black text-[#e3182d]">{ultimaFicha.kmIntervenidos?.toLocaleString('es-CO') ?? 0}</span>
                   </div>
                </div>
             </div>
             {ultimaFicha.alertaObras && (
                <div className="bg-gray-100 p-3 text-xs text-gray-800 mx-4 mb-4 rounded border">
                  <strong>Alertas:</strong> {ultimaFicha.alertaObras}
                </div>
             )}
             
          </div>

          {/* ROLLOS LEGENDARIOS */}
          <div className="bg-[#e3182d] rounded-xl overflow-hidden shadow-sm">
             <h3 className="bg-[#e3182d] text-white text-center font-bold text-xl py-3 uppercase tracking-wide">
                Rollos legendarios
             </h3>
             <div className="bg-white p-6 flex items-center justify-around">
                <div className="w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={rollosData} innerRadius={35} outerRadius={65} paddingAngle={0} dataKey="value" stroke="none">
                        {rollosData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-4">
                   <div>
                     <span className="text-sm font-bold text-gray-800 block">Resueltos</span>
                     <span className="text-5xl font-black text-[#e3182d]">{ultimaFicha.rollosResueltos}</span>
                   </div>
                   <div>
                     <span className="text-sm font-bold text-gray-800 block">En curso</span>
                     <span className="text-4xl font-black text-black">{ultimaFicha.rollosEnCurso}</span>
                   </div>
                </div>
             </div>
             {ultimaFicha.alertaRollos && (
                <div className="bg-gray-100 p-3 text-xs text-gray-800 mx-4 mb-4 rounded border">
                  <strong>Alerta:</strong> {ultimaFicha.alertaRollos}
                </div>
             )}
             
          </div>
           <div className="bg-[#e3182d] rounded-xl overflow-hidden shadow-sm">
             <h3 className="bg-[#e3182d] text-white text-center font-bold text-xl py-3 uppercase tracking-wide">
                Organización y Recuperación Espacio Público
             </h3>
             <div className="bg-white p-6 flex items-center justify-between relative h-64">
                <div className="absolute top-4 left-[40%] transform -translate-x-1/2 text-xs font-bold text-gray-800">Org parqueo <span className="block text-center">{orgParqueo}</span></div>
                <div className="absolute bottom-4 left-[40%] transform -translate-x-1/2 text-xs font-bold text-gray-800">Venta informal <span className="block text-center">{ventaInformal}</span></div>
                
                <div className="w-48 h-48 absolute left-[15%]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={espacioData} innerRadius={0} outerRadius={70} paddingAngle={0} dataKey="value" stroke="none">
                        {espacioData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex flex-col gap-6 items-end w-full pl-48 z-10">
                   <div className="text-right">
                      <span className="text-5xl font-black text-[#e3182d] block leading-none">{ultimaFicha.puntosIntervenidos ?? 0}</span>
                      <span className="text-lg text-gray-600 leading-tight block">Intervenciones<br/>reportadas</span>
                   </div>
                   <div className="text-right mt-2">
                      <span className="text-lg font-bold text-gray-700 block">{ultimaFicha.m2RecuperadosInformal?.toLocaleString('es-CO') ?? 0} m² recuperados</span>
                      <span className="text-lg font-bold text-gray-700 block">{ultimaFicha.personasReubicadas?.toLocaleString('es-CO') ?? 0} personas reubicadas</span>
                   </div>
                </div>
             </div>
             {ultimaFicha.alertaEspacioVenta && (
                <div className="bg-gray-100 p-3 text-xs text-gray-800 mx-4 mb-4 rounded border">
                  <strong>Alertas:</strong> {ultimaFicha.alertaEspacioVenta}
                </div>
              )}
              
           </div>

          {/* CONVIVENCIA Y SEGURIDAD */}
          <div className="bg-[#e3182d] rounded-xl overflow-hidden shadow-sm">
             <h3 className="bg-[#e3182d] text-white text-center font-bold text-xl py-3 uppercase tracking-wide">
                Convivencia y seguridad
             </h3>
                            <div className="bg-white p-4 flex items-center">
                  <div className="flex-1 space-y-2">
                       <div className="flex justify-between items-center px-2 py-1 mb-2 border-b-2 border-gray-100">
                          <span className="font-bold text-gray-700">Total Motos Contratadas</span>
                          <span className="font-black text-xl text-[#e3182d]">{ultimaFicha.motosContratadas}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#16a34a]"></div>
                             <span className="text-xs font-medium leading-tight text-gray-700">Entregadas a la Policia (2025)</span>
                          </div>
                          <span className="font-black text-sm text-gray-900">{ultimaFicha.motosEntregadasPolicia}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#facc15]"></div>
                             <span className="text-xs font-medium leading-tight text-gray-700">Entregadas a SDSCJ (2026)</span>
                          </div>
                          <span className="font-black text-sm text-gray-900">{ultimaFicha.motosEntregadas}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#ca8a04]"></div>
                             <span className="text-xs font-medium leading-tight text-gray-700">En almacen FDL</span>
                          </div>
                          <span className="font-black text-sm text-gray-900">{ultimaFicha.motosAlmacenFdl}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-[#dc2626]"></div>
                             <span className="text-xs font-medium leading-tight text-gray-700">Pendientes entrega FDL</span>
                          </div>
                          <span className="font-black text-sm text-gray-900">{ultimaFicha.motosPendientesFdl}</span>
                       </div>
                    </div>
                  <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={convivenciaData} innerRadius={40} outerRadius={70} paddingAngle={0} dataKey="value" stroke="none">
                        {convivenciaData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
             </div>
             {ultimaFicha.alertaConvivencia && (
                <div className="bg-gray-100 p-3 text-xs text-gray-800 mx-4 mb-4 rounded border">
                  <strong>Alertas:</strong> {ultimaFicha.alertaConvivencia}
                </div>
             )}
             
          </div>
          
        </div>
      </div>
    </div>
  );
}
