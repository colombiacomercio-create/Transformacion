import { useEffect, useState } from 'react';
import { fetchApi } from '../../utils/api';
import PanelAlertas from '../PanelAlertas';

const API = import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app';

interface Props { userData: any; }

export default function SeccionAlertas({ userData }: Props) {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi(`${API}/api/alertas`).then(r => r.json())
      .then(d => { setAlertas(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const activas = alertas.filter(a => a.activa);
  const criticas = activas.filter(a => a.nivel === 'CRITICA').length;
  const moderadas = activas.filter(a => a.nivel === 'MODERADA').length;
  const informativas = activas.filter(a => a.nivel === 'INFORMATIVA').length;
  const resueltas = alertas.filter(a => !a.activa).length;

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-gray-800">Seguimiento Gestión y Alertas</h3>

      {/* KPI resumen */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-red-600 text-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{criticas}</p>
            <p className="text-xs opacity-80 mt-1">Alertas Críticas</p>
          </div>
          <div className="bg-yellow-500 text-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{moderadas}</p>
            <p className="text-xs opacity-80 mt-1">Moderadas</p>
          </div>
          <div className="bg-blue-600 text-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{informativas}</p>
            <p className="text-xs opacity-80 mt-1">Informativas</p>
          </div>
          <div className="bg-emerald-600 text-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{resueltas}</p>
            <p className="text-xs opacity-80 mt-1">Resueltas</p>
          </div>
        </div>
      )}

      {/* Panel de alertas completo reutilizado */}
      <PanelAlertas userData={userData} />
    </div>
  );
}
