import { useEffect, useState } from 'react';
import { fetchApi } from '../../utils/api';
import ModalNuevaReunion from './ModalNuevaReunion';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API = import.meta.env.VITE_API_URL || '';

const COLORS = ['#e3002b','#FFCD00','#1a1a2e','#16213e','#0f3460','#e94560','#f5a623','#7ed321','#417505','#9013fe'];

const TIPOS_REUNION: Record<string, string> = {
  SESION_UNIDAD: 'Sesión Unidad', REUNION_SEGUIMIENTO_AL: 'Seguimiento AL',
  STOCKTAKE: 'Stocktake', VISITA_LOCALIDAD: 'Visita Localidad',
  MESA_TRABAJO: 'Mesa de Trabajo', OTRA: 'Otra',
};

const TIPOS_CONTRAPARTE: Record<string, string> = {
  ALCALDIA: 'Alcaldía / FDL', SECTOR_GOBIERNO: 'Sector Gobierno',
  ENTIDAD_DISTRITO: 'Entidad Distrito', INTERNA: 'Interna UGRT', OTRA_ENTIDAD: 'Otras entidades y actores',
};

const TEMATICAS: Record<string, string> = {
  GLOBAL: 'Global',
  P01: '[P01] Ingeniería de Detalle',
  P02: '[P02] Comité de Planeación',
  P03: '[P03] Obras locales ejecutadas',
  P04: '[P04] Residuos',
  P05: '[P05] Organización Espacio Público',
  P06: '[P06] Equipos de seguridad',
  P07: '[P07] Operativos IVC',
  P08: '[P08] Rollos legendarios',
  P09: '[P09] Transformación de comportamientos',
  P10: '[P10] Identidad local',
  PV1: '[PV1] Memoria local',
  NIVEL_CENTRAL: 'Nivel Central',
  OV2: '[OV2] Canales',
  OTRO: 'Otro',
};

const RESPONSABLES = [
  'MIGUEL EDUARDO PARRA CORVACHO - ASESOR LIDER TRANSFORMACIÓN',
  'ROBERTO CARLOS PARRA BORREGO - TRANSFORMACIÓN',
  'ARMANDO ESCOBAR SANCHEZ - TRANSFORMACIÓN',
  'MARIA ADELAIDA BARROS - TRANSFORMACIÓN',
  'MARIA ALEJANDRA CHAHIN - TRANSFORMACIÓN',
  'JUAN CAMILO RIVERA ACEVEDO - TRANSFORMACIÓN',
  'DAYANA MARCELA LOZANO - TRANSFORMACIÓN',
];

const PERIODOS = [
  { value: '', label: 'Todo el tiempo' },
  { value: '2026', label: 'Año 2026' }, { value: '2025', label: 'Año 2025' },
  { value: '2026-01', label: 'Enero 2026' }, { value: '2026-02', label: 'Febrero 2026' },
  { value: '2026-03', label: 'Marzo 2026' },  { value: '2026-04', label: 'Abril 2026' },
  { value: '2026-05', label: 'Mayo 2026' },   { value: '2026-06', label: 'Junio 2026' },
  { value: '2026-07', label: 'Julio 2026' },  { value: '2026-08', label: 'Agosto 2026' },
  { value: '2026-09', label: 'Septiembre 2026' }, { value: '2026-10', label: 'Octubre 2026' },
  { value: '2026-11', label: 'Noviembre 2026' },  { value: '2026-12', label: 'Diciembre 2026' },
];

interface Props { userData: any; }

