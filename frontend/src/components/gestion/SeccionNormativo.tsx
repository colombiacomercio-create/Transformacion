import { useEffect, useState } from 'react';
import { fetchApi } from '../../utils/api';

const API = import.meta.env.VITE_API_URL || '';
const ESTADOS: Record<string, { label: string; color: string }> = {
  EN_FORMULACION:    { label: 'En formulación',    color: 'bg-yellow-100 text-yellow-700' },
  EXPEDIDO:          { label: 'Expedido',           color: 'bg-blue-100 text-blue-700' },
  EN_IMPLEMENTACION: { label: 'En implementación',  color: 'bg-green-100 text-green-700' },
  ARCHIVADO:         { label: 'Archivado',          color: 'bg-gray-100 text-gray-600' },
};

interface Props { userData: any; }

export default function SeccionNormativo({ userData }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: 'DECRETO', nombre: '', descripcion: '', estado: 'EN_FORMULACION', avances: '', urlDocumento: '' });
  const [guardando, setGuardando] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const cargar = () =>
    fetchApi(`${API}/api/normativo`).then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    if (!form.nombre) return;
    setGuardando(true);
    const url = editId ? `${API}/api/normativo/${editId}` : `${API}/api/normativo`;
    await fetchApi(url, { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }).catch(() => {});
    setGuardando(false); setShowForm(false); setEditId(null);
    setForm({ tipo: 'DECRETO', nombre: '', descripcion: '', estado: 'EN_FORMULACION', avances: '', urlDocumento: '' });
    cargar();
  };

  const editar = (item: any) => {
    setForm({ tipo: item.tipo, nombre: item.nombre, descripcion: item.descripcion || '', estado: item.estado, avances: item.avances || '', urlDocumento: item.urlDocumento || '' });
    setEditId(item.id); setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Acompañamiento a Proyectos de Ley y Decretos</h3>
        <button onClick={() => { setShowForm(s => !s); setEditId(null); }} className="bg-bogota-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700">
          {showForm ? '× Cancelar' : '+ Agregar'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
                <option value="DECRETO">Decreto</option>
                <option value="PROYECTO_LEY">Proyecto de Ley</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
                {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Decreto 117 de 2026" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
            </div>
            <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none" />
            </div>
            <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Avances</label>
              <textarea value={form.avances} onChange={e => setForm(f => ({ ...f, avances: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none" />
            </div>
            <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">URL del documento</label>
              <input value={form.urlDocumento} onChange={e => setForm(f => ({ ...f, urlDocumento: e.target.value }))} placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={guardar} disabled={guardando || !form.nombre}
              className="px-5 py-2 bg-bogota-primary text-white text-sm font-semibold rounded-lg disabled:opacity-60 hover:bg-red-700">
              {guardando ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item: any) => {
            const estado = ESTADOS[item.estado] || { label: item.estado, color: 'bg-gray-100 text-gray-600' };
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 font-semibold">{item.tipo === 'DECRETO' ? 'Decreto' : item.tipo === 'PROYECTO_LEY' ? 'Proyecto de Ley' : 'Otro'}</span>
                      <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${estado.color}`}>{estado.label}</span>
                    </div>
                    <h4 className="font-bold text-gray-800 mt-2">{item.nombre}</h4>
                    {item.descripcion && <p className="text-xs text-gray-600 mt-1">{item.descripcion}</p>}
                    {item.avances && <p className="text-xs text-blue-700 mt-2 bg-blue-50 rounded p-2"><strong>Avances:</strong> {item.avances}</p>}
                  </div>
                  <div className="flex gap-2 ml-2">
                    {item.urlDocumento && <a href={item.urlDocumento} target="_blank" rel="noreferrer" className="text-xs text-bogota-primary hover:underline">📎 Doc</a>}
                    <button onClick={() => editar(item)} className="text-xs text-gray-500 hover:text-gray-700 font-semibold">Editar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400"><p className="text-3xl mb-2">⚖️</p><p className="font-semibold">No hay instrumentos normativos registrados</p></div>
      )}
    </div>
  );
}
