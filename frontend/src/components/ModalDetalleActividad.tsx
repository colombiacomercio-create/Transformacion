import React, { useState } from 'react';
import { X, MessageSquare, Paperclip, CheckCircle2, Clock, Calendar, FileText, Send } from 'lucide-react';

interface Props {
  actividad: any;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ModalDetalleActividad({ actividad, onClose, onRefresh }: Props) {
  const esAdmin = (actividad.asignaciones?.length || 0) > 1;
  const asignacionesOrdenadas = [...(actividad.asignaciones || [])].sort((a: any, b: any) => a.localidad?.nombre.localeCompare(b.localidad?.nombre));
  
  const [tab, setTab] = useState<'detalles'|'comentarios'|'evidencias'>('detalles');
  const [locAdminSelected, setLocAdminSelected] = useState<string>(asignacionesOrdenadas[0]?.localidadId || '');
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // States for Admin Edit
  const [editando, setEditando] = useState(false);
  const [editData, setEditData] = useState({
     descripcion: actividad.descripcion || '',
     fechaInicio: actividad.fechaInicio ? new Date(actividad.fechaInicio).toISOString().split('T')[0] : '',
     fechaLimite: actividad.fechaLimite ? new Date(actividad.fechaLimite).toISOString().split('T')[0] : ''
  });

  // States for Gestor Evidence Form
  const [comentarioEvidencia, setComentarioEvidencia] = useState('');
  const [evidenciaFile, setEvidenciaFile] = useState<File | null>(null);

  const [estadoPendiente, setEstadoPendiente] = useState<string | null>(null);
  const [comentarioEstado, setComentarioEstado] = useState('');
  const [evidenciaEstado, setEvidenciaEstado] = useState<File | null>(null);
  const [procesandoEstado, setProcesandoEstado] = useState(false);

  const curLocId = esAdmin ? locAdminSelected : asignacionesOrdenadas[0]?.localidadId;
  const asigActual = asignacionesOrdenadas.find((a: any) => a.localidadId === curLocId);
  
  const comentariosAMostrar = actividad.comentarios?.filter((c: any) => c.localidadId === curLocId) || [];
  const evidenciasAMostrar = actividad.evidencias?.filter((e: any) => e.localidadId === curLocId) || [];

  const isReadonly = asigActual?.estadoValidacion === 'VALIDADA_COMPLETADA';

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;
    setPostingComment(true);
    try {
      await fetch(`http://localhost:4000/api/actividades/${actividad.id}/comentarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer local_dev_token'
        },
        body: JSON.stringify({ texto: nuevoComentario, localidadId: curLocId })
      });
      setNuevoComentario('');
      onRefresh(); // Refresh parent to get new comments
    } catch(err) {
      console.error(err);
    }
    setPostingComment(false);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenciaFile) return alert('Seleccione un archivo');
    if (!comentarioEvidencia.trim()) return alert('Debe proporcionar un comentario obligatorio sobre la ejecución.');

    const formData = new FormData();
    formData.append('archivo', evidenciaFile);
    formData.append('tipoEvidencia', 'documento');
    formData.append('descripcion', 'Subida local manual');
    formData.append('comentarioAdjunto', comentarioEvidencia);
    formData.append('localidadId', curLocId);

    setUploading(true);
    try {
      const mockRole = localStorage.getItem('mockRole') || 'ADMIN';
      const res = await fetch(`http://localhost:4000/api/evidencias/upload/${actividad.id}`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer local_dev_token',
          'x-mock-role': mockRole
        },
        body: formData
      });
      if (!res.ok) {
         const d = await res.json();
         throw new Error(d.error || 'Error subiendo archivo');
      }
      setComentarioEvidencia('');
      setEvidenciaFile(null);
      // Let it disappear automatically (reset file input is tricky but we clear state)
      onRefresh();
    } catch(err: any) {
      console.error(err);
      alert(err.message);
    }
    setUploading(false);
  };

  const handleAdminSaveEdits = async () => {
    try {
      const mockRole = localStorage.getItem('mockRole') || 'ADMIN';
      await fetch(`http://localhost:4000/api/actividades/${actividad.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer local_dev_token', 'x-mock-role': mockRole },
        body: JSON.stringify(editData)
      });
      setEditando(false);
      onRefresh();
    } catch(err) { console.error(err); }
  };

  const handleUpdateEstadoLocal = async (estadoLocal: string) => {
    if (!asigActual) return;
    setEstadoPendiente(estadoLocal);
  };

  const confirmarCambioEstadoLocal = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!asigActual || !estadoPendiente) return;
     if (!evidenciaEstado || !comentarioEstado.trim()) {
        alert("Debes adjuntar un archivo de evidencia y escribir un comentario técnico.");
        return;
     }
     
     setProcesandoEstado(true);
     try {
       const mockRole = localStorage.getItem('mockRole') || 'ADMIN';
       
       // 1. Subir evidencia
       const formData = new FormData();
       formData.append('documento', evidenciaEstado);
       formData.append('tipo', 'DOCUMENTO');
       formData.append('localidadId', asigActual.localidadId);
       formData.append('descripcion', comentarioEstado);

       await fetch(`http://localhost:4000/api/evidencias/actividad/${actividad.id}`, {
         method: 'POST',
         headers: { 'Authorization': 'Bearer local_dev_token', 'x-mock-role': mockRole },
         body: formData
       });

       // 2. Subir Comentario
       await fetch(`http://localhost:4000/api/comentarios/actividad/${actividad.id}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer local_dev_token', 'x-mock-role': mockRole },
         body: JSON.stringify({
            texto: `[Cambio de Estado a ${estadoPendiente.replace(/_/g, ' ')}]: ` + comentarioEstado,
            localidadId: asigActual.localidadId,
            esAlerta: false
         })
       });

       // 3. Cambiar estado local
       await fetch(`http://localhost:4000/api/actividades/asignacion/${asigActual.id}/estadoLocal`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer local_dev_token', 'x-mock-role': mockRole },
         body: JSON.stringify({ estadoLocal: estadoPendiente })
       });
       
       setEstadoPendiente(null);
       setComentarioEstado('');
       setEvidenciaEstado(null);
       setProcesandoEstado(false);
       onRefresh();
       setTab('evidencias'); // Ir a la tab de evidencias para ver el éxito
     } catch(err) { console.error(err); setProcesandoEstado(false); }
  };

  const handleUpdateEstadoValidacion = async (estadoValidacion: string) => {
    if (!asigActual) return;
    try {
      const mockRole = localStorage.getItem('mockRole') || 'ADMIN';
      await fetch(`http://localhost:4000/api/actividades/asignacion/${asigActual.id}/estadoValidacion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer local_dev_token', 'x-mock-role': mockRole },
        body: JSON.stringify({ estadoValidacion })
      });
      onRefresh();
    } catch(err) { console.error(err); }
  };

  const getEstadoValidacionLabel = (st: string) => {
    if (st === 'VALIDADA_COMPLETADA') return 'Validada y Completada';
    if (st === 'VALIDADA_EN_CURSO') return 'Validada en Curso';
    if (st === 'VALIDADA_SIN_AVANCE') return 'Validada Sin Avance';
    return 'Pendiente de Revisión';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col h-[85vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 rounded-t-xl">
          <div>
             <span className="text-xs font-bold text-bogota-primary bg-bogota-primary/10 px-2 py-1 rounded inline-block mb-2">
                 {actividad.codigoCompleto || 'SIN CODIGO'}
             </span>
             <h2 className="text-2xl font-bold text-gray-800 leading-tight">{actividad.nombre}</h2>
             <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
               <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> Límite: {actividad.fechaLimite ? new Date(actividad.fechaLimite).toLocaleDateString() : 'Sin Fecha'}</span>
               <span className="flex items-center gap-1">
                 {actividad.estado === 'COMPLETADA' ? <CheckCircle2 className="w-4 h-4 text-green-500"/> : <Clock className="w-4 h-4 text-orange-500"/>}
                 <span className="font-medium text-gray-700">{actividad.estado}</span>
               </span>
             </div>
          </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors ml-4">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {esAdmin && (
          <div className="bg-orange-50 px-6 py-3 border-b border-orange-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-orange-800">Caja de Auditoría (ADMIN):</span>
              <select 
                value={locAdminSelected} 
                onChange={e => setLocAdminSelected(e.target.value)}
                className="border border-orange-200 rounded px-2 py-1 text-sm bg-white font-medium outline-none focus:ring-2 focus:ring-orange-300"
              >
                {asignacionesOrdenadas.map((a: any) => (
                  <option key={a.id} value={a.localidadId}>{a.localidad?.nombre} ({a.estadoLocal === 'COMPLETADA_LOCAL' ? 'Completado' : 'Abierto'})</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Cambiar Estado de Validación:</span>
              <select 
                value={asigActual?.estadoValidacion || 'PENDIENTE_REVISION'}
                onChange={e => handleUpdateEstadoValidacion(e.target.value)}
                className={`border text-sm font-bold px-2 py-1 rounded outline-none ${asigActual?.estadoValidacion === 'VALIDADA_COMPLETADA' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-white border-gray-300'}`}
              >
                <option value="PENDIENTE_REVISION">Pendiente de Revisión</option>
                <option value="VALIDADA_COMPLETADA">Validada y Completada</option>
                <option value="VALIDADA_EN_CURSO">Validada en Curso</option>
                <option value="VALIDADA_SIN_AVANCE">Validada Sin Avance</option>
              </select>
            </div>
          </div>
        )}

        {!esAdmin && (
          <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-blue-800">Mi Reporte Local - {asigActual?.localidad?.nombre || 'General'}</span>
              <span className="text-xs text-blue-600 font-medium flex items-center gap-1">Estado de Revisión: <span className="font-bold underline">{getEstadoValidacionLabel(asigActual?.estadoValidacion || 'PENDIENTE_REVISION')}</span></span>
            </div>
            {isReadonly ? (
               <div className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">
                 Actividad Cerrada (Solo Lectura)
               </div>
            ) : (
              <div className="flex flex-col gap-2 relative">
                <div className="flex gap-2 items-center justify-end">
                   <span className="text-xs font-bold text-gray-500 uppercase">Mi Estado:</span>
                   <select 
                     value={estadoPendiente || asigActual?.estadoLocal || 'NO_INICIADA'}
                     onChange={e => handleUpdateEstadoLocal(e.target.value)}
                     className={`border text-sm font-bold px-2 py-1.5 rounded outline-none ${(estadoPendiente || asigActual?.estadoLocal) === 'COMPLETA_SIN_VALIDAR' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-white border-gray-300'} transition-colors`}
                   >
                     <option value="NO_INICIADA">No Iniciada (Default)</option>
                     <option value="EN_CURSO_SIN_VALIDAR">En Curso sin Validar</option>
                     <option value="COMPLETA_SIN_VALIDAR">Completa sin Validar (Enviar)</option>
                   </select>
                </div>
              </div>
            )}
          </div>
        )}

        {estadoPendiente && estadoPendiente !== asigActual?.estadoLocal && !isReadonly && (
           <form onSubmit={confirmarCambioEstadoLocal} className="bg-yellow-50 px-6 py-4 border-b border-yellow-200 shadow-inner flex flex-col gap-3">
              <h4 className="font-bold text-yellow-800 text-sm flex items-center gap-2">
                 <AlertCircle className="w-4 h-4"/>
                 Requisito para Reportar Cambio de Estado
              </h4>
              <p className="text-xs text-yellow-700">Para actualizar esta actividad a <strong>{estadoPendiente.replace(/_/g, ' ')}</strong>, es obligatorio cargar el soporte de la ejecución.</p>
              <textarea 
                required
                placeholder="Escribe el comentario / justificación del avance..."
                className="w-full text-sm border-yellow-300 rounded p-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                value={comentarioEstado}
                onChange={e => setComentarioEstado(e.target.value)}
              />
              <div className="flex justify-between items-center">
                 <input 
                   required
                   type="file" 
                   onChange={e => setEvidenciaEstado(e.target.files ? e.target.files[0] : null)}
                   className="text-sm bg-white border border-yellow-300 p-1.5 rounded w-full max-w-xs"
                 />
                 <div className="flex gap-2">
                    <button type="button" onClick={() => setEstadoPendiente(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded">Cancelar</button>
                    <button type="submit" disabled={procesandoEstado} className="px-4 py-1.5 text-xs bg-bogota-primary text-white font-bold rounded shadow hover:bg-red-700 transition disabled:opacity-50">
                       {procesandoEstado ? 'Subiendo...' : 'Reportar Avance a Revisión'}
                    </button>
                 </div>
              </div>
           </form>
        )}
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 mt-2">
           <button onClick={() => setTab('detalles')} className={`pb-3 pt-2 font-medium mr-8 border-b-2 transition-colors ${tab === 'detalles' ? 'border-bogota-primary text-bogota-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
             Detalles
           </button>
           <button onClick={() => setTab('comentarios')} className={`pb-3 pt-2 font-medium mr-8 border-b-2 transition-colors flex items-center gap-2 ${tab === 'comentarios' ? 'border-bogota-primary text-bogota-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
             <MessageSquare className="w-4 h-4"/> Comentarios Locales ({comentariosAMostrar.length})
           </button>
           <button onClick={() => setTab('evidencias')} className={`pb-3 pt-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === 'evidencias' ? 'border-bogota-primary text-bogota-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
             <Paperclip className="w-4 h-4"/> Archivos Locales ({evidenciasAMostrar.length})
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white min-h-0">
          
          {tab === 'detalles' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Descripción</h3>
                  {esAdmin && !editando && (
                    <button onClick={() => setEditando(true)} className="text-bogota-primary text-xs font-bold hover:underline">Activar Edición</button>
                  )}
                  {esAdmin && editando && (
                     <div className="flex gap-2">
                       <button onClick={() => setEditando(false)} className="text-gray-500 text-xs font-bold hover:underline">Cancelar</button>
                       <button onClick={handleAdminSaveEdits} className="bg-bogota-primary text-white text-xs px-3 py-1 rounded hover:bg-red-700">Guardar Cambios</button>
                     </div>
                  )}
                </div>
                {editando ? (
                   <textarea className="w-full border rounded p-2 outline-none h-24" value={editData.descripcion} onChange={e => setEditData({...editData, descripcion: e.target.value})}/>
                ) : (
                   <p className="text-gray-700 text-sm whitespace-pre-wrap">{actividad.descripcion || 'Sin descripción disponible.'}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                 <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Fechas ({esAdmin && 'Editables'})</h3>
                    {editando ? (
                      <div className="flex flex-col gap-2">
                         <input type="date" className="border px-2 text-sm rounded" value={editData.fechaInicio} onChange={e => setEditData({...editData, fechaInicio: e.target.value})}/>
                         <input type="date" className="border px-2 text-sm rounded" value={editData.fechaLimite} onChange={e => setEditData({...editData, fechaLimite: e.target.value})}/>
                      </div>
                    ) : (
                      <p className="font-medium">Inicio: {actividad.fechaInicio ? new Date(actividad.fechaInicio).toLocaleDateString() : 'N/A'}<br/>Límite: {actividad.fechaLimite ? new Date(actividad.fechaLimite).toLocaleDateString() : 'N/A'}</p>
                    )}
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Localidades Asignadas</h3>
                    <p className="font-medium text-sm">
                      {actividad.asignaciones?.map((a: any) => a.localidad?.nombre).join(', ') || 'Global'}
                    </p>
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Meta y Unidad</h3>
                    <p className="font-medium">{actividad.indicadorMeta} {actividad.indicadorUnidad}</p>
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Evidencias Requeridas</h3>
                    <p className="font-medium">{actividad.tiposEvidenciaRequeridos?.join(', ') || 'General'}</p>
                 </div>
              </div>
            </div>
          )}

          {tab === 'comentarios' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2">
                 {comentariosAMostrar.length === 0 && (
                   <div className="text-center text-gray-400 mt-10">No hay comentarios en el hilo de esta localidad.</div>
                 )}
                 {comentariosAMostrar.map((c: any) => (
                   <div key={c.id} className={`p-4 rounded-xl max-w-[85%] ${c.autorId === (actividad.creadoPor || 'admin-mock-id') ? 'ml-auto bg-blue-50 border border-blue-100 rounded-tr-none' : 'bg-gray-50 border border-gray-100 rounded-tl-none'}`}>
                     <div className="flex justify-between items-baseline mb-1 gap-4">
                       <span className={`font-bold text-sm ${c.autorId === (actividad.creadoPor || 'admin-mock-id') ? 'text-blue-700' : 'text-bogota-primary'}`}>{c.autor?.nombre || 'Alguien'}</span>
                       <span className="text-xs text-gray-400">{new Date(c.fechaCreacion).toLocaleString()}</span>
                     </div>
                     <p className="text-gray-700 text-sm whitespace-pre-wrap">{c.texto}</p>
                   </div>
                 ))}
              </div>
              {!isReadonly ? (
                <form onSubmit={handlePostComment} className="flex gap-2 pt-4 border-t mt-auto">
                   <input 
                     type="text" 
                     value={nuevoComentario}
                     onChange={e => setNuevoComentario(e.target.value)}
                     placeholder="Escribe una actualización para esta localidad..."
                     className="flex-1 border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30"
                   />
                   <button disabled={postingComment} type="submit" className="bg-bogota-primary text-white p-2 rounded-lg hover:bg-red-700 disabled:opacity-50">
                      <Send className="w-5 h-5" />
                   </button>
                </form>
              ) : (
                <div className="pt-4 border-t mt-auto text-center text-sm font-bold text-gray-400 bg-gray-50 p-2 rounded-lg">
                  Hilo de chat bloqueado. La actividad ya fue validada.
                </div>
              )}
            </div>
          )}

          {tab === 'evidencias' && (
            <div className="space-y-6">
              {!isReadonly && (
                <div className="border border-gray-200 bg-gray-50 p-6 rounded-xl flex flex-col justify-center">
                   <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><FileText className="w-5 h-5 text-gray-500" /> Cargar nueva evidencia</h3>
                   <p className="text-sm text-gray-500 mb-4 max-w-md">Para el archivo seleccionado es estrictamente necesario que agregues una descripción del trabajo ejecutado.</p>
                   
                   <form onSubmit={handleFileUpload} className="flex flex-col gap-4">
                     <textarea 
                       required 
                       placeholder="Describe brevemente en detalle lo que demuestra este reporte/archivo..."
                       className="w-full border rounded-lg p-3 outline-none text-sm h-20 resize-none focus:ring-2 focus:ring-bogota-primary/30"
                       value={comentarioEvidencia}
                       onChange={e => setComentarioEvidencia(e.target.value)}
                     />
                     <div className="flex gap-4 items-center justify-between">
                       <input 
                         required 
                         type="file" 
                         className="text-sm border border-gray-200 p-2 rounded bg-white w-full max-w-xs"
                         onChange={e => setEvidenciaFile(e.target.files ? e.target.files[0] : null)}
                       />
                       <button type="submit" disabled={uploading} className="bg-bogota-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 inline-flex items-center gap-2 shadow">
                         {uploading ? 'Procesando...' : 'Subir Archivo'}
                       </button>
                     </div>
                   </form>
                </div>
              )}

              <div className="space-y-3 mt-8">
                 <h4 className="font-bold text-gray-700">Archivos Cargados ({asigActual?.localidad?.nombre || 'General'})</h4>
                 {evidenciasAMostrar.length === 0 && (
                   <p className="text-sm text-gray-400">Sin archivos adjuntos en el expediente local.</p>
                 )}
                 {evidenciasAMostrar.map((ev: any) => (
                   <div key={ev.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50">
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Paperclip className="w-5 h-5"/></div>
                       <div>
                         <p className="font-medium text-sm text-gray-800">{ev.nombreArchivo}</p>
                         <p className="text-xs text-gray-400">Subido el {new Date(ev.fechaSubida).toLocaleDateString()}</p>
                       </div>
                     </div>
                     <a href={`http://localhost:4000${ev.urlArchivo}`} target="_blank" rel="noreferrer" className="text-bogota-primary text-sm font-bold hover:underline">Ver</a>
                   </div>
                 ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
