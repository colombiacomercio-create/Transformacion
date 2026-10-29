import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { CheckCircle, Save, Edit2, Info, Flag, Sparkles, AlertTriangle, Clock, Layers, ArrowLeft, Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LOGO_BOGOTA_BASE64, LOGO_SDG_BASE64, LOGO_RADAR_BASE64 } from '../utils/logos';
import { fetchApi } from '../utils/api';

const NUM_LOCALIDAD_MAP: Record<string, string> = {
  'usaquén': '01. Usaquén',
  'usaquen': '01. Usaquén',
  'chapinero': '02. Chapinero',
  'santa fe': '03. Santa Fe',
  'san cristóbal': '04. San Cristóbal',
  'san cristobal': '04. San Cristóbal',
  'usme': '05. Usme',
  'tunjuelito': '06. Tunjuelito',
  'bosa': '07. Bosa',
  'kennedy': '08. Kennedy',
  'fontibón': '09. Fontibón',
  'fontibon': '09. Fontibón',
  'engativá': '10. Engativá',
  'engativa': '10. Engativá',
  'suba': '11. Suba',
  'barrios unidos': '12. Barrios Unidos',
  'teusaquillo': '13. Teusaquillo',
  'los mártires': '14. Los Mártires',
  'los martires': '14. Los Mártires',
  'antonio nariño': '15. Antonio Nariño',
  'antonio narino': '15. Antonio Nariño',
  'puente aranda': '16. Puente Aranda',
  'la candelaria': '17. La Candelaria',
  'rafael uribe uribe': '18. Rafael Uribe Uribe',
  'ciudad bolívar': '19. Ciudad Bolívar',
  'ciudad bolivar': '19. Ciudad Bolívar',
  'sumapaz': '20. Sumapaz'
};

function getNombreLocalidadConNumero(nombre: string): string {
  const lower = (nombre || '').toLowerCase().trim();
  for (const [key, val] of Object.entries(NUM_LOCALIDAD_MAP)) {
    if (lower.includes(key)) return val;
  }
  return nombre;
}

const mockAvancePorAspiraciones = [
  { name: 'A1. Presupuesto', avance: 95 },
  { name: 'A2. Experiencia Ciudad', avance: 82 },
  { name: 'A3. Seguridad', avance: 73 },
  { name: 'A4. Rollo Legendario', avance: 70 },
  { name: 'A5. Bogotaneidad', avance: 93 },
  { name: 'A6. DDHH', avance: 87 },
  { name: 'A7. Cercanía ciudadano', avance: 76 }
];

