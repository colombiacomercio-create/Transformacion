import { useState, useRef } from 'react';
import { fetchApi } from '../../utils/api';

const API = import.meta.env.VITE_API_URL || '';

interface Asistente { nombre: string; cargo: string; entidad: string; }
interface Compromiso { descripcion: string; responsable: string; fechaEntrega: string; }

interface Props { onClose: () => void; }

const TIPOS_REUNION = ['SESION_UNIDAD','REUNION_SEGUIMIENTO_AL','STOCKTAKE','VISITA_LOCALIDAD','MESA_TRABAJO','OTRA'];
const TIPOS_REUNION_LABELS: Record<string, string> = {
  SESION_UNIDAD: 'Sesión de la Unidad (Secretario)', REUNION_SEGUIMIENTO_AL: 'Reunión de seguimiento AL',
  STOCKTAKE: 'Stocktake', VISITA_LOCALIDAD: 'Visita a Localidad',
  MESA_TRABAJO: 'Mesa de Trabajo', OTRA: 'Otra',
};
const TIPOS_CONTRAPARTE = ['ALCALDIA','SECTOR_GOBIERNO','ENTIDAD_DISTRITO','INTERNA','OTRA_ENTIDAD'];
const TIPOS_CONTRAPARTE_LABELS: Record<string, string> = {
  ALCALDIA: 'Alcaldía / FDL', SECTOR_GOBIERNO: 'Sector Gobierno',
  ENTIDAD_DISTRITO: 'Entidad Distrito', INTERNA: 'Interna UGRT', OTRA_ENTIDAD: 'Otras entidades y actores',
};
const MODALIDADES = ['PRESENCIAL','VIRTUAL','TELEFONICA','MIXTA'];

const RESPONSABLES = [
  'MIGUEL EDUARDO PARRA CORVACHO - ASESOR LIDER TRANSFORMACIÓN',
  'ROBERTO CARLOS PARRA BORREGO - TRANSFORMACIÓN',
  'ARMANDO ESCOBAR SANCHEZ - TRANSFORMACIÓN',
  'MARIA ADELAIDA BARRIOS - TRANSFORMACIÓN',
  'MARIA ALEJANDRA CHAHIN - TRANSFORMACIÓN',
  'JUAN CAMILO RIVERA ACEVEDO - TRANSFORMACIÓN',
  'DAYANA MARCELA LOZANO - TRANSFORMACIÓN',
];

const TEMATICAS = [
  { value: 'GLOBAL',  label: '(Ninguno / Global)' },
  { value: 'P01',     label: '[P01] Ingeniería de Detalle' },
  { value: 'P02',     label: '[P02] Comité de Planeación' },
  { value: 'P03',     label: '[P03] Obras locales ejecutadas' },
  { value: 'P04',     label: '[P04] Residuos' },
  { value: 'P05',     label: '[P05] Organización Espacio Público' },
  { value: 'P06',     label: '[P06] Equipos de seguridad' },
  { value: 'P07',     label: '[P07] Operativos IVC' },
  { value: 'P08',     label: '[P08] Rollos legendarios' },
  { value: 'P09',     label: '[P09] Transformación de comportamientos' },
  { value: 'P10',     label: '[P10] Identidad local' },
  { value: 'PV1',     label: '[PV1] Memoria local' },
  { value: 'OTRO',    label: 'Otro' },
];

