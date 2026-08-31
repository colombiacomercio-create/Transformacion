import { useEffect, useState } from 'react';
import { fetchApi } from '../../utils/api';

const API = import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app';
const TIPOS: Record<string, string> = {
  CIRCULO_CALIDAD:       'Círculo de calidad',
  COMITE_OBRAS:          'Comité de obras e infraestructura',
  COMITE_ESPACIO_PUBLICO: 'Comité de Espacio Público',
  COMITE_RESIDUOS:       'Comité de residuos',
  COMITE_ACTUACIONES:    'Comité de actuaciones administrativas',
  OTRO:                  'Otro',
};

interface Props { userData: any; }

export default function SeccionOtrosEspacios({ userData }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: 'COMITE_OBRAS', nombre: '', fecha: '', descripcion: '', resultados: '' });
  const [guardando, setGuardando] = useState(false);

  const cargar = () =>
    fetchApi(`${API}/api/otros-espacios${filtroTipo ? `?tipo=${filtroTipo}` : ''}`).then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { cargar(); }, [filtroTipo]);

  const guardar = async () => {
    if (!form.nombre || !form.fecha) return;
    setGuardando(true);
    await fetchApi(`${API}/api/otros-espacios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }).catch(() => {});
    setGuardando(false); setShowForm(false);
    setForm({ tipo: 'COMITE_OBRAS', nombre: '', fecha: '', descripcion: '', resultados: '' });
    cargar();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Otros Espacios de Articulación</h3>
        <button onClick={() => setShowForm(s => !s)} className="bg-bogota-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700">
          {showForm ? '× Cancelar' : '+ Registrar actividad'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
            </div>
            <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
            </div>
            <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none" />
            </div>
            <div className="sm:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Resultados</label>
              <textarea value={form.resultados} onChange={e => setForm(f => ({ ...f, resultados: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none" />
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

      {/* Filtro */}
      <div>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700">
          <option value="">Todos los tipos</option>
          {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs bg-white rounded-xl border border-gray-100 shadow-sm">
            <thead><tr className="bg-gray-50">
              <th className="text-left px-3 py-2">Fecha</th>
              <th className="text-left px-3 py-2">Tipo</th>
              <th className="text-left px-3 py-2">Nombre</th>
              <th className="text-left px-3 py-2">Descripción</th>
              <th className="text-left px-3 py-2">Resultados</th>
            </tr></thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(item.fecha).toLocaleDateString('es-CO')}</td>
                  <td className="px-3 py-2"><span className="bg-orange-50 text-orange-700 rounded-full px-2 py-0.5">{TIPOS[item.tipo] || item.tipo}</span></td>
                  <td className="px-3 py-2 font-medium">{item.nombre}</td>
                  <td className="px-3 py-2 max-w-[200px] truncate text-gray-500">{item.descripcion || '-'}</td>
                  <td className="px-3 py-2 max-w-[200px] truncate text-green-700">{item.resultados || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400"><p className="text-3xl mb-2">🏛️</p><p className="font-semibold">No hay espacios de articulación registrados</p></div>
      )}
    </div>
  );
}
