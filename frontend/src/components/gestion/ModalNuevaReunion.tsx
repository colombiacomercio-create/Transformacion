import { useState, useRef } from 'react';
import { fetchApi } from '../../utils/api';

const API = import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app';

interface Compromiso { descripcion: string; responsable: string; fechaEntrega: string; }
interface Props { onClose: () => void; }

const TIPOS_REUNION = ['SESION_UNIDAD','REUNION_SEGUIMIENTO_AL','STOCKTAKE','VISITA_LOCALIDAD','MESA_TRABAJO','OTRA'];
const TIPOS_REUNION_LABELS: Record<string, string> = {
  SESION_UNIDAD: 'Sesion de la Unidad (Secretario)', REUNION_SEGUIMIENTO_AL: 'Reunion de seguimiento AL',
  STOCKTAKE: 'Stocktake', VISITA_LOCALIDAD: 'Visita a Localidad', MESA_TRABAJO: 'Mesa de Trabajo', OTRA: 'Otra',
};
const TIPOS_CONTRAPARTE = ['ALCALDIA','SECTOR_GOBIERNO','ENTIDAD_DISTRITO','INTERNA','OTRA_ENTIDAD'];
const TIPOS_CONTRAPARTE_LABELS: Record<string, string> = {
  ALCALDIA: 'Alcaldia / FDL', SECTOR_GOBIERNO: 'Sector Gobierno',
  ENTIDAD_DISTRITO: 'Entidad Distrito', INTERNA: 'Interna UGRT', OTRA_ENTIDAD: 'Otras entidades y actores',
};
const MODALIDADES = ['PRESENCIAL','VIRTUAL','TELEFONICA','MIXTA'];
const RESPONSABLES = [
  'MIGUEL EDUARDO PARRA CORVACHO - ASESOR LIDER TRANSFORMACION',
  'ROBERTO CARLOS PARRA BORREGO - TRANSFORMACION',
  'ARMANDO ESCOBAR SANCHEZ - TRANSFORMACION',
  'MARIA ADELAIDA BARROS - TRANSFORMACION',
  'MARIA ALEJANDRA CHAHIN - TRANSFORMACION',
  'JUAN CAMILO RIVERA ACEVEDO - TRANSFORMACION',
  'DAYANA MARCELA LOZANO - TRANSFORMACION',
];
const TEMATICAS = [
  { value: 'GLOBAL',  label: '(Ninguno / Global)' },
  { value: 'P01',     label: '[P01] Ingenieria de Detalle' },
  { value: 'P02',     label: '[P02] Comite de Planeacion' },
  { value: 'P03',     label: '[P03] Obras locales ejecutadas' },
  { value: 'P04',     label: '[P04] Residuos' },
  { value: 'P05',     label: '[P05] Organizacion Espacio Publico' },
  { value: 'P06',     label: '[P06] Equipos de seguridad' },
  { value: 'P07',     label: '[P07] Operativos IVC' },
  { value: 'P08',     label: '[P08] Rollos legendarios' },
  { value: 'P09',     label: '[P09] Transformacion de comportamientos' },
  { value: 'P10',     label: '[P10] Identidad local' },
  { value: 'PV1',     label: '[PV1] Memoria local' },
  { value: 'NIVEL_CENTRAL', label: 'Nivel Central' },
  { value: 'OV2',     label: '[OV2] Canales' },
  { value: 'OTRO',    label: 'Otro' },
];

