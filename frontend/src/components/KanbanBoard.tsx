import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle2, MoreVertical, FileText, Plus, X, Download } from 'lucide-react';
import ModalNuevaActividad from './ModalNuevaActividad';
import ModalDetalleActividad from './ModalDetalleActividad';

// Colors for dynamic columns
const columnColors = ['bg-gray-100', 'bg-blue-50', 'bg-green-50', 'bg-orange-50', 'bg-bogota-primary/10', 'bg-teal-50', 'bg-purple-50'];

const mockActividades = [
  {
    id: 'a1',
    codigoCompleto: 'P01.H1.A1',
    nombre: 'Reporte Consolidado de Inversiones',
    fechaLimite: '2026-02-28',
    estado: 'PENDIENTE',
    progreso: 0,
    evidenciasCargadas: 0,
    evidenciasRequeridas: 2
  },
  {
    id: 'a2',
    codigoCompleto: 'P01.H2.A2',
    nombre: 'Mejora Malla Vial Suba',
    fechaLimite: '2026-01-15',
    estado: 'VENCIDA',
    progreso: 80,
    evidenciasCargadas: 1,
    evidenciasRequeridas: 3
  },
  {
    id: 'a3',
    codigoCompleto: 'P02.H1.A1',
    nombre: 'Estrategia de Memoria Histórica',
    fechaLimite: '2026-05-10',
    estado: 'EN_PROGRESO',
    progreso: 50,
    evidenciasCargadas: 2,
    evidenciasRequeridas: 2
  }
];

