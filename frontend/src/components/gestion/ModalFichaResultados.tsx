import { useState, useEffect } from 'react';
import { fetchApi } from '../../utils/api';

const API = import.meta.env.VITE_API_URL || '';

interface Props { onClose: (savedId?: string) => void; }

const SECCIONES = [
  {
    id: 'ejecucion', titulo: 'Ejecución Presupuestal',
    campos: [
      { key: 'ejecucionActEn', label: 'Fecha de corte (esta sección)', type: 'date' },
      { key: 'compromisosPct', label: '% Compromisos', type: 'number' },
      { key: 'girosPct', label: '% Giros', type: 'number' },
      { key: 'procesosMonitoreados', label: 'Procesos contractuales monitoreados', type: 'number' },
      { key: 'procesosRequierenComite', label: 'Requieren Comité de Contratación', type: 'number' },
      { key: 'alertaEjecucion', label: 'Texto de alerta (opcional)', type: 'textarea' },
    ],
  },
  {
    id: 'obras', titulo: 'Obras Locales',
    campos: [
      { key: 'obrasActEn', label: 'Fecha de corte (esta sección)', type: 'date' },
      { key: 'metaObras', label: 'Meta de obras', type: 'number' },
      { key: 'intervencionesFinalizadas', label: 'Intervenciones finalizadas', type: 'number' },
      { key: 'kmCarrilIntervenido', label: 'Km carril intervenido', type: 'number' },
      { key: 'kmIntervenidos', label: 'm² intervenidos', type: 'number' },
      { key: 'alertaObras', label: 'Texto de alerta (opcional)', type: 'textarea' },
    ],
  },
  {
    id: 'comites', titulo: 'Comités de Contratación',
    campos: [
      { key: 'comitesActEn', label: 'Fecha de corte (esta sección)', type: 'date' },
      { key: 'comitesRealizados', label: 'Comités realizados', type: 'number' },
      { key: 'comitesMeta', label: 'Meta de comités', type: 'number' },
      { key: 'alertaComites', label: 'Texto de alerta (opcional)', type: 'textarea' },
    ],
  },
  {
    id: 'espacioResid', titulo: 'Espacio Público – Residuos',
    campos: [
      { key: 'espacioResiduosActEn', label: 'Fecha de corte (esta sección)', type: 'date' },
      { key: 'accionesReportadas', label: 'Intervenciones reportadas', type: 'number' },
      { key: 'residuosM3', label: 'Residuos recolectados (m³)', type: 'number' },
      { key: 'espacioPublicoM2', label: 'Espacio público recuperado (m²)', type: 'number' },
      { key: 'alertaEspacioResiduos', label: 'Texto de alerta (opcional)', type: 'textarea' },
    ],
  },
  {
    id: 'ventaInformal', titulo: 'Organización y Recuperación Espacio Público',
    campos: [
      { key: 'espacioVentaActEn', label: 'Fecha de corte (esta sección)', type: 'date' },
      { key: 'puntosIntervenidos', label: 'Intervenciones reportadas', type: 'number' },
      { key: 'ventaInformal', label: 'Venta informal', type: 'number' },
      { key: 'orgParqueo', label: 'Org. parqueo', type: 'number' },
      { key: 'm2RecuperadosInformal', label: 'm² recuperados', type: 'number' },
      { key: 'personasReubicadas', label: 'Personas reubicadas', type: 'number' },
      { key: 'alertaEspacioVenta', label: 'Texto de alerta (opcional)', type: 'textarea' },
    ],
  },
  {
    id: 'convivencia', titulo: 'Convivencia y Seguridad',
    campos: [
      { key: 'convivenciaActEn', label: 'Fecha de corte (esta sección)', type: 'date' },
      { key: 'motosContratadas', label: 'Motos contratadas', type: 'number' },
      { key: 'motosPendientesFdl', label: 'Motos pendientes FDL', type: 'number' },
      { key: 'motosAlmacenFdl', label: 'Motos en almacén FDL', type: 'number' },
      { key: 'motosEntregadas', label: 'Motos entregadas', type: 'number' },
      { key: 'alertaConvivencia', label: 'Texto de alerta (opcional)', type: 'textarea' },
    ],
  },
  {
    id: 'actuaciones', titulo: 'Actuaciones Administrativas',
    campos: [
      { key: 'actuacionesActEn', label: 'Fecha de corte (esta sección)', type: 'date' },
      { key: 'archivosPct', label: '% Archivos (M11)', type: 'number' },
      { key: 'metaArchivos', label: 'Meta anual archivos (M11)', type: 'number' },
      { key: 'fallosPrimeraEstanciaPct', label: '% Fallos 1ª estancia (M12)', type: 'number' },
      { key: 'metaFallos', label: 'Meta anual fallos (M12)', type: 'number' },
      { key: 'alertaActuaciones', label: 'Texto de alerta (opcional)', type: 'textarea' },
    ],
  },
  {
    id: 'memoria', titulo: 'Estrategias de Memoria',
    campos: [
      { key: 'estrategiasActEn', label: 'Fecha de corte (esta sección)', type: 'date' },
      { key: 'estrategiasResueltas', label: 'Resueltas', type: 'number' },
      { key: 'estrategiasFormulacion', label: 'En formulación', type: 'number' },
      { key: 'alertaEstrategias', label: 'Texto de alerta (opcional)', type: 'textarea' },
    ],
  },
  {
    id: 'rollos', titulo: 'Rollos Legendarios',
    campos: [
      { key: 'rollosActEn', label: 'Fecha de corte (esta sección)', type: 'date' },
      { key: 'rollosResueltos', label: 'Resueltos', type: 'number' },
      { key: 'rollosEnCurso', label: 'En curso', type: 'number' },
      { key: 'alertaRollos', label: 'Texto de alerta por localidad (opcional)', type: 'textarea' },
    ],
  },
];

