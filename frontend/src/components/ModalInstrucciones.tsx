import React from 'react';
import { X, CheckCircle2, FileText, AlertCircle, Info } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function ModalInstrucciones({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b-4 border-bogota-primary bg-black">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <Info className="text-[#FFCD00]" /> Guía Rápida de la Plataforma
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6 text-gray-700 bg-gray-50">
          <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-bold text-bogota-primary flex items-center gap-2 mb-2 text-lg"><CheckCircle2 className="w-5 h-5"/> Visión General</h3>
            <p className="text-sm font-medium text-gray-700 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400 mb-4">
              No le hacemos seguimiento al Plan de Desarrollo, le hacemos seguimiento a las prioridades de Gobierno suscritas por los alcaldes y alcaldesas con el Secretario de Gobierno en los Acuerdos locales de gestión, para cada una de ellas se definió una ruta de transformación con productos, hitos y actividades.
            </p>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex justify-center p-2">
               <img src="/mapa_transformacion.png" alt="Mapa de Ruta de Transformación" className="max-w-full h-auto rounded" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </div>
          </section>
          
          <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
            <h3 className="font-bold text-gray-800 mb-4">Ruta de Transformación Institucional</h3>
            <table className="min-w-full text-xs text-left border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-800 text-white font-bold text-sm">
                  <th className="border p-2 w-[10%]">Eje</th>
                  <th className="border p-2 w-[15%]">Aspiración</th>
                  <th className="border p-2 w-[20%]">Objetivo</th>
                  <th className="border p-2 w-[25%]">Productos</th>
                  <th className="border p-2 w-[30%]">Resultados / Metas</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2 bg-yellow-400 font-bold" rowSpan={4}>1. Gestión de lo cotidiano</td>
                  <td className="border p-2 bg-gray-100 font-bold" rowSpan={1}>A1: Presupuestal</td>
                  <td className="border p-2 font-semibold">O1: Ejecución presupuestal</td>
                  <td className="border p-2 text-gray-600">P1. Ingeniería de Detalle<br/>P2. Comité de Planeación</td>
                  <td className="border p-2 text-gray-600">Girar el 65% a 31 de dic.</td>
                </tr>
                <tr>
                  <td className="border p-2 bg-gray-100 font-bold" rowSpan={2}>A2: Experiencia ciudad</td>
                  <td className="border p-2 font-semibold">O2: Obras locales</td>
                  <td className="border p-2 text-gray-600">P3. Obras locales ejecutadas</td>
                  <td className="border p-2 text-gray-600">1000 obras entregadas en 2026</td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">O3: Espacio Público</td>
                  <td className="border p-2 text-gray-600">P4. Residuos<br/>P5. Organización Espacio Público</td>
                  <td className="border p-2 text-gray-600">100% puntos intervenidos</td>
                </tr>
                <tr>
                  <td className="border p-2 bg-gray-100 font-bold">A3: Seguridad</td>
                  <td className="border p-2 font-semibold">O4: Operativos IVC</td>
                  <td className="border p-2 text-gray-600">P6. Equipos de seguridad<br/>P7. Operativos IVC</td>
                  <td className="border p-2 text-gray-600">Ejecutar el 100% de operativos</td>
                </tr>
                <tr>
                  <td className="border p-2 bg-red-600 text-white font-bold" rowSpan={1}>2. Bogotaneidad</td>
                  <td className="border p-2 bg-gray-100 font-bold">A5: Bogotaneidad</td>
                  <td className="border p-2 font-semibold">O6: Bogotaneidad</td>
                  <td className="border p-2 text-gray-600">P9. Transformación de comportamientos<br/>P10. Identidad local</td>
                  <td className="border p-2 text-gray-600">Definición de modelo territorial</td>
                </tr>
                <tr>
                  <td className="border p-2 bg-green-500 text-white font-bold" rowSpan={1}>3. Más social</td>
                  <td className="border p-2 bg-gray-100 font-bold">A6: DDHH</td>
                  <td className="border p-2 font-semibold">OV1: Estrategia de memoria</td>
                  <td className="border p-2 text-gray-600">PV1, PV2, PV3 Memoria local</td>
                  <td className="border p-2 text-gray-600">20 estrategias implementadas</td>
                </tr>
              </tbody>
            </table>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-blue-700 flex items-center gap-2 mb-2"><FileText className="w-5 h-5"/> Operación Local (Gestores)</h3>
              <ul className="list-disc pl-5 text-sm space-y-2">
                <li>Solo verás las actividades asignadas a tu alcaldía.</li>
                <li>Para suministrar pruebas, ingresa a la tarjeta, ve a <strong>Evidencias</strong> y agrega tu soporte con descripción.</li>
                <li>Al terminar, marca tu estado como <strong>"Completa sin Validar"</strong> para notificar al Gobierno Distrital.</li>
              </ul>
            </section>

            <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-orange-700 flex items-center gap-2 mb-2"><AlertCircle className="w-5 h-5"/> Operación Global (Admin)</h3>
              <ul className="list-disc pl-5 text-sm space-y-2">
                <li>El botón de <strong>Auditoría</strong> concentra todas las solicitudes pendientes.</li>
                <li>Al emitir validación positiva sobre una tarea, esta queda inmutable (Solo Lectura).</li>
                <li><strong>Reportes Cualitativos:</strong> En el Tablero de Control puedes editar las 'Alertas' de cada Objetivo en el corte actual.</li>
              </ul>
            </section>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end bg-white">
          <button onClick={onClose} className="px-6 py-2 bg-bogota-primary text-white font-bold rounded-lg hover:bg-red-700 transition shadow">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
