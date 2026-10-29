import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, X, MessageSquare, Paperclip, CheckCircle2, Clock, Calendar, FileText, Send, Sparkles, ExternalLink } from 'lucide-react';
import { fetchApi } from '../utils/api';

interface Props {
  actividad: any;
  onClose: () => void;
  onRefresh: () => void;
  userData?: any;
}

export default function ModalDetalleActividad({ actividad, onClose, onRefresh, userData }: Props) {
  const esAdmin = userData?.rol === 'ADMIN';
  
  let asignacionesOrdenadas = [...(actividad.asignaciones || [])].sort((a: any, b: any) => (a.localidad?.nombre || '').localeCompare(b.localidad?.nombre || ''));
  if (userData?.rol === 'GESTOR' && userData.localidadesAsignadas && userData.localidadesAsignadas.length > 0) {
      const filtradas = asignacionesOrdenadas.filter((a: any) => userData.localidadesAsignadas?.includes(a.localidadId));
      if (filtradas.length > 0) {
        asignacionesOrdenadas = filtradas;
      }
  }
  
  const [tab, setTab] = useState<'detalles' | 'evidencias_comentarios'>('detalles');
  const [locSelected, setLocSelected] = useState<string>(asignacionesOrdenadas[0]?.localidadId || actividad.asignaciones?.[0]?.localidadId || '');
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
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // Límite estricto: 10 Megabytes máximo
  const SHAREPOINT_ROLLOS_URL = 'https://gobiernobogota.sharepoint.com/:f:/s/Prueba939/IgBdPBai3S26Q6YqovlhsXgWAaA-7XazLIooMvRu_6M6McA?e=WYlxko';

  const [comentarioEvidencia, setComentarioEvidencia] = useState('');
  const [evidenciaFile, setEvidenciaFile] = useState<File | null>(null);
  const [modalArchivoPesado, setModalArchivoPesado] = useState<{
    nombre: string;
    pesoMB: string;
  } | null>(null);
  const [estadoAlSubir, setEstadoAlSubir] = useState<string>('EN_CURSO_SIN_VALIDAR');
  const [confirmModalData, setConfirmModalData] = useState<{
    tipo: 'estadoLocal' | 'estadoValidacion';
    nuevoValor: string;
    label: string;
  } | null>(null);

  const [nuevoResponsableInput, setNuevoResponsableInput] = useState('');
  const [guardandoResponsables, setGuardandoResponsables] = useState(false);
  const [usuariosSistema, setUsuariosSistema] = useState<any[]>([]);
  const [listaResponsables, setListaResponsables] = useState<string[]>(actividad.correosNotificacion || []);

  useEffect(() => {
    if (actividad?.correosNotificacion) {
      setListaResponsables(actividad.correosNotificacion);
    }
  }, [actividad?.correosNotificacion]);

  useEffect(() => {
    fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/auth/usuarios`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsuariosSistema(data);
      })
      .catch(() => {});
  }, []);

  // Opción B: Si el usuario accede a través del link (o al abrir la actividad), auto-promover a GESTOR y sumarlo a correosNotificacion
  useEffect(() => {
    if (actividad?.id) {
      fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades/${actividad.id}/acceder-enlace`, {
        method: 'POST'
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.ok) {
            if (data.rol && userData && userData.rol !== data.rol) {
              userData.rol = data.rol;
            }
            if (data.localidadesAgregadas && userData?.localidadesAsignadas) {
              data.localidadesAgregadas.forEach((locId: string) => {
                if (!userData.localidadesAsignadas.includes(locId)) {
                  userData.localidadesAsignadas.push(locId);
                }
              });
            }
            if (data.correosNotificacion && Array.isArray(data.correosNotificacion)) {
              actividad.correosNotificacion = data.correosNotificacion;
              setListaResponsables(data.correosNotificacion);
              setEditData(prev => ({
                ...prev,
                correosNotificacion: data.correosNotificacion.join(', ')
              }));
              onRefresh();
            }
          }
        })
        .catch(() => {});
    }
  }, [actividad?.id]);

  const curLocId = locSelected || asignacionesOrdenadas[0]?.localidadId || actividad.asignaciones?.[0]?.localidadId || '';
  const asigActual = asignacionesOrdenadas.find((a: any) => a.localidadId === curLocId) || actividad.asignaciones?.find((a: any) => a.localidadId === curLocId) || actividad.asignaciones?.[0];
  
  useEffect(() => {
    const defaultLoc = asignacionesOrdenadas[0]?.localidadId || actividad.asignaciones?.[0]?.localidadId || '';
    if (!locSelected && defaultLoc) {
      setLocSelected(defaultLoc);
    }
  }, [actividad, asignacionesOrdenadas, locSelected]);

  const comentariosAMostrar = curLocId 
    ? actividad.comentarios?.filter((c: any) => !c.localidadId || c.localidadId === curLocId) || []
    : actividad.comentarios || [];
  const evidenciasAMostrar = curLocId 
    ? actividad.evidencias?.filter((e: any) => !e.localidadId || e.localidadId === curLocId) || []
    : actividad.evidencias || [];

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
    const effectiveLocId = curLocId || asigActual?.localidadId || actividad.asignaciones?.[0]?.localidadId || '';
    try {
      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades/${actividad.id}/comentarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ texto: textoParaEnviar, localidadId: effectiveLocId || undefined })
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

    if (evidenciaFile.size > MAX_FILE_SIZE_BYTES) {
      const pesoMB = (evidenciaFile.size / (1024 * 1024)).toFixed(1);
      setModalArchivoPesado({ nombre: evidenciaFile.name, pesoMB });
      return;
    }

    const effectiveLocId = curLocId || asigActual?.localidadId || actividad.asignaciones?.[0]?.localidadId || '';

    const formData = new FormData();
    formData.append('archivo', evidenciaFile);
    formData.append('tipoEvidencia', 'documento');
    formData.append('descripcion', 'Subida local manual');
    formData.append('comentarioAdjunto', comentarioEvidencia.trim());
    if (effectiveLocId) {
      formData.append('localidadId', effectiveLocId);
    }
    formData.append('nuevoEstado', estadoAlSubir);

    setUploading(true);
    try {
      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/evidencias/upload/${actividad.id}`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
         const d = await res.json().catch(() => ({}));
         throw new Error(d.detalles ? `${d.error}: ${d.detalles}` : (d.error || 'Error subiendo archivo'));
      }

      const nombreArchivoSubido = evidenciaFile.name;
      const comentarioTexto = comentarioEvidencia.trim();

      // Enviar notificación oficial por correo con el soporte adjunto
      await enviarNotificacionComentario(comentarioTexto, nombreArchivoSubido);

      setComentarioEvidencia('');
      setEvidenciaFile(null);
      const estadoLabel = estadoAlSubir === 'COMPLETA_SIN_VALIDAR' ? 'Completada' : estadoAlSubir === 'EN_CURSO_SIN_VALIDAR' ? 'En Curso' : 'Sin iniciar';
      alert(`Evidencia cargada con éxito, registrada en el hilo de comentarios y estado de actividad actualizado a "${estadoLabel}".`);
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
      setListaResponsables(updatedList);
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
      setListaResponsables(updatedList);
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

  const handleUpdateEstadoLocal = async (estadoLocal: string, forzarAdmin = false) => {
    if (!asigActual) return;

    const tieneEvidencias = (evidenciasAMostrar && evidenciasAMostrar.length > 0) || (actividad.evidencias && actividad.evidencias.length > 0);

    // Si no tiene evidencias cargadas
    if (!tieneEvidencias && !forzarAdmin) {
      if (!esAdmin) {
        alert('Para cambiar el estado de la actividad es imperativo cargar un documento de soporte y registrar un comentario de avance en la sección de Evidencias y Comentarios.');
        setTab('evidencias_comentarios');
        return;
      }

      // Si es Administrador, pedir confirmación obligatoria
      const label = estadoLocal === 'COMPLETA_SIN_VALIDAR' ? 'Completada' :
                    estadoLocal === 'EN_CURSO_SIN_VALIDAR' ? 'En Curso' : 'Sin iniciar';
      setConfirmModalData({
        tipo: 'estadoLocal',
        nuevoValor: estadoLocal,
        label
      });
      return;
    }

    try {
      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades/asignacion/${asigActual.id}/estadoLocal`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          estadoLocal,
          confirmarSinEvidencias: forzarAdmin
        })
      });
      if (res.ok) {
        setConfirmModalData(null);
        onRefresh();
      } else {
        const d = await res.json().catch(() => ({}));
        if (d.error === 'REQUIRES_ADMIN_CONFIRMATION') {
          const label = estadoLocal === 'COMPLETA_SIN_VALIDAR' ? 'Completada' :
                        estadoLocal === 'EN_CURSO_SIN_VALIDAR' ? 'En Curso' : 'Sin iniciar';
          setConfirmModalData({
            tipo: 'estadoLocal',
            nuevoValor: estadoLocal,
            label
          });
        } else {
          alert(d.error || 'Error actualizando estado');
        }
      }
    } catch(err: any) {
      console.error(err);
      alert(err.message || 'Error de conexión');
    }
  };

  const handleUpdateEstadoValidacion = async (estadoValidacion: string, forzarAdmin = false) => {
    if (!asigActual) return;

    const tieneEvidencias = (evidenciasAMostrar && evidenciasAMostrar.length > 0) || (actividad.evidencias && actividad.evidencias.length > 0);

    // Si se valida con avance o completada y no hay evidencias, pedir confirmación
    if (!tieneEvidencias && !forzarAdmin && (estadoValidacion === 'VALIDADA_COMPLETADA' || estadoValidacion === 'VALIDADA_EN_CURSO')) {
      const label = getEstadoValidacionLabel(estadoValidacion);
      setConfirmModalData({
        tipo: 'estadoValidacion',
        nuevoValor: estadoValidacion,
        label
      });
      return;
    }

    try {
      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades/asignacion/${asigActual.id}/estadoValidacion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          estadoValidacion,
          confirmarSinEvidencias: forzarAdmin
        })
      });
      if (res.ok) {
        setConfirmModalData(null);
        onRefresh();
      } else {
        const d = await res.json().catch(() => ({}));
        if (d.error === 'REQUIRES_ADMIN_CONFIRMATION') {
          const label = getEstadoValidacionLabel(estadoValidacion);
          setConfirmModalData({
            tipo: 'estadoValidacion',
            nuevoValor: estadoValidacion,
            label
          });
        } else {
          alert(d.error || 'Error actualizando estado de validación');
        }
      }
    } catch(err: any) { 
      console.error(err); 
      alert(err.message || 'Error de conexión');
    }
  };

  const handleEjecutarConfirmacionAdmin = () => {
    if (!confirmModalData) return;
    if (confirmModalData.tipo === 'estadoLocal') {
      handleUpdateEstadoLocal(confirmModalData.nuevoValor, true);
    } else if (confirmModalData.tipo === 'estadoValidacion') {
      handleUpdateEstadoValidacion(confirmModalData.nuevoValor, true);
    }
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
          <div className="bg-orange-50 px-6 py-3 border-b border-orange-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-orange-800">Caja de Auditoría (ADMIN):</span>
              <span className="text-xs text-orange-700">Localidad: <strong>{asigActual?.localidad?.nombre || 'General'}</strong></span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600 uppercase">Estado de Validación:</span>
              <select 
                value={asigActual?.estadoValidacion || 'PENDIENTE_REVISION'}
                onChange={e => handleUpdateEstadoValidacion(e.target.value)}
                className={`border text-sm font-bold px-3 py-1.5 rounded outline-none cursor-pointer ${
                  asigActual?.estadoValidacion === 'VALIDADA_COMPLETADA' ? 'bg-green-100 text-green-800 border-green-200' :
                  asigActual?.estadoValidacion === 'VALIDADA_EN_CURSO' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                  asigActual?.estadoValidacion === 'VALIDADA_SIN_AVANCE' ? 'bg-red-100 text-red-800 border-red-200' :
                  'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="PENDIENTE_REVISION">Pendiente de Revisión</option>
                <option value="VALIDADA_COMPLETADA">Validada y Completada (100% puntaje)</option>
                <option value="VALIDADA_EN_CURSO">Validada en Curso (50% puntaje)</option>
                <option value="VALIDADA_SIN_AVANCE">Validada Sin Avance (0% puntaje)</option>
              </select>
            </div>
          </div>
        )}

        {/* Banner de estado de la actividad / reporte */}
        <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-blue-900">Estado de la Actividad ({asigActual?.localidad?.nombre || 'General'})</span>
            <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
              <span>Validación Admin: <strong className="underline">{getEstadoValidacionLabel(asigActual?.estadoValidacion || 'PENDIENTE_REVISION')}</strong></span>
              {asigActual && (
                <span className="font-bold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded">
                  Calificación: {asigActual.porcentajeAvance ?? 0}% de {actividad.indicadorMeta || 0}%
                </span>
              )}
            </div>
          </div>

          {isReadonly ? (
            <div className="text-xs font-bold text-green-800 bg-green-100 px-3 py-1.5 rounded-full border border-green-200">
              ✓ Validada y Completada (Solo Lectura)
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600 uppercase">Estado:</span>
              {evidenciasAMostrar.length > 0 ? (
                <select 
                  value={asigActual?.estadoLocal || 'NO_INICIADA'}
                  onChange={e => handleUpdateEstadoLocal(e.target.value)}
                  className={`border text-sm font-bold px-3 py-1.5 rounded outline-none transition-colors cursor-pointer ${
                    asigActual?.estadoLocal === 'COMPLETA_SIN_VALIDAR' ? 'bg-green-100 text-green-800 border-green-200' :
                    asigActual?.estadoLocal === 'EN_CURSO_SIN_VALIDAR' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  <option value="NO_INICIADA">Sin iniciar</option>
                  <option value="EN_CURSO_SIN_VALIDAR">En Curso</option>
                  <option value="COMPLETA_SIN_VALIDAR">Completada</option>
                </select>
              ) : esAdmin ? (
                <div className="flex items-center gap-2">
                  <select 
                    value={asigActual?.estadoLocal || 'NO_INICIADA'}
                    onChange={e => handleUpdateEstadoLocal(e.target.value)}
                    className="border text-sm font-bold px-3 py-1.5 rounded outline-none transition-colors cursor-pointer bg-white text-gray-700 border-gray-300"
                  >
                    <option value="NO_INICIADA">Sin iniciar</option>
                    <option value="EN_CURSO_SIN_VALIDAR">En Curso</option>
                    <option value="COMPLETA_SIN_VALIDAR">Completada</option>
                  </select>
                  <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1" title="Esta actividad no tiene evidencias registradas">
                    ⚠️ Sin evidencias (Requiere confirmación)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select 
                    disabled 
                    value={asigActual?.estadoLocal || 'NO_INICIADA'}
                    className="border text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                    title="Carga un archivo de evidencia con su comentario obligatorio para habilitar el cambio de estado"
                  >
                    <option value="NO_INICIADA">Sin iniciar</option>
                    <option value="EN_CURSO_SIN_VALIDAR">En Curso</option>
                    <option value="COMPLETA_SIN_VALIDAR">Completada</option>
                  </select>
                  <button 
                    type="button"
                    onClick={() => setTab('evidencias_comentarios')}
                    className="text-[11px] text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    title="Haz clic para ir a Evidencias y Comentarios"
                  >
                    🔒 Carga evidencia + comentario para habilitar cambio
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
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
                                {listaResponsables?.length || 0}
                             </span>
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">Puedes asignar uno o varios responsables; puedes agregar o quitar en cualquier momento.</p>
                       </div>
                       {listaResponsables && listaResponsables.length > 0 && (
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
                       {listaResponsables && listaResponsables.length > 0 ? (
                          listaResponsables.map((email: string) => (
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
                    <div className="flex flex-wrap gap-3 items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-700">Cambiar estado a:</label>
                        <select 
                          value={estadoAlSubir} 
                          onChange={e => setEstadoAlSubir(e.target.value)} 
                          className="text-xs border border-gray-300 rounded px-2.5 py-1.5 font-bold bg-white text-gray-800 outline-none focus:ring-1 focus:ring-bogota-primary cursor-pointer"
                        >
                          <option value="EN_CURSO_SIN_VALIDAR">En Curso</option>
                          <option value="COMPLETA_SIN_VALIDAR">Completada</option>
                          <option value="NO_INICIADA">Sin iniciar</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          <input 
                            required 
                            type="file" 
                            className="text-xs border border-gray-300 p-1.5 rounded bg-white w-full sm:max-w-xs cursor-pointer"
                            onChange={e => {
                              const file = e.target.files ? e.target.files[0] : null;
                              if (file && file.size > MAX_FILE_SIZE_BYTES) {
                                const pesoMB = (file.size / (1024 * 1024)).toFixed(1);
                                setModalArchivoPesado({ nombre: file.name, pesoMB });
                                e.target.value = '';
                                setEvidenciaFile(null);
                                return;
                              }
                              setEvidenciaFile(file);
                            }}
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
                                Subir Soporte y Actualizar Estado
                              </>
                            )}
                          </button>
                        </div>

                        {/* Banner recordatorio de límite de 10 MB y SharePoint */}
                        <div className="flex items-start gap-2 bg-blue-50/80 border border-blue-200/80 rounded-lg p-2.5 text-[11px] text-blue-900 leading-relaxed">
                          <ExternalLink className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Límite de adjuntos: 10 MB.</span> Si tu archivo pesa más de 10 MB (videos, carpetas comprimidas, presentaciones pesadas), cárgalo directamente en el SharePoint institucional en la carpeta oficial{' '}
                            <a 
                              href={SHAREPOINT_ROLLOS_URL} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="font-bold text-bogota-primary underline hover:text-red-800 inline-flex items-center gap-0.5 ml-1"
                            >
                              📁 ROLLOS 2026 ↗
                            </a>. Luego toma una captura de pantalla donde se visualice el cargue y adjúntala aquí junto con tu comentario.
                          </div>
                        </div>
                      </div>
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

                            {esAdmin && (
                              <>
                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                                    Pre-chequeo IA: {ev.prechequeoEstado || 'PENDIENTE'}
                                  </span>
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
                                </div>

                                {ev.prechequeoFeedback && (
                                  <div className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 flex flex-col gap-0.5">
                                    <p className="font-bold flex items-center gap-1 text-gray-800">
                                      <Sparkles className="w-3 h-3 text-purple-700"/> Diagnóstico IA ({ev.prechequeoPuntaje || 0}% coherencia):
                                    </p>
                                    <p className="text-gray-600">{ev.prechequeoFeedback}</p>
                                  </div>
                                )}
                              </>
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

      {/* Modal de confirmación para Administrador al cambiar estado sin evidencias */}
      {confirmModalData && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-4 border border-amber-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-100 rounded-full text-amber-700 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  ¿Confirmar cambio sin evidencias?
                </h3>
                <p className="text-xs text-amber-800 font-semibold mt-0.5">
                  Atención de Administrador
                </p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-3.5 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-2">
              <p>
                Esta actividad actualmente <strong>no cuenta con documentos de soporte ni comentarios de avance cargados</strong>.
              </p>
              <p className="text-gray-800 font-medium">
                ¿Como <strong>Administrador</strong>, estás seguro de cambiar el estado a <strong className="text-amber-950 bg-white px-2 py-0.5 rounded border border-amber-300 font-bold">"{confirmModalData.label}"</strong> sin evidencias registradas?
              </p>
            </div>

            <div className="flex justify-end items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalData(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEjecutarConfirmacionAdmin}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow transition"
              >
                Sí, cambiar sin evidencias
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Advertencia e Instrucciones para Archivo Pesado (> 10 MB) */}
      {modalArchivoPesado && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-blue-200">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">
                    Archivo superior a 10 MB ({modalArchivoPesado.pesoMB} MB)
                  </h3>
                  <p className="text-xs text-blue-700 font-semibold mt-0.5">
                    Límite máximo permitido excedido
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setModalArchivoPesado(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 text-xs text-amber-950 leading-relaxed">
              El archivo <strong className="font-bold underline">{modalArchivoPesado.nombre}</strong> pesa{' '}
              <strong>{modalArchivoPesado.pesoMB} MB</strong>, superando el límite de <strong>10 MB</strong> para subidas directas.
            </div>

            <div className="space-y-2.5 text-xs text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="font-bold text-gray-900 text-xs">
                Sigue estos pasos para adjuntar tu soporte oficial:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-gray-800">
                <li>
                  Ingresa a la carpeta oficial de SharePoint:{' '}
                  <a 
                    href={SHAREPOINT_ROLLOS_URL} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="font-bold text-bogota-primary underline hover:text-red-800 inline-flex items-center gap-1"
                  >
                    📁 ROLLOS 2026 <ExternalLink className="w-3 h-3 inline" />
                  </a>
                </li>
                <li>
                  Carga allí tu archivo pesado (video, carpeta comprimida zip, memorias o documentos extensos).
                </li>
                <li>
                  Toma una <strong>captura de pantalla</strong> donde se visualice claramente el cargue del archivo en dicha carpeta.
                </li>
                <li>
                  Carga dicha <strong>captura de pantalla</strong> aquí en el sistema acompañada de tu comentario de avance y el enlace.
                </li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row justify-end items-center gap-2 pt-2">
              <a
                href={SHAREPOINT_ROLLOS_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-white bg-bogota-primary hover:bg-red-700 rounded-lg shadow transition inline-flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Carpeta ROLLOS 2026
              </a>
              <button
                type="button"
                onClick={() => setModalArchivoPesado(null)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Entendido, subiré la captura
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
