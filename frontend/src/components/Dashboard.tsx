import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { CheckCircle, Save, Edit2, Info, Flag, Sparkles, AlertTriangle, Clock, Layers, ArrowLeft } from 'lucide-react';
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

  const handleGenerateIA = async (objId: string) => {
    setGenerandoIA(objId);
    try {
      const targetLocalidadId = (localidadFiltro === 'TODAS' || !localidadFiltro) && localidades.length > 0 
        ? localidades[0].id 
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

          <div className="text-xs text-gray-500 font-medium">
            Fecha de corte evaluada: <strong className="text-gray-800">{corteActivo?.nombre || '15 de Octubre de 2026'}</strong>
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
      </div>
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

      {/* SECCIÓN ANALÍTICA CUALITATIVA POR OBJETIVO */}
      {objetivosAPI.filter(obj => objIdsConActividades.has(obj.id)).map(obj => {
         const objReporte = corteActivo?.reportes?.find((r:any) => r.objetivoId === obj.id) || {};
         const isEditing = editandoCualitativo === obj.id;

         return (
            <div key={obj.id} className="bg-white border rounded shadow-lg overflow-hidden flex flex-col mb-4">
              <div className="bg-black text-white px-6 py-4 flex justify-between items-center border-b-4 border-bogota-primary">
                 <h2 className="text-xl font-bold font-serif">{obj.nombre}</h2>
                 {isAdmin ? (
                    isEditing ? (
                       <div className="flex gap-2">
                          <button 
                            onClick={() => handleGenerateIA(obj.id)}
                            disabled={generandoIA !== null}
                            className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded font-bold shadow flex items-center gap-2 disabled:opacity-50 transition-colors"
                          >
                            <Sparkles className="w-4 h-4 animate-pulse"/>
                            {generandoIA === obj.id ? 'Redactando borrador...' : 'Sugerir con IA'}
                          </button>
                          <button onClick={() => handleSave(obj.id)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold shadow flex items-center gap-2"><Save className="w-4 h-4"/> Guardar</button>
                       </div>
                    ) : (
                       <button onClick={() => handleEdit(obj.id)} className="bg-gray-800 hover:bg-gray-700 text-yellow-500 border border-yellow-600 px-4 py-2 rounded font-bold shadow flex items-center gap-2"><Edit2 className="w-4 h-4"/> Editar Reporte</button>
                    )
                 ) : null}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2">
                 <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                       <span className="p-1 bg-[#FFCD00] rounded-full text-black"><CheckCircle className="w-5 h-5"/></span>
                       Principales <span className="text-red-600">Avances</span>
                    </h3>
                    {isEditing ? (
                       <textarea className="w-full h-40 p-3 border border-gray-300 rounded font-sans text-sm focus:outline-none focus:ring-2 focus:ring-red-500" value={formCualitativo.principalesAvances} onChange={(e)=>setFormCualitativo({...formCualitativo, principalesAvances: e.target.value})}/>
                    ) : (
                       <div className="prose text-sm text-gray-700 whitespace-pre-wrap">{objReporte.principalesAvances || <span className="italic text-gray-400">Sin avances reportados.</span>}</div>
                    )}
                 </div>
                 <div className="p-6 bg-white">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                       <span className="p-1 bg-red-600 rounded-full text-white"><Info className="w-5 h-5"/></span>
                       Alertas y <span className="text-red-600">recomendaciones</span>
                    </h3>
                    {isEditing ? (
                       <textarea className="w-full h-40 p-3 border border-gray-300 rounded font-sans text-sm focus:outline-none focus:ring-2 focus:ring-red-500" value={formCualitativo.alertasRecomendaciones} onChange={(e)=>setFormCualitativo({...formCualitativo, alertasRecomendaciones: e.target.value})}/>
                    ) : (
                       <div className="prose text-sm text-gray-700 whitespace-pre-wrap">{objReporte.alertasRecomendaciones || <span className="italic text-gray-400">Sin alertas reportadas.</span>}</div>
                    )}
                 </div>
              </div>
            </div>
         );
      })}
    </div>
  );
}