export default function SeccionSesionesMesas({ userData }: Props) {
  const [reuniones, setReuniones] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filtroContraparte, setFiltroContraparte] = useState('');
  const [filtroResponsable, setFiltroResponsable] = useState('');
  const [filtroMes, setFiltroMes] = useState('2026');
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroSubtematica, setFiltroSubtematica] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    const params = new URLSearchParams();
    if (filtroContraparte) params.set('tipoContraparte', filtroContraparte);
    if (filtroResponsable) params.set('responsable', filtroResponsable);
    if (filtroMes) {
      if (filtroMes === '2026') {
        params.set('desde', '2026-01-01');
        params.set('hasta', '2026-12-31');
      } else if (filtroMes === '2025') {
        params.set('desde', '2025-01-01');
        params.set('hasta', '2025-12-31');
      } else {
        params.set('desde', `${filtroMes}-01`);
        const [y, m] = filtroMes.split('-').map(Number);
        const ultimo = new Date(y, m, 0).getDate();
        params.set('hasta', `${filtroMes}-${ultimo}`);
      }
    }
    Promise.all([
      fetchApi(`${API}/api/reuniones?${params}`).then(r => r.json()).catch(() => []),
      fetchApi(`${API}/api/reuniones/stats?${params}`).then(r => r.json()).catch(() => null),
    ]).then(([lista, s]) => {
      setReuniones(Array.isArray(lista) ? lista : []);
      setStats(s);
      setLoading(false);
    });
  };

  useEffect(() => { cargar(); }, [filtroContraparte, filtroResponsable, filtroMes]);

  const descargarPDF = async (id: string, fecha: string) => {
    try {
      const res = await fetchApi(`${API}/api/reuniones/${id}/pdf`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Acta_Reunion_${fecha.slice(0, 10)}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(`Error: ${error.message || 'Error generando el acta PDF'}`);
    }
  };

  const eliminarReunion = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro por completo? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetchApi(`${API}/api/reuniones/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Reunión eliminada correctamente');
        cargar(); // Recargar datos
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'Error eliminando la reunión'}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Error eliminando la reunión'}`);
    }
  };

  // Datos para gráficas
  const dataTipoReunion = stats?.porTipoReunion
    ? Object.entries(stats.porTipoReunion).map(([k, v]) => ({ name: TIPOS_REUNION[k] || k, value: v as number }))
    : [];

  const dataContraparteChart = stats?.porTipoContraparte
    ? Object.entries(stats.porTipoContraparte)
        .map(([k, v]) => ({ name: TIPOS_CONTRAPARTE[k] || k, reuniones: v as number }))
        .sort((a: any, b: any) => b.reuniones - a.reuniones)
    : [];

  // Evolución Mes a Mes
  const mesesOrdenados = [
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
    '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
    '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'
  ];
  const dataMes = mesesOrdenados.map(mes => ({
    name: mes,
    reuniones: stats?.porMes?.[mes] || 0
  }));

  const total2025_2026 = Object.entries(stats?.porMes || {}).reduce((sum, [mes, count]) => {
    if (mes.startsWith('2025') || mes.startsWith('2026')) return sum + (count as number);
    return sum;
  }, 0);

  const tematicasUnicasDB = Array.from(new Set(reuniones.map(r => r.tematica).filter(Boolean))) as string[];
  const tematicasDefault = Object.entries(TEMATICAS);
  const tematicasExtra = tematicasUnicasDB
    .filter(t => !TEMATICAS[t])
    .map(t => [t, `2025 - ${t}`]);
  const renderFiltroProductos = [...tematicasDefault, ...tematicasExtra];

  // Filtro local por producto y subtematica
  const reunionesFiltradas = reuniones.filter(r => {
    if (filtroProducto && (r.tematica || 'GLOBAL') !== filtroProducto) return false;
    if (filtroSubtematica && r.subtematica !== filtroSubtematica) return false;
    return true;
  });

  const subtematicasUnicas = Array.from(new Set(reuniones.map(r => r.subtematica).filter(Boolean))) as string[];

  const totalCompromisos = reuniones.reduce((s, r) => s + (r.compromisos?.length ?? 0), 0);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Sesiones y/o Mesas de Trabajo</h3>
        <button onClick={() => setShowModal(true)}
          className="bg-bogota-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
          + Nueva Reunión
        </button>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LineChart: Evolución mes a mes */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm relative">
          <div className="absolute top-4 right-4 bg-gray-100 text-gray-800 font-bold px-3 py-1 rounded text-sm">
            Total 2025-2026: {total2025_2026}
          </div>
          <h4 className="text-sm font-bold text-gray-700 mb-3">Reuniones Mes a Mes (2025 - 2026)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dataMes} margin={{ left: 0, right: 16 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="reuniones" fill="#e3002b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* BarChart: por Tipo Contraparte */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h4 className="text-sm font-bold text-gray-700 mb-3">Tipo de reunión</h4>
          {dataContraparteChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dataContraparteChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 9 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={130} />
                <Tooltip />
                <Bar dataKey="reuniones" fill="#e3002b" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-xs">Sin datos</div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-bogota-primary">
          {PERIODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={filtroProducto} onChange={e => setFiltroProducto(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-bogota-primary">
          <option value="">Todos los productos</option>
          {renderFiltroProductos.map(([k, v]) => <option key={k as string} value={k as string}>{v as string}</option>)}
        </select>
        <select value={filtroSubtematica} onChange={e => setFiltroSubtematica(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-bogota-primary">
          <option value="">Todas las subtemáticas</option>
          {subtematicasUnicas.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filtroContraparte} onChange={e => setFiltroContraparte(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-bogota-primary">
          <option value="">Tipo de reunión</option>
          {Object.entries(TIPOS_CONTRAPARTE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filtroResponsable} onChange={e => setFiltroResponsable(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-bogota-primary">
          <option value="">Todos los responsables</option>
          {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Tabla */}
      {reunionesFiltradas.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
          <table className="min-w-full text-xs bg-white">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wide">
                <th className="text-left px-3 py-2">Fecha</th>
                <th className="text-left px-3 py-2">Producto</th>
                <th className="text-left px-3 py-2">Objeto</th>
                <th className="text-left px-3 py-2">Actores</th>
                <th className="text-left px-3 py-2">Tipo de reunión</th>
                <th className="text-left px-3 py-2">Responsable</th>
                <th className="text-center px-3 py-2">Compromisos</th>
                <th className="text-center px-3 py-2">Acta</th>
                <th className="text-center px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {reunionesFiltradas.map((r: any) => (
                <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap font-medium">
                    {r.fecha.slice(0, 10)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-semibold whitespace-nowrap">
                        {r.tematica && r.tematica !== 'GLOBAL' ? (TEMATICAS[r.tematica] || r.tematica) : 'Global'}
                      </span>
                      {r.subtematica && (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-medium whitespace-nowrap">
                          {r.subtematica}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 max-w-[160px] truncate text-gray-700">{r.objeto}</td>
                  <td className="px-3 py-2 text-gray-600">{TIPOS_CONTRAPARTE[r.tipoContraparte] || r.tipoContraparte}</td>
                  <td className="px-3 py-2 text-gray-600">{TIPOS_REUNION[r.tipoReunion] || r.tipoReunion}</td>
                  <td className="px-3 py-2 text-gray-700 max-w-[140px] truncate">{r.responsable}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="font-semibold text-gray-800">{r.compromisos?.length ?? 0}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {r.fecha >= '2026-01-01' ? (
                      <button onClick={() => descargarPDF(r.id, r.fecha)} title="Descargar Acta"
                        className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </button>
                    ) : (
                      <span className="text-gray-400 text-[10px]">Sin acta</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {r.creadoPor?.id === userData.id && (
                      <button onClick={() => eliminarReunion(r.id)} title="Eliminar Registro"
                        className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🤝</p>
          <p className="font-semibold">No hay reuniones registradas</p>
          {(filtroMes || filtroProducto) && (
            <p className="text-xs mt-1">Prueba cambiando los filtros</p>
          )}
        </div>
      )}

      {showModal && <ModalNuevaReunion onClose={() => { setShowModal(false); cargar(); }} />}
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-bogota-primary" /></div>;
}
