import { useState } from 'react';
import TablaGestionResultados from './gestion/TablaGestionResultados';
import SeccionResultados from './gestion/SeccionResultados';
import SeccionInformes from './gestion/SeccionInformes';
import SeccionSesionesMesas from './gestion/SeccionSesionesMesas';
import SeccionEventos from './gestion/SeccionEventos';
import SeccionAlertas from './gestion/SeccionAlertas';
import SeccionNormativo from './gestion/SeccionNormativo';
import SeccionOtrosEspacios from './gestion/SeccionOtrosEspacios';

type Seccion = 'tablero' | 'resultados' | 'informes' | 'sesiones' | 'eventos' | 'alertas' | 'normativo' | 'otros';

const TABS: { key: Seccion; label: string; icon: string }[] = [
  { key: 'tablero',    label: 'Tablero General',            icon: '📊' },
  { key: 'resultados', label: 'Resultados',                  icon: '📈' },
  { key: 'informes',   label: 'Informes',                    icon: '📄' },
  { key: 'sesiones',   label: 'Sesiones y/o Mesas',          icon: '🤝' },
  { key: 'eventos',    label: 'Eventos',                     icon: '🎯' },
  { key: 'alertas',    label: 'Seguimiento Alertas',         icon: '🚨' },
  { key: 'normativo',  label: 'Acompañamiento Normativo',    icon: '⚖️' },
  { key: 'otros',      label: 'Otros Espacios',              icon: '🏛️' },
];

interface Props {
  userData: any;
}

export default function PanelGestionResultados({ userData }: Props) {
  const [seccionActiva, setSeccionActiva] = useState<Seccion>('tablero');

  return (
    <div className="space-y-4">
      {/* Encabezado del módulo */}
      <div className="bg-black rounded-xl px-6 py-4 border-l-4 border-bogota-primary flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Gestión y Resultados</h2>
          <p className="text-sm text-gray-400 mt-0.5">Unidad de Transformación — Secretaría Distrital de Gobierno</p>
        </div>
        <span className="text-xs text-yellow-400 font-semibold bg-yellow-900/30 px-3 py-1 rounded-full">UGRT</span>
      </div>

      {/* Sub-navegación */}
      <div className="flex flex-wrap gap-1.5 bg-white rounded-xl p-2 shadow-sm border border-gray-100">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSeccionActiva(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              seccionActiva === tab.key
                ? 'bg-bogota-primary text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de la sección activa */}
      <div>
        {seccionActiva === 'tablero'    && <TablaGestionResultados userData={userData} onNavigate={setSeccionActiva} />}
        {seccionActiva === 'resultados' && <SeccionResultados userData={userData} />}
        {seccionActiva === 'informes'   && <SeccionInformes userData={userData} />}
        {seccionActiva === 'sesiones'   && <SeccionSesionesMesas userData={userData} />}
        {seccionActiva === 'eventos'    && <SeccionEventos userData={userData} />}
        {seccionActiva === 'alertas'    && <SeccionAlertas userData={userData} />}
        {seccionActiva === 'normativo'  && <SeccionNormativo userData={userData} />}
        {seccionActiva === 'otros'      && <SeccionOtrosEspacios userData={userData} />}
      </div>
    </div>
  );
}