export default function KanbanBoard() {
  const [actividades, setActividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<any>(null);
  const [mostrandoNuevaActividad, setMostrandoNuevaActividad] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('TODAS');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // 'PENDIENTES', 'EN_REVISION', 'COMPLETADAS'
  const [filtroObjetivo, setFiltroObjetivo] = useState('TODOS');
  const [filtroProducto, setFiltroProducto] = useState('TODOS');
  
  const [mostrandoBandejaValidacion, setMostrandoBandejaValidacion] = useState(false);

  // Computar validaciones pendientes (Solo para ADMIN, que trae múltiples asignaciones)
  const validacionesPendientes = actividades.flatMap(a => 
      a.asignaciones?.filter((asig: any) => asig.estadoLocal === 'COMPLETA_SIN_VALIDAR' && asig.estadoValidacion === 'PENDIENTE_REVISION')
       .map((asig: any) => ({ ...asig, actividadUrl: a.codigoCompleto, actividadNombre: a.nombre })) || []
  );
  
  const esAdminStr = actividades[0]?.asignaciones?.length > 1;

  const fetchActividades = () => {
    const mockRole = localStorage.getItem('mockRole') || 'ADMIN';
    fetch('http://localhost:4000/api/actividades', {
      headers: {
        'Authorization': 'Bearer local_dev_token',
        'x-mock-role': mockRole
      }
    })
      .then(res => res.json())
      .then(data => {
         setActividades(data || []);
         
         // Si hay una seleccionada, la actualizamos también con la nueva data
         if (actividadSeleccionada) {
            const up = data.find((a: any) => a.id === actividadSeleccionada.id);
            if (up) setActividadSeleccionada(up);
         }
         
         setLoading(false);
      })
      .catch(err => {
         console.error('Error fetching actividades:', err);
         setLoading(false);
      });
  };

  useEffect(() => {
    fetchActividades();
  }, []);

  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);
  const laOtraSemana = new Date(hoy); laOtraSemana.setDate(laOtraSemana.getDate() + 7);
  const mesProximo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

  let actividadesFiltradas = actividades.filter(a => {
    if (filtroTexto && !a.codigoCompleto?.toLowerCase().includes(filtroTexto.toLowerCase()) && !a.nombre.toLowerCase().includes(filtroTexto.toLowerCase())) return false;
    
    if (filtroFecha !== 'TODAS') {
       if (!a.fechaLimite) return false;
       const limit = new Date(a.fechaLimite);
       if (filtroFecha === 'VENCIDA') return limit < hoy;
       if (filtroFecha === 'HOY') return limit >= hoy && limit < manana;
       if (filtroFecha === 'PROXIMA_SEMANA') return limit >= hoy && limit <= laOtraSemana;
       if (filtroFecha === 'ESTE_MES') return limit >= hoy && limit <= mesProximo;
    }
    if (filtroEstado !== 'TODOS') {
       // Buscar si ALGUNA asignacion cumple (Para Gestores será la de ellos, para Admin mira el global)
       if (filtroEstado === 'PENDIENTES') {
          if (!a.asignaciones?.some((asig:any) => asig.estadoLocal === 'NO_INICIADA')) return false;
       }
       if (filtroEstado === 'EN_REVISION') {
          if (!a.asignaciones?.some((asig:any) => asig.estadoLocal === 'COMPLETA_SIN_VALIDAR' && asig.estadoValidacion === 'PENDIENTE_REVISION')) return false;
       }
       if (filtroEstado === 'COMPLETADA') {
          if (!a.asignaciones?.some((asig:any) => asig.estadoValidacion === 'VALIDADA_COMPLETADA')) return false;
       }
    }
    
    const objNombre = a.hito?.programa?.objetivo?.nombre || 'General';
    const prodCodigo = a.hito?.programa?.codigo || 'General';

    if (filtroObjetivo !== 'TODOS' && objNombre !== filtroObjetivo) return false;
    if (filtroProducto !== 'TODOS' && prodCodigo !== filtroProducto) return false;

    return true;
  });

  const exportToCSV = (lista: any[], baseName: string) => {
    let csvData = '\uFEFFCodigo Actividad,Nombre Actividad,Objetivo,Programa,Localidad,Estado Local,Estado Validacion\n';
    lista.forEach(act => {
       const obs = act.hito?.programa?.objetivo?.nombre || 'General';
       const progs = act.hito?.programa?.codigo || 'General';
       if (!act.asignaciones || act.asignaciones.length === 0) {
           csvData += `"${act.codigoCompleto || ''}","${act.nombre}","${obs}","${progs}","Sin Asignacion","",""\n`;
       } else {
           act.asignaciones.forEach((asig:any) => {
              csvData += `"${act.codigoCompleto || ''}","${act.nombre}","${obs}","${progs}","${asig.localidad?.nombre || 'General'}","${asig.estadoLocal || ''}","${asig.estadoValidacion || ''}"\n`;
           });
       }
    });
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${baseName}.csv`;
    link.click();
  };

  const objetivosList = Array.from(new Set(actividades.map(a => a.hito?.programa?.objetivo?.nombre || 'General'))).sort();
  const productosList = Array.from(new Set(actividades.map(a => a.hito?.programa?.codigo || 'General'))).sort();

  const columnasSet = new Set(actividadesFiltradas.map(a => a.hito?.programa?.objetivo?.nombre || 'General'));
  const columnasDinamicas = Array.from(columnasSet).map((obj, i) => ({
     id: obj, titulo: obj, color: columnColors[i % columnColors.length]
  })).sort((a,b) => a.id.localeCompare(b.id)); // Alfabetico O1, O2...

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando actividades...</div>;

  return (
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
      </div>
      
      {mostrandoBandejaValidacion && (
         <div className="absolute top-20 right-0 w-96 max-h-[70vh] bg-white border border-gray-200 shadow-2xl rounded-xl z-40 flex flex-col overflow-hidden">
            <div className="bg-orange-50 p-4 border-b border-orange-200 flex justify-between items-center">
              <h3 className="font-bold text-orange-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> Bandeja de Validación Administrativa</h3>
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
                        <span className="text-xs text-orange-600 font-bold">Requiere revisión</span>
                     </div>
                     <p className="text-sm font-medium text-gray-800 leading-tight">[{v.actividadUrl}] {v.actividadNombre}</p>
                  </div>
               ))}
            </div>
         </div>
      )}

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {columnasDinamicas.map(col => (
          <div key={col.id} className={`flex-shrink-0 w-[22rem] rounded-xl border border-gray-200 flex flex-col ${col.color}`}>
            <div className="p-4 border-b border-gray-200/50 flex justify-between items-center bg-white/70 rounded-t-xl">
              <h3 className="font-bold text-gray-800 text-sm">{col.titulo}</h3>
              <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-bogota-primary shadow-sm border border-gray-100">
                {actividadesFiltradas.filter(a => (a.hito?.programa?.objetivo?.nombre || 'General') === col.id).length}
              </span>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
              {actividadesFiltradas.filter(a => (a.hito?.programa?.objetivo?.nombre || 'General') === col.id).map(actividad => (
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
                      <div className="bg-bogota-secondary h-1.5 rounded-full" style={{ width: `${actividad.indicadorMeta ? Math.min(100, Math.round(actividad.indicadorMeta)) : 0}%` }}></div>
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
              
              {actividadesFiltradas.filter(a => (a.hito?.programa?.objetivo?.nombre || 'General') === col.id).length === 0 && (
                <div className="h-24 border-2 border-dashed border-gray-300 bg-white/50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                  Sin resultados
                </div>
              )}
            </div>
          </div>
        ))}
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
        />
      )}
    </div>
  );
}