// ─── Subformulario compartido: datos generales de la reunion ─────────────────
function DatosGenerales({ form, setForm, tematica, setTematica, subtematica, setSubtematica, responsablesList, setResponsablesList }: any) {
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Tipo de reunion *</label>
          <select value={form.tipoReunion} onChange={e => set('tipoReunion', e.target.value)} className="input">
            <option value="">Seleccione...</option>
            {TIPOS_REUNION.map(t => <option key={t} value={t}>{TIPOS_REUNION_LABELS[t]}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Actores de la reunion *</label>
          <select value={form.tipoContraparte} onChange={e => set('tipoContraparte', e.target.value)} className="input">
            <option value="">Seleccione...</option>
            {TIPOS_CONTRAPARTE.map(t => <option key={t} value={t}>{TIPOS_CONTRAPARTE_LABELS[t]}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Tematica (Aspiracion) *</label>
          <select value={tematica} onChange={e => setTematica(e.target.value)} className="input">
            {TEMATICAS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Subtematica (Agrupacion especifica)</label>
          <input type="text" value={subtematica} onChange={e => setSubtematica(e.target.value)} className="input" placeholder="Ej: Mesa de trabajo DGDL" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Objeto de la reunion *</label>
          <input value={form.objeto} onChange={e => set('objeto', e.target.value)} className="input" placeholder="Descripcion del objeto de la reunion..." />
        </div>
        <div><label className="label">Fecha *</label><input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className="input" /></div>
        <div>
          <label className="label">Modalidad</label>
          <select value={form.modalidad} onChange={e => set('modalidad', e.target.value)} className="input">
            {MODALIDADES.map(m => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
        <div><label className="label">Hora inicio</label><input type="time" value={form.horaInicio} onChange={e => set('horaInicio', e.target.value)} className="input" /></div>
        <div><label className="label">Hora fin</label><input type="time" value={form.horaFin} onChange={e => set('horaFin', e.target.value)} className="input" /></div>
        <div className="sm:col-span-2">
          <label className="label">Lugar</label>
          <input value={form.lugar} onChange={e => set('lugar', e.target.value)} className="input" placeholder="Ej: TEAMS, Sala de reuniones..." />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Responsable de la reunion *</label>
          <select
            value={RESPONSABLES.includes(form.responsable) ? form.responsable : (form.responsable ? 'OTRO' : '')}
            onChange={e => { if (e.target.value !== 'OTRO') set('responsable', e.target.value); else set('responsable', 'OTRO'); }}
            className="input"
          >
            <option value="">Seleccione responsable...</option>
            {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
            <option value="OTRO">Otro...</option>
          </select>
          {!RESPONSABLES.includes(form.responsable) && form.responsable !== '' && (
            <input type="text" value={form.responsable === 'OTRO' ? '' : form.responsable}
              onChange={e => set('responsable', e.target.value)}
              className="input mt-2 text-xs" placeholder="Cual?" />
          )}
        </div>
      </div>
      <div>
        <label className="label">Asistentes Unidad de Transformacion</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
          {RESPONSABLES.map(r => (
            <label key={r} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input type="checkbox" checked={responsablesList.includes(r)}
                onChange={e => {
                  if (e.target.checked) setResponsablesList((prev: string[]) => [...prev, r]);
                  else setResponsablesList((prev: string[]) => prev.filter((x: string) => x !== r));
                }}
                className="rounded text-bogota-primary focus:ring-bogota-primary"
              />
              {r.split('-')[0].trim()}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
export default function ModalNuevaReunion({ onClose }: Props) {
  const [modo, setModo] = useState<'nueva' | 'cargar' | null>(null);
  const [paso, setPaso] = useState(1);
  const [tematica, setTematica] = useState('GLOBAL');
  const [subtematica, setSubtematica] = useState('');
  const [form, setForm] = useState({
    tipoReunion: '', tipoContraparte: '', objeto: '', fecha: '',
    horaInicio: '', horaFin: '', lugar: '', modalidad: 'VIRTUAL', responsable: '', desarrollo: '',
  });
  const [responsablesList, setResponsablesList] = useState<string[]>([]);
  const [compromisos, setCompromisos] = useState<Compromiso[]>([{ descripcion: '', responsable: '', fechaEntrega: '' }]);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [actaFile, setActaFile] = useState<File | null>(null);
  const [reunionId, setReunionId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const addCompromiso = () => setCompromisos(c => [...c, { descripcion: '', responsable: '', fechaEntrega: '' }]);
  const setCompromiso = (i: number, k: keyof Compromiso, v: string) =>
    setCompromisos(c => c.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const removeCompromiso = (i: number) => setCompromisos(c => c.filter((_, idx) => idx !== i));

  const validarBase = () => {
    if (!form.tipoReunion || !form.tipoContraparte || !form.objeto || !form.fecha || !form.responsable || !form.lugar || !form.horaInicio || !form.horaFin) {
      setError('Complete todos los campos obligatorios: Tipo, Contraparte, Objeto, Fecha, Horas, Lugar y Responsable');
      return false;
    }
    return true;
  };

  const guardarReunion = async (conDesarrollo: boolean) => {
    if (!validarBase()) return;
    if (conDesarrollo && !form.desarrollo) {
      setError('Complete el campo Desarrollo y conclusiones de la reunion');
      return;
    }
    setGuardando(true); setError('');
    try {
      const asistentesPayload = responsablesList.map(nombre => ({ nombre, cargo: 'Unidad de Transformacion', entidad: 'SDG' }));
      const res = await fetchApi(`${API}/api/reuniones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          desarrollo: conDesarrollo ? form.desarrollo : '',
          tematica, subtematica,
          asistentes: asistentesPayload,
          compromisos: conDesarrollo ? compromisos.filter(c => c.descripcion) : [],
        }),
      });
      const data = await res.json();
      setReunionId(data.id);
      setPaso(2);
    } catch (e: any) {
      setError(`Error: ${e?.message || 'Error desconocido'}`);
    } finally {
      setGuardando(false);
    }
  };

  const subirImagenYGenerar = async () => {
    setGuardando(true); setError('');
    try {
      if (imagenFile) {
        const fd = new FormData();
        fd.append('imagen', imagenFile);
        await fetchApi(`${API}/api/reuniones/${reunionId}/imagen`, { method: 'POST', body: fd });
      }
      const pdfRes = await fetchApi(`${API}/api/reuniones/${reunionId}/pdf`);
      if (!pdfRes.ok) throw new Error('Error generando PDF');
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Acta_Reunion_${form.fecha}.pdf`; a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Error procesando el acta.');
    } finally {
      setGuardando(false);
    }
  };

  const subirActaYFinalizar = async () => {
    setGuardando(true); setError('');
    try {
      if (actaFile) {
        const fd = new FormData();
        fd.append('acta', actaFile);
        const uploadRes = await fetchApi(`${API}/api/reuniones/${reunionId}/acta`, { method: 'POST', body: fd });
        if (!uploadRes.ok) throw new Error('Error subiendo el PDF del acta');
      }
      const pdfRes = await fetchApi(`${API}/api/reuniones/${reunionId}/pdf`);
      if (!pdfRes.ok) throw new Error('Error obteniendo el acta');
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Acta_Reunion_${form.fecha}.pdf`; a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Error procesando el acta.');
    } finally {
      setGuardando(false);
    }
  };

  const pasoLabel = modo === null ? '' : `Paso ${paso} de 2 — ${modo === 'nueva' ? 'Elaborar nueva acta' : 'Cargar acta existente'}`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Nueva Reunion</h2>
            {pasoLabel && <p className="text-xs text-gray-500 mt-0.5">{pasoLabel}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">x</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">

          {/* SELECCION INICIAL */}
          {modo === null && (
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-6 text-center font-medium">Seleccione como desea registrar la reunion:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => { setModo('nueva'); setError(''); }}
                  className="border-2 border-bogota-primary rounded-xl p-6 text-left hover:bg-red-50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-bogota-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-800">Elaborar nueva acta</h3>
                  </div>
                  <p className="text-xs text-gray-500">Ingrese los datos de la reunion completos. El sistema generara el acta PDF automaticamente.</p>
                </button>
                <button onClick={() => { setModo('cargar'); setError(''); }}
                  className="border-2 border-gray-200 rounded-xl p-6 text-left hover:border-bogota-primary hover:bg-red-50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-800">Cargar acta existente</h3>
                  </div>
                  <p className="text-xs text-gray-500">Ya tiene el acta elaborada en PDF? Registre los datos generales y cargue el archivo PDF.</p>
                </button>
              </div>
            </div>
          )}

          {/* MODO NUEVA ACTA — Paso 1 */}
          {modo === 'nueva' && paso === 1 && (
            <div className="space-y-5 mt-1">
              <DatosGenerales form={form} setForm={setForm} tematica={tematica} setTematica={setTematica}
                subtematica={subtematica} setSubtematica={setSubtematica}
                responsablesList={responsablesList} setResponsablesList={setResponsablesList} />
              <div>
                <label className="label">Desarrollo y conclusiones de la reunion *</label>
                <textarea value={form.desarrollo} onChange={e => set('desarrollo', e.target.value)}
                  rows={4} className="input resize-none" placeholder="Descripcion del desarrollo, temas tratados y conclusiones..." />
              </div>
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
                        {compromisos.length > 1 && <button onClick={() => removeCompromiso(i)} className="text-red-400 text-sm font-bold px-1">x</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODO NUEVA ACTA — Paso 2 (imagen opcional) */}
          {modo === 'nueva' && paso === 2 && (
            <div className="space-y-4 mt-1">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-semibold">Reunion guardada correctamente</p>
                <p className="text-xs text-green-600 mt-1">Suba la imagen de desarrollo (opcional) para incluirla en el acta PDF.</p>
              </div>
              <div>
                <label className="label">Cargar imagen de desarrollo y conclusiones (Opcional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-bogota-primary transition-colors cursor-pointer"
                  onClick={() => fileRef.current?.click()}>
                  {imagenFile ? (
                    <div><p className="text-sm font-semibold text-gray-700">{imagenFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(imagenFile.size / 1024).toFixed(0)} KB</p></div>
                  ) : (
                    <div>
                      <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500">Haga clic para seleccionar imagen</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 20MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && setImagenFile(e.target.files[0])} />
              </div>
            </div>
          )}

          {/* MODO CARGAR ACTA — Paso 1 */}
          {modo === 'cargar' && paso === 1 && (
            <div className="space-y-5 mt-1">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
                Ingrese los datos generales de la reunion. El acta PDF que ya tiene elaborada se cargara en el siguiente paso.
              </div>
              <DatosGenerales form={form} setForm={setForm} tematica={tematica} setTematica={setTematica}
                subtematica={subtematica} setSubtematica={setSubtematica}
                responsablesList={responsablesList} setResponsablesList={setResponsablesList} />
            </div>
          )}

          {/* MODO CARGAR ACTA — Paso 2 (subir PDF) */}
          {modo === 'cargar' && paso === 2 && (
            <div className="space-y-4 mt-1">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-semibold">Datos generales guardados</p>
                <p className="text-xs text-green-600 mt-1">Ahora cargue el PDF del acta pre-elaborada.</p>
              </div>
              <div>
                <label className="label">Acta PDF a cargar</label>
                <p className="text-xs text-gray-500 mb-3">El PDF que suba sera el que se descargue al hacer clic en el icono de acta en la tabla. Puede omitirlo si aun no tiene el acta lista.</p>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-bogota-primary transition-colors cursor-pointer"
                  onClick={() => fileRef.current?.click()}>
                  {actaFile ? (
                    <div>
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-6 h-6 text-bogota-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{actaFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{(actaFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p className="text-xs text-green-600 mt-2 font-semibold">PDF listo para subir</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-500">Haga clic para seleccionar el acta PDF</p>
                      <p className="text-xs text-gray-400 mt-1">Solo PDF — max 20MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden"
                  onChange={e => e.target.files?.[0] && setActaFile(e.target.files[0])} />
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mt-4">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-between items-center">
          {modo === null ? (
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          ) : (
            <button onClick={() => { if (paso === 1) { setModo(null); setError(''); } else { setPaso(1); setError(''); } }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
              Atras
            </button>
          )}

          {modo === null && <div />}

          {modo === 'nueva' && paso === 1 && (
            <button onClick={() => guardarReunion(true)} disabled={guardando}
              className="px-6 py-2 rounded-lg bg-bogota-primary text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
              {guardando ? 'Guardando...' : 'Guardar y Continuar'}
            </button>
          )}
          {modo === 'nueva' && paso === 2 && (
            <button onClick={subirImagenYGenerar} disabled={guardando}
              className="px-6 py-2 rounded-lg bg-bogota-primary text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
              {guardando ? 'Generando acta...' : 'Finalizar y Generar Acta PDF'}
            </button>
          )}
          {modo === 'cargar' && paso === 1 && (
            <button onClick={() => guardarReunion(false)} disabled={guardando}
              className="px-6 py-2 rounded-lg bg-bogota-primary text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
              {guardando ? 'Guardando...' : 'Guardar y Continuar'}
            </button>
          )}
          {modo === 'cargar' && paso === 2 && (
            <button onClick={subirActaYFinalizar} disabled={guardando}
              className="px-6 py-2 rounded-lg bg-bogota-primary text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
              {guardando ? 'Subiendo...' : actaFile ? 'Finalizar y Subir Acta PDF' : 'Finalizar sin PDF'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .label { display: block; font-size: 0.75rem; font-weight: 600; color: #4B5563; margin-bottom: 0.25rem; }
        .input { width: 100%; border: 1px solid #D1D5DB; border-radius: 0.5rem; padding: 0.375rem 0.75rem; font-size: 0.875rem; }
        .input:focus { outline: none; border-color: #e3002b; }
      `}</style>
    </div>
  );
}
