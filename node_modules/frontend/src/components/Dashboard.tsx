import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, Save, Edit2, Info, Flag } from 'lucide-react';

const mockAvancePorAspiraciones = [
  { name: 'A1. Presupuesto', avance: 95 },
  { name: 'A2. Experiencia Ciudad', avance: 82 },
  { name: 'A3. Seguridad', avance: 73 },
  { name: 'A4. Rollo Legendario', avance: 70 },
  { name: 'A5. Bogotaneidad', avance: 93 },
  { name: 'A6. DDHH', avance: 87 },
  { name: 'A7. Cercanía ciudadano', avance: 76 }
];
const mockDataRadar = [
  { subject: 'Ejecución Presup.', B: 80, fullMark: 100 },
  { subject: 'Obras', B: 98, fullMark: 100 },
  { subject: 'Espacio Público', B: 86, fullMark: 100 },
  { subject: 'Seguridad y IVC', B: 99, fullMark: 100 },
  { subject: 'Memoria Hist.', B: 65, fullMark: 100 },
  { subject: 'Cercanía Ciudadana', B: 45, fullMark: 100 },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ avance: 0, evaluadas: 0, alertaTotal: 0, ejecutadasVsProgramadas: 0, ejecutadasLiteral: 0, programadasLiteral: 0 });
  const [dataBars, setDataBars] = useState<any[]>([]);
  const [objetivosAPI, setObjetivosAPI] = useState<any[]>([]);
  const [cortes, setCortes] = useState<any[]>([]);
  const [corteActivo, setCorteActivo] = useState<any>(null);
  const [localidades, setLocalidades] = useState<any[]>([]);
  const [localidadFiltro, setLocalidadFiltro] = useState<string>('TODAS');
  const [aspiracionesDinamicas, setAspiracionesDinamicas] = useState<any[]>(mockAvancePorAspiraciones);
  
  // Data local para drill-down
  const [locData, setLocData] = useState<any>({ indice: 0, productos: [], objetivosBars: [], pieData: [], actList: [] });

  const isAdmin = (localStorage.getItem('mockRole') || 'ADMIN') === 'ADMIN';

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/actividades`, { headers: { 'Authorization': 'Bearer local_dev_token' }})
      .then(res => res.json())
      .then(data => {
         const hoy = new Date();
         
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
            const esProgramada = a.fechaLimite && new Date(a.fechaLimite) <= hoy;
            const asp = mapByCodigo(a.codigoCompleto);
            a.asignaciones?.forEach((asig: any) => {
                const completada = asig.estadoLocal === 'COMPLETA_SIN_VALIDAR' || asig.estadoValidacion === 'VALIDADA_COMPLETADA' || asig.estadoLocal === 'COMPLETADA_LOCAL';
                
                let valAvance = 0;
                if (completada) valAvance = 100;
                else if (asig.estadoLocal === 'EN_CURSO_SIN_VALIDAR') valAvance = 50;

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

         const totalAsignaciones = data.reduce((acc: number, a:any) => acc + (a.asignaciones?.length || 0), 0) || 1;
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

         const aspiracionesArr = Object.entries(aspiracionesMap).map(([name, data]) => ({
            name,
            avance: data.total > 0 ? Math.round(data.sum / data.total) : 0
         }));
         setAspiracionesDinamicas(aspiracionesArr);

         const locStats = new Map();
         data.forEach((a: any) => {
            a.asignaciones?.forEach((asig: any) => {
               if(!asig.localidad) return;
               const locId = asig.localidad.id;
               if (!locStats.has(locId)) locStats.set(locId, { id: locId, nombre: asig.localidad.nombre, Indice: 50 });
               if (asig.estadoValidacion === 'VALIDADA_COMPLETADA') locStats.get(locId).Indice += 5;
            });
         });
         const db = Array.from(locStats.values()).map(x => ({...x, Indice: Math.min(x.Indice, 100)})).sort((a,b)=>b.Indice - a.Indice);
         setDataBars(db);
         
         const ORDEN_DANE = ["usaquén", "usaquen", "chapinero", "santa fe", "san cristóbal", "san cristobal", "usme", "tunjuelito", "bosa", "kennedy", "fontibón", "fontibon", "engativá", "engativa", "suba", "barrios unidos", "teusaquillo", "los mártires", "los martires", "antonio nariño", "antonio narino", "puente aranda", "la candelaria", "rafael uribe uribe", "ciudad bolívar", "ciudad bolivar", "sumapaz"];
         const locsSorted = [...db].sort((a,b) => {
            const iA = ORDEN_DANE.findIndex(x => a.nombre.toLowerCase().includes(x));
            const iB = ORDEN_DANE.findIndex(x => b.nombre.toLowerCase().includes(x));
            return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
         });
         setLocalidades(locsSorted);

         // Generar data si hay filtro
         if(localidadFiltro !== 'TODAS') {
            const currentIndice = db.find(d => d.id === localidadFiltro)?.Indice || 0;
            
            // Filtrar asignaciones de esta localidad
            const actsLoc = data.filter((a:any) => a.asignaciones?.some((asig:any) => asig.localidadId === localidadFiltro));
            
            // Pie Status
            let comp=0, cur=0, no=0;
            const tableList: any[] = [];
            
            actsLoc.forEach((a:any) => {
               const st = a.asignaciones.find((asig:any) => asig.localidadId === localidadFiltro)?.estadoLocal || 'NO_INICIADA';
               if(st.includes('COMPLETA')) comp++;
               else if(st.includes('CURSO')) cur++;
               else no++;
               tableList.push({ id: a.id, codigo: a.codigoCompleto, nombre: a.nombre, estado: st });
            });

            const prodStats = new Map();
            const objStats = new Map();

            actsLoc.forEach((a:any) => {
               const st = a.asignaciones.find((asig:any) => asig.localidadId === localidadFiltro)?.estadoLocal || 'NO_INICIADA';
               let av = 0;
               if(st.includes('COMPLETA')) av = 100;
               else if(st.includes('CURSO')) av = 50;

               // Dynamic Programa / Producto calculation
               const p = a.hito?.programa;
               if (p) {
                  const pName = p.codigo;
                  if (!prodStats.has(pName)) prodStats.set(pName, { name: pName, sum: 0, count: 0 });
                  const e = prodStats.get(pName); e.sum += av; e.count++;
               }

               // Dynamic Objetivo calculation
               const obj = a.hito?.programa?.objetivo;
               if (obj) {
                  const oName = obj.codigo;
                  if (!objStats.has(oName)) objStats.set(oName, { name: oName, sum: 0, count: 0 });
                  const e = objStats.get(oName); e.sum += av; e.count++;
               }
            });

            const prodBars = Array.from(prodStats.values()).map(x => ({ name: x.name, avance: Math.round(x.sum/x.count) }));
            const objBars = Array.from(objStats.values()).map(x => ({ name: x.name, avance: Math.round(x.sum/x.count) }));

            setLocData({
               indice: currentIndice,
               pieData: [
                 { name: 'Completado', value: comp, color: '#16a34a' },
                 { name: 'En curso', value: cur, color: '#ca8a04' },
                 { name: 'No iniciado', value: no, color: '#dc2626' }
               ],
               actList: tableList,
               productosBars: prodBars,
               objetivosBars: objBars
            });
         }
      }).catch(err => console.error(err));

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/cortes`, { headers: { 'Authorization': 'Bearer local_dev_token' }})
      .then(res => res.json())
      .then(data => {
         setCortes(data);
         if(data.length > 0) setCorteActivo(data[0]);
      }).catch(err => console.error(err));

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/planes`, { headers: { 'Authorization': 'Bearer local_dev_token' }})
      .then(res => res.json())
      .then(data => {
         if (data.length > 0) setObjetivosAPI(data[0].objetivos || []);
      }).catch(err => console.error(err));

  }, [localidadFiltro]);

  const [editandoCualitativo, setEditandoCualitativo] = useState<string | null>(null);
  const [formCualitativo, setFormCualitativo] = useState({ principalesAvances: '', alertasRecomendaciones: '' });

  const handleEdit = (objId: string) => {
     const asig = corteActivo?.reportes?.find((r:any) => r.objetivoId === objId);
     setFormCualitativo({
        principalesAvances: asig?.principalesAvances || '',
        alertasRecomendaciones: asig?.alertasRecomendaciones || ''
     });
     setEditandoCualitativo(objId);
  };

  const handleSave = async (objId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/cortes/${corteActivo.id}/objetivo/${objId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer local_dev_token', 'x-mock-role': localStorage.getItem('mockRole') || 'ADMIN' },
        body: JSON.stringify(formCualitativo)
      });
      const data = await res.json();
      const reportesActualizados = corteActivo.reportes ? [...corteActivo.reportes] : [];
      const idx = reportesActualizados.findIndex((r:any) => r.objetivoId === objId);
      if(idx > -1) reportesActualizados[idx] = data; else reportesActualizados.push(data);
      setCorteActivo({ ...corteActivo, reportes: reportesActualizados });
      setEditandoCualitativo(null);
    } catch(err) { console.error(err); }
  };

  const renderFiltros = () => (
      <div className="bg-[#111111] bg-opacity-95 p-6 rounded-xl shadow-xl flex flex-col md:flex-row items-center justify-between border-t-4 border-[#FFCD00] text-white bg-[url('https://www.bogota.gov.co/sites/default/files/2019-12/cerros_bogota.jpg')] bg-cover bg-blend-overlay">
        <div>
           <h2 className="text-3xl font-bold tracking-wide">Balance general</h2>
           <h3 className="text-2xl text-[#FFCD00] font-bold">Localidades</h3>
        </div>
        <div className="flex flex-col items-end mt-4 md:mt-0 gap-3">
           <div className="flex items-center gap-2">
             <span className="text-xs text-gray-300 uppercase tracking-widest font-bold">Corte:</span>
             {cortes.length > 0 ? (
               <select 
                 className="bg-[#222222] text-white font-bold px-3 py-1 rounded border border-gray-700 outline-none hover:border-[#FFCD00]"
                 value={corteActivo?.id}
                 onChange={(e) => setCorteActivo(cortes.find(c => c.id === e.target.value))}
               >
                 {cortes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
               </select>
             ) : (
               <span className="text-[#FFCD00] font-bold">En Vivo</span>
             )}
           </div>
           
           <div className="flex items-center gap-2">
             <span className="text-xs text-gray-300 uppercase tracking-widest font-bold flex items-center gap-1"><Flag className="w-3 h-3"/> Localidad:</span>
             <select 
               className="bg-[#222222] text-[#FFCD00] font-bold px-3 py-1 rounded border border-gray-700 outline-none hover:border-[#FFCD00]"
               value={localidadFiltro}
               onChange={(e) => setLocalidadFiltro(e.target.value)}
             >
               <option value="TODAS">TODAS (Global)</option>
               {localidades.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
             </select>
           </div>
        </div>
      </div>
  );

  if (localidadFiltro !== 'TODAS') {
     const locName = localidades.find(l => l.id === localidadFiltro)?.nombre;
     return (
        <div className="flex flex-col gap-6 font-sans">
           {renderFiltros()}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* IZQUIERDA: INDICE Y TABLA */}
              <div className="flex flex-col gap-6">
                 <div className="bg-white p-6 rounded-xl border shadow flex justify-center items-center gap-8 relative">
                    <img src="https://bogota.gov.co/themes/custom/govbr/logo.svg" className="absolute top-4 right-4 h-8 opacity-50" />
                    <h2 className="text-3xl font-extrabold text-red-600 block mb-2">{locName}</h2>
                    <div className="flex flex-col items-center">
                       <span className="text-6xl font-black text-bogota-secondary">{locData.indice}</span>
                       <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Índice Transformación</span>
                    </div>
                    <div className="flex items-center">
                       <div className="bg-gray-800 p-2 rounded-full border-4 border-gray-900 shadow-inner flex flex-col gap-2">
                          <div className={`w-8 h-8 rounded-full shadow-inner ${locData.indice < 60 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-red-900'}`}></div>
                          <div className={`w-8 h-8 rounded-full shadow-inner ${locData.indice >= 60 && locData.indice < 90 ? 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'bg-yellow-900'}`}></div>
                          <div className={`w-8 h-8 rounded-full shadow-inner ${locData.indice >= 90 ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]' : 'bg-green-900'}`}></div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-xl border shadow">
                    <h3 className="font-bold mb-4 text-gray-800">Estado Actividades</h3>
                    <div className="flex justify-center items-center h-48">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={locData.pieData || []} innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value" label>
                             {(locData.pieData || []).map((e:any, i:any) => <Cell key={i} fill={e.color} />)}
                           </Pie>
                           <Tooltip />
                           <Legend />
                         </PieChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              {/* DERECHA: BARRAS */}
              <div className="flex flex-col gap-6">
                 <div className="bg-white p-6 rounded-xl border shadow h-64">
                    <h3 className="font-bold mb-4 text-gray-800 text-center">Avance Objetivo</h3>
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={locData.objetivosBars || []} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                         <XAxis type="number" hide domain={[0, 100]} />
                         <YAxis dataKey="name" type="category" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                         <Tooltip />
                         <Bar dataKey="avance" barSize={16}>
                            {(locData.objetivosBars || []).map((entry:any, idx:any) => (
                               <Cell key={idx} fill={entry.avance >= 90 ? '#16a34a' : entry.avance >= 60 ? '#facc15' : '#ef4444'} />
                            ))}
                         </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>

                 <div className="bg-white p-6 rounded-xl border shadow h-64">
                    <h3 className="font-bold mb-4 text-gray-800 text-center">Avance Producto</h3>
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={locData.productosBars || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                         <YAxis type="number" hide domain={[0, 100]} />
                         <XAxis dataKey="name" type="category" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                         <Tooltip />
                         <Bar dataKey="avance" barSize={20}>
                            {(locData.productosBars || []).map((entry:any, idx:any) => (
                               <Cell key={idx} fill={entry.avance >= 90 ? '#16a34a' : entry.avance >= 60 ? '#facc15' : '#ef4444'} />
                            ))}
                         </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl border shadow">
             <h3 className="font-bold mb-4 text-gray-800">Detalle Actividades ({locName})</h3>
             <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-700">
                   <tr>
                      <th className="p-3">Código</th>
                      <th className="p-3">Actividad</th>
                      <th className="p-3">Estado Local</th>
                   </tr>
                </thead>
                <tbody>
                   {(locData.actList || []).map((a:any) => (
                     <tr key={a.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-gray-500">{a.codigo}</td>
                        <td className="p-3 text-gray-800 font-medium">{a.nombre}</td>
                        <td className="p-3">
                           <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${a.estado.includes('COMPLETA') ? 'bg-green-100 text-green-700' : typeof a.estado === 'string' && a.estado.includes('CURSO') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {a.estado.replace(/_/g, ' ')}
                           </span>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
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
               <span className="text-5xl font-bold text-[#FFCD00]">{stats.evaluadas}</span>
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

      {/* BARRAS HORIZONTALES LOCALIDADES (EVITA APEÑUZCADO) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 h-[500px]">
           <h4 className="w-full text-center bg-red-600 text-white font-bold py-2 rounded mb-4 uppercase tracking-wider text-sm">Índice Transformación Localidades</h4>
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataBars} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 20 }}>
                 <XAxis type="number" hide domain={[0, 100]} />
                 <YAxis dataKey="name" type="category" tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                 <Tooltip cursor={{fill: '#f9fafb'}} />
                 <Bar dataKey="Indice" fill="#005C8A" radius={[0, 4, 4, 0]} barSize={12} label={{ position: 'right', fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} />
              </BarChart>
           </ResponsiveContainer>
         </div>

         <div className="bg-white border rounded-xl shadow-sm p-6 h-[500px]">
            <h4 className="w-full text-center bg-red-600 text-white font-bold py-2 rounded mb-4 uppercase tracking-wider text-sm">Avance Radárico por Objetivo</h4>
            <ResponsiveContainer width="100%" height="100%">
               <RadarChart cx="50%" cy="50%" outerRadius="70%" data={mockDataRadar}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
                  <Radar name="Promedio" dataKey="B" stroke="#b91c1c" fill="#ef4444" fillOpacity={0.4} />
                  <Tooltip />
               </RadarChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* SECCIÓN ANALÍTICA CUALITATIVA POR OBJETIVO */}
      {objetivosAPI.map(obj => {
         const objReporte = corteActivo?.reportes?.find((r:any) => r.objetivoId === obj.id) || {};
         const isEditing = editandoCualitativo === obj.id;

         return (
            <div key={obj.id} className="bg-white border rounded shadow-lg overflow-hidden flex flex-col mb-4">
              <div className="bg-black text-white px-6 py-4 flex justify-between items-center border-b-4 border-bogota-primary">
                 <h2 className="text-xl font-bold font-serif">{obj.nombre}</h2>
                 {isAdmin ? (
                    isEditing ? (
                       <button onClick={() => handleSave(obj.id)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold shadow flex items-center gap-2"><Save className="w-4 h-4"/> Guardar</button>
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