function GaugeSpeedometer({ value, label = 'Avance A2', corte = '15 de Octubre de 2026' }: { value: number; label?: string; corte?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const angleRad = Math.PI + (clamped / 100) * Math.PI;
  const cx = 130;
  const cy = 115;
  const r = 85;
  const strokeWidth = 18;

  const needleLen = 68;
  const nx = cx + needleLen * Math.cos(angleRad);
  const ny = cy + needleLen * Math.sin(angleRad);

  const color = clamped >= 90 ? '#16A34A' : clamped >= 60 ? '#EAB308' : '#DC2626';

  return (
    <div className="flex flex-col items-center justify-center p-3">
      <div className="relative flex items-center justify-center">
        <svg width="260" height="145" viewBox="0 0 260 145" className="overflow-visible">
          {/* Fondo gris del arco */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Arco con color según avance */}
          {clamped > 0 && (
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(angleRad)} ${cy + r * Math.sin(angleRad)}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}
          {/* Marcas de escala */}
          <text x={cx - r} y={cy + 18} fontSize="11" fontWeight="700" fill="#9CA3AF" textAnchor="middle">0%</text>
          <text x={cx} y={cy - r - 8} fontSize="11" fontWeight="700" fill="#9CA3AF" textAnchor="middle">50%</text>
          <text x={cx + r} y={cy + 18} fontSize="11" fontWeight="700" fill="#9CA3AF" textAnchor="middle">100%</text>

          {/* Aguja indicadora */}
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="#1F2937"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="8" fill="#1F2937" />
          <circle cx={cx} cy={cy} r="3.5" fill="#FFFFFF" />
        </svg>
      </div>
      <div className="text-center -mt-2">
        <div className="text-4xl md:text-5xl font-black tracking-tight" style={{ color }}>
          {clamped}%
        </div>
        <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mt-0.5">
          {label}
        </div>
        <div className="text-[11px] text-gray-500 mt-0.5">
          Corte: {corte}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ userData }: { userData?: any }) {
  const [stats, setStats] = useState({ avance: 0, evaluadas: 0, alertaTotal: 0, ejecutadasVsProgramadas: 0, ejecutadasLiteral: 0, programadasLiteral: 0 });
  const [dataBars, setDataBars] = useState<any[]>([]);
  const [objetivosAPI, setObjetivosAPI] = useState<any[]>([]);
  const [cortes, setCortes] = useState<any[]>([]);
  const [corteActivo, setCorteActivo] = useState<any>(null);
  const [localidades, setLocalidades] = useState<any[]>([]);
  const [localidadFiltro, setLocalidadFiltro] = useState<string>('TODAS');
  const [filtroProgramacion, setFiltroProgramacion] = useState<'TODAS' | 'PROGRAMADAS' | 'NO_PROGRAMADAS'>('TODAS');
  const [aspiracionesDinamicas, setAspiracionesDinamicas] = useState<any[]>(mockAvancePorAspiraciones);
  const [objIdsConActividades, setObjIdsConActividades] = useState<Set<string>>(new Set());
  
  // Data local para drill-down
  const [locData, setLocData] = useState<any>({
    indice: 0,
    nombre: '',
    totalActividades: 0,
    programadasCount: 0,
    ejecutadasCount: 0,
    enCursoCount: 0,
    noIniciadasCount: 0,
    cumplimientoPct: 0,
    productosBars: [],
    actList: []
  });

  const isAdmin = userData?.rol === 'ADMIN';

  // 1. Cargar cortes al montar
  useEffect(() => {
    fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/cortes`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCortes(data);
          const activo = data.find((c: any) => c.esActivo) || data[0];
          setCorteActivo(activo);
        }
      })
      .catch(err => console.error('Error cargando cortes:', err));

    fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/planes`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          const raw = data[0].objetivos || [];
          const seen = new Set();
          const filtered = raw.filter((obj: any) => {
            if (obj.codigo === 'O_BASE' || obj.codigo === 'Alertas') return false;
            if (seen.has(obj.codigo)) return false;
            seen.add(obj.codigo);
            return true;
          });

          const ordenCodigos = ['O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'OV1', 'OV2', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'];
          const sorted = [...filtered].sort((a: any, b: any) => {
            const idxA = ordenCodigos.indexOf(a.codigo);
            const idxB = ordenCodigos.indexOf(b.codigo);
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          });
          setObjetivosAPI(sorted);
        }
      })
      .catch(err => console.error('Error cargando planes:', err));
  }, []);

  // 2. Calcular estadísticas cuando cambian actividades, corteActivo, localidadFiltro o filtroProgramacion
  useEffect(() => {
    fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;

        const fechaCorte = corteActivo?.fechaLimite ? new Date(corteActivo.fechaLimite) : new Date();

        let programadasLocales = 0;
        let ejecutadasLocales = 0;
        let vencidasOAlerta = 0;
        let sumaAvance = 0;

        const aspiracionesMap: Record<string, { total: number; sum: number }> = {
          'A1. Presupuesto': { total: 0, sum: 0 },
          'A2. Experiencia Ciudad': { total: 0, sum: 0 },
          'A3. Seguridad': { total: 0, sum: 0 },
          'A4. Rollo Legendario': { total: 0, sum: 0 },
          'A5. Bogotaneidad': { total: 0, sum: 0 },
          'A6. DDHH': { total: 0, sum: 0 },
          'A7. Cercanía ciudadano': { total: 0, sum: 0 }
        };

        const mapByCodigo = (codigo: string) => {
          const p = codigo.split('.')[0] || '';
          if (p === 'P01' || p === 'P02') return 'A1. Presupuesto';
          if (p === 'P03' || p === 'P04' || p === 'P05') return 'A2. Experiencia Ciudad';
          if (p === 'P06' || p === 'P07') return 'A3. Seguridad';
          if (p === 'P08') return 'A4. Rollo Legendario';
          if (p === 'P09' || p === 'P10') return 'A5. Bogotaneidad';
          if (p.startsWith('PV') && p !== 'PV4') return 'A6. DDHH';
          if (p === 'PV4') return 'A7. Cercanía ciudadano';
          return null;
        };

        data.forEach((a: any) => {
          const esProgramada = !a.fechaLimite || new Date(a.fechaLimite) <= fechaCorte;
          let asp = mapByCodigo(a.codigoCompleto);
          if (!asp && (a.codigoCompleto.includes('[P05') || a.codigoCompleto.includes('H2') || a.codigoCompleto.includes('P2') || a.codigoCompleto.includes('P08'))) {
            asp = 'A4. Rollo Legendario';
          }

          a.asignaciones?.forEach((asig: any) => {
            const completada = asig.estadoLocal === 'COMPLETA_SIN_VALIDAR' || asig.estadoValidacion === 'VALIDADA_COMPLETADA' || asig.estadoLocal === 'COMPLETADA_LOCAL' || a.estado === 'COMPLETADA';
            const enCurso = asig.estadoLocal === 'EN_CURSO_SIN_VALIDAR' || asig.estadoValidacion === 'VALIDADA_EN_CURSO' || a.estado === 'EN_PROGRESO';

            let valAvance = 0;
            if (typeof asig.porcentajeAvance === 'number' && asig.porcentajeAvance > 0) {
              valAvance = asig.porcentajeAvance;
            } else if (completada) {
              valAvance = 100;
            } else if (enCurso) {
              valAvance = 50;
            }

            if (esProgramada) programadasLocales++;
            if (completada && esProgramada) ejecutadasLocales++;

            sumaAvance += valAvance;

            if (asp) {
              aspiracionesMap[asp].total += 1;
              aspiracionesMap[asp].sum += valAvance;
            }

            if (esProgramada && !completada) vencidasOAlerta++;
          });
        });

        const totalAsignaciones = data.reduce((acc: number, a: any) => acc + (a.asignaciones?.length || 0), 0) || 1;
        const ejeProg = programadasLocales > 0 ? Math.round((ejecutadasLocales / programadasLocales) * 100) : 0;
        const avgAvance = Math.round(sumaAvance / totalAsignaciones);

        setStats({
          avance: avgAvance,
          evaluadas: totalAsignaciones,
          alertaTotal: vencidasOAlerta,
          ejecutadasVsProgramadas: ejeProg,
          ejecutadasLiteral: ejecutadasLocales,
          programadasLiteral: programadasLocales
        });

        const aspiracionesArr = Object.entries(aspiracionesMap).map(([name, d]) => ({
          name,
          avance: d.total > 0 ? Math.round(d.sum / d.total) : 0
        }));
        setAspiracionesDinamicas(aspiracionesArr);
        setObjIdsConActividades(new Set(data.map((a: any) => a.hito?.programa?.objetivo?.id).filter(Boolean)));

        // Calcular estadísticas y ordenar localidades
        const locStats = new Map();
        data.forEach((a: any) => {
          a.asignaciones?.forEach((asig: any) => {
            if (!asig.localidad) return;
            const locId = asig.localidad.id;
            const locNombre = asig.localidad.nombre;
            if (!locStats.has(locId)) {
              locStats.set(locId, {
                id: locId,
                nombre: locNombre,
                nombreConNumero: getNombreLocalidadConNumero(locNombre),
                Indice: 50
              });
            }
            if (asig.estadoValidacion === 'VALIDADA_COMPLETADA') {
              locStats.get(locId).Indice += 5;
            }
          });
        });

        const db = Array.from(locStats.values()).map(x => ({ ...x, Indice: Math.min(x.Indice, 100) })).sort((a, b) => b.Indice - a.Indice);
        setDataBars(db);

        const ORDEN_DANE = [
          "usaquén", "usaquen", "chapinero", "santa fe", "san cristóbal", "san cristobal", "usme",
          "tunjuelito", "bosa", "kennedy", "fontibón", "fontibon", "engativá", "engativa", "suba",
          "barrios unidos", "teusaquillo", "los mártires", "los martires", "antonio nariño", "antonio narino",
          "puente aranda", "la candelaria", "rafael uribe uribe", "ciudad bolívar", "ciudad bolivar", "sumapaz"
        ];
        const locsSorted = [...db].sort((a, b) => {
          const iA = ORDEN_DANE.findIndex(x => a.nombre.toLowerCase().includes(x));
          const iB = ORDEN_DANE.findIndex(x => b.nombre.toLowerCase().includes(x));
          return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
        });
        setLocalidades(locsSorted);

        // 3. Drill-down si hay localidad seleccionada
        if (localidadFiltro !== 'TODAS') {
          const targetLoc = locsSorted.find(l => l.id === localidadFiltro);
          const currentIndice = targetLoc?.Indice || 0;

          // Filtrar actividades con asignación en esta localidad
          const actsLoc = data.filter((a: any) => a.asignaciones?.some((asig: any) => asig.localidadId === localidadFiltro));

          let compCount = 0;
          let curCount = 0;
          let noCount = 0;
          let progCount = 0;
          let sumaAvanceLocal = 0;
          let sumaMetaLocal = 0;

          const prodStats = new Map<string, { name: string; sumAvance: number; sumMeta: number; count: number }>();
          const tableList: any[] = [];

          actsLoc.forEach((a: any) => {
            const asig = a.asignaciones?.find((as: any) => as.localidadId === localidadFiltro);
            const esProgramada = !a.fechaLimite || new Date(a.fechaLimite) <= fechaCorte;
            const metaProg = esProgramada ? (a.indicadorMeta && a.indicadorMeta > 0 ? a.indicadorMeta : 100) : 0;

            const st = asig?.estadoLocal || 'NO_INICIADA';
            const isComp = st.includes('COMPLETA') || asig?.estadoValidacion === 'VALIDADA_COMPLETADA' || a.estado === 'COMPLETADA';
            const isCur = st.includes('CURSO') || asig?.estadoValidacion === 'VALIDADA_EN_CURSO' || a.estado === 'EN_PROGRESO';

            let avanceReal = 0;
            if (typeof asig?.porcentajeAvance === 'number' && asig.porcentajeAvance > 0) {
              avanceReal = asig.porcentajeAvance;
            } else if (isComp) {
              avanceReal = 100;
            } else if (isCur) {
              avanceReal = 50;
            }

            if (isComp) compCount++;
            else if (isCur) curCount++;
            else noCount++;

            if (esProgramada) progCount++;

            sumaAvanceLocal += avanceReal;
            sumaMetaLocal += metaProg;

            // Agrupar por Producto (P01..P10, etc.)
            const pCodigo = a.hito?.programa?.codigo || a.codigoCompleto.split('.')[0] || 'P01';
            if (!prodStats.has(pCodigo)) {
              prodStats.set(pCodigo, { name: pCodigo, sumAvance: 0, sumMeta: 0, count: 0 });
            }
            const pe = prodStats.get(pCodigo)!;
            pe.sumAvance += avanceReal;
            pe.sumMeta += metaProg;
            pe.count++;

            // Aplicar filtro de programación si está activo
            let matchFiltro = true;
            if (filtroProgramacion === 'PROGRAMADAS' && !esProgramada) matchFiltro = false;
            if (filtroProgramacion === 'NO_PROGRAMADAS' && esProgramada) matchFiltro = false;

            if (matchFiltro) {
              tableList.push({
                id: a.id,
                codigo: a.codigoCompleto,
                nombre: a.nombre,
                esProgramada,
                fechaLimite: a.fechaLimite,
                estado: isComp ? 'COMPLETADA' : isCur ? 'EN_CURSO' : 'NO_INICIADA',
                meta: metaProg,
                avance: avanceReal,
                cumplimiento: metaProg > 0 ? Math.min(100, Math.round((avanceReal / metaProg) * 100)) : (avanceReal > 0 ? 100 : 0)
              });
            }
          });

          const totalActs = actsLoc.length || 1;
          const avgAvanceLoc = Math.round(sumaAvanceLocal / totalActs);
          const cumplimientoTotal = progCount > 0 ? Math.round((compCount / progCount) * 100) : (compCount > 0 ? 100 : 0);

          const productosBars = Array.from(prodStats.values()).map(x => ({
            name: x.name,
            meta: Math.round(x.sumMeta / x.count),
            avance: Math.round(x.sumAvance / x.count)
          })).sort((a, b) => a.name.localeCompare(b.name));

          setLocData({
            indice: currentIndice,
            nombre: targetLoc?.nombreConNumero || targetLoc?.nombre || 'Localidad',
            totalActividades: actsLoc.length,
            programadasCount: progCount,
            ejecutadasCount: compCount,
            enCursoCount: curCount,
            noIniciadasCount: noCount,
            avanceGlobal: avgAvanceLoc,
            cumplimientoPct: cumplimientoTotal,
            productosBars,
            actList: tableList
          });
        }
      })
      .catch(err => console.error('Error calculando métricas:', err));
  }, [localidadFiltro, corteActivo, filtroProgramacion]);

  const [editandoCualitativo, setEditandoCualitativo] = useState<string | null>(null);
  const [formCualitativo, setFormCualitativo] = useState({ principalesAvances: '', alertasRecomendaciones: '' });
  const [generandoIA, setGenerandoIA] = useState<string | null>(null);
  const [generandoPdfLoc, setGenerandoPdfLoc] = useState(false);

  const handleGenerateIA = async (objId: string) => {
    setGenerandoIA(objId);
    setEditandoCualitativo(objId);
    try {
      const targetLocalidadId = !localidadFiltro || localidadFiltro === 'TODAS'
        ? 'TODAS'
        : localidadFiltro;

      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/ia/reportes/generar-borrador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objetivoId: objId,
          localidadId: targetLocalidadId,
          corteId: corteActivo?.id
        })
      });

      if (!res.ok) throw new Error('Error al generar borrador');

      const data = await res.json();
      setFormCualitativo({
        principalesAvances: data.principalesAvancesDraft || '',
        alertasRecomendaciones: data.alertasRecomendacionesDraft || ''
      });
    } catch (err) {
      console.error('Error generating report with IA:', err);
      alert('Error conectando al servicio de IA de RADAR. Verifica que el backend esté activo.');
    } finally {
      setGenerandoIA(null);
    }
  };

  const handleEdit = (objId: string) => {
    const asig = corteActivo?.reportes?.find((r: any) => r.objetivoId === objId);
    setFormCualitativo({
      principalesAvances: asig?.principalesAvances || '',
      alertasRecomendaciones: asig?.alertasRecomendaciones || ''
    });
    setEditandoCualitativo(objId);
  };

  const handleSave = async (objId: string) => {
    if (!corteActivo?.id) return;
    try {
      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/cortes/${corteActivo.id}/objetivo/${objId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formCualitativo)
      });
      const data = await res.json();
      const reportesActualizados = corteActivo.reportes ? [...corteActivo.reportes] : [];
      const idx = reportesActualizados.findIndex((r: any) => r.objetivoId === objId);
      if (idx > -1) reportesActualizados[idx] = data; else reportesActualizados.push(data);
      setCorteActivo({ ...corteActivo, reportes: reportesActualizados });
      setEditandoCualitativo(null);
    } catch (err) { console.error(err); }
  };

  const renderFiltros = () => (
    <div className="bg-[#111111] bg-opacity-95 p-6 rounded-xl shadow-xl flex flex-col md:flex-row items-center justify-between border-t-4 border-[#FFCD00] text-white bg-[url('https://www.bogota.gov.co/sites/default/files/2019-12/cerros_bogota.jpg')] bg-cover bg-blend-overlay">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest font-extrabold text-[#FFCD00] bg-white/10 px-2.5 py-0.5 rounded">
            Tablero de Control de Actividades
          </span>
          {localidadFiltro !== 'TODAS' && (
            <button
              onClick={() => setLocalidadFiltro('TODAS')}
              className="text-xs text-gray-300 hover:text-white flex items-center gap-1 underline underline-offset-2 ml-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a Global
            </button>
          )}
        </div>
        <h2 className="text-2xl md:text-3xl font-black tracking-wide mt-1">
          {localidadFiltro === 'TODAS' ? 'Balance General Distrital' : `Rollo Legendario · ${locData.nombre}`}
        </h2>
        <p className="text-xs md:text-sm text-gray-300 font-medium">
          {localidadFiltro === 'TODAS'
            ? 'Consolidado territorial de metas, avance y alertas por fecha de corte'
            : 'Seguimiento detallado a metas programadas y ejecución física por actividad'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-end sm:items-center mt-4 md:mt-0 gap-3">
        {/* Selector de Fecha de Corte */}
        <div className="flex items-center gap-2 bg-black/40 border border-gray-700 rounded-lg px-3 py-1.5">
          <Clock className="w-4 h-4 text-[#FFCD00]" />
          <span className="text-xs text-gray-300 uppercase tracking-widest font-bold">Corte:</span>
          {cortes.length > 0 ? (
            <select 
              className="bg-[#222222] text-[#FFCD00] font-bold px-2.5 py-1 rounded border border-gray-700 outline-none hover:border-[#FFCD00] text-xs cursor-pointer"
              value={corteActivo?.id}
              onChange={(e) => setCorteActivo(cortes.find(c => c.id === e.target.value))}
            >
              {cortes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.esActivo ? '★' : ''}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[#FFCD00] font-bold text-xs">15 de Octubre de 2026</span>
          )}
        </div>
        
        {/* Selector de Localidad */}
        <div className="flex items-center gap-2 bg-black/40 border border-gray-700 rounded-lg px-3 py-1.5">
          <Flag className="w-4 h-4 text-[#FFCD00]"/>
          <span className="text-xs text-gray-300 uppercase tracking-widest font-bold">Localidad:</span>
          <select 
            className="bg-[#222222] text-white font-bold px-2.5 py-1 rounded border border-gray-700 outline-none hover:border-[#FFCD00] text-xs cursor-pointer"
            value={localidadFiltro}
            onChange={(e) => setLocalidadFiltro(e.target.value)}
          >
            <option value="TODAS">TODAS (Global)</option>
            {localidades.map(l => (
              <option key={l.id} value={l.id}>
                {l.nombreConNumero || getNombreLocalidadConNumero(l.nombre)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const exportarReporteTerritorialPdf = async () => {
    if (!locData || localidadFiltro === 'TODAS') return;
    setGenerandoPdfLoc(true);

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '0';
    tempContainer.style.top = '0';
    tempContainer.style.width = '215.9mm';
    tempContainer.style.zIndex = '-9999';
    tempContainer.style.opacity = '0';
    tempContainer.style.pointerEvents = 'none';
    tempContainer.style.background = '#ffffff';
    document.body.appendChild(tempContainer);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });
      const pageWidth = 215.9;
      const pageHeight = 279.4;

      const actList = locData.actList || [];
      const totalActs = actList.length;
      const prodBars = locData.productosBars || [];

      // Si tiene hasta 30 actividades (como Chapinero con 29), cabe TODO en 1 SOLA PÁGINA sin cortes
      let chunks: any[][] = [];
      if (totalActs <= 30) {
        chunks = [actList];
      } else {
        // Para más de 30 actividades (ej. 37 de Santa Fe), página 1 lleva 22 y página 2 el resto
        const MAX_PAGE_1 = 22;
        const MAX_PAGE_OTHER = 28;
        chunks = [actList.slice(0, MAX_PAGE_1)];
        let rem = actList.slice(MAX_PAGE_1);
        while (rem.length > 0) {
          chunks.push(rem.slice(0, MAX_PAGE_OTHER));
          rem = rem.slice(MAX_PAGE_OTHER);
        }
      }

      const totalPages = Math.max(1, chunks.length);

      // Helper para renderizar velocímetro SVG exacto sin desborde
      const clamped = Math.max(0, Math.min(100, Math.round(locData.avanceGlobal || 0)));
      const angleRad = Math.PI + (clamped / 100) * Math.PI;
      const cx = 100;
      const cy = 82;
      const r = 58;
      const strokeWidth = 12;
      const needleLen = 45;
      const nx = cx + needleLen * Math.cos(angleRad);
      const ny = cy + needleLen * Math.sin(angleRad);
      const color = clamped >= 90 ? '#16A34A' : clamped >= 60 ? '#EAB308' : '#DC2626';

      const gaugeSvg = `
        <svg viewBox="0 0 200 95" style="width: 100%; max-width: 175px; height: auto; max-height: 70px; overflow: visible; margin: 0 auto; display: block;">
          <path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="#E5E7EB" stroke-width="${strokeWidth}" stroke-linecap="round" />
          ${clamped > 0 ? `<path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(angleRad)} ${cy + r * Math.sin(angleRad)}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" />` : ''}
          <text x="${cx - r}" y="${cy + 13}" font-size="8" font-weight="700" fill="#9CA3AF" text-anchor="middle">0%</text>
          <text x="${cx}" y="${cy - r - 4}" font-size="8" font-weight="700" fill="#9CA3AF" text-anchor="middle">50%</text>
          <text x="${cx + r}" y="${cy + 13}" font-size="8" font-weight="700" fill="#9CA3AF" text-anchor="middle">100%</text>
          <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="#1F2937" stroke-width="2.6" stroke-linecap="round" />
          <circle cx="${cx}" cy="${cy}" r="5" fill="#1F2937" />
          <circle cx="${cx}" cy="${cy}" r="1.8" fill="#FFFFFF" />
        </svg>
      `;

      // Helper para renderizar gráfico de barras por producto SVG adaptativo
      const generateBarChartSvg = (bars: any[]) => {
        const width = 200;
        const height = 95;
        const marginL = 22;
        const marginR = 6;
        const marginT = 8;
        const marginB = 20;
        const plotW = width - marginL - marginR;
        const plotH = height - marginT - marginB;

        const yTicks = [0, 50, 100];
        const gridLines = yTicks.map(t => {
          const y = marginT + plotH - (t / 100) * plotH;
          return `
            <line x1="${marginL}" y1="${y}" x2="${width - marginR}" y2="${y}" stroke="#F3F4F6" stroke-width="1" />
            <text x="${marginL - 3}" y="${y + 2.5}" font-size="7" fill="#9CA3AF" text-anchor="end" font-family="sans-serif">${t}%</text>
          `;
        }).join('');

        const numItems = Math.max(1, bars.length);
        const bandW = plotW / numItems;
        const barW = Math.min(12, Math.max(5, (bandW - 6) / 2));

        const barElements = bars.map((b, i) => {
          const cxBand = marginL + i * bandW + bandW / 2;
          const metaH = Math.max(1, (Math.min(100, b.meta || 0) / 100) * plotH);
          const avanceH = Math.max(1, (Math.min(100, b.avance || 0) / 100) * plotH);
          const metaY = marginT + plotH - metaH;
          const avanceY = marginT + plotH - avanceH;

          return `
            <rect x="${cxBand - barW - 1}" y="${metaY}" width="${barW}" height="${metaH}" fill="#94A3B8" rx="1.5" />
            <rect x="${cxBand + 1}" y="${avanceY}" width="${barW}" height="${avanceH}" fill="#16A34A" rx="1.5" />
            <text x="${cxBand}" y="${height - 5}" font-size="7.5" font-weight="bold" fill="#4B5563" text-anchor="middle" font-family="monospace">${b.name}</text>
          `;
        }).join('');

        return `
          <svg viewBox="0 0 ${width} ${height}" style="width: 100%; max-width: 175px; height: auto; max-height: 70px; display: block; margin: 0 auto; overflow: visible;">
            ${gridLines}
            ${barElements}
          </svg>
        `;
      };

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        tempContainer.innerHTML = '';
        const currentActs = chunks[pageIdx] || [];
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;
        const rowsCount = currentActs.length;

        // Si es 1 sola página (ej: 29 actividades), padding compacto para que quepa todo perfecto
        // Si son 2 páginas y la última tiene menos de 16, padding más amplio
        const rowPy = totalPages === 1 ? '4px' : rowsCount <= 16 ? '6.5px' : '4px';
        const fontSize = totalPages === 1 ? '8.5px' : rowsCount <= 16 ? '9px' : '8.5px';

        const pageEl = document.createElement('div');
        pageEl.className = 'bg-white text-gray-900 flex flex-col justify-between';
        pageEl.style.width = '215.9mm';
        pageEl.style.minHeight = '279.4mm';
        pageEl.style.maxHeight = '279.4mm';
        pageEl.style.padding = '7mm 10mm';
        pageEl.style.boxSizing = 'border-box';
        pageEl.style.fontFamily = '"Source Sans 3", "Segoe UI", system-ui, sans-serif';
        pageEl.style.overflow = 'hidden';

        let topContent = '';

        if (isFirstPage) {
          topContent += `
            <div>
              <!-- Encabezado Institucional Oficial Alcaldía de Bogotá + RADAR -->
              <div style="border-bottom: 2px solid #DC2626; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <img src="${LOGO_BOGOTA_BASE64}" alt="Alcaldía de Bogotá" style="height: 32px; width: auto; object-fit: contain;" />
                  <div style="border-left: 2px solid #E5E7EB; padding-left: 8px;">
                    <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #111827; letter-spacing: 0.04em;">
                      Alcaldía Mayor de Bogotá D.C. · Secretaría Distrital de Gobierno
                    </div>
                    <div style="font-size: 8px; font-weight: 700; color: #374151;">
                      Secretaría de Gobierno · Unidad de Transformación · RADAR
                    </div>
                    <div style="font-size: 11px; font-weight: 800; color: #111827; margin-top: 1px; text-transform: uppercase;">
                      Reporte Territorial de Actividades · ${locData.nombre}
                    </div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                  <div style="text-align: right;">
                    <div style="display: inline-block; background: #F3E8FF; color: #581C87; font-size: 8px; font-weight: 700; padding: 1.5px 6px; border-radius: 4px; border: 1px solid #E9D5FF;">
                      Corte: ${corteActivo?.nombre || '15 de Octubre de 2026'}
                    </div>
                    <div style="font-size: 7px; color: #6B7280; margin-top: 1px;">
                      Emisión: ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <img src="${LOGO_RADAR_BASE64}" alt="RADAR" style="height: 28px; width: auto; object-fit: contain; padding-left: 8px; border-left: 1px solid #E5E7EB;" />
                </div>
              </div>

              <!-- LAS 3 TARJETAS GRÁFICAS: VELOCÍMETRO, RESUMEN 2X2 Y GRÁFICO DE PRODUCTOS (ADAPTADAS Y SIN DESBORDE) -->
              <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-bottom: 6px;">
                
                <!-- 1. TACÓMETRO / VELOCÍMETRO -->
                <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 6px; padding: 5px 7px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.02); min-width: 0;">
                  <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F3F4F6; padding-bottom: 2px;">
                    <span style="font-size: 7.5px; font-weight: 800; text-transform: uppercase; color: #4B5563; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Avance Territorial</span>
                    <span style="font-size: 6.8px; font-weight: 700; padding: 1px 4px; border-radius: 3px; background: #DCFCE7; color: #166534;">Velocímetro</span>
                  </div>
                  <div style="margin: 1px 0; width: 100%;">
                    ${gaugeSvg}
                  </div>
                  <div style="text-align: center; margin-top: -4px;">
                    <div style="font-size: 18px; font-weight: 900; color: ${color}; line-height: 1;">${clamped}%</div>
                    <div style="font-size: 6.8px; font-weight: 700; text-transform: uppercase; color: #6B7280; margin-top: 1px;">${locData.nombre}</div>
                  </div>
                  <div style="width: 100%; text-align: center; font-size: 6.8px; color: #6B7280; border-top: 1px solid #F3F4F6; padding-top: 2px; margin-top: 2px;">
                    Cumplimiento: <strong>${locData.ejecutadasCount}</strong> de <strong>${locData.programadasCount}</strong>
                  </div>
                </div>

                <!-- 2. RESUMEN DE ACTIVIDADES (2X2 KPI) -->
                <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 6px; padding: 5px 7px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 2px rgba(0,0,0,0.02); min-width: 0;">
                  <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F3F4F6; padding-bottom: 2px;">
                    <span style="font-size: 7.5px; font-weight: 800; text-transform: uppercase; color: #4B5563;">Resumen</span>
                    <span style="font-size: 7px; font-weight: bold; color: #DC2626;">Total: ${locData.totalActividades}</span>
                  </div>

                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2.5px; margin: 2.5px 0;">
                    <div style="background: #F9FAFB; padding: 2.5px 3.5px; border-radius: 4px; border: 1px solid #E5E7EB;">
                      <div style="font-size: 12px; font-weight: 900; color: #111827; line-height: 1;">${locData.programadasCount}</div>
                      <div style="font-size: 6.5px; font-weight: 700; color: #6B7280; text-transform: uppercase;">Programadas</div>
                    </div>
                    <div style="background: #F0FDF4; padding: 2.5px 3.5px; border-radius: 4px; border: 1px solid #DCFCE7;">
                      <div style="font-size: 12px; font-weight: 900; color: #166534; line-height: 1;">${locData.ejecutadasCount}</div>
                      <div style="font-size: 6.5px; font-weight: 700; color: #15803D; text-transform: uppercase;">Completadas</div>
                    </div>
                    <div style="background: #FFFBEB; padding: 2.5px 3.5px; border-radius: 4px; border: 1px solid #FEF3C7;">
                      <div style="font-size: 12px; font-weight: 900; color: #B45309; line-height: 1;">${locData.enCursoCount}</div>
                      <div style="font-size: 6.5px; font-weight: 700; color: #B45309; text-transform: uppercase;">En Ejecución</div>
                    </div>
                    <div style="background: #FEF2F2; padding: 2.5px 3.5px; border-radius: 4px; border: 1px solid #FEE2E2;">
                      <div style="font-size: 12px; font-weight: 900; color: #991B1B; line-height: 1;">${locData.noIniciadasCount}</div>
                      <div style="font-size: 6.5px; font-weight: 700; color: #B91C1C; text-transform: uppercase;">Alerta/No Inic.</div>
                    </div>
                  </div>

                  <div style="background: #F9FAFB; padding: 2.5px 4px; border-radius: 4px; border: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 6.8px; color: #4B5563; font-weight: 600;">Cumplimiento corte:</span>
                    <span style="font-size: 8.5px; font-weight: 900; color: #DC2626; font-family: monospace;">${locData.cumplimientoPct}%</span>
                  </div>
                </div>

                <!-- 3. AVANCE PRODUCTOS (META VS AVANCE) -->
                <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 6px; padding: 5px 7px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 2px rgba(0,0,0,0.02); min-width: 0;">
                  <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F3F4F6; padding-bottom: 2px;">
                    <span style="font-size: 7.5px; font-weight: 800; text-transform: uppercase; color: #4B5563;">Avance Productos</span>
                    <span style="font-size: 6.8px; color: #9CA3AF;">${prodBars.length} prod.</span>
                  </div>
                  <div style="display: flex; justify-content: flex-end; gap: 5px; font-size: 6.5px; color: #6B7280; margin: 1px 0;">
                    <span style="display: flex; align-items: center; gap: 2px;"><span style="display: inline-block; width: 5px; height: 5px; background: #94A3B8; border-radius: 1px;"></span> Meta</span>
                    <span style="display: flex; align-items: center; gap: 2px;"><span style="display: inline-block; width: 5px; height: 5px; background: #16A34A; border-radius: 1px;"></span> Avance</span>
                  </div>
                  <div style="width: 100%;">
                    ${generateBarChartSvg(prodBars.slice(0, 6))}
                  </div>
                  <div style="width: 100%; text-align: right; font-size: 6.5px; color: #9CA3AF; border-top: 1px solid #F3F4F6; padding-top: 2px;">
                    Meta vs Avance
                  </div>
                </div>

              </div>
            </div>
          `;
        } else {
          // Páginas siguientes: Encabezado compacto
          let startIdx = 1;
          for (let p = 0; p < pageIdx; p++) {
            startIdx += (chunks[p] || []).length;
          }
          const endIdx = startIdx + currentActs.length - 1;

          topContent += `
            <div>
              <div style="border-bottom: 1.5px solid #DC2626; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <img src="${LOGO_BOGOTA_BASE64}" alt="Alcaldía de Bogotá" style="height: 26px; width: auto; object-fit: contain;" />
                  <div style="border-left: 2px solid #E5E7EB; padding-left: 8px;">
                    <div style="font-size: 8px; font-weight: 900; text-transform: uppercase; color: #111827;">
                      Alcaldía Mayor de Bogotá D.C. · Secretaría de Gobierno · Unidad de Transformación · RADAR
                    </div>
                    <div style="font-size: 10.5px; font-weight: 800; color: #111827; text-transform: uppercase;">
                      Continuación: Detalle de Actividades · ${locData.nombre} (${startIdx} a ${endIdx} de ${actList.length})
                    </div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                  <span style="font-size: 7.5px; font-weight: bold; background: #F3E8FF; color: #581C87; padding: 2px 6px; border-radius: 4px; border: 1px solid #E9D5FF;">
                    Corte: ${corteActivo?.nombre || '15 de Octubre de 2026'}
                  </span>
                  <img src="${LOGO_RADAR_BASE64}" alt="RADAR" style="height: 24px; width: auto; object-fit: contain; padding-left: 6px; border-left: 1px solid #E5E7EB;" />
                </div>
              </div>
            </div>
          `;
        }

        // Barra de Total Consolidado DIRECTAMENTE PEGADA AL PIE DE LA TABLA (NUNCA DESCONECTADA)
        const summaryBarConnected = isLastPage ? `
          <div style="background: #0F172A; color: #FFFFFF; padding: 5px 10px; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 8px; border-top: 1.5px solid #334155;">
            <span style="font-weight: 800; letter-spacing: 0.03em;">TOTAL CONSOLIDADO · ${locData.nombre}:</span>
            <div style="display: flex; gap: 14px; font-weight: 600;">
              <span>Actividades: <strong>${locData.ejecutadasCount} / ${locData.totalActividades} completadas</strong></span>
              <span>Avance Territorial: <strong>${locData.avanceGlobal}%</strong></span>
              <span>Eficacia a Corte: <strong>${locData.cumplimientoPct}%</strong></span>
            </div>
          </div>
        ` : '';

        // Bloque de síntesis territorial complementario en la última página si hay pocas actividades
        const extraAnalysisCard = (isLastPage && totalPages > 1 && rowsCount <= 16) ? `
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 10px; margin-top: 8px;">
            <div style="font-size: 8.5px; font-weight: 800; color: #1E293B; text-transform: uppercase; margin-bottom: 4px;">
              Directrices de Gestión y Cumplimiento Territorial · ${locData.nombre}
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; font-size: 7.5px;">
              <div style="background: #FFFFFF; padding: 5px 6px; border-radius: 4px; border: 1px solid #E2E8F0;">
                <div style="font-weight: 700; color: #475569;">Estatus de Operatividad</div>
                <div style="color: #0F172A; font-weight: 800; font-size: 10px; margin-top: 1px;">${locData.ejecutadasCount >= locData.programadasCount ? 'En Meta Programada' : 'Atención Prioritaria'}</div>
              </div>
              <div style="background: #FFFFFF; padding: 5px 6px; border-radius: 4px; border: 1px solid #E2E8F0;">
                <div style="font-weight: 700; color: #475569;">Alerta Preventiva</div>
                <div style="color: ${locData.noIniciadasCount > 0 ? '#DC2626' : '#16A34A'}; font-weight: 800; font-size: 10px; margin-top: 1px;">${locData.noIniciadasCount} act. pendientes</div>
              </div>
              <div style="background: #FFFFFF; padding: 5px 6px; border-radius: 4px; border: 1px solid #E2E8F0;">
                <div style="font-weight: 700; color: #475569;">Fecha de Corte Evaluada</div>
                <div style="color: #0F172A; font-weight: 800; font-size: 10px; margin-top: 1px;">${corteActivo?.nombre || '15 Octubre 2026'}</div>
              </div>
            </div>
          </div>
        ` : '';

        let tableHeaderTitle = isFirstPage
          ? `Detalle de Actividades · ${locData.nombre} (${totalPages === 1 ? 'Todas las ' + actList.length + ' actividades' : '1 a ' + currentActs.length + ' de ' + actList.length})`
          : `Continuación de Actividades · ${locData.nombre}`;

        pageEl.innerHTML = `
          <div>
            ${topContent}

            <!-- TABLA DE ACTIVIDADES CON CONTENEDOR INTEGRADO (TOTALES CONECTADOS DIRECTAMENTE) -->
            <div>
              <div style="font-size: 8px; font-weight: 800; color: #374151; text-transform: uppercase; margin-bottom: 3px; display: flex; justify-content: space-between; align-items: center;">
                <span>${tableHeaderTitle}</span>
                <span style="font-size: 7px; color: #6B7280; font-weight: normal;">Página ${pageIdx + 1} de ${totalPages}</span>
              </div>
              <div style="border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden; background: #FFFFFF;">
                <table style="width: 100%; border-collapse: collapse; font-size: ${fontSize}; text-align: left;">
                  <thead>
                    <tr style="background: #F1F5F9; color: #334155; font-weight: 700; border-bottom: 1.5px solid #CBD5E1; text-transform: uppercase; font-size: 7.5px;">
                      <th style="padding: 3.5px 5px; width: 95px;">Código</th>
                      <th style="padding: 3.5px 5px;">Actividad</th>
                      <th style="padding: 3.5px 5px; width: 75px; text-align: center;">Estado</th>
                      <th style="padding: 3.5px 5px; width: 44px; text-align: right;">Meta</th>
                      <th style="padding: 3.5px 5px; width: 46px; text-align: right;">Avance</th>
                      <th style="padding: 3.5px 5px; width: 56px; text-align: center;">Cumplimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${currentActs.map((a: any) => `
                      <tr style="border-bottom: 1px solid #F1F5F9; vertical-align: middle;">
                        <td style="padding: ${rowPy} 5px; font-family: monospace; font-weight: bold; color: #0F172A; font-size: 7.8px; white-space: nowrap;">${a.codigo}</td>
                        <td style="padding: ${rowPy} 5px; color: #1E293B; font-weight: 500; line-height: 1.2;">${a.nombre}</td>
                        <td style="padding: ${rowPy} 5px; text-align: center;">
                          <span style="display: inline-block; padding: 1px 4.5px; border-radius: 9999px; font-size: 7px; font-weight: bold; background: ${
                            a.estado === 'COMPLETADA' ? '#DCFCE7' : a.estado === 'EN_CURSO' ? '#FEF3C7' : '#FEE2E2'
                          }; color: ${
                            a.estado === 'COMPLETADA' ? '#166534' : a.estado === 'EN_CURSO' ? '#92400E' : '#991B1B'
                          };">
                            ${a.estado === 'COMPLETADA' ? 'Completada' : a.estado === 'EN_CURSO' ? 'En ejecución' : 'No iniciada'}
                          </span>
                        </td>
                        <td style="padding: ${rowPy} 5px; text-align: right; font-family: monospace; font-weight: 600;">${a.meta}%</td>
                        <td style="padding: ${rowPy} 5px; text-align: right; font-family: monospace; font-weight: 700; color: ${a.avance >= 90 ? '#15803D' : a.avance >= 50 ? '#B45309' : '#B91C1C'};">${a.avance}%</td>
                        <td style="padding: ${rowPy} 5px; text-align: center; font-weight: bold; color: ${a.cumplimiento >= 100 ? '#15803D' : a.cumplimiento >= 50 ? '#B45309' : '#B91C1C'};">${a.cumplimiento}%</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                ${summaryBarConnected}
              </div>
              ${extraAnalysisCard}
            </div>
          </div>

          <!-- Pie Institucional Oficial de Página -->
          <div style="border-top: 1px solid #E2E8F0; padding-top: 3px; margin-top: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 7px; color: #64748B;">
            <span>Alcaldía Mayor de Bogotá D.C. · Secretaría de Gobierno · Unidad de Transformación · RADAR</span>
            <span>Página ${pageIdx + 1} de ${totalPages}</span>
          </div>
        `;

        tempContainer.appendChild(pageEl);

        if ((document as any).fonts && (document as any).fonts.ready) {
          await (document as any).fonts.ready;
        }
        await new Promise(r => setTimeout(r, 90));

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          imageTimeout: 5000,
          backgroundColor: '#ffffff',
          windowWidth: pageEl.scrollWidth,
          windowHeight: pageEl.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (pageIdx > 0) {
          pdf.addPage('letter', 'portrait');
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
      }

      const nombreLoc = locData.nombre.replace(/[\s/\\:]+/g, '_');
      pdf.save(`Reporte_Territorial_${nombreLoc}_${corteActivo?.nombre || 'Corte'}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF territorial:', err);
      alert('Hubo un inconveniente al generar el reporte en PDF.');
    } finally {
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      setGenerandoPdfLoc(false);
    }
  };

  // VISTA DRILL-DOWN POR LOCALIDAD
  if (localidadFiltro !== 'TODAS') {
    return (
      <div className="flex flex-col gap-6 font-sans">
        {renderFiltros()}

        {/* CONTROLES ESPECÍFICOS DE PROGRAMACIÓN */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-bogota-primary" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Filtro Programación Meta:
            </span>
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs">
              <button
                type="button"
                onClick={() => setFiltroProgramacion('TODAS')}
                className={`px-3 py-1 font-bold rounded-md transition-colors ${filtroProgramacion === 'TODAS' ? 'bg-bogota-primary text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Todas ({locData.totalActividades})
              </button>
              <button
                type="button"
                onClick={() => setFiltroProgramacion('PROGRAMADAS')}
                className={`px-3 py-1 font-bold rounded-md transition-colors ${filtroProgramacion === 'PROGRAMADAS' ? 'bg-bogota-primary text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Programadas a corte ({locData.programadasCount})
              </button>
              <button
                type="button"
                onClick={() => setFiltroProgramacion('NO_PROGRAMADAS')}
                className={`px-3 py-1 font-bold rounded-md transition-colors ${filtroProgramacion === 'NO_PROGRAMADAS' ? 'bg-bogota-primary text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
              >
                No programadas ({locData.totalActividades - locData.programadasCount})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 font-medium hidden sm:block">
              Fecha de corte: <strong className="text-gray-800">{corteActivo?.nombre || '15 de Octubre de 2026'}</strong>
            </div>
            <button
              type="button"
              onClick={exportarReporteTerritorialPdf}
              disabled={generandoPdfLoc}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-sm transition-all cursor-pointer disabled:opacity-60"
              title="Descargar reporte territorial completo en PDF tamaño carta"
            >
              {generandoPdfLoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{generandoPdfLoc ? 'Generando PDF...' : 'Descargar Reporte PDF (Carta)'}</span>
            </button>
          </div>
        </div>

        {/* SECCIÓN SUPERIOR DE MÉTRICAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. TACÓMETRO / GAUGE CHART */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between items-center">
            <div className="w-full flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                Avance A2 · {locData.nombre}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                Velocímetro
              </span>
            </div>
            <GaugeSpeedometer
              value={locData.avanceGlobal || 0}
              label={`Avance Territorial ${locData.nombre}`}
              corte={corteActivo?.nombre || '15 de Octubre de 2026'}
            />
            <div className="w-full text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
              Cumplimiento: <strong className="text-gray-900">{locData.ejecutadasCount}</strong> de <strong className="text-gray-900">{locData.programadasCount}</strong> actividades programadas
            </div>
          </div>

          {/* 2. CARD DE METAS Y ESTADOS KPI */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="w-full flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                Resumen de Actividades
              </span>
              <span className="text-xs font-bold text-bogota-primary">
                Total: {locData.totalActividades}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col">
                <span className="text-2xl font-black text-gray-900">{locData.programadasCount}</span>
                <span className="text-[11px] font-bold text-gray-500 uppercase">Programadas al corte</span>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex flex-col">
                <span className="text-2xl font-black text-green-700">{locData.ejecutadasCount}</span>
                <span className="text-[11px] font-bold text-green-700 uppercase">Completadas</span>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex flex-col">
                <span className="text-2xl font-black text-amber-700">{locData.enCursoCount}</span>
                <span className="text-[11px] font-bold text-amber-700 uppercase">En ejecución</span>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex flex-col">
                <span className="text-2xl font-black text-red-700">{locData.noIniciadasCount}</span>
                <span className="text-[11px] font-bold text-red-700 uppercase">Pendientes / Alerta</span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between border border-gray-200 text-xs font-medium">
              <span className="text-gray-600">Cumplimiento frente a programadas:</span>
              <span className="font-extrabold text-sm text-bogota-primary font-archivo">
                {locData.cumplimientoPct}%
              </span>
            </div>
          </div>

          {/* 3. GRÁFICO AVANCE PRODUCTOS (META VS AVANCE) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <div className="w-full flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                Avance Productos (Meta vs Avance)
              </span>
              <span className="text-[11px] font-semibold text-gray-400">
                {locData.productosBars?.length || 0} productos
              </span>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={locData.productosBars || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fill: '#4B5563', fontSize: 11, fontWeight: 700 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} unit="%" />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${val}%`,
                      name === 'meta' ? 'Meta Programada' : 'Avance Real'
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '6px' }}
                  />
                  <Bar dataKey="meta" name="Meta Programada" fill="#94A3B8" radius={[3, 3, 0, 0]} barSize={14} />
                  <Bar dataKey="avance" name="Avance Real" fill="#16A34A" radius={[3, 3, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TABLA DETALLE DE ACTIVIDADES */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Detalle de Actividades · {locData.nombre}
              </h3>
              <p className="text-xs text-gray-500">
                Comparativa de metas programadas a fecha de corte frente al avance reportado
              </p>
            </div>
            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              Mostrando {locData.actList?.length || 0} actividades
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <th className="p-3 w-32">Código</th>
                  <th className="p-3">Actividad</th>
                  <th className="p-3 text-center w-36">Estado</th>
                  <th className="p-3 text-right w-36">Meta Programada</th>
                  <th className="p-3 text-right w-40">Avance Real</th>
                  <th className="p-3 text-center w-32">Cumplimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {(locData.actList || []).map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-gray-900">{a.codigo}</td>
                    <td className="p-3 text-gray-800 font-medium">{a.nombre}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                        a.estado === 'COMPLETADA'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : a.estado === 'EN_CURSO'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {a.estado === 'COMPLETADA' ? 'Completada' : a.estado === 'EN_CURSO' ? 'En ejecución' : 'No iniciada'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">
                      <div className="flex flex-col items-end">
                        <span className="text-gray-900 font-bold">{a.meta}%</span>
                        <span className={`text-[10px] ${a.esProgramada ? 'text-green-700 font-semibold' : 'text-gray-400'}`}>
                          {a.esProgramada ? 'Programada corte' : 'No prog. corte'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${a.avance >= 90 ? 'bg-green-600' : a.avance >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, a.avance)}%` }}
                          />
                        </div>
                        <span className="text-gray-900 font-bold">{a.avance}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                        a.cumplimiento >= 100 ? 'text-green-700' : a.cumplimiento >= 50 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {a.cumplimiento >= 100 ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            100%
                          </>
                        ) : (
                          `${a.cumplimiento}%`
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-800 text-white font-bold text-xs border-t-2 border-gray-900">
                  <td className="p-3 font-mono" colSpan={2}>
                    Total / Promedio Consolidado ({locData.nombre})
                  </td>
                  <td className="p-3 text-center">
                    {locData.ejecutadasCount} / {locData.programadasCount} ejecutadas
                  </td>
                  <td className="p-3 text-right font-mono">
                    {locData.programadasCount > 0 ? '100%' : '0%'}
                  </td>
                  <td className="p-3 text-right font-mono font-extrabold text-[#FFCD00]">
                    {locData.avanceGlobal || 0}%
                  </td>
                  <td className="p-3 text-center font-extrabold text-green-400">
                    {locData.cumplimientoPct}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {renderSeccionCualitativa()}
      </div>
    );
  }

  function renderSeccionCualitativa() {
    const objetivosVisibles = objetivosAPI.filter(obj => objIdsConActividades.has(obj.id));
    const listaRender = objetivosVisibles.length > 0 ? objetivosVisibles : objetivosAPI.slice(0, 1);

    return (
      <>
        {listaRender.map(obj => {
          const objReporte = corteActivo?.reportes?.find((r: any) => r.objetivoId === obj.id) || {};
          const isEditing = editandoCualitativo === obj.id;
          const alcanceLabel = localidadFiltro === 'TODAS' ? 'Consolidado General Distrital' : locData.nombre;

          return (
            <div key={obj.id} className="bg-white border rounded-xl shadow-lg overflow-hidden flex flex-col mb-4">
              <div className="bg-black text-white px-6 py-4 flex flex-wrap justify-between items-center gap-3 border-b-4 border-bogota-primary">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#FFCD00] font-extrabold block">
                    Síntesis Ejecutiva del Tablero de Control · {alcanceLabel}
                  </span>
                  <h2 className="text-xl font-bold font-serif">
                    Resumen de Todas las Actividades, Avances y Alertas ({obj.nombre})
                  </h2>
                </div>
                {isAdmin ? (
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleGenerateIA(obj.id)}
                      disabled={generandoIA !== null}
                      className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded font-bold shadow flex items-center gap-2 disabled:opacity-50 transition-colors text-xs sm:text-sm"
                    >
                      <Sparkles className="w-4 h-4 animate-pulse"/>
                      {generandoIA === obj.id ? 'Resumiendo actividades, avances y alertas...' : 'Resumen con IA (Actividades, Avances y Alertas)'}
                    </button>
                    {isEditing ? (
                      <>
                        <button onClick={() => handleSave(obj.id)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold shadow flex items-center gap-2 text-xs sm:text-sm"><Save className="w-4 h-4"/> Guardar</button>
                        <button onClick={() => setEditandoCualitativo(null)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded font-bold text-xs sm:text-sm">Cancelar</button>
                      </>
                    ) : (
                      <button onClick={() => handleEdit(obj.id)} className="bg-gray-800 hover:bg-gray-700 text-yellow-500 border border-yellow-600 px-4 py-2 rounded font-bold shadow flex items-center gap-2 text-xs sm:text-sm"><Edit2 className="w-4 h-4"/> Editar Reporte</button>
                    )}
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <span className="p-1 bg-[#FFCD00] rounded-full text-black"><CheckCircle className="w-5 h-5"/></span>
                    Resumen de Actividades y <span className="text-red-600">Principales Avances</span>
                  </h3>
                  {isEditing ? (
                    <textarea className="w-full h-48 p-3 border border-gray-300 rounded font-sans text-sm focus:outline-none focus:ring-2 focus:ring-red-500" value={formCualitativo.principalesAvances} onChange={(e)=>setFormCualitativo({...formCualitativo, principalesAvances: e.target.value})}/>
                  ) : (
                    <div className="prose text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{objReporte.principalesAvances || objReporte.principalesAvancesDraft || <span className="italic text-gray-400">Sin avances reportados. Haz clic en "Resumen con IA" para consolidar todas las actividades y avances.</span>}</div>
                  )}
                </div>
                <div className="p-6 bg-white">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <span className="p-1 bg-red-600 rounded-full text-white"><Info className="w-5 h-5"/></span>
                    Resumen de <span className="text-red-600">Alertas y Recomendaciones</span>
                  </h3>
                  {isEditing ? (
                    <textarea className="w-full h-48 p-3 border border-gray-300 rounded font-sans text-sm focus:outline-none focus:ring-2 focus:ring-red-500" value={formCualitativo.alertasRecomendaciones} onChange={(e)=>setFormCualitativo({...formCualitativo, alertasRecomendaciones: e.target.value})}/>
                  ) : (
                    <div className="prose text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{objReporte.alertasRecomendaciones || objReporte.alertasRecomendacionesDraft || <span className="italic text-gray-400">Sin alertas reportadas. Haz clic en "Resumen con IA" para sintetizar todas las alertas y actividades pendientes.</span>}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  // GLOBAL VIEW
  return (
    <div className="flex flex-col gap-6 font-sans">
      {renderFiltros()}

      {/* METRICAS HORIZONTALES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center">
            <h4 className="w-full text-center bg-red-600 text-white font-bold py-2 rounded shadow-sm mb-6 uppercase tracking-wider text-xs">Cumplimiento Global</h4>
            <div className="flex items-center gap-6">
               <span className="text-5xl font-bold text-[#FFCD00]">{stats.avance}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mt-8 mb-2 relative overflow-hidden flex items-center shadow-inner">
               <div className="bg-[#78B833] h-full" style={{width: `${stats.avance}%`}}></div>
               <span className="absolute right-2 font-bold text-[10px] text-gray-700">{stats.avance}%</span>
            </div>
            <p className="text-[10px] text-gray-500 font-medium">Cumplimiento promedio total</p>
        </div>

        <div className="bg-white border text-center border-gray-200 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5"><Flag className="w-32 h-32"/></div>
            <h4 className="w-full text-center bg-bogota-primary text-white font-bold py-2 rounded shadow-sm mb-4 uppercase tracking-wider text-xs">% Ejecutado / Programado</h4>
            <span className="text-5xl font-black text-gray-800 z-10 block">{stats.ejecutadasLiteral} <span className="text-xl font-bold text-gray-400">/ {stats.programadasLiteral}</span></span>
            <span className="font-bold text-bogota-primary mt-1 z-10">{stats.ejecutadasVsProgramadas}% Completado</span>
            <p className="text-[10px] text-gray-500 mt-2 z-10 font-medium px-4">Actividades ejecutadas frente al número total de vencidas a la fecha.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col relative md:col-span-2">
           <h4 className="w-full text-center bg-red-600 text-white font-bold py-2 rounded shadow-sm mb-6 uppercase tracking-wider text-xs">Avance por Aspiraciones</h4>
           <div className="flex flex-col justify-between h-full gap-2">
             {aspiracionesDinamicas.map(a => (
                <div key={a.name} className="flex items-center gap-2">
                   <span className="text-xs font-bold w-40 text-gray-700 truncate" title={a.name}>{a.name}</span>
                   <div className="flex-1 bg-gray-100 rounded-sm h-3 overflow-hidden relative">
                       <div className={`h-full ${a.avance > 80 ? 'bg-[#78B833]' : a.avance > 60 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{width: `${a.avance}%`}}></div>
                   </div>
                   <span className="text-xs font-bold text-gray-800 w-8 text-right">{a.avance}%</span>
                </div>
             ))}
           </div>
        </div>
      </div>

      {/* BARRAS HORIZONTALES LOCALIDADES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 h-[500px]">
           <h4 className="w-full text-center bg-red-600 text-white font-bold py-2 rounded mb-4 uppercase tracking-wider text-sm">Índice Transformación Localidades</h4>
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataBars} layout="vertical" margin={{ top: 0, right: 30, left: 100, bottom: 20 }}>
                 <XAxis type="number" hide domain={[0, 100]} />
                 <YAxis dataKey="nombre" type="category" width={110} tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                 <Tooltip cursor={{fill: '#f9fafb'}} />
                 <Bar dataKey="Indice" fill="#005C8A" radius={[0, 4, 4, 0]} barSize={12} label={{ position: 'right', fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} />
              </BarChart>
           </ResponsiveContainer>
         </div>

         <div className="bg-white border rounded-xl shadow-sm p-6 h-[500px]">
            <h4 className="w-full text-center bg-red-600 text-white font-bold py-2 rounded mb-4 uppercase tracking-wider text-sm">Avance Radárico por Objetivo</h4>
            <ResponsiveContainer width="100%" height="100%">
               <RadarChart cx="50%" cy="50%" outerRadius="70%" data={aspiracionesDinamicas}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
                  <Radar name="Promedio" dataKey="avance" stroke="#b91c1c" fill="#ef4444" fillOpacity={0.4} />
                  <Tooltip />
               </RadarChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* SECCIÓN ANALÍTICA CUALITATIVA DE RESUMEN DEL TABLERO */}
      {renderSeccionCualitativa()}
    </div>
  );
}
