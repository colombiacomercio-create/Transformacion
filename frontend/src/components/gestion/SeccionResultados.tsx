import { useEffect, useState } from 'react';
import { fetchApi } from '../../utils/api';
import ModalFichaResultados from './ModalFichaResultados';

const API = import.meta.env.VITE_API_URL || '';

interface Props { userData: any; }

export default function SeccionResultados({ userData }: Props) {
  const [fichas, setFichas] = useState<any[]>([]);
  const [ultimaFicha, setUltimaFicha] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAdmin = userData?.rol === 'ADMIN';

  const cargar = () => {
    Promise.all([
      fetchApi(`${API}/api/ficha-resultados`).then(r => r.json()).catch(() => []),
      fetchApi(`${API}/api/ficha-resultados/ultima`).then(r => r.json()).catch(() => null),
    ]).then(([lista, ultima]) => {
      setFichas(Array.isArray(lista) ? lista : []);
      setUltimaFicha(ultima);
      setLoading(false);
    });
  };

  useEffect(() => { cargar(); }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Ficha de Resultados — Datos de la Unidad</h3>
        {isAdmin && (
          <button onClick={() => setShowModal(true)}
            className="bg-bogota-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
            + Reportar Datos
          </button>
        )}
      </div>

      {ultimaFicha ? (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">Última actualización: corte <strong>{new Date(ultimaFicha.periodo).toLocaleDateString('es-CO')}</strong> — por {ultimaFicha.reportadoPor?.nombre}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FichaCard titulo="Ejecución Presupuestal" color="bg-red-50 border-red-200">
              <MetricaRow label="Compromisos" valor={`${ultimaFicha.compromisosPct ?? '-'}%`} />
              <MetricaRow label="Giros" valor={`${ultimaFicha.girosPct ?? '-'}%`} />
              <MetricaRow label="Procesos monitoreados" valor={ultimaFicha.procesosMonitoreados} />
              <MetricaRow label="Requieren comité" valor={ultimaFicha.procesosRequierenComite} />
              {ultimaFicha.alertaEjecucion && <AlertaTexto texto={ultimaFicha.alertaEjecucion} />}
            </FichaCard>

            <FichaCard titulo="Obras Locales" color="bg-gray-50 border-gray-200">
              <MetricaRow label="Meta obras" valor={ultimaFicha.metaObras?.toLocaleString('es-CO')} />
              <MetricaRow label="Intervenciones finalizadas" valor={ultimaFicha.intervencionesFinalizadas} />
              <MetricaRow label="Km carril intervenido" valor={ultimaFicha.kmCarrilIntervenido} />
              <MetricaRow label="Km intervenidos" valor={ultimaFicha.kmIntervenidos?.toLocaleString('es-CO')} />
              {ultimaFicha.alertaObras && <AlertaTexto texto={ultimaFicha.alertaObras} />}
            </FichaCard>

            <FichaCard titulo="Comités de Contratación" color="bg-yellow-50 border-yellow-200">
              <MetricaRow label="Comités realizados" valor={ultimaFicha.comitesRealizados} />
              <MetricaRow label="Meta comités" valor={ultimaFicha.comitesMeta} />
              {ultimaFicha.alertaComites && <AlertaTexto texto={ultimaFicha.alertaComites} />}
            </FichaCard>

            <FichaCard titulo="Espacio Público – Residuos" color="bg-green-50 border-green-200">
              <MetricaRow label="Acciones reportadas" valor={ultimaFicha.accionesReportadas} />
              <MetricaRow label="Residuos recolectados" valor={ultimaFicha.residuosM3 ? `${ultimaFicha.residuosM3.toLocaleString('es-CO')} m³` : '-'} />
              <MetricaRow label="Espacio público recuperado" valor={ultimaFicha.espacioPublicoM2 ? `${ultimaFicha.espacioPublicoM2.toLocaleString('es-CO')} m²` : '-'} />
            </FichaCard>

            <FichaCard titulo="Espacio Público – Venta Informal / Parqueo" color="bg-green-50 border-green-200">
              <MetricaRow label="Puntos intervenidos" valor={ultimaFicha.puntosIntervenidos} />
              <MetricaRow label="Venta informal" valor={ultimaFicha.ventaInformal} />
              <MetricaRow label="Org. parqueo" valor={ultimaFicha.orgParqueo} />
              <MetricaRow label="m² recuperados" valor={ultimaFicha.m2RecuperadosInformal ? `${ultimaFicha.m2RecuperadosInformal.toLocaleString('es-CO')} m²` : '-'} />
              <MetricaRow label="Personas reubicadas" valor={ultimaFicha.personasReubicadas} />
            </FichaCard>

            <FichaCard titulo="Convivencia y Seguridad" color="bg-blue-50 border-blue-200">
              <MetricaRow label="Motos contratadas" valor={ultimaFicha.motosContratadas} />
              <MetricaRow label="Pendientes FDL" valor={ultimaFicha.motosPendientesFdl} />
              <MetricaRow label="En almacén FDL" valor={ultimaFicha.motosAlmacenFdl} />
              <MetricaRow label="Entregadas" valor={ultimaFicha.motosEntregadas} />
              {ultimaFicha.alertaConvivencia && <AlertaTexto texto={ultimaFicha.alertaConvivencia} />}
            </FichaCard>

            <FichaCard titulo="Actuaciones" color="bg-purple-50 border-purple-200">
              <MetricaRow label="Archivos" valor={ultimaFicha.archivosPct ? `${ultimaFicha.archivosPct}%` : '-'} />
              <MetricaRow label="Meta archivos (M11)" valor={ultimaFicha.metaArchivos?.toLocaleString('es-CO')} />
              <MetricaRow label="Fallos 1ª estancia" valor={ultimaFicha.fallosPrimeraEstanciaPct ? `${ultimaFicha.fallosPrimeraEstanciaPct}%` : '-'} />
              <MetricaRow label="Meta fallos (M12)" valor={ultimaFicha.metaFallos?.toLocaleString('es-CO')} />
            </FichaCard>

            <FichaCard titulo="Estrategias de Memoria" color="bg-orange-50 border-orange-200">
              <MetricaRow label="Resueltas" valor={ultimaFicha.estrategiasResueltas} />
              <MetricaRow label="En formulación" valor={ultimaFicha.estrategiasFormulacion} />
            </FichaCard>

            <FichaCard titulo="Rollos Legendarios" color="bg-orange-50 border-orange-200">
              <MetricaRow label="Resueltos" valor={ultimaFicha.rollosResueltos} />
              <MetricaRow label="En curso" valor={ultimaFicha.rollosEnCurso} />
              {ultimaFicha.alertaRollos && <AlertaTexto texto={ultimaFicha.alertaRollos} />}
            </FichaCard>
          </div>

          {ultimaFicha.observaciones && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-1">Observaciones</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{ultimaFicha.observaciones}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-semibold">No hay fichas de resultados registradas</p>
          {isAdmin && <p className="text-sm mt-1">Use el botón "Reportar Datos" para registrar la primera ficha.</p>}
        </div>
      )}

      {/* Historial */}
      {fichas.length > 1 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Historial de Fichas</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs bg-white rounded-lg border border-gray-100 shadow-sm">
              <thead><tr className="bg-gray-50">
                <th className="text-left px-3 py-2">Período</th>
                <th className="text-left px-3 py-2">Compromisos %</th>
                <th className="text-left px-3 py-2">Giros %</th>
                <th className="text-left px-3 py-2">Obras finalizadas</th>
                <th className="text-left px-3 py-2">m² Esp. Público</th>
                <th className="text-left px-3 py-2">Reportado por</th>
              </tr></thead>
              <tbody>
                {fichas.map((f: any) => (
                  <tr key={f.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2">{new Date(f.periodo).toLocaleDateString('es-CO')}</td>
                    <td className="px-3 py-2">{f.compromisosPct ?? '-'}%</td>
                    <td className="px-3 py-2">{f.girosPct ?? '-'}%</td>
                    <td className="px-3 py-2">{f.intervencionesFinalizadas ?? '-'}</td>
                    <td className="px-3 py-2">{f.espacioPublicoM2 ? `${f.espacioPublicoM2.toLocaleString('es-CO')} m²` : '-'}</td>
                    <td className="px-3 py-2">{f.reportadoPor?.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && <ModalFichaResultados onClose={() => { setShowModal(false); cargar(); }} />}
    </div>
  );
}

function FichaCard({ titulo, color, children }: { titulo: string; color: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <h4 className="font-bold text-xs text-gray-600 uppercase tracking-wide mb-3">{titulo}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function MetricaRow({ label, valor }: { label: string; valor: any }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600 text-xs">{label}</span>
      <span className="font-bold text-gray-900">{valor ?? '-'}</span>
    </div>
  );
}

function AlertaTexto({ texto }: { texto: string }) {
  return (
    <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
      <p className="text-xs text-red-700"><strong>⚠️ Alerta:</strong> {texto}</p>
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-bogota-primary" /></div>;
}
