import { useEffect, useState } from 'react';
import { fetchApi } from '../utils/api';
import { ShieldAlert, Paperclip, Send } from 'lucide-react';

export default function VistaAlertaAsignada() {
  const id = window.location.pathname.split('/').pop();
  const [alerta, setAlerta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comentario, setComentario] = useState('');
  const [urlArchivo, setUrlArchivo] = useState('');

  const cargarAlerta = async () => {
    try {
      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/fichas-alertas`);
      const fichas = await res.json();
      const ficha = fichas.find((f: any) => f.id === id);
      
      if (!ficha) {
        setError('No tienes acceso a esta alerta o no existe.');
      } else {
        setAlerta(ficha);
      }
    } catch (err) {
      setError('Error cargando la alerta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAlerta();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentario.trim()) return;
    try {
      await fetchApi(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/fichas-alertas/${id}/actualizaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario, urlArchivo })
      });
      setComentario('');
      setUrlArchivo('');
      cargarAlerta();
    } catch (err: any) {
      alert(err.message || 'Error agregando actualización');
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando alerta...</div>;
  if (error || !alerta) return <div className="p-10 text-center text-red-600 font-bold">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg border border-gray-200 mt-10 overflow-hidden">
        <div className="bg-red-600 p-6 flex items-center gap-3">
          <ShieldAlert className="text-white w-8 h-8" />
          <h2 className="text-xl font-bold text-white">Detalle de Alerta Asignada</h2>
        </div>
        
        <div className="p-6 space-y-6">
           <div>
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Descripción de la Alerta</h3>
             <p className="text-gray-800 text-lg font-medium">{alerta.descripcion}</p>
           </div>
           
           <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong className="text-gray-500">Estado:</strong> <span className="ml-2 font-bold px-2 py-1 bg-gray-100 rounded">{alerta.estado.replace(/_/g, ' ')}</span></div>
              <div><strong className="text-gray-500">Tipo:</strong> <span className="ml-2 font-bold px-2 py-1 bg-gray-100 rounded">{alerta.tipo.replace(/_/g, ' ')}</span></div>
              <div><strong className="text-gray-500">Responsable asignado:</strong> {alerta.responsable}</div>
              <div><strong className="text-gray-500">Fecha creación:</strong> {new Date(alerta.fechaCreacion).toLocaleDateString()}</div>
           </div>

           <div className="border-t pt-6">
              <h3 className="text-md font-bold text-gray-800 mb-4">Actualizaciones e Historial</h3>
              
              {/* Add New Update */}
              <form onSubmit={handleUpdate} className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                 <h4 className="font-bold text-sm mb-2 text-bogota-primary">Agregar un reporte de actualización:</h4>
                 <textarea 
                    className="w-full border rounded p-3 mb-3 text-sm focus:ring-2 focus:ring-red-500" 
                    placeholder="Escribe aquí los avances o justificaciones..."
                    value={comentario} onChange={e => setComentario(e.target.value)} required
                 />
                 <div className="flex gap-3">
                   <input 
                      type="url" 
                      className="flex-1 border rounded p-2 text-sm" 
                      placeholder="URL del archivo adjunto (ej. enlace a SharePoint/Drive)"
                      value={urlArchivo} onChange={e => setUrlArchivo(e.target.value)}
                   />
                   <button type="submit" className="bg-bogota-primary text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-red-700">
                     <Send className="w-4 h-4"/> Enviar
                   </button>
                 </div>
              </form>

              {/* Updates List */}
              <div className="space-y-4">
                 {alerta.actualizaciones && alerta.actualizaciones.map((act: any) => (
                    <div key={act.id} className="bg-white p-4 rounded shadow-sm border border-gray-100">
                       <div className="flex justify-between items-center mb-2">
                         <span className="font-bold text-sm text-gray-800">{act.autorNombre || act.autorEmail}</span>
                         <span className="text-xs text-gray-400">{new Date(act.fechaCreacion).toLocaleString()}</span>
                       </div>
                       <p className="text-gray-700 text-sm whitespace-pre-wrap">{act.comentario}</p>
                       {act.urlArchivo && (
                         <a href={act.urlArchivo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                           <Paperclip className="w-3 h-3"/> Ver archivo adjunto
                         </a>
                       )}
                    </div>
                 ))}
                 {(!alerta.actualizaciones || alerta.actualizaciones.length === 0) && (
                    <div className="text-center text-sm text-gray-500 py-4 italic">No hay actualizaciones registradas aún.</div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
