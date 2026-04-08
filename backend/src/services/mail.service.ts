import nodemailer from 'nodemailer';

// Configuración genérica para pruebas locales locales. 
// En producción se cambian por variables de entorno (SendGrid, Mailgun, SES, o SMTP Institucional)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'ethereal_user',
    pass: process.env.SMTP_PASS || 'ethereal_pass'
  }
});

export const enviarNotificacion = async (destinatarios: string[], asunto: string, mensajeHTML: string) => {
  try {
    const info = await transporter.sendMail({
      from: '"Transformación Bogotá" <no-reply@bogota.gov.co>',
      to: destinatarios.join(','),
      subject: asunto,
      html: mensajeHTML
    });
    console.log(`Mensaje enviado: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error enviando correo SMTP:', error);
    return false;
  }
};
