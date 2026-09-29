import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { fetchApi } from '../utils/api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalNuevaActividad({ onClose, onSuccess }: Props) {
  const [planes, setPlanes] = useState<any[]>([]);
  const [localidades, setLocalidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [creandoProducto, setCreandoProducto] = useState(false);
  const [creandoAspiracion, setCreandoAspiracion] = useState(false);

  const [formData, setFormData] = useState({
    codigoCompleto: '',
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaLimite: '',
    prioridad: 'MEDIA',
    indicadorMeta: 100,
    indicadorUnidad: 'Porcentaje',
    hitoId: '',
    
    nuevoProductoCodigo: '',
    nuevoProductoNombre: '',
    aspiracionId: '',
    nuevaAspiracionCodigo: '',
    nuevaAspiracionNombre: '',
    
    localidadesIds: [] as string[],
    esRepetitiva: false,
    numRepeticiones: 1,
    fechasLimites: [] as string[]
  });

  useEffect(() => {
    Promise.all([
      fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/planes`).then(r => r.json()),
      fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/localidades`).then(r => r.json())
    ]).then(([planesData, locsData]) => {
      setPlanes(planesData);
      setLocalidades(locsData);
      if (planesData.length > 0 && planesData[0].objetivos?.[0]?.programas?.[0]?.hitos?.[0]) {
         setFormData(f => ({ ...f, hitoId: planesData[0].objetivos[0].programas[0].hitos[0].id }));
      }
    }).catch(err => console.error("Error cargando datos", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        crearNuevoProducto: creandoProducto,
        crearNuevaAspiracion: creandoAspiracion
      };
      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Error al crear la actividad');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getHitosPlano = () => {
    let hitos: {id: string, nombre: string}[] = [];
    planes.forEach(p => {
       p.objetivos?.forEach((o: any) => {
          o.programas?.forEach((prog: any) => {
             if (prog.hitos && prog.hitos.length > 0) {
                hitos.push({ id: prog.hitos[0].id, nombre: `[${prog.codigo}] ${prog.nombre}` });
             }
          });
       });
    });
    return hitos.sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, {numeric: true}));
  };
  
  const getAspiraciones = () => {
      let asp: {id: string, nombre: string}[] = [];
      planes.forEach(p => {
         p.objetivos?.forEach((o: any) => {
            asp.push({ id: o.id, nombre: `[${o.codigo}] ${o.nombre}` });
         });
      });
      return asp.sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, {numeric: true}));
  };
  
  const handleLocalidadToggle = (id: string) => {
      setFormData(prev => {
          const arr = prev.localidadesIds;
          if (arr.includes(id)) return { ...prev, localidadesIds: arr.filter(x => x !== id) };
          return { ...prev, localidadesIds: [...arr, id] };
      });
  };

  const seleccionarTodasLocs = () => setFormData(p => ({ ...p, localidadesIds: localidades.map(l => l.id) }));
  const deseleccionarTodasLocs = () => setFormData(p => ({ ...p, localidadesIds: [] }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[95vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Nueva Actividad</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          
          <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la actividad</label>
                 <input required type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30"
                   value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}
                 />
              </div>
              <div className="col-span-1">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Codigo Actividad</label>
                 <input type="text" placeholder="Autogenerar" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30 placeholder:text-gray-400"
                   value={formData.codigoCompleto} onChange={e => setFormData({...formData, codigoCompleto: e.target.value})}
                 />
                 <p className="text-[10px] text-gray-500 mt-1 leading-tight">Dejar en blanco para autogenerar.</p>
              </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
             <textarea required className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30 resize-none h-16"
               value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio <span className="text-gray-400 font-normal">(ejem 26/10/2026)</span></label>
              <input required type="date" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30"
                value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})}
              />
            </div>
            {!formData.esRepetitiva && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Limite <span className="text-gray-400 font-normal">(ejem 26/10/2026)</span></label>
              <input required type="date" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30"
                value={formData.fechaLimite} onChange={e => setFormData({...formData, fechaLimite: e.target.value})}
              />
            </div>
            )}
          </div>

          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                 <input type="checkbox" id="repetitiva" checked={formData.esRepetitiva} onChange={e => setFormData({...formData, esRepetitiva: e.target.checked})} className="w-4 h-4 text-bogota-primary rounded" />
                 <label htmlFor="repetitiva" className="font-bold text-sm text-blue-900 cursor-pointer">Actividad Repetitiva (Crear multiples copias/entregas)</label>
              </div>
              {formData.esRepetitiva && (
                 <div className="bg-white p-3 rounded-lg border border-blue-200 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-700">Cantidad de repeticiones:</span>
                        <input type="number" min="2" max="20" className="border rounded w-20 px-2 py-1 outline-none" 
                           value={formData.numRepeticiones} onChange={e => {
                               const num = Number(e.target.value);
                               let newFechas = [...formData.fechasLimites];
                               if (num > newFechas.length) {
                                   newFechas = [...newFechas, ...Array(num - newFechas.length).fill('')];
                               } else {
                                   newFechas = newFechas.slice(0, num);
                               }
                               setFormData({...formData, numRepeticiones: num, fechasLimites: newFechas});
                           }}
                        />
                        <div className="text-xs text-gray-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> El valor Meta (%) se dividira equitativamente.</div>
                    </div>
                    
                    {formData.numRepeticiones > 1 && (
                        <div className="mt-2">
                           <p className="text-sm font-bold text-gray-700 mb-2">Fechas Limites por Repeticion:</p>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                             {Array.from({length: formData.numRepeticiones}).map((_, i) => (
                                <div key={i} className="flex flex-col">
                                   <label className="text-xs text-gray-600 mb-1">Repeticion {i + 1}</label>
                                   <input required type="date" className="border rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-bogota-primary/30"
                                      value={formData.fechasLimites[i] || ''}
                                      onChange={e => {
                                         const newFechas = [...formData.fechasLimites];
                                         newFechas[i] = e.target.value;
                                         setFormData({...formData, fechasLimites: newFechas});
                                      }}
                                   />
                                </div>
                             ))}
                           </div>
                        </div>
                    )}
                 </div>
              )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30"
                  value={formData.prioridad} onChange={e => setFormData({...formData, prioridad: e.target.value})}>
                 <option value="BAJA">Baja</option>
                 <option value="MEDIA">Media</option>
                 <option value="ALTA">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Global (%)</label>
              <input required type="number" step="0.1" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30"
                value={formData.indicadorMeta} onChange={e => setFormData({...formData, indicadorMeta: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <input required type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30"
                value={formData.indicadorUnidad} onChange={e => setFormData({...formData, indicadorUnidad: e.target.value})}
              />
            </div>
          </div>

          <div>
             <div className="flex justify-between items-center mb-2">
                 <label className="block text-sm font-medium text-gray-700">Localidades Asignadas</label>
                 <div className="space-x-2 text-xs">
                     <button type="button" onClick={seleccionarTodasLocs} className="text-bogota-primary hover:underline">Todas</button>
                     <span className="text-gray-300">|</span>
                     <button type="button" onClick={deseleccionarTodasLocs} className="text-gray-500 hover:underline">Ninguna</button>
                 </div>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border rounded-lg p-3 max-h-32 overflow-y-auto bg-gray-50">
                 {localidades.map(l => (
                     <label key={l.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">
                         <input type="checkbox" checked={formData.localidadesIds.includes(l.id)} onChange={() => handleLocalidadToggle(l.id)} />
                         {l.nombre}
                     </label>
                 ))}
             </div>
             <p className="text-[10px] text-gray-500 mt-1">Si no seleccionas ninguna, se asignara a todas por defecto.</p>
          </div>
          
          <hr className="my-1 border-gray-100" />

          {!creandoProducto ? (
              <div>
                 <div className="flex justify-between items-center mb-1">
                     <label className="block text-sm font-medium text-gray-700">Vincular a Producto Existente</label>
                     <button type="button" onClick={() => setCreandoProducto(true)} className="text-xs font-bold text-bogota-primary flex items-center hover:underline">
                         <Plus className="w-3 h-3 mr-1" /> Crear nuevo Producto
                     </button>
                 </div>
                 <select required className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30"
                   value={formData.hitoId} onChange={e => setFormData({...formData, hitoId: e.target.value})}>
                   <option value="">-- Seleccione un Producto --</option>
                   {getHitosPlano().map(h => (
                      <option key={h.id} value={h.id}>{h.nombre}</option>
                   ))}
                 </select>
              </div>
          ) : (
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex flex-col gap-3">
                 <div className="flex justify-between items-center">
                     <label className="block text-sm font-bold text-orange-900">Crear Nuevo Producto</label>
                     <button type="button" onClick={() => setCreandoProducto(false)} className="text-xs font-bold text-orange-700 hover:underline">
                         Cancelar creacion
                     </button>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                     <input required placeholder="Codigo (ej: P11)" type="text" className="w-full border rounded-lg px-3 py-2 text-sm"
                       value={formData.nuevoProductoCodigo} onChange={e => setFormData({...formData, nuevoProductoCodigo: e.target.value})} />
                     <input required placeholder="Nombre del Producto" type="text" className="w-full border rounded-lg px-3 py-2 text-sm"
                       value={formData.nuevoProductoNombre} onChange={e => setFormData({...formData, nuevoProductoNombre: e.target.value})} />
                 </div>
                 
                 {!creandoAspiracion ? (
                     <div>
                         <div className="flex justify-between items-center mb-1 mt-2">
                             <label className="block text-xs font-medium text-orange-800">Vincular a Aspiracion Existente</label>
                             <button type="button" onClick={() => setCreandoAspiracion(true)} className="text-xs font-bold text-bogota-primary hover:underline">
                                 + Crear nueva Aspiracion
                             </button>
                         </div>
                         <select required className="w-full border rounded-lg px-3 py-2 text-sm"
                           value={formData.aspiracionId} onChange={e => setFormData({...formData, aspiracionId: e.target.value})}>
                           <option value="">Seleccione Aspiracion...</option>
                           {getAspiraciones().map(a => (
                              <option key={a.id} value={a.id}>{a.nombre}</option>
                           ))}
                         </select>
                     </div>
                 ) : (
                     <div className="bg-white p-3 rounded-lg border border-orange-200 mt-2 flex flex-col gap-2">
                         <div className="flex justify-between items-center">
                             <label className="block text-xs font-bold text-gray-700">Crear Nueva Aspiracion</label>
                             <button type="button" onClick={() => setCreandoAspiracion(false)} className="text-xs text-gray-500 hover:underline">
                                 Cancelar
                             </button>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                             <input required placeholder="Codigo (ej: A7)" type="text" className="w-full border rounded-lg px-3 py-2 text-sm"
                               value={formData.nuevaAspiracionCodigo} onChange={e => setFormData({...formData, nuevaAspiracionCodigo: e.target.value})} />
                             <input required placeholder="Nombre Aspiracion" type="text" className="w-full border rounded-lg px-3 py-2 text-sm"
                               value={formData.nuevaAspiracionNombre} onChange={e => setFormData({...formData, nuevaAspiracionNombre: e.target.value})} />
                         </div>
                     </div>
                 )}
              </div>
          )}

          <div className="mt-2 flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0">
             <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg font-medium text-gray-600 hover:bg-gray-50">
               Cancelar
             </button>
             <button type="submit" disabled={loading} className="px-6 py-2 bg-bogota-primary text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
               {loading ? 'Guardando...' : 'Crear Actividad'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}