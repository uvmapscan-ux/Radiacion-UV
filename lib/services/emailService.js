const nodemailer = require('nodemailer');
const logger = require('./logger');

function crearTransporte() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM', 'EMAIL_TO'];
  const faltantes = required.filter((v) => !process.env[v]);
  if (faltantes.length > 0) {
    throw new Error(`Faltan variables de entorno para el envío de correo: ${faltantes.join(', ')}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465, // true para 465, false para 587/25 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

async function enviarCorreo({ asunto, html }) {
  const transporte = crearTransporte();
  const destinatarios = process.env.EMAIL_TO.split(',').map((d) => d.trim()).filter(Boolean);

  const info = await transporte.sendMail({
    from: process.env.EMAIL_FROM,
    to: destinatarios,
    subject: asunto,
    html,
  });

  logger.info(`Correo enviado correctamente. messageId=${info.messageId} destinatarios=${destinatarios.length}`);
  return info;
}

async function enviarCorreoDeError({ motivo }) {
  const transporte = crearTransporte();
  const destinatarios = process.env.EMAIL_TO.split(',').map((d) => d.trim()).filter(Boolean);

  const asunto = `[ERROR] Reporte Diario Radiación UV Chile no pudo generarse`;
  const html = `
    <div style="font-family:Arial, sans-serif;">
      <h2 style="color:#c0392b;">No fue posible generar el Reporte Diario de Radiación UV</h2>
      <p>El sistema detectó un error que impide garantizar la validez de los datos y, por lo tanto,
      no se envió un reporte con información parcial o potencialmente incorrecta.</p>
      <p><strong>Motivo registrado:</strong> ${motivo}</p>
      <p style="font-size:12px;color:#777;">Revise los logs en la carpeta /logs para más detalle. Ninguna credencial se incluye en este mensaje.</p>
    </div>`;

  await transporte.sendMail({
    from: process.env.EMAIL_FROM,
    to: destinatarios,
    subject: asunto,
    html,
  });

  logger.info('Correo de aviso de error enviado a los destinatarios configurados.');
}

module.exports = { enviarCorreo, enviarCorreoDeError };
