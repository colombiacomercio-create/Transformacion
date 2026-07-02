import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, X, Search, ShieldAlert, Edit, Save } from 'lucide-react';
import { fetchApi } from '../utils/api';

export default function PanelAlertas({ userData }: { userData?: any }) {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [localidades, setLocalidades] = useState<any[]>([]);
  const [objetivos, setObjetivos] = useState<any[]>([]);
  
  const [mostrandoModal, setMostrandoModal] = useState(false);
  const [mostrandoGestion, setMostrandoGestion] = useState<string | null>(null);

  const [form, setForm] = useState({
     localidadId: '', objetivoId: '', tipo: 'BLOQUEO_GESTION', desc: '', responsable: '', fecha: '', correosResponsables: ''
  });
  
  const [formGestion, setFormGestion] = useState({ estado: 'ABIERTA', ultimaAccion: '', expectativa: '' });

  const fetchAlertas = () => {
    fetchApi(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/fichas-alertas`)
      .then(res => res.json())
      .then(data => setAlertas(data))
      .catch();
  };

  useEffect(() => {
    fetchAlertas();
    fetchApi(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/actividades`)
      .then(res => res.json())
      .then(data => {
         const locs = new Map();
         data.forEach((a:any) => a.asignaciones?.forEach((asig:any) => locs.set(asig.localidadId, asig.localidad)));
         const ORDEN_DANE = ["usaquén", "usaquen", "chapinero", "santa fe", "san cristóbal", "san cristobal", "usme", "tunjuelito", "bosa", "kennedy", "fontibón", "fontibon", "engativá", "engativa", "suba", "barrios unidos", "teusaquillo", "los mártires", "los martires", "antonio nariño", "antonio narino", "puente aranda", "la candelaria", "rafael uribe uribe", "ciudad bolívar", "ciudad bolivar", "sumapaz"];
         const locsRaw = Array.from(locs.values()).filter(Boolean) as any[];
         locsRaw.sort((a, b) => {
            const iA = ORDEN_DANE.findIndex(x => a.nombre.toLowerCase().includes(x));
            const iB = ORDEN_DANE.findIndex(x => b.nombre.toLowerCase().includes(x));
            return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
         });
         setLocalidades(locsRaw);
      });
      
    fetchApi(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/planes`)
      .then(res => res.json())
      .then(data => {
         if (data.length > 0) {
            let progs: any[] = [];
            data[0].objetivos?.forEach((o: any) => {
               o.programas?.forEach((p: any) => progs.push({ id: o.id, uniqueId: p.codigo, nombre: `[${p.codigo}] ${p.nombre}` }));
            });
            setObjetivos(progs);
         }
      });
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
     e.preventDefault();
      try {
       const correos = form.correosResponsables.split(',').map(e => e.trim()).filter(Boolean);
       
       const response = await fetchApi(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/fichas-alertas`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            localidadId: form.localidadId === 'GLOBAL' ? undefined : form.localidadId,
            objetivoId: form.objetivoId || null,
            tipo: form.tipo,
            descripcion: form.desc,
            responsable: form.responsable,
            correosResponsables: correos,
            fechaCompromiso: form.fecha || null
         })
       });
       
       const nuevaAlerta = await response.json();
       
       // Send email if emails provided
       if (correos.length > 0) {
          const { sendEmailGraphAPI } = await import('../utils/api');
          const subject = "La Unidad de Transformación te ha asignado una ALERTA";
          const link = `${window.location.origin}/alerta/${nuevaAlerta.id}`;
          const body = `
            <h2>Nueva Alerta Asignada</h2>
            <p>Se te ha asignado como responsable o notificado de la siguiente alerta en SITRA:</p>
            <p><strong>Descripción:</strong> ${form.desc}</p>
            <p><strong>Nivel / Tipo:</strong> ${form.tipo}</p>
            <p>Para ver los detalles, subir un reporte de actualización o adjuntar archivos, haz clic en el siguiente enlace:</p>
            <br/>
            <a href="${link}" style="background-color: #e3002b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acceder a la Alerta</a>
            <br/><br/>
            <p>Nota: Al ingresar, se te pedirá iniciar sesión con tu cuenta de Office 365.</p>
          `;
          try {
             await sendEmailGraphAPI(correos, subject, body);
          } catch (mailErr) {
             console.error("Error enviando correo, la alerta se guardó de todos modos", mailErr);
             alert("Alerta creada, pero hubo un error enviando los correos a los responsables.");
          }
       }

       setMostrandoModal(false);
       setForm({ ...form, desc: '', correosResponsables: '' });
       fetchAlertas();
     } catch(err) { console.error(err); }
  };

  const handleGestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!mostrandoGestion) return;
    try {
      await fetchApi(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/fichas-alertas/${mostrandoGestion}/estado`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(formGestion)
      });
      setMostrandoGestion(null);
      fetchAlertas();
    } catch(err) { console.error(err); }
  };

  const getTipoColor = (tipo: string) => {
     if(tipo === 'ESTRUCTURAL') return 'bg-purple-100 text-purple-800 border-purple-200';
     if(tipo === 'BLOQUEO_ALTO_NIVEL') return 'bg-red-100 text-red-800 border-red-200';
     return 'bg-orange-100 text-orange-800 border-orange-200';
  };

  const getEstadoBadge = (estado: string) => {
     if (estado === 'RESUELTA') return 'bg-green-100 text-green-800';
     if (estado === 'ESCALADA_DESPACHO' || estado === 'ESCALADA_GABINETE') return 'bg-purple-100 text-purple-800';
     return 'bg-red-100 text-red-800';
  };

  let alertasFiltradas = alertas;
  let localidadesForm = localidades;
  
  if (userData?.rol === 'GESTOR') {
     alertasFiltradas = alertas.filter(a => !a.localidadId || userData.localidadesAsignadas?.includes(a.localidadId));
     localidadesForm = localidades.filter(l => userData.localidadesAsignadas?.includes(l.id));
  }

  const cerradas = alertasFiltradas.filter(a => a.estado === 'RESUELTA').length;
  const enGestion = alertasFiltradas.filter(a => a.estado === 'ABIERTA').length;
  const escDespacho = alertasFiltradas.filter(a => a.estado === 'ESCALADA_DESPACHO').length;
  const escGabinete = alertasFiltradas.filter(a => a.estado === 'ESCALADA_GABINETE').length;
  const activas = enGestion + escDespacho + escGabinete;

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm gap-4">
         <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ShieldAlert className="w-8 h-8 text-red-600"/> Gestor de Alertas Prioritarias</h2>
            <p className="text-gray-500 text-sm">Registro y escalamiento de cuellos de botella reales en seguimiento a metas institucionales.</p>
         </div>
         <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
             <div className="text-center px-4 border-r border-gray-200">
                <span className="block text-2xl font-black text-red-600">{activas}</span>
                <span className="text-[10px] uppercase font-bold text-gray-500">Activas</span>
             </div>
             <div className="text-center px-4 border-r border-gray-200">
                <span className="block text-xl font-bold text-gray-700">{enGestion}</span>
                <span className="text-[10px] uppercase font-bold text-gray-500">Gestión UGRT</span>
             </div>
             <div className="text-center px-4 border-r border-gray-200">
                <span className="block text-xl font-bold text-purple-700">{escDespacho}</span>
                <span className="text-[10px] uppercase font-bold text-purple-600">Esc. Despacho</span>
             </div>
             <div className="text-center px-4 border-r border-gray-200">
                <span className="block text-xl font-bold text-purple-700">{escGabinete}</span>
                <span className="text-[10px] uppercase font-bold text-purple-600">Gab. Local</span>
             </div>
             <div className="text-center px-4">
                <span className="block text-xl font-bold text-green-600">{cerradas}</span>
                <span className="text-[10px] uppercase font-bold text-gray-500">Cerradas</span>
             </div>
         </div>
         <button onClick={() => setMostrandoModal(true)} className="bg-bogota-primary text-white font-bold px-6 py-3 rounded-lg shadow hover:bg-red-700 transition flex items-center gap-2">
            <Plus className="w-5 h-5"/> Registrar Alerta
         </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
         {alertasFiltradas.length === 0 && (
            <div className="p-8 text-center bg-gray-50 rounded-xl border-dashed border-2 border-gray-300">
               <span className="text-gray-400 font-medium">Excelente. No hay alertas registradas en el momento.</span>
            </div>
         )}
         {alertasFiltradas.map(a => (
            <div key={a.id} className={`p-6 bg-white rounded border shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start transition-all ${a.estado === 'RESUELTA' ? 'opacity-70 border-l-4 border-green-500' : 'border-l-4 border-red-600'}`}>
               <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                     <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${getTipoColor(a.tipo)}`}>{a.tipo.replace(/_/g, ' ')}</span>
                     <span className={`text-xs font-bold uppercase py-1 px-2 rounded-full ${getEstadoBadge(a.estado)}`}>{a.estado.replace(/_/g, ' ')}</span>
                  </div>
                  <h3 className="text-gray-800 font-bold text-lg">{a.descripcion}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600 mt-2">
                     <span className="bg-gray-100 p-1.5 px-3 rounded-lg shadow-sm border border-gray-200">🚩 <strong>Localidad:</strong> {a.localidad?.nombre || 'General'}</span>
                     <span className="bg-gray-100 p-1.5 px-3 rounded-lg shadow-sm border border-gray-200">👤 <strong>Responsable:</strong> {a.responsable}</span>
                     {a.objetivo && <span className="bg-gray-100 p-1.5 px-3 rounded-lg shadow-sm border border-gray-200">🎯 <strong>Objetivo:</strong> {a.objetivo.nombre}</span>}
                  </div>
                  
                  {a.ultimaAccion && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                       <h4 className="font-bold text-gray-700 mb-3 text-sm">Trazabilidad y Gestiones:</h4>
                       <div className="space-y-3">
                         {(() => {
                            try {
                               const historial = JSON.parse(a.ultimaAccion);
                               if (!Array.isArray(historial)) throw new Error('Not array');
                               if (historial.length === 0) return <span className="text-sm text-gray-400 italic">No hay gestiones registradas.</span>;
                               return historial.map((h: any, idx: number) => (
                                 <div key={idx} className="text-sm pl-4 border-l-2 border-bogota-primary relative">
                                    <div className="absolute w-2 h-2 rounded-full bg-bogota-primary -left-[5px] top-1.5"></div>
                                    <div className="flex justify-between items-baseline mb-1">
                                       <span className="font-bold text-gray-800">{h.usuario || 'Usuario'} <span className="font-normal text-gray-500 text-xs ml-2">cambió estado a <span className="font-bold">{h.estadoNuevo?.replace(/_/g, ' ')}</span></span></span>
                                       <span className="text-xs text-gray-400">{new Date(h.fecha).toLocaleString()}</span>
                                    </div>
                                    <p className="text-gray-700 bg-white p-2 rounded shadow-sm border border-gray-100">{h.accion}</p>
                                    {h.expectativa && (
                                       <p className="text-purple-700 bg-purple-50 p-2 rounded shadow-sm border border-purple-100 mt-1"><span className="font-bold">Expectativa:</span> {h.expectativa}</p>
                                    )}
                                 </div>
                               ));
                            } catch(e) {
                               return <div className="text-sm text-gray-600 bg-white p-3 rounded shadow-sm">{a.ultimaAccion}</div>;
                            }
                         })()}
                       </div>
                    </div>
                  )}
               </div>
               
               <div className="flex flex-col items-end gap-3 min-w-[200px]">
                  <button onClick={() => { setMostrandoGestion(a.id); setFormGestion({estado: a.estado, ultimaAccion: '', expectativa: ''})}} className="bg-white border-2 border-bogota-primary text-bogota-primary hover:bg-red-50 px-4 py-2 rounded font-bold flex items-center gap-2 transition w-full justify-center">
                     <Edit className="w-4 h-4"/> Gestionar / Actualizar
                  </button>
                  <span className="text-xs text-gray-400 font-medium tracking-wide">Reportado: {new Date(a.fechaCreacion).toLocaleDateString()}</span>
               </div>
            </div>
         ))}
      </div>

      {mostrandoGestion && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleGestion} className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
            <div className="bg-bogota-primary p-4 flex justify-between items-center text-white">
               <h3 className="font-bold text-lg">Actualizar Alerta</h3>
               <button type="button" onClick={() => setMostrandoGestion(null)}><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Estado de la Alerta</label>
                  <select className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500 font-bold" value={formGestion.estado} onChange={e => setFormGestion({...formGestion, estado: e.target.value})}>
                     <option value="ABIERTA">🚨 ABIERTA (En Gestión UGRT)</option>
                     <option value="ESCALADA_DESPACHO">🏛️ ESCALADA (Despacho / Secretario)</option>
                     <option value="ESCALADA_GABINETE">🏛️ ESCALADA (Gabinete Local)</option>
                     <option value="RESUELTA">✅ RESUELTA (Cerrada)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Justificación / Gestión Realizada</label>
                  <textarea required className="w-full p-3 border rounded-lg bg-gray-50 h-24 focus:ring-2 focus:ring-red-500 text-sm" value={formGestion.ultimaAccion} onChange={e => setFormGestion({...formGestion, ultimaAccion: e.target.value})} placeholder="Ej: Se intentó desbloquear contactando al contratista pero fue necesario elevar el requerimiento..."/>
               </div>
               {formGestion.estado.includes('ESCALADA') && (
                 <div>
                    <label className="block text-sm font-bold text-purple-700 mb-1">¿Qué se espera del escalonamiento? (Expectativa)</label>
                    <textarea required className="w-full p-3 border border-purple-200 rounded-lg bg-purple-50 h-20 focus:ring-2 focus:ring-purple-500 text-sm" value={formGestion.expectativa} onChange={e => setFormGestion({...formGestion, expectativa: e.target.value})} placeholder="Ej: Que el Secretario autorice la firma de la prórroga de manera urgente..."/>
                 </div>
               )}
            </div>
            <div className="bg-gray-100 p-4 border-t flex justify-end gap-3">
               <button type="button" onClick={() => setMostrandoGestion(null)} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded">Cancelar</button>
               <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center gap-2"><Save className="w-4 h-4"/> Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}

      {mostrandoModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCrear} className="bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden">
            <div className="bg-red-600 p-4 flex justify-between items-center text-white">
               <h3 className="font-bold text-lg">Reportar Alerta Temprana</h3>
               <button type="button" onClick={() => setMostrandoModal(false)}><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Alerta</label>
                 <select required className="w-full p-2 border rounded" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                    <option value="BLOQUEO_GESTION">Bloqueo de Gestión</option>
                    <option value="BLOQUEO_GABINETE">Bloqueo Gabinete Local</option>
                    <option value="BLOQUEO_ALTO_NIVEL">Bloqueo Alto Nivel</option>
                    <option value="ESTRUCTURAL">Causa Estructural</option>
                 </select>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Localidad Afectada</label>
                    <select required className="w-full p-2 border rounded" value={form.localidadId} onChange={e => setForm({...form, localidadId: e.target.value})}>
                       <option value="">Seleccione...</option>
                       <option value="GLOBAL">Alerta General (Todas las localidades)</option>
                       {localidadesForm.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                    </select>
                 </div>
                 <div className="col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Producto</label>
                    <select className="w-full p-2 border rounded text-sm" value={form.objetivoId} onChange={e => setForm({...form, objetivoId: e.target.value})}>
                       <option value="">(Ninguno / Global)</option>
                       {objetivos.map(o => <option key={o.uniqueId} value={o.id}>{o.nombre}</option>)}
                    </select>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Responsable de Gestión</label>
                 <input type="text" required className="w-full p-2 border rounded" value={form.responsable} onChange={e => setForm({...form, responsable: e.target.value})} placeholder="Ej: Alcalde de Engativá, SCJ..."/>
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Correos para asignar/notificar (separados por coma)</label>
                 <input type="text" className="w-full p-2 border rounded" value={form.correosResponsables} onChange={e => setForm({...form, correosResponsables: e.target.value})} placeholder="Ej: admin@gobiernobogota.gov.co, otro@correo.com" />
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Descripción del Bloqueo / Causa Estructural</label>
                 <textarea required className="w-full p-2 border rounded h-24" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} placeholder="Describe el obstáculo concreto que detiene el avance..."/>
               </div>
            </div>
            <div className="bg-gray-50 p-4 border-t flex justify-end gap-3">
               <button type="button" onClick={() => setMostrandoModal(false)} className="px-4 py-2 text-gray-600 font-bold">Cancelar</button>
               <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700">Crear Oficialmente</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
