const fs = require('fs');

let c = fs.readFileSync('src/components/KanbanBoard.tsx', 'utf8');

const targetStr =   return (
    <div className="h-[calc(100vh-12rem)] flex flex-col relative">
      <div className="mb-4 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Panel de Actividades</h2>
        </div>
        <div className="flex gap-3 items-center">
          <input 
            type="text" 
            placeholder="Buscar por código..." 
            value={filtroTexto}
            onChange={e => setFiltroTexto(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm max-w-[150px] focus:ring-2 focus:ring-bogota-primary/30 outline-none"
          />
          <select 
            value={filtroObjetivo}
            onChange={(e) => setFiltroObjetivo(e.target.value)}
            className="border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm outline-none cursor-pointer max-w-[150px] truncate"
          >
            <option value="TODOS">Objetivos: Todos</option>
            {objetivosList.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select 
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
            className="border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm outline-none cursor-pointer max-w-[150px] truncate"
          >
            <option value="TODOS">Producto: Todos</option>
            {productosList.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select 
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm outline-none cursor-pointer"
          >
            <option value="TODOS">Estado: Todos</option>
            <option value="PENDIENTES">Pendientes de Iniciar</option>
            <option value="EN_REVISION">En Revisión Admin</option>
            <option value="COMPLETADA">Validada y Completada</option>
          </select>
          <select 
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm outline-none cursor-pointer"
          >
            <option value="TODAS">Fechas: Todas</option>
            <option value="VENCIDA">Vencidas</option>
            <option value="HOY">Vencen Hoy</option>
            <option value="PROXIMA_SEMANA">Vencen próximos 7 días</option>
            <option value="ESTE_MES">Vencen este mes</option>
          </select>
          {esAdminStr && (
             <button onClick={() => setMostrandoBandejaValidacion(!mostrandoBandejaValidacion)} className="bg-orange-100 border border-orange-200 text-orange-800 px-4 py-2 rounded-lg hover:bg-orange-200 text-sm font-bold flex items-center gap-2 transition-colors relative">
               <AlertCircle className="w-4 h-4" />
               Auditoría
               {validacionesPendientes.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center shadow">{validacionesPendientes.length}</span>}
             </button>
          )}

          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 shadow-sm relative group cursor-pointer">
             <div className="bg-white text-gray-700 px-3 py-1.5 rounded flex items-center gap-2 font-medium text-sm">
               <Download className="w-4 h-4" /> Exportar
             </div>
             <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 shadow-xl rounded-lg hidden group-hover:flex flex-col overflow-hidden z-50">
                <button onClick={() => exportToCSV(actividadesFiltradas, 'reporte_filtrado')} className="px-4 py-3 text-left hover:bg-gray-50 text-sm font-medium border-b border-gray-100 text-gray-700">Exportar Filtro Actual</button>
                <button onClick={() => exportToCSV(actividades, 'reporte_completo')} className="px-4 py-3 text-left hover:bg-gray-50 text-sm font-medium text-gray-700">Exportar Toda la Base</button>
             </div>
          </div>

          <button onClick={() => setMostrandoNuevaActividad(true)} className="bg-bogota-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-bold flex items-center gap-2 transition-colors shadow">
            <Plus className="w-4 h-4" />
            Nueva Actividad
          </button>
        </div>
      </div>;

const newHeaderStr =   return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 flex-shrink-0">
        
        {/* Fila 1: Título y Acciones */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Panel de Actividades</h2>
          <div className="flex flex-wrap items-center gap-3">
            {esAdminStr && (
               <button onClick={() => setMostrandoBandejaValidacion(!mostrandoBandejaValidacion)} className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2 rounded-lg hover:bg-orange-100 text-sm font-semibold flex items-center gap-2 transition-colors relative">
                 <AlertCircle className="w-4 h-4" />
                 Auditoría
                 {validacionesPendientes.length > 0 && <span className="absolute -top-2 -right-2 bg-bogota-primary text-white rounded-full text-[10px] font-bold w-5 h-5 flex items-center justify-center shadow">{validacionesPendientes.length}</span>}
               </button>
            )}

            <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 shadow-sm relative group cursor-pointer">
               <div className="bg-white text-gray-700 px-3 py-1.5 rounded flex items-center gap-2 font-medium text-sm">
                 <Download className="w-4 h-4" /> Exportar
               </div>
               <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 shadow-lg rounded-lg hidden group-hover:flex flex-col overflow-hidden z-50">
                  <button onClick={() => exportToCSV(actividadesFiltradas, 'reporte_filtrado')} className="px-4 py-3 text-left hover:bg-gray-50 text-sm font-medium border-b border-gray-100 text-gray-700">Exportar Filtro Actual</button>
                  <button onClick={() => exportToCSV(actividades, 'reporte_completo')} className="px-4 py-3 text-left hover:bg-gray-50 text-sm font-medium text-gray-700">Exportar Toda la Base</button>
               </div>
            </div>

            <button onClick={() => setMostrandoNuevaActividad(true)} className="bg-bogota-primary text-white px-4 py-2 rounded-lg hover:bg-red-800 text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              Nueva Actividad
            </button>
          </div>
        </div>

        {/* Fila 2: Buscador y Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <input 
            type="text" 
            placeholder="Buscar por código o nombre..." 
            value={filtroTexto}
            onChange={e => setFiltroTexto(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full min-w-[220px] focus:ring-2 focus:ring-bogota-secondary focus:border-bogota-secondary outline-none transition-shadow"
          />
          <select 
            value={filtroObjetivo}
            onChange={(e) => setFiltroObjetivo(e.target.value)}
            className="border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm outline-none cursor-pointer w-full focus:ring-2 focus:ring-bogota-secondary focus:border-bogota-secondary"
          >
            <option value="TODOS">Objetivos: Todos</option>
            {objetivosList.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select 
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
            className="border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm outline-none cursor-pointer w-full focus:ring-2 focus:ring-bogota-secondary focus:border-bogota-secondary"
          >
            <option value="TODOS">Producto: Todos</option>
            {productosList.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select 
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm outline-none cursor-pointer w-full focus:ring-2 focus:ring-bogota-secondary focus:border-bogota-secondary"
          >
            <option value="TODOS">Estado: Todos</option>
            <option value="PENDIENTES">Pendientes de Iniciar</option>
            <option value="EN_REVISIÓN">En Revisión Admin</option>
            <option value="COMPLETADA">Validada y Completada</option>
          </select>
          <select 
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm outline-none cursor-pointer w-full focus:ring-2 focus:ring-bogota-secondary focus:border-bogota-secondary"
          >
            <option value="TODAS">Fechas: Todas</option>
            <option value="VENCIDA">Vencidas</option>
            <option value="HOY">Vencen Hoy</option>
            <option value="PROXIMA_SEMANA">Vencen próximos 7 días</option>
            <option value="ESTE_MES">Vencen este mes</option>
          </select>
        </div>
      </div>;

c = c.replace(targetStr.replace(/\r\n/g, '\n'), newHeaderStr).replace(targetStr, newHeaderStr);


const targetStr2 =       <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {columnasDinamicas.map(col => (
          <div key={col.id} className={\lex-shrink-0 w-[22rem] rounded-xl border border-gray-200 flex flex-col \\}>
            <div className="p-4 border-b border-gray-200/50 flex justify-between items-center bg-white/70 rounded-t-xl">
              <h3 className="font-bold text-gray-800 text-sm">{col.titulo}</h3>
              <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-bogota-primary shadow-sm border border-gray-100">
                {actividadesFiltradas.filter(a => (a.hito?.programa ? \\ \\ : 'General') === col.id).length}
              </span>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
              {actividadesFiltradas.filter(a => (a.hito?.programa ? \\ \\ : 'General') === col.id).map(actividad => (
                <div key={actividad.id} onClick={() => setActividadSeleccionada(actividad)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer relative group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-bogota-primary bg-bogota-primary/10 px-2 py-1 rounded">
                      {actividad.codigoCompleto || 'SIN CODIGO'}
                    </span>
                    <button className="text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 text-sm leading-snug mb-3">
                    {actividad.nombre}
                  </h4>
                  
                  <div className="flex flex-col gap-2">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-bogota-secondary h-1.5 rounded-full" style={{ width: \\%\ }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        {actividad.estado === 'VENCIDA' ? (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        ) : actividad.estado === 'COMPLETADA' ? (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        ) : (
                          <Clock className="w-3 h-3 text-orange-500" />
                        )}
                        <span className="text-gray-500 font-medium">
                          {actividad.fechaLimite ? new Date(actividad.fechaLimite).toISOString().split('T')[0] : 'Sin fecha'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-medium" title="Evidencias Cargadas">
                        <FileText className="w-3 h-3" />
                        <span>{actividad.evidencias?.length || 0}/{actividad.tiposEvidenciaRequeridos?.length || 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {actividadesFiltradas.filter(a => (a.hito?.programa ? \\ \\ : 'General') === col.id).length === 0 && (
                <div className="h-24 border-2 border-dashed border-gray-300 bg-white/50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                  Sin resultados
                </div>
              )}
            </div>
          </div>
        ))};

const newColsStr =       <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 h-full min-w-max">
        {columnasDinamicas.map((col, idx) => {
          const borderColors = ['border-t-bogota-primary', 'border-t-bogota-secondary', 'border-t-blue-500', 'border-t-green-500', 'border-t-orange-500', 'border-t-teal-500', 'border-t-purple-500'];
          const borderColor = borderColors[idx % borderColors.length];
          return (
            <div key={col.id} className={\lex-shrink-0 w-[340px] rounded-xl border border-gray-200 flex flex-col bg-gray-50 border-t-4 \\}>
              <div className="p-4 border-b border-gray-200/50 flex justify-between items-center bg-white/50 rounded-t-xl">
                <h3 className="font-semibold text-gray-800 text-[15px]">{col.titulo}</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-[12px] font-medium text-gray-600 shadow-sm border border-gray-200">
                  {actividadesFiltradas.filter(a => (a.hito?.programa ? \\ \\ : 'General') === col.id).length}
                </span>
              </div>
              
              <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
                {actividadesFiltradas.filter(a => (a.hito?.programa ? \\ \\ : 'General') === col.id).map(actividad => (
                  <div key={actividad.id} onClick={() => setActividadSeleccionada(actividad)} className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md hover:border-gray-300 transition-all cursor-pointer relative group flex flex-col gap-2">
                    
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[12px] font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded truncate max-w-[85%]" title={actividad.codigoCompleto || 'SIN CODIGO'}>
                        {actividad.codigoCompleto || 'SIN CODIGO'}
                      </span>
                      <button className="text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 text-[14px] leading-snug">
                      {actividad.nombre}
                    </h4>
                    
                    <div className="flex items-center justify-between text-[12px] text-gray-500 mt-2 border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-1.5" title="Fecha límite">
                        {actividad.estado === 'VENCIDA' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        ) : actividad.estado === 'COMPLETADA' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-orange-500" />
                        )}
                        <span className="font-medium text-gray-600">
                          {actividad.fechaLimite ? new Date(actividad.fechaLimite).toISOString().split('T')[0] : 'Sin fecha'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 font-medium text-gray-600" title="Evidencias Cargadas">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{actividad.evidencias?.length || 0}/{actividad.tiposEvidenciaRequeridos?.length || 1}</span>
                      </div>

                      <div className="flex items-center gap-2" title="Progreso">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-bogota-secondary h-2 rounded-full" style={{ width: \\%\ }}></div>
                        </div>
                        <span className="font-medium text-gray-700 text-[11px]">{Math.round(actividad.indicadorMeta || 0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}

                {actividadesFiltradas.filter(a => (a.hito?.programa ? \\ \\ : 'General') === col.id).length === 0 && (
                  <div className="h-24 border-2 border-dashed border-gray-300 bg-white/50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                    Sin resultados
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>;

c = c.replace(targetStr2.replace(/\r\n/g, '\n'), newColsStr).replace(targetStr2, newColsStr);

fs.writeFileSync('src/components/KanbanBoard.tsx', c);
