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
  ENTIDAD_DISTRITO: 'Distrito', INTERNA: 'UGRT', OTRA_ENTIDAD: 'Otros',
};

// Helper de color según porcentaje de cumplimiento vs meta/programado
const getColorByAvance = (real: number | undefined, prog: number | undefined): string => {
  if (!prog || prog === 0) return '#6b7280';
  const pct = ((real || 0) / prog) * 100;
  if (pct < 50) return '#dc2626'; // Rojo
  if (pct < 80) return '#d97706'; // Ámbar / Naranja
  return '#16a34a'; // Verde
};

const getAvancePct = (real: number | undefined, prog: number | undefined): number => {
  if (!prog || prog === 0) return 0;
  return Math.round(((real || 0) / prog) * 100);
};

// Componente Semicircle Gauge vectorial (similar al panel de resultados)
function SemiGauge({
  valPct,
  progPct,
  color,
  label,
  progLabel,
  realLabel,
}: {
  valPct: number;
  progPct: number;
  color: string;
  label: string;
  progLabel: string;
  realLabel?: string;
}) {
  const safeVal = Math.min(100, Math.max(0, valPct));
  const safeProg = Math.min(100, Math.max(0, progPct));

  // Arco de semicírculo: centro (60, 50), radio 40
  // Longitud de semicírculo = pi * 40 ≈ 125.66
  const arcLen = 125.66;
  const strokeOffset = arcLen * (1 - safeVal / 100);

  // Ángulo de aguja del programado: 0% -> pi (izq), 100% -> 0 (der)
  const progAngle = Math.PI * (1 - safeProg / 100);
  const nx = 60 + 44 * Math.cos(progAngle);
  const ny = 50 - 44 * Math.sin(progAngle);

  return (
    <div className="flex flex-col items-center">
      <span className="font-bold text-[11px] text-gray-700 uppercase tracking-wide mb-1">{label}</span>
      <div className="relative w-28 h-18">
        <svg viewBox="0 0 120 62" className="w-full h-full overflow-visible">
          {/* Fondo gris del medidor */}
          <path
            d="M 20 50 A 40 40 0 0 1 100 50"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="11"
            strokeLinecap="round"
          />
          {/* Arco activo coloreado */}
          {safeVal > 0 && (
            <path
              d="M 20 50 A 40 40 0 0 1 100 50"
              fill="none"
              stroke={color}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={arcLen}
              strokeDashoffset={strokeOffset}
            />
          )}
          {/* Aguja punteada en el programado */}
          <line
            x1="60"
            y1="50"
            x2={nx}
            y2={ny}
            stroke="#111827"
            strokeWidth="2.5"
            strokeDasharray="3 2"
          />
          <circle cx="60" cy="50" r="3.5" fill="#111827" />
          {/* Texto de cumplimiento en el centro */}
          <text
            x="60"
            y="46"
            textAnchor="middle"
            className="font-black text-lg select-none"
            fill={color}
          >
            {safeVal}%
          </text>
        </svg>
      </div>
      <div className="text-center mt-1">
        <span className="block text-[11px] font-bold text-gray-700 leading-tight">{progLabel}</span>
        {realLabel && <span className="block text-[10px] text-gray-500 font-medium leading-tight">{realLabel}</span>}
      </div>
    </div>
  );
}

