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
  ENTIDAD_DISTRITO: 'Entidad Distrito', INTERNA: 'Interna (SDG)', OTRA_ENTIDAD: 'Otra Entidad',
};

const TEMATICAS: Record<string, string> = {
  GLOBAL: 'Global', P01: '[P01] Ejecución Presupuestal', P02: '[P02] Obras Locales',
  P03: '[P03] Espacio Público', P04: '[P04] Seguridad y Convivencia',
  P05: '[P05] Inspección, Vigilancia y Control', P06: '[P06] Gestión del Riesgo',
  P07: '[P07] Participación Ciudadana', P08: '[P08] Memoria Histórica',
  P09: '[P09] Fortalecimiento Institucional', P10: '[P10] Diálogo Social', OTRO: 'Otro',
};

const RESPONSABLES = [
  'MIGUEL EDUARDO PARRA CORVACHO - ASESOR LIDER TRANSFORMACIÓN',
  'ROBERTO CARLOS PARRA BORREGO - TRANSFORMACIÓN',
  'ARMANDO ESCOBAR SANCHEZ - TRANSFORMACIÓN',
  'MARIA ADELAIDA BARRIOS - TRANSFORMACIÓN',
  'MARIA ALEJANDRA CHAHIN - TRANSFORMACIÓN',
  'JUAN CAMILO RIVERA ACEVEDO - TRANSFORMACIÓN',
  'DAYANA MARCELA LOZANO - TRANSFORMACIÓN',
];

const MESES = [
  { value: '', label: 'Todos los meses' },
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
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    const params = new URLSearchParams();
    if (filtroContraparte) params.set('tipoContraparte', filtroContraparte);
    if (filtroTipo) params.set('tipoReunion', filtroTipo);
    if (filtroMes) {
      params.set('desde', `${filtroMes}-01`);
      const [y, m] = filtroMes.split('-').map(Number);
      const ultimo = new Date(y, m, 0).getDate();
      params.set('hasta', `${filtroMes}-${ultimo}`);
    }
    Promise.all([
      fetchApi(`${API}/api/reuniones?${params}`).then(r => r.json()).catch(() => []),
      fetchApi(`${API}/api/reuniones/stats`).then(r => r.json()).catch(() => null),
    ]).then(([lista, s]) => {
      setReuniones(Array.isArray(lista) ? lista : []);
      setStats(s);
      setLoading(false);
    });
  };

  useEffect(() => { cargar(); }, [filtroContraparte, filtroTipo, filtroMes]);

  const descargarPDF = async (id: string, fecha: string) => {
    const res = await fetchApi(`${API}/api/reuniones/${id}/pdf`);
    if (!res.ok) { alert('Error generando el acta PDF'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Acta_Reunion_${fecha.slice(0, 10)}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  // Datos para gráficas
  const dataTipoReunion = stats?.porTipoReunion
    ? Object.entries(stats.porTipoReunion).map(([k, v]) => ({ name: TIPOS_REUNION[k] || k, value: v as number }))
    : [];

  const dataProducto = stats?.porTematica
    ? Object.entries(stats.porTematica)
        .map(([k, v]) => ({ name: TEMATICAS[k] || k, reuniones: v as number }))
        .sort((a, b) => b.reuniones - a.reuniones)
    : [];

  // Filtro local por producto
  const reunionesFiltradas = filtroProducto
    ? reuniones.filter(r => (r.tematica || 'GLOBAL') === filtroProducto)
    : reuniones;

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

      {/* KPIs — solo 3 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 text-white rounded-xl p-4 text-center">
          <p className="text-3xl font-bold">{stats?.total ?? 0}</p>
          <p className="text-xs opacity-70 mt-1">Total reuniones</p>
        </div>
        <div className="bg-bogota-primary text-white rounded-xl p-4 text-center">
          <p className="text-3xl font-bold">{totalCompromisos}</p>
          <p className="text-xs opacity-70 mt-1">Compromisos</p>
        </div>
        <div className="bg-yellow-400 text-black rounded-xl p-4 text-center">
          <p className="text-3xl font-bold">{Object.keys(stats?.porTematica || {}).filter(k => k !== 'GLOBAL').length}</p>
          <p className="text-xs opacity-70 mt-1">Productos activos</p>
        </div>
      </div>

      {/* Gráficas: Tipo de reunión + Por producto */}
      {(dataTipoReunion.length > 0 || dataProducto.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pie: por tipo de reunión */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 mb-3">Por tipo de reunión</h4>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={dataTipoReunion} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {dataTipoReunion.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar: por producto */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 mb-3">Por producto / aspiración</h4>
            {dataProducto.length > 0 ? (
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={dataProducto} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={130} />
                  <Tooltip />
                  <Bar dataKey="reuniones" fill="#e3002b" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-xs">Sin datos aún</div>
            )}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-bogota-primary">
          {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={filtroProducto} onChange={e => setFiltroProducto(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-bogota-primary">
          <option value="">Todos los productos</option>
          {Object.entries(TEMATICAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filtroContraparte} onChange={e => setFiltroContraparte(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-bogota-primary">
          <option value="">Todos los tipos de reunión</option>
          {Object.entries(TIPOS_CONTRAPARTE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-bogota-primary">
          <option value="">Todos los formatos</option>
          {Object.entries(TIPOS_REUNION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
                <th className="text-left px-3 py-2">Tipo de reunión</th>
                <th className="text-left px-3 py-2">Formato</th>
                <th className="text-left px-3 py-2">Responsable</th>
                <th className="text-center px-3 py-2">Asistentes</th>
                <th className="text-center px-3 py-2">Compromisos</th>
                <th className="text-center px-3 py-2">Acta</th>
              </tr>
            </thead>
            <tbody>
              {reunionesFiltradas.map((r: any) => (
                <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap font-medium">
                    {new Date(r.fecha).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-semibold whitespace-nowrap">
                      {r.tematica && r.tematica !== 'GLOBAL' ? (TEMATICAS[r.tematica] || r.tematica) : 'Global'}
                    </span>
                  </td>
                  <td className="px-3 py-2 max-w-[160px] truncate text-gray-700">{r.objeto}</td>
                  <td className="px-3 py-2 text-gray-600">{TIPOS_CONTRAPARTE[r.tipoContraparte] || r.tipoContraparte}</td>
                  <td className="px-3 py-2 text-gray-600">{TIPOS_REUNION[r.tipoReunion] || r.tipoReunion}</td>
                  <td className="px-3 py-2 text-gray-700 max-w-[140px] truncate">{r.responsable}</td>
                  <td className="px-3 py-2 text-center font-semibold">{r.asistentes?.length ?? 0}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="font-semibold text-gray-800">{r.compromisos?.length ?? 0}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => descargarPDF(r.id, r.fecha)}
                      className="text-bogota-primary hover:underline font-semibold text-xs">
                      📄 PDF
                    </button>
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
