export interface DatosCorreoActividad {
  nombre: string;
  descripcion?: string | null;
  codigo: string;
  fechaLimite?: string | Date | null;
  actividadId?: string;
}

export const asuntoCorreoActividad = (codigo?: string) => {
  return `Asignación de Actividad - ${codigo || 'Sistema RADAR'}`;
};

export const generarCuerpoCorreoActividad = ({
  nombre,
  descripcion,
  codigo,
  fechaLimite,
  actividadId
}: DatosCorreoActividad): string => {
  const link = actividadId 
    ? `${window.location.origin}/#/actividad/${actividadId}` 
    : window.location.origin;

  let fechaStr = 'Sin fecha';
  if (fechaLimite) {
    const d = new Date(fechaLimite);
    if (!isNaN(d.getTime())) {
      fechaStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }
  }

  const descHTML = descripcion && descripcion.trim() 
    ? `<p style="margin: 0 0 10px 0; font-size: 14px; color: #111827;"><strong>Descripción:</strong> ${descripcion.trim()}</p>`
    : '';

  return `
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
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #111827;"><strong>Actividad:</strong> ${nombre}</p>
          ${descHTML}
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #111827;"><strong>Código:</strong> ${codigo}</p>
          <p style="margin: 0; font-size: 14px; color: #111827;"><strong>Fecha Límite:</strong> ${fechaStr}</p>
        </div>

        <p style="font-size: 14px; color: #374151; margin: 0 0 24px 0;">
          Por favor ingresa a RADAR para revisar el detalle y gestionar los avances y evidencias correspondientes.
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${link}" style="background-color: #de0028; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; border-bottom: 3px solid #ffcd00;">
            Acceder a la Actividad en RADAR
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
          Este es un correo institucional automático emitido por el sistema RADAR - Unidad de Transformación.
        </p>
      </div>
    </div>
  `;
};