export default function ModalNuevaReunion({ onClose }: Props) {
  const [paso, setPaso] = useState(1);
  const [tematica, setTematica] = useState('GLOBAL');
  const [subtematica, setSubtematica] = useState('');
  const [form, setForm] = useState({
    tipoReunion: '', tipoContraparte: '', objeto: '', fecha: '',
    horaInicio: '', horaFin: '', lugar: '', modalidad: 'VIRTUAL', responsable: '', desarrollo: '',
  });
  const [asistentes, setAsistentes] = useState<Asistente[]>([{ nombre: '', cargo: '', entidad: '' }]);
  const [compromisos, setCompromisos] = useState<Compromiso[]>([{ descripcion: '', responsable: '', fechaEntrega: '' }]);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [reunionId, setReunionId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const addAsistente = () => setAsistentes(a => [...a, { nombre: '', cargo: '', entidad: '' }]);
  const setAsistente = (i: number, k: keyof Asistente, v: string) =>
    setAsistentes(a => a.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const removeAsistente = (i: number) => setAsistentes(a => a.filter((_, idx) => idx !== i));

  const addCompromiso = () => setCompromisos(c => [...c, { descripcion: '', responsable: '', fechaEntrega: '' }]);
  const setCompromiso = (i: number, k: keyof Compromiso, v: string) =>
    setCompromisos(c => c.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const removeCompromiso = (i: number) => setCompromisos(c => c.filter((_, idx) => idx !== i));

  const guardarReunion = async () => {
    if (!form.tipoReunion || !form.tipoContraparte || !form.objeto || !form.fecha || !form.responsable || !form.lugar || !form.horaInicio || !form.horaFin || !form.desarrollo) {
      setError('Complete todos los campos obligatorios: Tipo, Contraparte, Objeto, Fecha, Horas, Lugar, Responsable y Desarrollo'); return;
    }
    setGuardando(true); setError('');
    try {
      const res = await fetchApi(`${API}/api/reuniones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tematica, subtematica, asistentes: asistentes.filter(a => a.nombre), compromisos: compromisos.filter(c => c.descripcion) }),
      });
      const data = await res.json();
      setReunionId(data.id);
      setPaso(2);
    } catch (e: any) {
      console.error('Error guardando reunión:', e);
      setError(`Error: ${e?.message || 'Error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };

  const subirImagenYGenerar = async () => {
    if (!imagenFile || !reunionId) { setError('La imagen de asistencia es obligatoria'); return; }
    setGuardando(true); setError('');
    try {
      const fd = new FormData();
      fd.append('imagen', imagenFile);
      await fetchApi(`${API}/api/reuniones/${reunionId}/imagen`, { method: 'POST', body: fd });
      // Descargar PDF
      const pdfRes = await fetchApi(`${API}/api/reuniones/${reunionId}/pdf`);
      if (!pdfRes.ok) throw new Error('Error generando PDF');
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Acta_Reunion_${form.fecha}.pdf`; a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Error procesando la imagen o generando el PDF.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Nueva Reunión</h2>
            <p className="text-xs text-gray-500">Formato GDI-GPD-F029 — Evidencia de Reunión</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Paso {paso} de 2</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {paso === 1 && (
            <>
              {/* Datos básicos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="label">Tipo de reunión *</label>
                  <select value={form.tipoReunion} onChange={e => set('tipoReunion', e.target.value)} className="input">
                    <option value="">Seleccione...</option>
                    {TIPOS_REUNION.map(t => <option key={t} value={t}>{TIPOS_REUNION_LABELS[t]}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Actores de la reunión *</label>
                  <select value={form.tipoContraparte} onChange={e => set('tipoContraparte', e.target.value)} className="input">
                    <option value="">Seleccione...</option>
                    {TIPOS_CONTRAPARTE.map(t => <option key={t} value={t}>{TIPOS_CONTRAPARTE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Temática (Aspiración) *</label>
                  <select value={tematica} onChange={e => setTematica(e.target.value)} className="input">
                    {TEMATICAS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Subtemática (Agrupación específica)</label>
                  <input type="text" value={subtematica} onChange={e => setSubtematica(e.target.value)} className="input" placeholder="Ej: Mesa de trabajo DGDL" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">
                    Objeto de la reunión *
                    {tematica !== 'GLOBAL' && tematica !== 'OTRO' && (
                      <span className="ml-2 text-bogota-primary font-normal">{TEMATICAS.find(t => t.value === tematica)?.label}</span>
                    )}
                  </label>
                  <input value={form.objeto} onChange={e => set('objeto', e.target.value)} className="input" placeholder="Descripción del objeto de la reunión..." />
                </div>
                <div><label className="label">Fecha *</label><input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className="input" /></div>
                <div><label className="label">Modalidad</label>
                  <select value={form.modalidad} onChange={e => set('modalidad', e.target.value)} className="input">
                    {MODALIDADES.map(m => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div><label className="label">Hora inicio</label><input type="time" value={form.horaInicio} onChange={e => set('horaInicio', e.target.value)} className="input" /></div>
                <div><label className="label">Hora fin</label><input type="time" value={form.horaFin} onChange={e => set('horaFin', e.target.value)} className="input" /></div>
                <div className="sm:col-span-2"><label className="label">Lugar</label><input value={form.lugar} onChange={e => set('lugar', e.target.value)} className="input" placeholder="Ej: TEAMS, Sala de reuniones..." /></div>
                <div className="sm:col-span-2">
                  <label className="label">Responsable de la reunión *</label>
                  <select value={form.responsable} onChange={e => set('responsable', e.target.value)} className="input">
                    <option value="">Seleccione responsable...</option>
                    {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Asistentes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">Asistentes</label>
                  <button onClick={addAsistente} className="text-xs text-bogota-primary font-semibold hover:underline">+ Agregar</button>
                </div>
                <div className="space-y-2">
                  {asistentes.map((a, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 items-center">
                      <input value={a.nombre} onChange={e => setAsistente(i, 'nombre', e.target.value)} placeholder="Nombre *" className="input text-xs" />
                      <input value={a.cargo} onChange={e => setAsistente(i, 'cargo', e.target.value)} placeholder="Cargo" className="input text-xs" />
                      <div className="flex gap-1">
                        <input value={a.entidad} onChange={e => setAsistente(i, 'entidad', e.target.value)} placeholder="Entidad" className="input text-xs flex-1" />
                        {asistentes.length > 1 && <button onClick={() => removeAsistente(i)} className="text-red-400 hover:text-red-600 text-sm font-bold px-1">×</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desarrollo */}
              <div>
                <label className="label">Desarrollo y conclusiones de la reunión</label>
                <textarea value={form.desarrollo} onChange={e => set('desarrollo', e.target.value)}
                  rows={4} className="input resize-none" placeholder="Descripción del desarrollo, temas tratados y conclusiones..." />
              </div>

              {/* Compromisos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">Compromisos</label>
                  <button onClick={addCompromiso} className="text-xs text-bogota-primary font-semibold hover:underline">+ Agregar</button>
                </div>
                <div className="space-y-2">
                  {compromisos.map((c, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 items-center">
                      <input value={c.descripcion} onChange={e => setCompromiso(i, 'descripcion', e.target.value)} placeholder="Actividad / compromiso *" className="input text-xs" />
                      <input value={c.responsable} onChange={e => setCompromiso(i, 'responsable', e.target.value)} placeholder="Responsable" className="input text-xs" />
                      <div className="flex gap-1">
                        <input type="date" value={c.fechaEntrega} onChange={e => setCompromiso(i, 'fechaEntrega', e.target.value)} className="input text-xs flex-1" />
                        {compromisos.length > 1 && <button onClick={() => removeCompromiso(i)} className="text-red-400 hover:text-red-600 text-sm font-bold px-1">×</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {paso === 2 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-semibold">✓ Reunión guardada correctamente</p>
                <p className="text-xs text-green-600 mt-1">Ahora suba la imagen de asistencia para generar el acta PDF</p>
              </div>
              <div>
                <label className="label">Imagen de asistencia *</label>
                <p className="text-xs text-gray-500 mb-2">Foto de la planilla de asistencia firmada o captura de pantalla de la reunión en Teams.</p>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-bogota-primary transition-colors cursor-pointer"
                  onClick={() => fileRef.current?.click()}>
                  {imagenFile ? (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{imagenFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{(imagenFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-3xl mb-2">📎</p>
                      <p className="text-sm text-gray-500">Haga clic para seleccionar imagen</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF — máx 20MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                  onChange={e => e.target.files?.[0] && setImagenFile(e.target.files[0])} />
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-between">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          {paso === 1 ? (
            <button onClick={guardarReunion} disabled={guardando}
              className="px-6 py-2 rounded-lg bg-bogota-primary text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
              {guardando ? 'Guardando...' : 'Guardar y Continuar →'}
            </button>
          ) : (
            <button onClick={subirImagenYGenerar} disabled={guardando || !imagenFile}
              className="px-6 py-2 rounded-lg bg-bogota-primary text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
              {guardando ? 'Generando acta...' : '📄 Guardar imagen y Generar Acta PDF'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .label { display: block; font-size: 0.75rem; font-weight: 600; color: #4B5563; margin-bottom: 0.25rem; }
        .input { width: 100%; border: 1px solid #D1D5DB; border-radius: 0.5rem; padding: 0.375rem 0.75rem; font-size: 0.875rem; }
        .input:focus { outline: none; ring: 2px; border-color: #e3002b; }
      `}</style>
    </div>
  );
}