// Ficha contenedora con cabecera de color oficial y borde
function ResultCard({
  title,
  color,
  icon,
  onClick,
  children,
}: {
  title: string;
  color: string;
  icon?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-white rounded-xl shadow-xs border-2 overflow-hidden flex flex-col hover:shadow-md transition-all duration-200"
      style={{ borderColor: color }}
    >
      <div
        onClick={onClick}
        className="py-2.5 px-3.5 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-between cursor-pointer select-none"
        style={{ backgroundColor: color }}
      >
        <span className="flex items-center gap-1.5 truncate">
          {icon && <span>{icon}</span>}
          <span className="truncate">{title}</span>
        </span>
        <span className="text-[10px] font-semibold opacity-90 hover:underline flex items-center gap-0.5 shrink-0 ml-1">
          Ver detalle →
        </span>
      </div>
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}

interface Props { userData: any; onNavigate: (s: any) => void; }

export default function TablaGestionResultados({ onNavigate }: Props) {
  const [ultimaFicha, setUltimaFicha] = useState<any>(null);
  const [statsReuniones, setStatsReuniones] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi(`${API}/api/ficha-resultados/ultima`).then(r => r.json()).catch(() => null),
      fetchApi(`${API}/api/reuniones/stats`).then(r => r.json()).catch(() => null),
    ]).then(([ficha, stats]) => {
      setUltimaFicha(ficha);
      setStatsReuniones(stats);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-48">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-bogota-primary" />
    </div>
  );

  const dataPieContraparte = statsReuniones?.porTipoContraparte
    ? Object.entries(statsReuniones.porTipoContraparte).map(([k, v]) => ({ name: LABELS_CONTRAPARTE[k] || k, value: v as number }))
    : [];

  const dataBarResponsable = statsReuniones?.porResponsable
    ? Object.entries(statsReuniones.porResponsable).map(([k, v]) => ({ name: k, reuniones: v as number }))
    : [];

  const dataMes = statsReuniones?.porMes
    ? Object.entries(statsReuniones.porMes).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ mes: k, reuniones: v as number }))
    : [];

  // Cálculos de las fichas de resultados:
  // 1. Ejecución Presupuestal
  const compReal = ultimaFicha?.compromisosPct ?? 0;
  const compProg = ultimaFicha?.metaCompromisosPct ?? 0;
  const compAvance = getAvancePct(compReal, compProg);
  const c1Color = getColorByAvance(compReal, compProg);

  const girosReal = ultimaFicha?.girosPct ?? 0;
  const girosProg = ultimaFicha?.metaGirosPct ?? 0;
  const girosAvance = getAvancePct(girosReal, girosProg);
  const c2Color = getColorByAvance(girosReal, girosProg);
  const ejecucionHeaderColor = c1Color === '#dc2626' || c2Color === '#dc2626' ? '#dc2626' : c1Color === '#d97706' || c2Color === '#d97706' ? '#d97706' : '#16a34a';

  // 2. Obras Locales
  const metaObras = ultimaFicha?.metaObras ?? 0;
  const obrasProg = ultimaFicha?.obrasProgramadasAlCorte ?? 0;
  const obrasFin = ultimaFicha?.intervencionesFinalizadas ?? 0;
  const obrasAvanceCorte = getAvancePct(obrasFin, obrasProg);
  const obrasAvanceAnual = metaObras > 0 ? Math.round((obrasFin / metaObras) * 100) : 0;
  const obrasHeaderColor = '#16a34a';

  // 3. Espacio Público - Residuos
  const residPriorizados = ultimaFicha?.puntosCriticosPriorizados ?? 0;
  const residSostenidos = ultimaFicha?.puntosSostenidos ?? 0;
  const residProg = ultimaFicha?.puntosSostenidosProgramados || residPriorizados || 0;
  const residAvance = getAvancePct(residSostenidos, residProg);
  const residHeaderColor = '#d97706';

  // 4. Espacio Público - Organización y Recuperación
  const orgVerificados = ultimaFicha?.puntosVerificados ?? 57;
  const orgSostenibles = ultimaFicha?.puntosSostenibilidadEfectiva ?? 16;
  const orgAvance = getAvancePct(orgSostenibles, orgVerificados);
  const orgHeaderColor = '#dc2626';

  // 5. Convivencia y Seguridad (Vehículos)
  const vehiculosMeta = ultimaFicha?.vehiculosMetaTotal ?? 0;
  const vehiculosProg = ultimaFicha?.vehiculosProgramadosCorte ?? vehiculosMeta;
  const vehiculosPolicia = ultimaFicha?.vehiculosEntregadosPolicia ?? 0;
  const vehiculosSdscj = ultimaFicha?.vehiculosEntregadosSdscj ?? 0;
  const vehiculosEntregados = vehiculosPolicia + vehiculosSdscj;
  const vehAvance = getAvancePct(vehiculosEntregados, vehiculosProg || vehiculosMeta);
  const convHeaderColor = '#16a34a';

  // 6. Sesiones y Mesas (Distribución semestral)
  const conteoSemestres: Record<string, number> = {
    '2025 I': 0,
    '2025 II': 0,
    '2026 I': 0,
    '2026 II': 0,
  };

  if (statsReuniones?.porMes) {
    Object.entries(statsReuniones.porMes).forEach(([mes, val]) => {
      const [y, m] = mes.split('-').map(Number);
      if (y && m) {
        const sem = `${y} ${m <= 6 ? 'I' : 'II'}`;
        if (conteoSemestres[sem] !== undefined) {
          conteoSemestres[sem] += (val as number);
        } else {
          conteoSemestres[sem] = (val as number);
        }
      }
    });
  }

  const totalReuniones = statsReuniones?.total ?? 0;
  const maxSemestre = Math.max(1, ...Object.values(conteoSemestres));

  // Fecha del corte formateada
  const fechaCorteStr = ultimaFicha?.periodo
    ? new Date(ultimaFicha.periodo).toLocaleDateString('es-CO', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Sin corte registrado';

  return (
    <div className="space-y-6">
      {/* Barra de cabecera con información del corte y navegación */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl px-5 py-3.5 text-white flex flex-wrap items-center justify-between gap-3 shadow-sm border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-bogota-primary/20 rounded-lg border border-red-500/30 text-lg">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm md:text-base text-white">Indicadores de Resultados de la Unidad</h3>
              <span className="text-[10px] bg-red-600/90 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Corte Oficial
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-0.5">
              Corte al: <strong className="text-white font-semibold">{fechaCorteStr}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('resultados')}
            className="bg-bogota-primary hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>📈</span> Ver Ficha Completa
          </button>
        </div>
      </div>

      {/* Grid de las 6 Fichas de Resultados e Indicadores Clave */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* 1. EJECUCIÓN PRESUPUESTAL */}
        <ResultCard
          title="1. Ejecución Presupuestal"
          color={ejecucionHeaderColor}
          icon="💰"
          onClick={() => onNavigate('resultados')}
        >
          <div className="space-y-2.5">
            <div className="flex justify-around items-end pt-1">
              <SemiGauge
                label="Compromisos"
                valPct={compAvance}
                progPct={compProg}
                color={c1Color}
                progLabel={`${compProg}% Programado`}
                realLabel={`Ejecutado: ${compReal}%`}
              />
              <SemiGauge
                label="Giros"
                valPct={girosAvance}
                progPct={girosProg}
                color={c2Color}
                progLabel={`${girosProg}% Programado`}
                realLabel={`Ejecutado: ${girosReal}%`}
              />
            </div>
            <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-[11px] text-gray-600">
              <span className="text-gray-500">Avance relativo al programado</span>
              <span className="font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                FDL Bogotá
              </span>
            </div>
          </div>
        </ResultCard>

        {/* 2. OBRAS LOCALES */}
        <ResultCard
          title="2. Obras Locales"
          color={obrasHeaderColor}
          icon="🏗️"
          onClick={() => onNavigate('resultados')}
        >
          <div className="space-y-2.5">
            {/* 3 Cifras clave */}
            <div className="grid grid-cols-3 gap-1 text-center border-b border-gray-100 pb-2">
              <div>
                <span className="text-[9px] text-gray-500 font-bold block uppercase">META ANUAL</span>
                <span className="text-lg font-black text-gray-800">{metaObras.toLocaleString('es-CO')}</span>
              </div>
              <div className="border-l border-r border-gray-100">
                <span className="text-[9px] text-gray-500 font-bold block uppercase">PROG. AL CORTE</span>
                <span className="text-lg font-black text-gray-800">{obrasProg.toLocaleString('es-CO')}</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 font-bold block uppercase">FINALIZADAS</span>
                <span className="text-lg font-black text-green-700">{obrasFin.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Barra de progreso */}
            <div>
              <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1">
                <span>Avance al corte</span>
                <span className="text-green-700 font-black">{obrasAvanceCorte}% al corte ({obrasAvanceAnual}% anual)</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, obrasAvanceCorte)}%` }}
                />
              </div>
            </div>

            {/* Tipologías */}
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              {[
                { label: 'Malla Vial', val: ultimaFicha?.obrasMallaVial },
                { label: 'Esp. Público', val: ultimaFicha?.obrasEspacioPublico },
                { label: 'Viv. Rural', val: ultimaFicha?.obrasViviendaRural },
                { label: 'Parques', val: ultimaFicha?.obrasParque },
                { label: 'Salón Com.', val: ultimaFicha?.obrasSalonComunal },
                { label: 'Otras', val: ultimaFicha?.obrasOtras },
              ].map(({ label, val }) => (
                <div key={label} className="border border-gray-100 bg-gray-50 px-1.5 py-0.5 rounded flex justify-between items-center">
                  <span className="text-gray-500 font-medium truncate">{label}</span>
                  <span className="font-bold text-gray-800 ml-1">{val ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </ResultCard>

        {/* 3. ESPACIO PÚBLICO - RESIDUOS */}
        <ResultCard
          title="3. Espacio Público - Residuos"
          color={residHeaderColor}
          icon="♻️"
          onClick={() => onNavigate('resultados')}
        >
          <div className="space-y-2.5">
            {/* Puntos Sostenidos vs Priorizados */}
            <div className="grid grid-cols-2 gap-2 text-center border-b border-gray-100 pb-2">
              <div>
                <span className="text-[9px] text-gray-500 font-bold block uppercase">Puntos Priorizados</span>
                <span className="text-lg font-black text-gray-800">{residPriorizados}</span>
              </div>
              <div className="border-l border-gray-100">
                <span className="text-[9px] text-gray-500 font-bold block uppercase">Puntos Sostenidos</span>
                <span className="text-lg font-black text-amber-600">{residSostenidos}</span>
              </div>
            </div>

            {/* Barra de progreso */}
            <div>
              <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1">
                <span>Sostenibilidad al corte</span>
                <span className="text-amber-600 font-black">{residAvance}% vs Programado</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, residAvance)}%` }}
                />
              </div>
            </div>

            {/* Métricas clave */}
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="border border-gray-100 p-1.5 rounded-lg bg-gray-50">
                <span className="block font-black text-sm text-amber-700">
                  {ultimaFicha?.operativosIVC?.toLocaleString('es-CO') || 0}
                </span>
                <span className="text-[9px] text-gray-600 font-semibold block leading-tight">Operativos IVC</span>
                <span className="text-[8px] text-gray-400">Prog: {ultimaFicha?.operativosIVCProgramados || 0}</span>
              </div>
              <div className="border border-gray-100 p-1.5 rounded-lg bg-gray-50">
                <span className="block font-black text-sm text-amber-700">
                  {(ultimaFicha?.accionesReportadas || ultimaFicha?.residuosIntervencionesSemestre || 0).toLocaleString('es-CO')}
                </span>
                <span className="text-[9px] text-gray-600 font-semibold block leading-tight">Intervenciones</span>
                <span className="text-[8px] text-gray-400">reportadas</span>
              </div>
              <div className="border border-gray-100 p-1.5 rounded-lg bg-gray-50">
                <span className="block font-black text-sm text-amber-700">
                  {ultimaFicha?.personasSensibilizadas
                    ? `${(ultimaFicha.personasSensibilizadas / 1000).toFixed(1)}k`
                    : (ultimaFicha?.residuosM3 ? `${ultimaFicha.residuosM3} m³` : '0')}
                </span>
                <span className="text-[9px] text-gray-600 font-semibold block leading-tight">Sensibilización</span>
                <span className="text-[8px] text-gray-400">{ultimaFicha?.personasSensibilizadas?.toLocaleString('es-CO') || 0} pers.</span>
              </div>
            </div>
          </div>
        </ResultCard>

        {/* 4. ESPACIO PÚBLICO - ORGANIZACIÓN Y RECUPERACIÓN */}
        <ResultCard
          title="4. Recuperación Espacio Público"
          color={orgHeaderColor}
          icon="📍"
          onClick={() => onNavigate('resultados')}
        >
          <div className="space-y-2.5">
            {/* Sostenibilidad de puntos priorizados */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 px-1">
              <div>
                <span className="text-[9px] text-gray-500 font-bold block uppercase">Sostenibilidad Puntos Priorizados</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-black text-red-600">
                    {orgSostenibles} de {orgVerificados}
                  </span>
                  <span className="text-[11px] font-bold text-gray-500">puntos</span>
                </div>
                <span className="text-[9px] text-gray-400 font-medium">Sostenibilidad efectiva alcanzada</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-red-600">{orgAvance}%</span>
                <span className="block text-[8px] text-gray-400 font-bold uppercase">Efectividad</span>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, orgAvance)}%` }}
              />
            </div>

            {/* 3 Métricas: Intervenciones, M2 y Personas */}
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="border border-gray-100 p-1.5 rounded-lg bg-gray-50">
                <span className="block font-black text-sm text-red-700">
                  {ultimaFicha?.puntosIntervenidos?.toLocaleString('es-CO') || 0}
                </span>
                <span className="text-[9px] text-gray-600 font-semibold block leading-tight">Intervenciones</span>
                <span className="text-[8px] text-gray-400">reportadas</span>
              </div>
              <div className="border border-gray-100 p-1.5 rounded-lg bg-gray-50">
                <span className="block font-black text-sm text-red-700">
                  {ultimaFicha?.m2RecuperadosInformal
                    ? `${(ultimaFicha.m2RecuperadosInformal / 1000).toFixed(1)}k`
                    : '0'}
                </span>
                <span className="text-[9px] text-gray-600 font-semibold block leading-tight">M² recuperados</span>
                <span className="text-[8px] text-gray-400">{ultimaFicha?.m2RecuperadosInformal?.toLocaleString('es-CO') || 0} m²</span>
              </div>
              <div className="border border-gray-100 p-1.5 rounded-lg bg-gray-50">
                <span className="block font-black text-sm text-red-700">
                  {ultimaFicha?.personasReubicadas?.toLocaleString('es-CO') || 0}
                </span>
                <span className="text-[9px] text-gray-600 font-semibold block leading-tight">Personas</span>
                <span className="text-[8px] text-gray-400">reubicadas</span>
              </div>
            </div>
          </div>
        </ResultCard>

        {/* 5. CONVIVENCIA Y SEGURIDAD */}
        <ResultCard
          title="5. Convivencia y Seguridad"
          color={convHeaderColor}
          icon="🚓"
          onClick={() => onNavigate('resultados')}
        >
          <div className="space-y-2.5">
            {/* Cifras principales de vehículos */}
            <div className="grid grid-cols-3 gap-1 text-center border-b border-gray-100 pb-2">
              <div>
                <span className="text-[9px] text-gray-500 font-bold block uppercase">META TOTAL</span>
                <span className="text-lg font-black text-gray-800">{vehiculosMeta.toLocaleString('es-CO')}</span>
              </div>
              <div className="border-l border-r border-gray-100">
                <span className="text-[9px] text-gray-500 font-bold block uppercase">PROG. CORTE</span>
                <span className="text-lg font-black text-gray-800">{vehiculosProg.toLocaleString('es-CO')}</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 font-bold block uppercase">ENTREGADOS</span>
                <span className="text-lg font-black text-green-700">{vehiculosEntregados.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Barra de progreso */}
            <div>
              <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1">
                <span>Avance de entregas</span>
                <span className="text-green-700 font-black">{vehAvance}% ({vehiculosEntregados} de {vehiculosMeta})</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, vehAvance)}%` }}
                />
              </div>
            </div>

            {/* Desglose de vehículos */}
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {[
                { label: 'Policía Nal.', val: vehiculosPolicia, dot: '#16a34a' },
                { label: 'SDSCJ', val: vehiculosSdscj, dot: '#f59e0b' },
                { label: 'Almacén FDL', val: ultimaFicha?.vehiculosEntregadosAlmacen, dot: '#d97706' },
                { label: 'Pendientes', val: ultimaFicha?.vehiculosPendienteEntrega, dot: '#9ca3af' },
              ].map(({ label, val, dot }) => (
                <div key={label} className="border border-gray-100 bg-gray-50 px-2 py-0.5 rounded flex justify-between items-center">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                    <span className="text-gray-600 font-medium truncate">{label}</span>
                  </div>
                  <span className="font-bold text-gray-900 ml-1">{val ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </ResultCard>

        {/* 6. SESIONES Y MESAS */}
        <ResultCard
          title="6. Sesiones y Mesas"
          color="#2563eb"
          icon="🤝"
          onClick={() => onNavigate('sesiones')}
        >
          <div className="space-y-2.5">
            {/* Cifras de cabecera */}
            <div className="grid grid-cols-3 gap-1 text-center border-b border-gray-100 pb-2">
              <div>
                <span className="text-[9px] text-gray-500 font-bold block uppercase">TOTAL SESIONES</span>
                <span className="text-lg font-black text-blue-700">{totalReuniones}</span>
              </div>
              <div className="border-l border-r border-gray-100">
                <span className="text-[9px] text-gray-500 font-bold block uppercase">COMPROMISOS</span>
                <span className="text-lg font-black text-gray-800">{statsReuniones?.compromisosTotal ?? 0}</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 font-bold block uppercase">PENDIENTES</span>
                <span className="text-lg font-black text-amber-600">{statsReuniones?.compromisosPendientes ?? 0}</span>
              </div>
            </div>

            {/* Subtítulo de distribución semestral */}
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-600">
              <span className="uppercase text-gray-500">Distribución por Semestre</span>
              <span className="text-blue-700 font-semibold">{totalReuniones} registradas</span>
            </div>

            {/* 4 Semestres: 2025 I, 2025 II, 2026 I, 2026 II */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              {[
                { sem: '2025 I', val: conteoSemestres['2025 I'] || 0 },
                { sem: '2025 II', val: conteoSemestres['2025 II'] || 0 },
                { sem: '2026 I', val: conteoSemestres['2026 I'] || 0 },
                { sem: '2026 II', val: conteoSemestres['2026 II'] || 0 },
              ].map(({ sem, val }) => {
                const pct = totalReuniones > 0 ? Math.round((val / totalReuniones) * 100) : 0;
                return (
                  <div key={sem} className="border border-blue-100 bg-blue-50/50 p-2 rounded-lg flex flex-col justify-between">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-gray-700 text-[11px]">{sem}</span>
                      <span className="font-black text-blue-800 text-sm">{val}</span>
                    </div>
                    <div className="w-full bg-blue-100/80 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((val / maxSemestre) * 100))}%` }}
                      />
                    </div>
                    <span className="text-[8px] text-gray-500 mt-1 text-right font-medium">{pct}% del total</span>
                  </div>
                );
              })}
            </div>
          </div>
        </ResultCard>

      </div>

      {/* Gráficas de Sesiones y Espacios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reuniones por responsable */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h3 className="font-bold text-sm text-gray-700 mb-3">Reuniones por Responsable</h3>
          {dataBarResponsable.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
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
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={dataPieContraparte} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  {dataPieContraparte.map((_: any, i: number) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
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

function EmptyChart() {
  return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin datos registrados</div>;
}