export default function ModalFichaResultados({ onClose }: Props) {
  const getLocalISODate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };
  const [form, setForm] = useState<Record<string, any>>({ periodo: getLocalISODate() });
  const [originalForm, setOriginalForm] = useState<Record<string, any>>({});
  const [seccionAbierta, setSeccionAbierta] = useState<string>('ejecucion');
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  useEffect(() => {
    if (!form.periodo) return;
    setCargando(true);
    fetchApi(`${API}/api/ficha-resultados/periodo/${form.periodo}`)
      .then(res => res.json())
      .then(async data => {
        const formatearFechas = (obj: any) => {
          const res = { ...obj, periodo: obj.periodo.split('T')[0] };
          Object.keys(res).forEach(k => {
             if (k.endsWith('ActEn') && res[k]) {
                res[k] = res[k].split('T')[0];
             }
          });
          return res;
        };
        if (data && data.id) {
          const loadedData = formatearFechas(data);
          setForm(loadedData);
          setOriginalForm(loadedData);
        } else {
          const ultima = await fetchApi(`${API}/api/ficha-resultados/ultima`).then(r => r.json()).catch(() => null);
          if (ultima && ultima.id) {
             const copiedData = { ...formatearFechas(ultima), id: undefined, periodo: form.periodo };
             setForm(copiedData);
             setOriginalForm(copiedData);
          } else {
             const emptyData = { periodo: form.periodo };
             setForm(emptyData);
             setOriginalForm(emptyData);
          }
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [form.periodo]);

  const guardar = async () => {
    if (!form.periodo) { setError('El período de corte es obligatorio'); return; }
    setGuardando(true);
    
    // Computar qué secciones fueron modificadas
    const seccionesActualizadas = SECCIONES.filter(sec => {
      return sec.campos.some(campo => form[campo.key] !== originalForm[campo.key]);
    }).map(sec => sec.id);

    // Añadir el array al payload
    const payload = { ...form, seccionesActualizadas };

    try {
      const res = await fetchApi(`${API}/api/ficha-resultados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const savedData = await res.json();
      onClose(savedData.id);
    } catch {
      setError('Error guardando la ficha. Intente nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Reportar Datos de la Ficha</h2>
          <button onClick={() => onClose()} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Período del Reporte (General) *</label>
            <div className="flex gap-2 items-center">
               <input type="date" value={form.periodo || ''} onChange={e => set('periodo', e.target.value)}
                 className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-bogota-primary focus:border-transparent" />
               {cargando && <span className="text-xs text-gray-400">Cargando...</span>}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Si seleccionas una fecha existente (ej. la que ves en el filtro), los datos se cargarán para ser editados.</p>
          </div>

          {/* Secciones acordeón */}
          {SECCIONES.map(sec => (
            <div key={sec.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setSeccionAbierta(s => s === sec.id ? '' : sec.id)}
                className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700 transition-colors">
                {sec.titulo}
                <span>{seccionAbierta === sec.id ? '▲' : '▼'}</span>
              </button>
              {seccionAbierta === sec.id && (
                <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sec.campos.map(campo => (
                    <div key={campo.key} className={campo.type === 'textarea' ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{campo.label}</label>
                      {campo.type === 'textarea' ? (
                        <textarea value={form[campo.key] || ''} onChange={e => set(campo.key, e.target.value)}
                          rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-bogota-primary focus:border-transparent resize-none" />
                      ) : campo.type === 'date' ? (
                        <input type="date" value={form[campo.key] || ''} 
                          onChange={e => set(campo.key, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-bogota-primary focus:border-transparent" />
                      ) : (
                        <input type={campo.type} value={form[campo.key] ?? ''} 
                          onChange={e => set(campo.key, e.target.value === '' ? null : Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-bogota-primary focus:border-transparent" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Observaciones generales</label>
            <textarea value={form.observaciones || ''} onChange={e => set('observaciones', e.target.value)}
              rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-bogota-primary focus:border-transparent resize-none" />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={() => onClose()} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={guardar} disabled={guardando}
            className="px-6 py-2 rounded-lg bg-bogota-primary text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors">
            {guardando ? 'Guardando...' : 'Guardar Ficha'}
          </button>
        </div>
      </div>
    </div>
  );
}
