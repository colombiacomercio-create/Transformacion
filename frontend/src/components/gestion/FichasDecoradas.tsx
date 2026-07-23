import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  ultimaFicha: any;
}

export default function FichasDecoradas({ ultimaFicha }: Props) {
  if (!ultimaFicha) return null;

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
    { name: 'Motos Contratadas', value: ultimaFicha.motosContratadas ?? 0, color: '#dc2626' },
    { name: 'Pendientes FDL', value: ultimaFicha.motosPendientesFdl ?? 0, color: '#FFCD00' },
    { name: 'En almacén FDL', value: ultimaFicha.motosAlmacenFdl ?? 0, color: '#d1d5db' },
    { name: 'Motos entregadas', value: ultimaFicha.motosEntregadas ?? 0, color: '#7f1d1d' },
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
    { name: 'Restante', value: Math.max(0.1, 100 - archVal), color: '#ffffff' }
  ];
  
  const fallosVal = ultimaFicha.fallosPrimeraEstanciaPct ?? 0;
  const fallosData = [
    { name: 'Fallos 1° estancia', value: fallosVal, color: '#FFCD00' },
    { name: 'Restante', value: Math.max(0.1, 100 - fallosVal), color: '#ffffff' }
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
                    <span className="bg-white text-gray-800 text-sm font-bold px-4 py-1 rounded-full relative top-3 z-10 border shadow-sm text-center">Compromisos</span>
                    <div className="relative h-32 w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={compromisosData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                            {compromisosData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      {ultimaFicha.metaCompromisosPct !== undefined && ultimaFicha.metaCompromisosPct !== null && (
                         <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}>
                            <div className="absolute border-t-2 border-red-500 border-dashed w-[55px] origin-right" style={{
                               top: '100%', left: 'calc(50% - 55px)', transform: `rotate(${180 - (ultimaFicha.metaCompromisosPct * 180 / 100)}deg)`
                            }}></div>
                         </div>
                      )}
                    </div>
                    <span className="text-white font-bold text-xl mt-[-20px]">{compromisosVal}%</span>
                    {ultimaFicha.metaCompromisosPct !== undefined && ultimaFicha.metaCompromisosPct !== null && (
                       <span className="text-red-200 text-[10px] text-center mt-1 font-semibold leading-tight">{ultimaFicha.metaCompromisosPct}% programados</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center relative">
                    <span className="bg-white text-gray-800 text-sm font-bold px-4 py-1 rounded-full relative top-3 z-10 border shadow-sm text-center">Giros</span>
                    <div className="relative h-32 w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={girosData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                            {girosData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      {ultimaFicha.metaGirosPct !== undefined && ultimaFicha.metaGirosPct !== null && (
                         <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}>
                            <div className="absolute border-t-2 border-red-500 border-dashed w-[55px] origin-right" style={{
                               top: '100%', left: 'calc(50% - 55px)', transform: `rotate(${180 - (ultimaFicha.metaGirosPct * 180 / 100)}deg)`
                            }}></div>
                         </div>
                      )}
                    </div>
                    <span className="text-white font-bold text-xl mt-[-20px]">{girosVal}%</span>
                    {ultimaFicha.metaGirosPct !== undefined && ultimaFicha.metaGirosPct !== null && (
                       <span className="text-red-200 text-[10px] text-center mt-1 font-semibold leading-tight">{ultimaFicha.metaGirosPct}% programados</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/40 mt-6 pt-4 relative">
                   <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 text-sm font-bold px-4 py-1 rounded-full border shadow-sm text-center">
                     Procesos contractuales
                   </div>
                   <div className="flex justify-between items-end mt-6 text-white text-center">
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
                  <span className="text-sm font-bold text-gray-800">Realizados</span>
                  <span className="text-2xl font-black text-gray-800 leading-none">{comRealizados}</span>
                  
                  <div className="relative h-40 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={comitesData} innerRadius={40} outerRadius={60} paddingAngle={0} dataKey="value" stroke="none">
                          {comitesData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    {comRealizados > 0 && comMeta > 0 && (
                      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center justify-center">
                         <div className="absolute w-[120px] h-0 border-t-2 border-red-500 border-dashed" style={{
                            transform: `rotate(${-90 + ((comMeta / Math.max(comRealizados, comMeta)) * 360)}deg)`
                         }}></div>
                      </div>
                    )}
                  </div>
                  
                  <span className="text-sm font-bold text-gray-800">Meta comités</span>
                  <span className="text-lg font-black text-gray-800 leading-none">{comMeta}</span>
                  <span className="text-red-500 text-[10px] text-center mt-1 font-semibold">{comMeta} comités prog.</span>
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
          
          {/* CONVIVENCIA Y SEGURIDAD */}
          <div className="bg-[#e3182d] rounded-xl overflow-hidden shadow-sm">
             <h3 className="bg-[#e3182d] text-white text-center font-bold text-xl py-3 uppercase tracking-wide">
                Convivencia y seguridad
             </h3>
             <div className="bg-white p-4 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="flex flex-col bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
                      <div className="bg-white rounded py-2 shadow-sm font-bold text-sm w-full text-center mb-4 text-gray-800">
                        Motos Contratadas / Entregadas
                      </div>
                      <div className="flex flex-col items-center flex-1 justify-end">
                         <div className="w-full h-32 mb-4">
                           <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                               <Pie data={[
                                 { name: 'Entregadas', value: ultimaFicha.motosEntregadas ?? 0, color: '#7f1d1d' },
                                 { name: 'Faltantes', value: Math.max(0, (ultimaFicha.motosContratadas ?? 0) - (ultimaFicha.motosEntregadas ?? 0)), color: '#f3f4f6' }
                               ]} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={40} outerRadius={60} paddingAngle={0} dataKey="value" stroke="none">
                                 {[
                                 { name: 'Entregadas', value: ultimaFicha.motosEntregadas ?? 0, color: '#7f1d1d' },
                                 { name: 'Faltantes', value: Math.max(0, (ultimaFicha.motosContratadas ?? 0) - (ultimaFicha.motosEntregadas ?? 0)), color: '#f3f4f6' }
                                 ].map((e, i) => <Cell key={i} fill={e.color} />)}
                               </Pie>
                             </PieChart>
                           </ResponsiveContainer>
                         </div>
                         <div className="flex justify-around w-full mt-2 gap-2 text-center">
                            <div className="flex flex-col items-center">
                               <span className="text-xs font-bold text-gray-500">Contratadas</span>
                               <span className="text-xl font-black text-[#dc2626]">{ultimaFicha.motosContratadas}</span>
                            </div>
                            <div className="flex flex-col items-center">
                               <span className="text-xs font-bold text-gray-500">Entregadas</span>
                               <span className="text-xl font-black text-[#7f1d1d]">{ultimaFicha.motosEntregadas}</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
                      <div className="bg-white rounded py-2 shadow-sm font-bold text-sm w-full text-center mb-4 text-gray-800">
                        Motos en Proceso FDL
                      </div>
                      <div className="flex flex-col items-center flex-1 justify-end">
                         <div className="w-full h-32 mb-4">
                           <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                               <Pie data={[
                                 { name: 'Pendientes', value: ultimaFicha.motosPendientesFdl ?? 0, color: '#FFCD00' },
                                 { name: 'En almacén', value: ultimaFicha.motosAlmacenFdl ?? 0, color: '#9ca3af' }
                               ]} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
                                 {[
                                 { name: 'Pendientes', value: ultimaFicha.motosPendientesFdl ?? 0, color: '#FFCD00' },
                                 { name: 'En almacén', value: ultimaFicha.motosAlmacenFdl ?? 0, color: '#9ca3af' }
                                 ].map((e, i) => <Cell key={i} fill={e.color} />)}
                               </Pie>
                             </PieChart>
                           </ResponsiveContainer>
                         </div>
                         <div className="flex justify-around w-full mt-2 gap-2 text-center">
                            <div className="flex flex-col items-center">
                               <span className="text-xs font-bold text-gray-500 leading-tight">Pendientes<br/>FDL</span>
                               <span className="text-xl font-black text-[#FFCD00]">{ultimaFicha.motosPendientesFdl}</span>
                            </div>
                            <div className="flex flex-col items-center">
                               <span className="text-xs font-bold text-gray-500 leading-tight">En almacén<br/>FDL</span>
                               <span className="text-xl font-black text-gray-500">{ultimaFicha.motosAlmacenFdl}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
             {ultimaFicha.alertaConvivencia && (
                <div className="bg-gray-100 p-3 text-xs text-gray-800 mx-4 mb-4 rounded border">
                  <strong>Alertas:</strong> {ultimaFicha.alertaConvivencia}
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

          {/* ACTUACIONES */}
          <div className="bg-[#e3182d] rounded-xl overflow-hidden shadow-sm">
             <h3 className="bg-[#e3182d] text-white text-center font-bold text-xl py-3 uppercase tracking-wide">
                Actuaciones
             </h3>
             <div className="bg-white p-4 m-4 rounded-xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   
                   {/* Columna Archivos */}
                   <div className="flex flex-col bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
                      <div className="bg-white rounded py-2 shadow-sm font-bold text-sm w-full text-center mb-4 text-gray-800">
                        Archivos
                      </div>
                      
                      <div className="flex flex-col items-center relative flex-1 justify-end">
                         <div className="relative w-full h-24 mb-4">
                           <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                               <Pie data={archData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={40} outerRadius={60} paddingAngle={0} dataKey="value" stroke="none">
                                 {archData.map((e, i) => <Cell key={i} fill={e.color} />)}
                               </Pie>
                             </PieChart>
                           </ResponsiveContainer>
                           {ultimaFicha.metaArchivos !== undefined && ultimaFicha.metaArchivos !== null && (
                             <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}>
                                <div className="absolute border-t-2 border-red-500 border-dashed w-[60px] origin-right" style={{
                                   top: '100%', left: 'calc(50% - 60px)', transform: `rotate(${180 - (Math.min(100, ultimaFicha.metaArchivos) * 180 / 100)}deg)`
                                }}></div>
                             </div>
                           )}
                         </div>
                         <div className="relative w-full mt-2">
                           <div className="text-xs text-white font-medium text-center bg-[#dc2626] px-2 py-3 rounded-lg shadow-inner w-full border border-red-800 leading-tight">
                             Meta 11 anual:<br/><span className="text-sm font-bold">{ultimaFicha.metaArchivos?.toLocaleString('es-CO')}</span>
                           </div>
                           <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                              <span className="text-white font-bold text-lg bg-[#dc2626] px-3 py-1 rounded-md shadow-md border border-red-800">{archVal}%</span>
                           </div>
                         </div>
                         {ultimaFicha.metaArchivos !== undefined && ultimaFicha.metaArchivos !== null && (
                            <span className="text-red-500 text-[10px] text-center mt-2 font-semibold leading-tight">{ultimaFicha.metaArchivos}% programados</span>
                         )}
                      </div>
                   </div>

                   {/* Columna Fallos */}
                   <div className="flex flex-col bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
                      <div className="bg-white rounded py-2 shadow-sm font-bold text-sm w-full text-center leading-tight mb-4 text-gray-800">
                        Fallos 1° estancia
                      </div>
                      
                      <div className="flex flex-col items-center relative flex-1 justify-end">
                         <div className="relative w-full h-24 mb-4">
                           <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                               <Pie data={fallosData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={40} outerRadius={60} paddingAngle={0} dataKey="value" stroke="none">
                                 {fallosData.map((e, i) => <Cell key={i} fill={e.color} />)}
                               </Pie>
                             </PieChart>
                           </ResponsiveContainer>
                           {ultimaFicha.metaFallos !== undefined && ultimaFicha.metaFallos !== null && (
                             <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}>
                                <div className="absolute border-t-2 border-red-500 border-dashed w-[60px] origin-right" style={{
                                   top: '100%', left: 'calc(50% - 60px)', transform: `rotate(${180 - (Math.min(100, ultimaFicha.metaFallos) * 180 / 100)}deg)`
                                }}></div>
                             </div>
                           )}
                         </div>
                         <div className="relative w-full mt-2">
                           <div className="text-xs text-gray-800 font-medium text-center bg-[#FFCD00] px-2 py-3 rounded-lg shadow-inner w-full border border-yellow-600 leading-tight">
                             Meta 12 anual:<br/><span className="text-sm font-bold">{ultimaFicha.metaFallos?.toLocaleString('es-CO')}</span>
                           </div>
                           <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                              <span className="text-gray-900 font-bold text-lg bg-[#FFCD00] px-3 py-1 rounded-md shadow-md border border-yellow-600">{fallosVal}%</span>
                           </div>
                         </div>
                         {ultimaFicha.metaFallos !== undefined && ultimaFicha.metaFallos !== null && (
                            <span className="text-red-500 text-[10px] text-center mt-2 font-semibold leading-tight">{ultimaFicha.metaFallos}% programados</span>
                         )}
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
      </div>
    </div>
  );
}
