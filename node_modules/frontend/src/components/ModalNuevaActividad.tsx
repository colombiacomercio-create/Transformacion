import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalNuevaActividad({ onClose, onSuccess }: Props) {
  const [planes, setPlanes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaLimite: '',
    prioridad: 'MEDIA',
    indicadorMeta: 100,
    indicadorUnidad: 'Porcentaje',
    hitoId: ''
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/planes`, {
      headers: { 'Authorization': 'Bearer local_dev_token' }
    })
      .then(res => res.json())
      .then(data => {
        setPlanes(data);
        // Default hitoId selection if exists
        if (data.length > 0 && data[0].objetivos?.[0]?.programas?.[0]?.hitos?.[0]) {
           setFormData(f => ({ ...f, hitoId: data[0].objetivos[0].programas[0].hitos[0].id }));
        }
      })
      .catch(err => console.error("Error cargando planes", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/actividades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer local_dev_token'
        },
        body: JSON.stringify(formData)
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
    return hitos;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800">Nueva Actividad</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
          
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la actividad</label>
             <input required type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30"
               value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}
             />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
             <textarea required className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30 resize-none h-20"
               value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
              <input required type="date" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30"
                value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite</label>
              <input required type="date" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30"
                value={formData.fechaLimite} onChange={e => setFormData({...formData, fechaLimite: e.target.value})}
              />
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta</label>
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
             <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a Producto</label>
             <select required className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30"
               value={formData.hitoId} onChange={e => setFormData({...formData, hitoId: e.target.value})}>
               {getHitosPlano().map(h => (
                  <option key={h.id} value={h.id}>{h.nombre}</option>
               ))}
             </select>
          </div>

          <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-gray-100">
             <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg font-medium text-gray-600 hover:bg-gray-50">
               Cancelar
             </button>
             <button type="submit" disabled={loading} className="px-5 py-2 bg-bogota-primary text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
               {loading ? 'Guardando...' : 'Crear Actividad'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
