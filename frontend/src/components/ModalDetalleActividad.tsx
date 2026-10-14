import React, { useState, useEffect } from 'react';
import { AlertCircle, X, MessageSquare, Paperclip, CheckCircle2, Clock, Calendar, FileText, Send, Sparkles } from 'lucide-react';
import { fetchApi } from '../utils/api';

interface Props {
  actividad: any;
  onClose: () => void;
  onRefresh: () => void;
  userData?: any;
}

export default function ModalDetalleActividad({ actividad, onClose, onRefresh, userData }: Props) {
  const esAdmin = userData?.rol === 'ADMIN';
  
  let asignacionesOrdenadas = [...(actividad.asignaciones || [])].sort((a: any, b: any) => a.localidad?.nombre.localeCompare(b.localidad?.nombre));
  if (userData?.rol === 'GESTOR') {
      asignacionesOrdenadas = asignacionesOrdenadas.filter((a: any) => userData.localidadesAsignadas?.includes(a.localidadId));
  }
  
  const [tab, setTab] = useState<'detalles' | 'evidencias_comentarios'>('detalles');
  const [locSelected, setLocSelected] = useState<string>(asignacionesOrdenadas[0]?.localidadId || '');
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // States for Admin Edit
  const [editando, setEditando] = useState(false);
  const [planes, setPlanes] = useState<any[]>([]);
  const [editData, setEditData] = useState({
     codigoCompleto: actividad.codigoCompleto || '',
     nombre: actividad.nombre || '',
     hitoId: actividad.hitoId || '',
     descripcion: actividad.descripcion || '',
     fechaInicio: actividad.fechaInicio ? new Date(actividad.fechaInicio).toISOString().split('T')[0] : '',
     fechaLimite: actividad.fechaLimite ? new Date(actividad.fechaLimite).toISOString().split('T')[0] : '',
     correosNotificacion: actividad.correosNotificacion?.join(', ') || ''
  });

  // States for Gestor Evidence Form
  const [comentarioEvidencia, setComentarioEvidencia] = useState('');
  const [evidenciaFile, setEvidenciaFile] = useState<File | null>(null);

  const [estadoPendiente, setEstadoPendiente] = useState<string | null>(null);
  const [comentarioEstado, setComentarioEstado] = useState('');
  const [evidenciaEstado, setEvidenciaEstado] = useState<File | null>(null);
  const [procesandoEstado, setProcesandoEstado] = useState(false);
  const [nuevoResponsableInput, setNuevoResponsableInput] = useState('');
  const [guardandoResponsables, setGuardandoResponsables] = useState(false);
  const [usuariosSistema, setUsuariosSistema] = useState<any[]>([]);

  useEffect(() => {
    fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/auth/usuarios`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsuariosSistema(data);
      })
      .catch(() => {});
  }, []);

  const curLocId = locSelected || asignacionesOrdenadas[0]?.localidadId;
  const asigActual = asignacionesOrdenadas.find((a: any) => a.localidadId === curLocId);
  
  const comentariosAMostrar = actividad.comentarios?.filter((c: any) => c.localidadId === curLocId) || [];
  const evidenciasAMostrar = actividad.evidencias?.filter((e: any) => e.localidadId === curLocId) || [];

  const isReadonly = asigActual?.estadoValidacion === 'VALIDADA_COMPLETADA';

  
  useEffect(() => {
    if (esAdmin) {
      fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/planes`)
        .then(res => res.json())
        .then(data => setPlanes(data))
        .catch(err => console.error(err));
    }
  }, [esAdmin]);

  useEffect(() => {
    setEditData({
      codigoCompleto: actividad.codigoCompleto || '',
      nombre: actividad.nombre || '',
      hitoId: actividad.hitoId || '',
      descripcion: actividad.descripcion || '',
      fechaInicio: actividad.fechaInicio ? new Date(actividad.fechaInicio).toISOString().split('T')[0] : '',
      fechaLimite: actividad.fechaLimite ? new Date(actividad.fechaLimite).toISOString().split('T')[0] : '',
      correosNotificacion: actividad.correosNotificacion?.join(', ') || ''
    });
  }, [actividad]);

  const getHitosPlano = () => {
    let hitos: {id: string, nombre: string}[] = [];
    planes.forEach(p => {
       p.objetivos?.forEach((o: any) => {
          o.programas?.forEach((prog: any) => {
             if (prog.hitos && prog.hitos.length > 0) {
                hitos.push({ id: prog.hitos[0].id, nombre: `[${prog.codigo}] ${prog.nombre}` });
             }
          });
       });
    });
    return hitos.sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, {numeric: true}));
  };

  const enviarNotificacionComentario = async (comentarioTexto: string, archivoAdjuntoNombre?: string | null) => {
    try {
      const ADMINS_ROLLO = ['armando.escobar@gobiernobogota.gov.co', 'maria.jaimes@gobiernobogota.gov.co'];
      const currentUserEmail = (userData?.email || '').toLowerCase().trim();
      const currentUserName = userData?.nombre || currentUserEmail.split('@')[0] || 'Usuario';
      
      const esAdminRollo = ADMINS_ROLLO.some(adminEmail => adminEmail.toLowerCase() === currentUserEmail);

      let destinatarios: string[] = [];

      if (esAdminRollo) {
        // Si el comentario es de Armando Escobar o María Lucía Jaimes, notificar a los responsables de la actividad
        destinatarios = (actividad.correosNotificacion || []).map((e: string) => (typeof e === 'string' ? e.trim().toLowerCase() : '')).filter(Boolean);
        if (asigActual?.asignadoA?.email) {
          destinatarios.push(asigActual.asignadoA.email.trim().toLowerCase());
        }
        actividad.asignaciones?.forEach((a: any) => {
          if (a.asignadoA?.email) {
            destinatarios.push(a.asignadoA.email.trim().toLowerCase());
          }
        });
      } else {
        // Si el comentario es de cualquier otra persona, notificar a Armando Escobar y María Lucía Jaimes (y al creador si existe)
        destinatarios = [...ADMINS_ROLLO];
        if (actividad.creadoPor && actividad.creadoPor !== 'SYSTEM' && actividad.creadorEmail) {
          destinatarios.push(actividad.creadorEmail.toLowerCase().trim());
        }
      }

      // Filtrar correo del mismo autor (no auto-notificarse) y deduplicar
      const cleanDestinatarios = Array.from(new Set(
        destinatarios
          .filter(e => e && e !== currentUserEmail)
      ));

      if (cleanDestinatarios.length === 0) {
        console.log("No hay destinatarios distintos para notificar este comentario.");
        return;
      }

      if (import.meta.env.VITE_BYPASS_AUTH === 'true') {
        console.log(`Modo Bypass: Notificación de comentario simulada para ${cleanDestinatarios.join(', ')}`);
        return;
      }

      const { sendEmailGraphAPI } = await import('../utils/api');
      const { generarCuerpoCorreoComentario, asuntoCorreoComentario } = await import('../utils/mailTemplate');

      const subject = asuntoCorreoComentario(actividad.codigoCompleto, actividad.nombre);
      const body = generarCuerpoCorreoComentario({
        actividadNombre: actividad.nombre,
        codigo: actividad.codigoCompleto,
        autorNombre: currentUserName,
        comentario: comentarioTexto,
        localidadNombre: asigActual?.localidad?.nombre,
        archivoAdjunto: archivoAdjuntoNombre,
        actividadId: actividad.id
      });

      await sendEmailGraphAPI(cleanDestinatarios, subject, body);
      console.log(`Notificación de comentario enviada con éxito a: ${cleanDestinatarios.join(', ')}`);
    } catch (mailErr) {
      console.error("Error enviando notificación de comentario por Microsoft Graph:", mailErr);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;
    setPostingComment(true);
    const textoParaEnviar = nuevoComentario.trim();
    try {
      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades/${actividad.id}/comentarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ texto: textoParaEnviar, localidadId: curLocId })
      });
      if (!res.ok) {
        throw new Error('Error al publicar comentario');
      }

      // Enviar notificación oficial por correo
      await enviarNotificacionComentario(textoParaEnviar, null);

      setNuevoComentario('');
      onRefresh(); // Refresh parent to get new comments
    } catch(err: any) {
      console.error(err);
      alert('Error publicando comentario: ' + (err.message || err));
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
    formData.append('comentarioAdjunto', comentarioEvidencia.trim());
    formData.append('localidadId', curLocId);

    setUploading(true);
    try {
      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/evidencias/upload/${actividad.id}`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
         const d = await res.json();
         throw new Error(d.error || 'Error subiendo archivo');
      }

      const nombreArchivoSubido = evidenciaFile.name;
      const comentarioTexto = comentarioEvidencia.trim();

      // Enviar notificación oficial por correo con el soporte adjunto
      await enviarNotificacionComentario(comentarioTexto, nombreArchivoSubido);

      setComentarioEvidencia('');
      setEvidenciaFile(null);
      alert('Evidencia cargada con éxito y registrada en el hilo de comentarios.');
      onRefresh();
    } catch(err: any) {
      console.error(err);
      alert(err.message);
    }
    setUploading(false);
  };

  
  const handleDeleteActividad = async () => {
    if (window.confirm('Confirma que desea eliminar esta actividad por completo? Esta accion no se puede deshacer.')) {
      try {
        await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades/${actividad.id}`, {
          method: 'DELETE'
        });
        onRefresh();
        onClose();
      } catch (e: any) {
        alert('Error eliminando la actividad: ' + e.message);
      }
    }
  };

  const handleAgregarResponsable = async (correoParaAgregar?: string) => {
    let emailToAdd = (correoParaAgregar || nuevoResponsableInput).trim().toLowerCase();
    if (!emailToAdd) return;

    // Si escribe solo el usuario sin dominio (ej: "roberto.parra"), autocompletar con @gobiernobogota.gov.co
    if (!emailToAdd.includes('@')) {
      emailToAdd = `${emailToAdd}@gobiernobogota.gov.co`;
    }

    const currentList: string[] = Array.from(new Set(
      (actividad.correosNotificacion || [])
        .map((e: string) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
        .filter(Boolean)
    ));

    if (currentList.includes(emailToAdd)) {
      alert(`El correo ${emailToAdd} ya se encuentra asignado como responsable.`);
      setNuevoResponsableInput('');
      return;
    }

    const updatedList = [...currentList, emailToAdd];
    setGuardandoResponsables(true);
    try {
      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades/${actividad.id}/responsables`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correosNotificacion: updatedList })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Error guardando responsable en el servidor');
      }

      // Actualizar estado local inmediatamente
      actividad.correosNotificacion = updatedList;
      setEditData(prev => ({
        ...prev,
        correosNotificacion: updatedList.join(', ')
      }));
      setNuevoResponsableInput('');

      // Enviar correo de notificación al nuevo responsable
      if (import.meta.env.VITE_BYPASS_AUTH === 'true') {
        alert(`Responsable asignado con éxito. (Modo Bypass: correo simulado a ${emailToAdd})`);
      } else {
        try {
          const { sendEmailGraphAPI } = await import('../utils/api');
          const { generarCuerpoCorreoActividad, asuntoCorreoActividad } = await import('../utils/mailTemplate');
          const subject = asuntoCorreoActividad(actividad.codigoCompleto);
          const body = generarCuerpoCorreoActividad({
            nombre: actividad.nombre,
            descripcion: actividad.descripcion,
            codigo: actividad.codigoCompleto,
            fechaLimite: actividad.fechaLimite,
            actividadId: actividad.id
          });
          await sendEmailGraphAPI([emailToAdd], subject, body);
          alert(`Responsable ${emailToAdd} asignado con éxito y notificación enviada por correo.`);
        } catch (mailErr: any) {
          console.error("Error enviando correo al nuevo responsable:", mailErr);
          alert(`Responsable ${emailToAdd} guardado en la base de datos, pero ocurrió un aviso con el envío del correo: ${mailErr.message || mailErr}`);
        }
      }

      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(`Error al asignar responsable: ${err.message || err}`);
    } finally {
      setGuardandoResponsables(false);
    }
  };

  const handleQuitarResponsable = async (emailToRemove: string) => {
    if (!window.confirm(`¿Deseas quitar a ${emailToRemove} de los responsables de esta actividad?`)) {
      return;
    }

    const currentList: string[] = (actividad.correosNotificacion || [])
      .map((e: string) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
      .filter(Boolean);

    const updatedList = currentList.filter(e => e !== emailToRemove.toLowerCase());
    setGuardandoResponsables(true);
    try {
      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades/${actividad.id}/responsables`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correosNotificacion: updatedList })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Error removiendo responsable');
      }

      actividad.correosNotificacion = updatedList;
      setEditData(prev => ({
        ...prev,
        correosNotificacion: updatedList.join(', ')
      }));

      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(`Error al remover responsable: ${err.message || err}`);
    } finally {
      setGuardandoResponsables(false);
    }
  };

  const handleReenviarNotificacion = async () => {
    const emails = actividad.correosNotificacion || [];
    if (emails.length === 0) {
      alert("No hay correos de responsables asignados a esta actividad.");
      return;
    }
    if (import.meta.env.VITE_BYPASS_AUTH === 'true') {
      alert(`Modo Bypass: correo simulado a ${emails.join(', ')}`);
      return;
    }
    try {
      const { sendEmailGraphAPI } = await import('../utils/api');
      const { generarCuerpoCorreoActividad, asuntoCorreoActividad } = await import('../utils/mailTemplate');
      const subject = asuntoCorreoActividad(actividad.codigoCompleto);
      const body = generarCuerpoCorreoActividad({
        nombre: actividad.nombre,
        descripcion: actividad.descripcion,
        codigo: actividad.codigoCompleto,
        fechaLimite: actividad.fechaLimite,
        actividadId: actividad.id
      });
      await sendEmailGraphAPI(emails, subject, body);
      alert(`Notificación enviada con éxito a: ${emails.join(', ')}`);
    } catch (err: any) {
      console.error("Error enviando notificación:", err);
      alert(`Error enviando correo por Microsoft Graph: ${err.message || err}`);
    }
  };

  const handleAdminSaveEdits = async () => {
    try {
      const previousEmails: string[] = (actividad.correosNotificacion || []).map((e: string) => e.trim()).filter(Boolean);
      const newEmails: string[] = (editData.correosNotificacion || '').split(',').map((e: string) => e.trim()).filter(Boolean);
      const addedEmails = newEmails.filter((e: string) => !previousEmails.includes(e));

      await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades/${actividad.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      
      // Update local object to reflect changes immediately
      actividad.nombre = editData.nombre;
      actividad.codigoCompleto = editData.codigoCompleto;
      actividad.descripcion = editData.descripcion;
      actividad.fechaLimite = editData.fechaLimite;
      actividad.fechaInicio = editData.fechaInicio;
      actividad.correosNotificacion = newEmails;
      
      // Enviar correo si se agregaron nuevos responsables
      if (addedEmails.length > 0) {
        if (import.meta.env.VITE_BYPASS_AUTH === 'true') {
          console.log("Modo Bypass Activo. Se omite el envio de correo por Microsoft Graph API.");
          alert(`Actividad guardada. (Modo Bypass: correo simulado para ${addedEmails.join(', ')})`);
        } else {
          try {
            const { sendEmailGraphAPI } = await import('../utils/api');
            const { generarCuerpoCorreoActividad, asuntoCorreoActividad } = await import('../utils/mailTemplate');
            const subject = asuntoCorreoActividad(editData.codigoCompleto || actividad.codigoCompleto);
            const body = generarCuerpoCorreoActividad({
              nombre: editData.nombre || actividad.nombre,
              descripcion: editData.descripcion !== undefined ? editData.descripcion : actividad.descripcion,
              codigo: editData.codigoCompleto || actividad.codigoCompleto,
              fechaLimite: editData.fechaLimite || actividad.fechaLimite,
              actividadId: actividad.id
            });
            await sendEmailGraphAPI(addedEmails, subject, body);
            alert(`Actividad guardada y correo de notificación enviado con éxito a: ${addedEmails.join(', ')}`);
          } catch (mailErr: any) {
            console.error("No se pudo enviar el correo de notificación:", mailErr);
            alert(`La actividad se actualizó en la base de datos, pero hubo un error enviando el correo por Microsoft Graph: ${mailErr.message || mailErr}`);
          }
        }
      }

      setEditando(false);
      onRefresh();
    } catch(err: any) {
      console.error(err);
      alert(`Error guardando actividad: ${err.message || err}`);
    }
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
       // 1. Subir evidencia
       const formData = new FormData();
       formData.append('archivo', evidenciaEstado);
       formData.append('tipoEvidencia', 'documento');
       formData.append('localidadId', asigActual.localidadId);
       formData.append('descripcion', 'Soporte de cambio de estado');
       formData.append('comentarioAdjunto', comentarioEstado);

       await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/evidencias/upload/${actividad.id}`, {
         method: 'POST',
         body: formData
       });

       // 2. Subir Comentario (aunque el upload ya crea uno, creamos este para ser explícitos sobre el cambio de estado)
       await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades/${actividad.id}/comentarios`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            texto: `[Cambio de Estado a ${estadoPendiente.replace(/_/g, ' ')}]`,
            localidadId: asigActual.localidadId
         })
       });

       // 3. Cambiar estado local
       await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades/asignacion/${asigActual.id}/estadoLocal`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ estadoLocal: estadoPendiente })
       });
       
       setEstadoPendiente(null);
       setComentarioEstado('');
       setEvidenciaEstado(null);
       setProcesandoEstado(false);
       onRefresh();
       setTab('evidencias_comentarios'); // Ir a la tab unificada para ver el éxito
     } catch(err) { console.error(err); setProcesandoEstado(false); }
  };

  const handleUpdateEstadoValidacion = async (estadoValidacion: string) => {
    if (!asigActual) return;
    try {
      await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades/asignacion/${asigActual.id}/estadoValidacion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl flex flex-col h-[85vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 rounded-t-xl">
          <div>
             <span className="text-xs font-bold text-bogota-primary bg-bogota-primary/10 px-2 py-1 rounded inline-block mb-2">
                 {actividad.codigoCompleto || 'SIN CODIGO'}
             </span>
             {editando ? (
                <div className="flex flex-col gap-2 w-full mt-2 pr-6">
                  <label className="text-xs font-bold text-gray-500 uppercase">Codigo/Numeracion</label>
                  <input type="text" className="w-full text-sm font-bold border rounded p-1 outline-none mb-2" value={editData.codigoCompleto} onChange={e => setEditData({...editData, codigoCompleto: e.target.value})} />
                  
                  <label className="text-xs font-bold text-gray-500 uppercase">Titulo de la actividad</label>
                  <input type="text" className="w-full text-lg font-bold border rounded p-1 outline-none" value={editData.nombre} onChange={e => setEditData({...editData, nombre: e.target.value})} />
                  
                  <label className="text-xs font-bold text-gray-500 uppercase mt-2">Reclasificar en Ruta/Aspiracion</label>
                  <select className="w-full border rounded p-1 text-sm outline-none" value={editData.hitoId} onChange={e => setEditData({...editData, hitoId: e.target.value})}>
                     {getHitosPlano().map(h => (
                        <option key={h.id} value={h.id}>{h.nombre}</option>
                     ))}
                  </select>
                  
                  <label className="text-xs font-bold text-gray-500 uppercase mt-2">Responsables a Notificar (Correos separados por coma)</label>
                  <input type="text" className="w-full text-sm border rounded p-1 outline-none mb-2" value={editData.correosNotificacion} onChange={e => setEditData({...editData, correosNotificacion: e.target.value})} placeholder="admin@gobierno.gov.co, alcalde@bogota.gov.co" />
                </div>
               ) : (
                <h2 className="text-2xl font-bold text-gray-800 leading-tight">{actividad.nombre}</h2>
               )}
             <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
               <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> Limite: {actividad.fechaLimite ? new Date(actividad.fechaLimite).toLocaleDateString() : 'Sin Fecha'}</span>
                 <span className="flex items-center gap-1 bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full text-xs ml-4 border border-blue-200">
                   Creado por: {actividad.nombreCreador || (actividad.creadoPor === 'SYSTEM' ? 'Sistema / Importaci�n' : 'Usuario Desconocido')}
                 </span>
               <span className="flex items-center gap-1">
                 {actividad.estado === 'COMPLETADA' ? <CheckCircle2 className="w-4 h-4 text-green-500"/> : <Clock className="w-4 h-4 text-orange-500"/>}
                 <span className="font-medium text-gray-700">{actividad.estado}</span>
               </span>
             </div>
          </div>
           <div className="flex items-center gap-2 ml-4">
            {esAdmin && !editando && (
              <>
                <button onClick={() => setEditando(true)} className="bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-orange-700 font-bold shadow-sm">Editar</button>
                <button onClick={handleDeleteActividad} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-800 font-bold shadow-sm">Eliminar</button>
              </>
            )}
            {esAdmin && editando && (
              <>
                <button onClick={() => setEditando(false)} className="text-gray-600 font-bold text-xs hover:underline">Cancelar</button>
                <button onClick={handleAdminSaveEdits} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 font-bold shadow-sm">Guardar</button>
              </>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {asignacionesOrdenadas.length > 1 && (
          <div className="bg-gray-100 px-6 py-2 border-b border-gray-200 flex items-center justify-between">
             <span className="text-sm font-bold text-gray-700">Seleccionar Localidad:</span>
             <select 
               value={locSelected} 
               onChange={e => setLocSelected(e.target.value)}
               className="border border-gray-300 rounded px-2 py-1 text-sm bg-white font-medium outline-none focus:ring-2 focus:ring-bogota-primary/30"
             >
               {asignacionesOrdenadas.map((a: any) => (
                 <option key={a.id} value={a.localidadId}>{a.localidad?.nombre} ({a.estadoLocal === 'COMPLETADA_LOCAL' ? 'Completado' : 'Abierto'})</option>
               ))}
             </select>
          </div>
        )}

        {esAdmin && (
          <div className="bg-orange-50 px-6 py-3 border-b border-orange-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-orange-800">Caja de Auditoría (ADMIN):</span>
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
           <button 
             onClick={() => setTab('detalles')} 
             className={`pb-3 pt-2 font-medium mr-8 border-b-2 transition-colors ${tab === 'detalles' ? 'border-bogota-primary text-bogota-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
           >
             Detalles
           </button>
           <button 
             onClick={() => setTab('evidencias_comentarios')} 
             className={`pb-3 pt-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === 'evidencias_comentarios' ? 'border-bogota-primary text-bogota-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
           >
             <Paperclip className="w-4 h-4"/> Evidencias y Comentarios ({evidenciasAMostrar.length + comentariosAMostrar.length})
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
                      <p className="font-medium">Inicio: {actividad.fechaInicio ? new Date(actividad.fechaInicio).toLocaleDateString() : 'N/A'}<br/>Limite: {actividad.fechaLimite ? new Date(actividad.fechaLimite).toLocaleDateString() : 'N/A'}</p>
                    )}
                 </div>
                 <div className="col-span-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 pb-2">
                       <div>
                          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                             <span>👤</span> Responsables Asignados
                             <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                                {actividad.correosNotificacion?.length || 0}
                             </span>
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">Puedes asignar uno o varios responsables; puedes agregar o quitar en cualquier momento.</p>
                       </div>
                       {actividad.correosNotificacion?.length > 0 && (
                          <button
                             type="button"
                             onClick={handleReenviarNotificacion}
                             className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors w-fit"
                             title="Enviar correo de notificación oficial por Microsoft a todos los responsables asignados"
                          >
                             ✉️ Reenviar Notificación a Todos
                          </button>
                       )}
                    </div>

                    {/* Chips de Responsables Asignados */}
                    <div className="flex flex-wrap gap-2 items-center min-h-[32px]">
                       {actividad.correosNotificacion && actividad.correosNotificacion.length > 0 ? (
                          actividad.correosNotificacion.map((email: string) => (
                             <div 
                                key={email} 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 shadow-2xs transition-colors"
                             >
                                <span className="w-5 h-5 rounded-full bg-bogota-primary text-white flex items-center justify-center text-[10px] font-bold">
                                   {email[0]?.toUpperCase()}
                                </span>
                                <span className="font-medium text-gray-800">{email}</span>
                                <button
                                   type="button"
                                   disabled={guardandoResponsables}
                                   onClick={() => handleQuitarResponsable(email)}
                                   className="ml-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full w-5 h-5 inline-flex items-center justify-center text-sm font-bold transition-colors"
                                   title={`Quitar a ${email}`}
                                >
                                   ✕
                                </button>
                             </div>
                          ))
                       ) : (
                          <div className="text-sm text-gray-400 italic py-1">
                             No hay responsables asignados actualmente.
                          </div>
                       )}
                    </div>

                    {/* Barra para agregar responsable */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-gray-100 bg-gray-50/50 p-2.5 rounded-lg">
                       <div className="relative flex-1">
                          <input 
                             type="text" 
                             list="sugerencias-usuarios-responsables"
                             value={nuevoResponsableInput}
                             onChange={e => setNuevoResponsableInput(e.target.value)}
                             onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAgregarResponsable(); } }}
                             placeholder="Escribe correo o usuario (ej: roberto.parra@gobiernobogota.gov.co)..."
                             disabled={guardandoResponsables}
                             className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-bogota-primary/30 bg-white"
                          />
                          <datalist id="sugerencias-usuarios-responsables">
                             {usuariosSistema.map(u => (
                                <option key={u.id} value={u.email}>{u.nombre} ({u.email})</option>
                             ))}
                          </datalist>
                       </div>
                       <button
                          type="button"
                          disabled={guardandoResponsables || !nuevoResponsableInput.trim()}
                          onClick={() => handleAgregarResponsable()}
                          className="bg-bogota-primary hover:bg-red-800 disabled:opacity-50 text-white text-xs px-4 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                       >
                          {guardandoResponsables ? 'Guardando...' : '+ Asignar Responsable'}
                       </button>
                    </div>
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

          {tab === 'evidencias_comentarios' && (
            <div className="space-y-6">
              {/* Formulario para cargar soporte y evidencia obligatoria */}
              {!isReadonly && (
                <div className="border border-red-100 bg-red-50/40 p-4 rounded-xl flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-bogota-primary" /> Cargar Nueva Evidencia y Justificación
                    </h3>
                    <span className="text-[11px] font-semibold text-bogota-primary bg-red-100/70 px-2 py-0.5 rounded">
                      {asigActual?.localidad?.nombre || 'General'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Al cargar un soporte es <strong>obligatorio</strong> incluir una justificación o comentario sobre la evidencia. Se registrará automáticamente en el hilo con fecha y hora, y se notificará por correo.
                  </p>
                  
                  <form onSubmit={handleFileUpload} className="flex flex-col gap-3">
                    <textarea 
                      required 
                      placeholder="Escribe el comentario obligatorio sobre la evidencia o avance ejecutado..."
                      className="w-full border border-gray-300 rounded-lg p-2.5 outline-none text-sm h-20 resize-none focus:ring-2 focus:ring-bogota-primary/30 bg-white"
                      value={comentarioEvidencia}
                      onChange={e => setComentarioEvidencia(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-3 items-center justify-between">
                      <input 
                        required 
                        type="file" 
                        className="text-xs border border-gray-300 p-1.5 rounded bg-white w-full sm:max-w-xs cursor-pointer"
                        onChange={e => setEvidenciaFile(e.target.files ? e.target.files[0] : null)}
                      />
                      <button 
                        type="submit" 
                        disabled={uploading || !evidenciaFile || !comentarioEvidencia.trim()} 
                        className="bg-bogota-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 inline-flex items-center gap-1.5 shadow"
                      >
                        {uploading ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Subiendo y Notificando...
                          </>
                        ) : (
                          <>
                            <Paperclip className="w-3.5 h-3.5" />
                            Subir Archivo y Notificar
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Vista dividida: Archivos cargados e Hilo de conversación/chat */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Columna Izquierda: Archivos y Soportes */}
                <div className="flex flex-col border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-bogota-primary" />
                      Archivos Cargados ({evidenciasAMostrar.length})
                    </h4>
                    <span className="text-xs text-gray-500 font-medium">{asigActual?.localidad?.nombre || 'General'}</span>
                  </div>

                  {evidenciasAMostrar.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">
                      Sin archivos adjuntos en el expediente de esta localidad.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {evidenciasAMostrar.map((ev: any) => {
                        const statusColor = 
                          ev.prechequeoEstado === 'APTO' ? 'bg-green-100 text-green-800 border-green-200' :
                          ev.prechequeoEstado === 'NO_APTO' ? 'bg-red-100 text-red-800 border-red-200' :
                          ev.prechequeoEstado === 'DUDOSO' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-gray-100 text-gray-800 border-gray-200';
                        
                        const fileUrl = ev.urlArchivo?.startsWith('http') 
                          ? ev.urlArchivo 
                          : `${(import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '')}${ev.urlArchivo}`;

                        return (
                          <div key={ev.id} className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 min-w-0">
                                <div className="p-1.5 bg-red-50 text-bogota-primary rounded shrink-0">
                                  <Paperclip className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-xs text-gray-800 truncate" title={ev.nombreArchivo}>
                                    {ev.nombreArchivo}
                                  </p>
                                  <p className="text-[11px] text-gray-400">
                                    Subido: {new Date(ev.fechaSubida).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                                  </p>
                                </div>
                              </div>
                              <a 
                                href={fileUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-bogota-primary text-xs font-bold hover:underline shrink-0 px-2 py-0.5 bg-red-50 rounded"
                              >
                                Ver
                              </a>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                                Pre-chequeo IA: {ev.prechequeoEstado || 'PENDIENTE'}
                              </span>
                              {!ev.prechequeoEstado && (
                                <button 
                                  onClick={async () => {
                                    try {
                                      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/ia/evidencias/prechequear`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ evidenciaId: ev.id })
                                      });
                                      if (res.ok) {
                                        alert("Análisis de evidencia completado. Por favor recarga el detalle para ver los resultados.");
                                        onRefresh();
                                      } else {
                                        alert("No se pudo iniciar el pre-chequeo. Asegúrate de configurar la clave de API.");
                                      }
                                    } catch(e) {
                                      console.error(e);
                                    }
                                  }}
                                  className="text-[10px] bg-purple-700 hover:bg-purple-800 text-white font-bold py-0.5 px-2 rounded transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  <Sparkles className="w-3 h-3"/>
                                  Analizar IA
                                </button>
                              )}
                            </div>

                            {ev.prechequeoFeedback && (
                              <div className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 flex flex-col gap-0.5">
                                <p className="font-bold flex items-center gap-1 text-gray-800">
                                  <Sparkles className="w-3 h-3 text-purple-700"/> Diagnóstico IA ({ev.prechequeoPuntaje || 0}% coherencia):
                                </p>
                                <p className="text-gray-600">{ev.prechequeoFeedback}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Columna Derecha: Hilo de Comentarios y Chat */}
                <div className="flex flex-col border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex-1">
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-bogota-primary" />
                      Hilo de Chat ({comentariosAMostrar.length})
                    </h4>
                    <span className="text-xs text-gray-500 font-medium">Con fecha y hora</span>
                  </div>

                  {/* Lista de comentarios */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[310px] min-h-[160px]">
                    {comentariosAMostrar.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-xs">
                        No hay comentarios en el hilo de esta localidad.
                      </div>
                    ) : (
                      comentariosAMostrar.map((c: any) => {
                        const esEvidencia = c.texto?.startsWith('📎 Evidencia adjunta:');
                        const esCreadorOAdmin = c.autorId === (actividad.creadoPor || 'admin-mock-id');
                        return (
                          <div 
                            key={c.id} 
                            className={`p-3 rounded-xl text-xs border ${
                              esEvidencia 
                                ? 'bg-amber-50/70 border-amber-200' 
                                : esCreadorOAdmin 
                                  ? 'bg-blue-50/80 border-blue-100 ml-2' 
                                  : 'bg-white border-gray-200 mr-2'
                            }`}
                          >
                            <div className="flex justify-between items-baseline mb-1 gap-2">
                              <span className={`font-bold ${esCreadorOAdmin ? 'text-blue-700' : 'text-bogota-primary'}`}>
                                {c.autor?.nombre || 'Usuario'}
                              </span>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                {new Date(c.fechaCreacion).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{c.texto}</p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Redactar comentario rápido */}
                  {!isReadonly ? (
                    <form onSubmit={handlePostComment} className="flex gap-2 pt-3 border-t mt-3">
                      <input 
                        type="text" 
                        value={nuevoComentario}
                        onChange={e => setNuevoComentario(e.target.value)}
                        placeholder="Escribe un comentario..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-bogota-primary/30 bg-white"
                      />
                      <button 
                        disabled={postingComment || !nuevoComentario.trim()} 
                        type="submit" 
                        className="bg-bogota-primary text-white p-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
                        title="Enviar comentario y notificar"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <div className="pt-2 border-t mt-3 text-center text-xs font-bold text-gray-400 bg-gray-100 p-2 rounded-lg">
                      Hilo de chat bloqueado. La actividad ya fue validada.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
