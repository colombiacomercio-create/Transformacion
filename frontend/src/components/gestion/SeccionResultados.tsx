import { useEffect, useState } from 'react';
import { fetchApi } from '../../utils/api';
import ModalFichaResultados from './ModalFichaResultados';
import FichasDecoradas from './FichasDecoradas';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const API = import.meta.env.VITE_API_URL || '';

interface Props { userData: any; }

export default function SeccionResultados({ userData }: Props) {
  const [fichas, setFichas] = useState<any[]>([]);
  const [ultimaFicha, setUltimaFicha] = useState<any>(null);
  const [fichaActivaId, setFichaActivaId] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const isAdmin = userData?.rol === 'ADMIN';

  const cargar = (forceId?: string) => {
    Promise.all([
      fetchApi(`${API}/api/ficha-resultados`).then(r => r.json()).catch(() => []),
      fetchApi(`${API}/api/ficha-resultados/ultima`).then(r => r.json()).catch(() => null),
    ]).then(([lista, ultima]) => {
      setFichas(Array.isArray(lista) ? lista : []);
      setUltimaFicha(ultima);
      if (forceId) {
        setFichaActivaId(forceId);
      } else {
        setFichaActivaId(prev => {
          if (prev && Array.isArray(lista) && lista.some(f => f.id === prev)) return prev;
          return ultima?.id || '';
        });
      }
      setLoading(false);
    });
  };

  useEffect(() => { cargar(); }, []);

  const exportPDF = async () => {
    const el = document.getElementById('ficha-pdf-container');
    if (!el) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'l' : 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Ficha_Resultados_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Spinner />;

  const fichaMostrar = fichas.find(f => f.id === fichaActivaId) || ultimaFicha;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Ficha de Resultados — Datos de la Unidad</h3>
        <div className="flex items-center gap-4">
          <button 
             onClick={exportPDF} 
             disabled={exporting}
             className="px-4 py-1.5 rounded-lg bg-gray-800 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50"
          >
             {exporting ? 'Generando PDF...' : '⬇ Exportar PDF'}
          </button>
          {fichas.length > 0 && (
             <select 
               value={fichaActivaId} 
               onChange={e => setFichaActivaId(e.target.value)}
               className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white"
             >
               {fichas.map(f => (
                 <option key={f.id} value={f.id}>
                   Corte: {new Date(f.periodo).toLocaleDateString('es-CO', { timeZone: 'UTC' })}
                 </option>
               ))}
             </select>
          )}
          {isAdmin && (
            <button onClick={() => setShowModal(true)}
              className="bg-bogota-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
              + Reportar Datos
            </button>
          )}
        </div>
      </div>

      {fichaMostrar ? (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Ficha del corte <strong>{new Date(fichaMostrar.periodo).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</strong>
          </p>

          <div id="ficha-pdf-container" className="bg-white p-2">
            <FichasDecoradas ultimaFicha={fichaMostrar} />
          </div>

          {fichaMostrar.observaciones && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-1">Observaciones</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{fichaMostrar.observaciones}</p>
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
                    <td className="px-3 py-2">{new Date(f.periodo).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</td>
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

      {showModal && <ModalFichaResultados onClose={(savedId) => { setShowModal(false); cargar(savedId); }} />}
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
