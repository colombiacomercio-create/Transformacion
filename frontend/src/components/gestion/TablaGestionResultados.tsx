import { useEffect, useState } from 'react';
import { fetchApi } from '../../utils/api';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const API = import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app';

const COLORS_PIE = ['#e3002b', '#FFCD00', '#333333', '#888888', '#cc6600'];

const LABELS_CONTRAPARTE: Record<string, string> = {
  ALCALDIA: 'Alcaldía', SECTOR_GOBIERNO: 'Sec. Gob',
  ENTIDAD_DISTRITO: 'Entidad Distrito', INTERNA: 'UGRT', OTRA_ENTIDAD: 'Otras entidades y actores',
};

interface Props { userData: any; onNavigate: (s: any) => void; }

export default function TablaGestionResultados({ onNavigate }: Props) {
  const [ultimaFicha, setUltimaFicha] = useState<any>(null);
  const [statsReuniones, setStatsReuniones] = useState<any>(null);
  const [statsAlertas, setStatsAlertas] = useState<any[]>([]);
  const [normativo, setNormativo] = useState<any[]>([]);
  const [otrosEspacios, setOtrosEspacios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi(`${API}/api/ficha-resultados/ultima`).then(r => r.json()).catch(() => null),
      fetchApi(`${API}/api/reuniones/stats`).then(r => r.json()).catch(() => null),
      fetchApi(`${API}/api/alertas`).then(r => r.json()).catch(() => []),
      fetchApi(`${API}/api/normativo`).then(r => r.json()).catch(() => []),
      fetchApi(`${API}/api/otros-espacios`).then(r => r.json()).catch(() => []),
    ]).then(([ficha, stats, alertas, norm, otros]) => {
      setUltimaFicha(ficha);
      setStatsReuniones(stats);
      setStatsAlertas(Array.isArray(alertas) ? alertas : []);
      setNormativo(Array.isArray(norm) ? norm : []);
      setOtrosEspacios(Array.isArray(otros) ? otros : []);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-48">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-bogota-primary" />
    </div>
  );

  const alertasCriticas = statsAlertas.filter((a: any) => a.nivel === 'CRITICA' && a.activa).length;
  const alertasModeradas = statsAlertas.filter((a: any) => a.nivel === 'MODERADA' && a.activa).length;
  const alertasResueltas = statsAlertas.filter((a: any) => !a.activa).length;

  const dataPieContraparte = statsReuniones?.porTipoContraparte
    ? Object.entries(statsReuniones.porTipoContraparte).map(([k, v]) => ({ name: LABELS_CONTRAPARTE[k] || k, value: v as number }))
    : [];

  const dataBarResponsable = statsReuniones?.porResponsable
    ? Object.entries(statsReuniones.porResponsable).map(([k, v]) => ({ name: k, reuniones: v as number }))
    : [];

  const dataMes = statsReuniones?.porMes
    ? Object.entries(statsReuniones.porMes).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ mes: k, reuniones: v as number }))
    : [];

  const normativoEnCurso = normativo.filter((n: any) => ['EN_FORMULACION', 'EXPEDIDO', 'EN_IMPLEMENTACION'].includes(n.estado)).length;

  const mesActual = new Date().toISOString().slice(0, 7);
  const otrosMes = otrosEspacios.filter((o: any) => o.fecha?.slice(0, 7) === mesActual).length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          titulo="Ejecución Presupuestal"
          valor={ultimaFicha ? `${ultimaFicha.compromisosPct ?? '-'}%` : 'Sin datos'}
          subtitulo={ultimaFicha ? `Giros: ${ultimaFicha.girosPct ?? '-'}%` : 'Registre la ficha'}
          color="bg-bogota-primary"
          onClick={() => onNavigate('resultados')}
        />
        <KpiCard
          titulo="Obras Locales"
          valor={ultimaFicha?.intervencionesFinalizadas ?? '-'}
          subtitulo={`Meta: ${ultimaFicha?.metaObras ?? '-'}`}
          color="bg-gray-800"
          onClick={() => onNavigate('resultados')}
        />
        <KpiCard
          titulo="Espacio Público m²"
          valor={ultimaFicha?.espacioPublicoM2 ? ultimaFicha.espacioPublicoM2.toLocaleString('es-CO') : '-'}
          subtitulo={`Residuos: ${ultimaFicha?.residuosM3 ? `${ultimaFicha.residuosM3.toLocaleString('es-CO')} m³` : '-'}`}
          color="bg-green-700"
          onClick={() => onNavigate('resultados')}
        />
        <KpiCard
          titulo="Reuniones Totales"
          valor={statsReuniones?.total ?? 0}
          subtitulo={`Compromisos pendientes: ${statsReuniones?.compromisosPendientes ?? 0}`}
          color="bg-blue-700"
          onClick={() => onNavigate('sesiones')}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard titulo="Alertas Críticas" valor={alertasCriticas} subtitulo={`Moderadas: ${alertasModeradas}`} color="bg-red-600" onClick={() => onNavigate('alertas')} />
        <KpiCard titulo="Alertas Resueltas" valor={alertasResueltas} subtitulo="Total cerradas" color="bg-emerald-600" onClick={() => onNavigate('alertas')} />
        <KpiCard titulo="Instrumentos Normativos" valor={normativoEnCurso} subtitulo="En curso" color="bg-purple-700" onClick={() => onNavigate('normativo')} />
        <KpiCard titulo="Comités este mes" valor={otrosMes} subtitulo="Otros espacios" color="bg-orange-600" onClick={() => onNavigate('otros')} />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reuniones por responsable */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h3 className="font-bold text-sm text-gray-700 mb-3">Reuniones por Responsable</h3>
          {dataBarResponsable.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dataBarResponsable} margin={{ left: 0, right: 10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="reuniones" fill="#e3002b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        {/* Reuniones por contraparte */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h3 className="font-bold text-sm text-gray-700 mb-3">Reuniones por Actores</h3>
          {dataPieContraparte.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={dataPieContraparte} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {dataPieContraparte.map((_: any, i: number) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        {/* Evolución mensual */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 md:col-span-2">
          <h3 className="font-bold text-sm text-gray-700 mb-3">Evolución Mensual de Reuniones</h3>
          {dataMes.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dataMes}>
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reuniones" stroke="#e3002b" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>

      {/* Accesos rápidos a secciones */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Acceso rápido a secciones</p>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'resultados', label: 'Ficha de Resultados', icon: '📈' },
            { key: 'informes', label: 'Informes', icon: '📄' },
            { key: 'sesiones', label: 'Sesiones y Mesas', icon: '🤝' },
            { key: 'eventos', label: 'Eventos', icon: '🎯' },
            { key: 'normativo', label: 'Normativo', icon: '⚖️' },
            { key: 'otros', label: 'Otros Espacios', icon: '🏛️' },
          ].map(s => (
            <button key={s.key} onClick={() => onNavigate(s.key as any)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-bogota-primary hover:text-bogota-primary transition-colors shadow-sm">
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ titulo, valor, subtitulo, color, onClick }: { titulo: string; valor: any; subtitulo: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`${color} rounded-xl p-4 text-left text-white hover:opacity-90 transition-opacity shadow-sm`}>
      <p className="text-xs font-semibold opacity-80 mb-1">{titulo}</p>
      <p className="text-2xl font-bold">{valor}</p>
      <p className="text-xs opacity-70 mt-1">{subtitulo}</p>
    </button>
  );
}

function EmptyChart() {
  return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin datos registrados</div>;
}
