# -*- coding: utf-8 -*-
import sys

def process():
    with open('src/components/KanbanBoard.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
        
    idx = content.find('  return (\n    <div className="h-[calc(100vh-12rem)] flex flex-col relative">')
    if idx == -1: idx = content.find('  return (\r\n    <div className="h-[calc(100vh-12rem)] flex flex-col relative">')
    if idx == -1: idx = content.find('  return (\n    <div className="flex flex-col h-[calc(100vh-140px)]">')
    if idx == -1: idx = content.find('  return (\r\n    <div className="flex flex-col h-[calc(100vh-140px)]">')

    if idx == -1:
        print("Start not found.")
        sys.exit(1)
        
    end_str = '    </div>\n  );\n}\n'
    end_idx = content.find(end_str, idx)
    if end_idx == -1: end_idx = content.find('    </div>\r\n  );\r\n}\r\n', idx)
    if end_idx == -1: end_idx = content.find('    </div>\n  );\n}', idx)
    if end_idx == -1: end_idx = content.find('    </div>\r\n  );\r\n}', idx)
        
    if end_idx == -1:
        print("End not found")
        sys.exit(1)
        
    new_return = '''  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 flex-shrink-0">
        
        {/* Fila 1: Titulo y Acciones */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Panel de Actividades</h2>
          <div className="flex flex-wrap items-center gap-3">
            {esAdminStr && (
               <button onClick={() => setMostrandoBandejaValidacion(!mostrandoBandejaValidacion)} className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2 rounded-lg hover:bg-orange-100 text-sm font-semibold flex items-center gap-2 transition-colors relative">
                 <AlertCircle className="w-4 h-4" />
                 Auditoria
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
            placeholder="Buscar por codigo o nombre..." 
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
            <option value="EN_REVISION">En Revision Admin</option>
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
            <option value="PROXIMA_SEMANA">Vencen proximos 7 dias</option>
            <option value="ESTE_MES">Vencen este mes</option>
          </select>
        </div>
      </div>
      
      {mostrandoBandejaValidacion && (
         <div className="absolute top-32 right-0 w-96 max-h-[70vh] bg-white border border-gray-200 shadow-2xl rounded-xl z-40 flex flex-col overflow-hidden">
            <div className="bg-orange-50 p-4 border-b border-orange-200 flex justify-between items-center">
              <h3 className="font-bold text-orange-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> Bandeja de Validacion Administrativa</h3>
              <button onClick={() => setMostrandoBandejaValidacion(false)}><X className="w-5 h-5 text-orange-600 hover:text-orange-800"/></button>
            </div>
            <div className="overflow-y-auto p-4 flex-1 flex flex-col gap-3">
               {validacionesPendientes.length === 0 && <div className="text-gray-500 text-sm text-center py-4">No hay actividades pendientes por validar de ninguna localidad.</div>}
               {validacionesPendientes.map((v: any) => (
                  <div key={v.id} className="border border-gray-100 bg-gray-50 p-3 rounded-lg hover:border-orange-300 transition-colors cursor-pointer" onClick={() => {
                      const act = actividades.find(a => a.id === v.actividadId);
                      if (act) { setActividadSeleccionada(act); setMostrandoBandejaValidacion(false); }
                  }}>
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold bg-white text-gray-500 px-2 py-0.5 border rounded">{v.localidad.nombre}</span>
                        <span className="text-xs text-orange-600 font-bold">Requiere revision</span>
                     </div>
                     <p className="text-sm font-medium text-gray-800 leading-tight">[{v.actividadUrl}] {v.actividadNombre}</p>
                  </div>
               ))}
            </div>
         </div>
      )}

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 h-full min-w-max">
        {columnasDinamicas.map((col, idx) => {
          const borderColors = ['border-t-bogota-primary', 'border-t-bogota-secondary', 'border-t-blue-500', 'border-t-green-500', 'border-t-orange-500', 'border-t-teal-500', 'border-t-purple-500'];
          const borderColor = borderColors[idx % borderColors.length];
          return (
            <div key={col.id} className={`flex-shrink-0 w-[340px] rounded-xl border border-gray-200 flex flex-col bg-gray-50 border-t-4 ${borderColor}`}>
              <div className="p-4 border-b border-gray-200/50 flex justify-between items-center bg-white/50 rounded-t-xl">
                <h3 className="font-semibold text-gray-800 text-[15px]">{col.titulo}</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-[12px] font-medium text-gray-600 shadow-sm border border-gray-200">
                  {actividadesFiltradas.filter(a => (a.hito?.programa ? `${a.hito.programa.codigo} ${a.hito.programa.nombre}` : 'General') === col.id).length}
                </span>
              </div>
              
              <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
                {actividadesFiltradas.filter(a => (a.hito?.programa ? `${a.hito.programa.codigo} ${a.hito.programa.nombre}` : 'General') === col.id).map(actividad => (
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
                      <div className="flex items-center gap-1.5" title="Fecha limite">
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
                          <div className="bg-bogota-secondary h-2 rounded-full" style={{ width: `${actividad.indicadorMeta ? Math.min(100, Math.round(actividad.indicadorMeta)) : 0}%` }}></div>
                        </div>
                        <span className="font-medium text-gray-700 text-[11px]">{Math.round(actividad.indicadorMeta || 0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}

                {actividadesFiltradas.filter(a => (a.hito?.programa ? `${a.hito.programa.codigo} ${a.hito.programa.nombre}` : 'General') === col.id).length === 0 && (
                  <div className="h-24 border-2 border-dashed border-gray-300 bg-white/50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                    Sin resultados
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
        
      {mostrandoNuevaActividad && (
        <ModalNuevaActividad 
          onClose={() => setMostrandoNuevaActividad(false)} 
          onSuccess={() => { setMostrandoNuevaActividad(false); fetchActividades(); }} 
        />
      )}
      
      {actividadSeleccionada && (
        <ModalDetalleActividad 
          actividad={actividadSeleccionada}
          onClose={() => setActividadSeleccionada(null)}
          onRefresh={fetchActividades}
          userData={userData}
        />
      )}
    </div>
  );
}
'''
    
    final_content = content[:idx] + new_return
    with open('src/components/KanbanBoard.tsx', 'w', encoding='utf-8') as f:
        f.write(final_content)
        print("Success")
        
process()
