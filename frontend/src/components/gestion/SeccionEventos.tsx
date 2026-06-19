import { useEffect, useState, useRef } from 'react';
import { fetchApi } from '../../utils/api';

const API = import.meta.env.VITE_API_URL || '';

interface Props { userData: any; }

export default function SeccionEventos({ userData }: Props) {
  const [eventos, setEventos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: 'CONECTAR_TRANSFORMAR', nombre: '', fecha: '', lugar: '', descripcion: '', resultados: '' });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cargar = () =>
    fetchApi(`${API}/api/eventos`).then(r => r.json()).then(d => setEventos(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    if (!form.nombre || !form.fecha || !form.lugar) return;
    setGuardando(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (archivo) fd.append('archivo', archivo);
    await fetchApi(`${API}/api/eventos`, { method: 'POST', body: fd }).catch(() => {});
    setGuardando(false); setShowForm(false);
    setForm({ tipo: 'CONECTAR_TRANSFORMAR', nombre: '', fecha: '', lugar: '', descripcion: '', resultados: '' });
    cargar();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Eventos</h3>
        <button onClick={() => setShowForm(s => !s)} className="bg-bogota-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700">
          {showForm ? '× Cancelar' : '+ Registrar Evento'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
                <option value="CONECTAR_TRANSFORMAR">Conectar para Transformar</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
            </div>
            <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del evento *</label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
            </div>
            <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Lugar</label>
              <input value={form.lugar} onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
            </div>
            <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none" />
            </div>
            <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Resultados</label>
              <textarea value={form.resultados} onChange={e => setForm(f => ({ ...f, resultados: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none" />
            </div>
            <div className="sm:col-span-2">
              <button onClick={() => fileRef.current?.click()} className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100">
                📎 {archivo ? archivo.name : 'Adjuntar archivo'}
              </button>
              <input ref={fileRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && setArchivo(e.target.files[0])} />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={guardar} disabled={guardando || !form.nombre || !form.fecha}
              className="px-5 py-2 bg-bogota-primary text-white text-sm font-semibold rounded-lg disabled:opacity-60 hover:bg-red-700">
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {eventos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventos.map((ev: any) => (
            <div key={ev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5 font-semibold">
                    {ev.tipo === 'CONECTAR_TRANSFORMAR' ? 'Conectar para Transformar' : 'Otro'}
                  </span>
                  <h4 className="font-bold text-gray-800 mt-2">{ev.nombre}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(ev.fecha).toLocaleDateString('es-CO')} — {ev.lugar}</p>
                </div>
                {ev.urlArchivo && <a href={ev.urlArchivo} target="_blank" rel="noreferrer" className="text-bogota-primary text-xs hover:underline">📎 Archivo</a>}
              </div>
              {ev.descripcion && <p className="text-xs text-gray-600 mt-2">{ev.descripcion}</p>}
              {ev.resultados && <p className="text-xs text-green-700 mt-2 bg-green-50 rounded p-2"><strong>Resultados:</strong> {ev.resultados}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400"><p className="text-3xl mb-2">🎯</p><p className="font-semibold">No hay eventos registrados</p></div>
      )}
    </div>
  );
}
