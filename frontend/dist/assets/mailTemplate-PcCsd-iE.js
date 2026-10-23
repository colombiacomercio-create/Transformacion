const f=o=>`Asignación de Actividad - ${o||"Sistema RADAR"}`,c=({nombre:o,descripcion:e,codigo:s,fechaLimite:a,actividadId:i})=>{const t=i?`${window.location.origin}/#/actividad/${i}`:window.location.origin;let n="Sin fecha";if(a){const r=new Date(a);isNaN(r.getTime())||(n=`${r.getFullYear()}-${r.getMonth()+1}-${r.getDate()}`)}const d=e&&e.trim()?`<p style="margin: 0 0 10px 0; font-size: 14px; color: #111827;"><strong>Descripción:</strong> ${e.trim()}</p>`:"";return`
    <div style="font-family: Arial, Helvetica, sans-serif; color: #333333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <!-- Encabezado con Colores del Distrito (Rojo Bogotá y Franja Amarilla) -->
      <div style="background-color: #de0028; color: #ffffff; padding: 22px 20px; text-align: center; border-bottom: 4px solid #ffcd00;">
        <h2 style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">Unidad de Transformación</h2>
        <p style="margin: 6px 0 0; font-size: 13px; color: #ffcd00; font-weight: bold;">Sistema RADAR – Red de Articulación, Datos, Alertas y Resultados</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 16px; margin: 0 0 12px 0; color: #111827;">Hola,</p>
        <p style="font-size: 15px; margin: 0 0 18px 0; color: #374151;">Has sido asignado(a) como responsable de la siguiente actividad:</p>

        <div style="background-color: #fffdf5; border: 1px solid #fef3c7; border-left: 4px solid #de0028; border-radius: 4px; padding: 16px; margin: 0 0 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #111827;"><strong>Actividad:</strong> ${o}</p>
          ${d}
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #111827;"><strong>Código:</strong> ${s}</p>
          <p style="margin: 0; font-size: 14px; color: #111827;"><strong>Fecha Límite:</strong> ${n}</p>
        </div>

        <p style="font-size: 14px; color: #374151; margin: 0 0 24px 0;">
          Por favor ingresa a RADAR para revisar el detalle y gestionar los avances y evidencias correspondientes.
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${t}" style="background-color: #de0028; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; border-bottom: 3px solid #ffcd00;">
            Acceder a la Actividad en RADAR
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
          Este es un correo institucional automático emitido por el sistema RADAR - Unidad de Transformación.
        </p>
      </div>
    </div>
  `},g=(o,e)=>`Nuevo Comentario/Evidencia - [${o||"RADAR"}] ${e.substring(0,45)}`,x=({actividadNombre:o,codigo:e,autorNombre:s,comentario:a,localidadNombre:i,archivoAdjunto:t,actividadId:n})=>{const d=n?`${window.location.origin}/#/actividad/${n}`:window.location.origin,r=t&&t.trim()?`<p style="margin: 0 0 10px 0; font-size: 14px; color: #111827;"><strong>📎 Soporte / Archivo Adjunto:</strong> <span style="color: #de0028; font-weight: bold;">${t.trim()}</span></p>`:"",l=i?`<p style="margin: 0 0 10px 0; font-size: 14px; color: #111827;"><strong>Localidad:</strong> ${i}</p>`:"",p=new Date().toLocaleString("es-CO",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});return`
    <div style="font-family: Arial, Helvetica, sans-serif; color: #333333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <!-- Encabezado con Colores del Distrito (Rojo Bogotá y Franja Amarilla) -->
      <div style="background-color: #de0028; color: #ffffff; padding: 22px 20px; text-align: center; border-bottom: 4px solid #ffcd00;">
        <h2 style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">Unidad de Transformación</h2>
        <p style="margin: 6px 0 0; font-size: 13px; color: #ffcd00; font-weight: bold;">Sistema RADAR – Red de Articulación, Datos, Alertas y Resultados</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 16px; margin: 0 0 12px 0; color: #111827;">Hola,</p>
        <p style="font-size: 15px; margin: 0 0 18px 0; color: #374151;">Se ha registrado una nueva actualización o evidencia en la siguiente actividad:</p>

        <div style="background-color: #fffdf5; border: 1px solid #fef3c7; border-left: 4px solid #de0028; border-radius: 4px; padding: 16px; margin: 0 0 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #111827;"><strong>Actividad:</strong> ${o}</p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #111827;"><strong>Código:</strong> ${e}</p>
          ${l}
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #111827;"><strong>Registrado por:</strong> ${s}</p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #111827;"><strong>Fecha y Hora:</strong> ${p}</p>
          ${r}
          <div style="margin-top: 12px; padding: 12px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px;">
            <p style="margin: 0; font-size: 14px; color: #374151; white-space: pre-wrap;"><strong>Detalle / Comentario:</strong><br/>${a.trim()}</p>
          </div>
        </div>

        <p style="font-size: 14px; color: #374151; margin: 0 0 24px 0;">
          Por favor ingresa a RADAR para revisar el detalle y gestionar los avances correspondientes.
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${d}" style="background-color: #de0028; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; border-bottom: 3px solid #ffcd00;">
            Ver Actividad en RADAR
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
          Este es un correo institucional automático emitido por el sistema RADAR - Unidad de Transformación.
        </p>
      </div>
    </div>
  `};export{f as asuntoCorreoActividad,g as asuntoCorreoComentario,c as generarCuerpoCorreoActividad,x as generarCuerpoCorreoComentario};
