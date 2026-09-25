import { useEffect, useState } from 'react';
import { fetchApi } from '../../utils/api';
import PanelAlertas from '../PanelAlertas';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const API = import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app';

interface Props { userData: any; }

export default function SeccionAlertas({ userData }: Props) {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi(`${API}/api/fichas-alertas`).then(r => r.json())
      .then(d => { setAlertas(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const alertasPorTipo = alertas.reduce((acc: any, alerta: any) => {
    const tipo = (alerta.tipo || 'OTRO').replace(/_/g, ' ');
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  const dataChart = Object.keys(alertasPorTipo).map(key => ({
    name: key,
    Cantidad: alertasPorTipo[key]
  })).sort((a, b) => b.Cantidad - a.Cantidad);

  const COLORS = ['#e3002b', '#FFCD00', '#f97316', '#3b82f6', '#8b5cf6', '#10b981'];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Seguimiento GestiÃ³n y Alertas</h3>

      {!loading && dataChart.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="text-sm font-bold text-gray-700 mb-4">Resumen de Alertas por Tipo</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dataChart} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{fill: '#f3f4f6'}} />
              <Bar dataKey="Cantidad" radius={[0, 4, 4, 0]}>
                {dataChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <PanelAlertas userData={userData} />
    </div>
  );
}
