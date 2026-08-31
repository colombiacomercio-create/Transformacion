import { useEffect, useState, useRef } from 'react';
import { fetchApi } from '../../utils/api';

const API = import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app';
const TIPOS: Record<string, string> = {
  BOLETIN_TRANSFORMACION: 'Boletín Transformación Local',
  REPORTE_SDG: 'Reporte Transformación SDG',
  INFORME_OAP: 'Informe Mensual OAP',
  OTRO: 'Otro',
};

interface Props { userData: any; }

export default function SeccionInformes({ userData }: Props) {
  const [informes, setInformes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: 'BOLETIN_TRANSFORMACION', titulo: '', periodo: '', descripcion: '' });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cargar = () =>
    fetchApi(`${API}/api/informes`).then(r => r.json()).then(d => setInformes(Array.isArray(d) ? d : [])).catch(() => {});

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    if (!form.titulo || !form.periodo) return;
    setGuardando(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (archivo) fd.append('archivo', archivo);
    await fetchApi(`${API}/api/informes`, { method: 'POST', body: fd }).catch(() => {});
    setGuardando(false);
    setShowForm(false);
    setForm({ tipo: 'BOLETIN_TRANSFORMACION', titulo: '', periodo: '', descripcion: '' });
    setArchivo(null);
    cargar();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Informes</h3>
        <button onClick={() => setShowForm(s => !s)}
          className="bg-bogota-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
          {showForm ? '× Cancelar' : '+ Agregar Informe'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Período (ej: 2026-05)</label>
              <input value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))}
                placeholder="2026-05" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
              <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Archivo (opcional)</label>
              <div className="flex items-center gap-2">
                <button onClick={() => fileRef.current?.click()}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100">
                  📎 {archivo ? archivo.name : 'Seleccionar archivo'}
                </button>
                <input ref={fileRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && setArchivo(e.target.files[0])} />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={guardar} disabled={guardando || !form.titulo || !form.periodo}
              className="px-5 py-2 bg-bogota-primary text-white text-sm font-semibold rounded-lg disabled:opacity-60 hover:bg-red-700">
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {informes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs bg-white rounded-xl border border-gray-100 shadow-sm">
            <thead><tr className="bg-gray-50">
              <th className="text-left px-3 py-2">Tipo</th>
              <th className="text-left px-3 py-2">Título</th>
              <th className="text-left px-3 py-2">Período</th>
              <th className="text-left px-3 py-2">Registrado por</th>
              <th className="text-left px-3 py-2">Archivo</th>
            </tr></thead>
            <tbody>
              {informes.map((inf: any) => (
                <tr key={inf.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2"><span className="bg-red-50 text-red-700 rounded-full px-2 py-0.5">{TIPOS[inf.tipo] || inf.tipo}</span></td>
                  <td className="px-3 py-2 font-medium">{inf.titulo}</td>
                  <td className="px-3 py-2">{inf.periodo}</td>
                  <td className="px-3 py-2">{inf.creadoPor?.nombre}</td>
                  <td className="px-3 py-2">
                    {inf.urlArchivo ? <a href={inf.urlArchivo} target="_blank" rel="noreferrer" className="text-bogota-primary hover:underline font-semibold">📎 Ver</a> : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400"><p className="text-3xl mb-2">📄</p><p className="font-semibold">No hay informes registrados</p></div>
      )}
    </div>
  );
}
