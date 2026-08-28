const fs = require('fs');
const content = import { useState, useEffect } from 'react';
import { fetchApi } from '../../utils/api';

const API = import.meta.env.VITE_API_URL || '';

interface Props { onClose: (savedId?: string) => void; }

const SECCIONES = [
  {
    id: 'ejecucion', titulo: '1. Ejecución del Plan de Desarrollo',
    campos: [
      { key: 'compromisosPct', label: 'Compromisos - Avance Real %', type: 'number', step: '0.1' },
      { key: 'metaCompromisosPct', label: 'Compromisos - Programado al corte %', type: 'number', step: '0.1' },
      { key: 'girosPct', label: 'Giros - Avance Real %', type: 'number', step: '0.1' },
      { key: 'metaGirosPct', label: 'Giros - Programado al corte %', type: 'number', step: '0.1' },
      { key: 'procesosMonitoreados', label: 'Procesos Monitoreados', type: 'number' },
      { key: 'procesosRequierenComite', label: 'Procesos requieren comité', type: 'number' },
      { key: 'avancesEjecucion', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaEjecucion', label: 'Alertas (rezago, impacto, acción)', type: 'textarea' },
    ],
  },
  {
    id: 'obras', titulo: '2. Obras Locales',
    campos: [
      { key: 'metaObras', label: 'Meta anual de obras', type: 'number' },
      { key: 'obrasProgramadasAlCorte', label: 'Intervenciones programadas al corte', type: 'number' },
      { key: 'intervencionesFinalizadas', label: 'Intervenciones finalizadas (real)', type: 'number' },
      { key: 'kmCarrilIntervenido', label: 'Km-carril intervenidos', type: 'number', step: '0.1' },
      { key: 'kmIntervenidos', label: 'M2 intervenidos (kmIntervenidos/m2)', type: 'number', step: '0.1' },
      { key: 'avancesObras', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaObras', label: 'Alertas', type: 'textarea' },
    ],
  },
  {
    id: 'rollos', titulo: '3. Rollos Legendarios',
    campos: [
      { key: 'totalRollos', label: 'Total de rollos', type: 'number' },
      { key: 'rollosResueltos', label: 'Rollos resueltos (real)', type: 'number' },
      { key: 'rollosEnCurso', label: 'Rollos en curso', type: 'number' },
      { key: 'rollosAvancesSignificativos', label: 'Rollos con avances significativos', type: 'number' },
      { key: 'rollosProgramadosAlCorte', label: 'Rollos programados al corte', type: 'number' },
      { key: 'avancesRollos', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaRollos', label: 'Alertas', type: 'textarea' },
    ],
  },
  {
    id: 'espacioResid', titulo: '4. Espacio Público - Residuos',
    campos: [
      { key: 'puntosCriticosPriorizados', label: 'Total Puntos Críticos Priorizados', type: 'number' },
      { key: 'puntosSostenidosProgramados', label: 'Puntos programados para estar sostenidos', type: 'number' },
      { key: 'puntosSostenidos', label: 'Puntos sostenidos a la fecha (real)', type: 'number' },
      { key: 'personasSensibilizadas', label: 'Personas sensibilizadas (real)', type: 'number' },
      { key: 'personasSensibilizadasProgramadas', label: 'Personas sensibilizadas (programado)', type: 'number' },
      { key: 'operativosIVC', label: 'Operativos IVC (real)', type: 'number' },
      { key: 'operativosIVCProgramados', label: 'Operativos IVC (programado)', type: 'number' },
      { key: 'accionesReportadas', label: 'Intervenciones reportadas', type: 'number' },
      { key: 'residuosM3', label: 'Residuos recolectados (m³)', type: 'number', step: '0.1' },
      { key: 'espacioPublicoM2', label: 'M² recuperados', type: 'number', step: '0.1' },
      { key: 'avancesResiduos', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaEspacioResiduos', label: 'Alertas', type: 'textarea' },
    ],
  },
  {
    id: 'ventaInformal', titulo: '5. Organización Espacio y Venta Informal',
    campos: [
      { key: 'puntosVerificados', label: 'Total Puntos Priorizados/Verificados', type: 'number' },
      { key: 'puntosProgramadosSostenibilidad', label: 'Puntos programados para sostenibilidad', type: 'number' },
      { key: 'puntosSostenibilidadEfectiva', label: 'Puntos con sostenibilidad efectiva (real)', type: 'number' },
      { key: 'puntosIntervenidos', label: 'Intervenciones reportadas', type: 'number' },
      { key: 'm2RecuperadosInformal', label: 'M² recuperados', type: 'number', step: '0.1' },
      { key: 'personasReubicadas', label: 'Personas reubicadas', type: 'number' },
      { key: 'orgParqueo', label: 'Operativos de org. parqueo', type: 'number' },
      { key: 'ventaInformal', label: 'Operativos de venta informal', type: 'number' },
      { key: 'avancesVenta', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaEspacioVenta', label: 'Alertas', type: 'textarea' },
    ],
  },
  {
    id: 'actuaciones', titulo: '6. Actuaciones Administrativas',
    campos: [
      { key: 'metaArchivos', label: 'Archivos - Meta Anual', type: 'number' },
      { key: 'archivosProgramadosCorte', label: 'Archivos - Programado al corte', type: 'number', step: '0.1' },
      { key: 'archivosPct', label: 'Archivos - Resultado acumulado', type: 'number', step: '0.1' },
      { key: 'metaFallos', label: 'Fallos 1ª Instancia - Meta Anual', type: 'number' },
      { key: 'fallosProgramadosCorte', label: 'Fallos - Programado al corte', type: 'number', step: '0.1' },
      { key: 'fallosPrimeraEstanciaPct', label: 'Fallos - Resultado acumulado', type: 'number', step: '0.1' },
      { key: 'avancesActuaciones', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaActuaciones', label: 'Alertas', type: 'textarea' },
    ],
  },
  {
    id: 'convivencia', titulo: '7. Convivencia y Seguridad',
    campos: [
      { key: 'motosMetaTotal', label: 'Meta total de Motos', type: 'number' },
      { key: 'motosProgramadasCorte', label: 'Motos programadas al corte', type: 'number' },
      { key: 'motosEntregadasPolicia', label: 'Entregadas a Policía', type: 'number' },
      { key: 'motosEntregadas', label: 'Entregadas a SDSCJ', type: 'number' },
      { key: 'motosAlmacenFdl', label: 'En almacén FDL', type: 'number' },
      { key: 'motosPendientesFdl', label: 'Pendientes entrega FDL', type: 'number' },
      { key: 'avancesConvivencia', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaConvivencia', label: 'Alertas', type: 'textarea' },
    ],
  },
  {
    id: 'memoria', titulo: '8. Estrategias de Memoria',
    campos: [
      { key: 'estrategiasTotal', label: 'Total de Estrategias', type: 'number' },
      { key: 'estrategiasProgramadasCorte', label: 'Estrategias programadas al corte', type: 'number' },
      { key: 'estrategiasResueltas', label: 'Estrategias finalizadas', type: 'number' },
      { key: 'estrategiasFormulacion', label: 'En formulación', type: 'number' },
      { key: 'estrategiasAjustes', label: 'Con ajustes solicitados', type: 'number' },
      { key: 'estrategiasValidacionTecnica', label: 'En validación técnica', type: 'number' },
      { key: 'avancesEstrategias', label: 'Principales avances del corte (viñetas)', type: 'textarea' },
      { key: 'alertaEstrategias', label: 'Alertas', type: 'textarea' },
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
    fetchApi(\\/api/ficha-resultados/periodo/\\)
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
          const ultima = await fetchApi(\\/api/ficha-resultados/ultima\).then(r => r.json()).catch(() => null);
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
    
    const seccionesActualizadas = SECCIONES.filter(sec => {
      return sec.campos.some(campo => form[campo.key] !== originalForm[campo.key]);
    }).map(sec => sec.id);

    const payload = { ...form, seccionesActualizadas };

    try {
      const res = await fetchApi(\\/api/ficha-resultados\, {
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

          {SECCIONES.map(sec => (
            <div key={sec.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setSeccionAbierta(s => s === sec.id ? '' : sec.id)}
                className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700 transition-colors">
                {sec.titulo}
                <span>{seccionAbierta === sec.id ? '▼' : '▶'}</span>
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
\;

fs.writeFileSync('D:/Transformacion/frontend/src/components/gestion/ModalFichaResultados.tsx', content, { encoding: 'utf8' });
