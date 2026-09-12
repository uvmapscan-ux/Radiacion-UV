const logger = require('../lib/services/logger');
const { obtenerIndiceUVTodasLasCapitales } = require('../lib/services/uvService');
const { construirResumenNacional, construirHTML, asuntoCorreo } = require('../lib/services/reportGenerator');
const { enviarCorreo, enviarCorreoDeError } = require('../lib/services/emailService');
const REGIONES = require('../lib/config/regions');

const FUENTES_TEXTO =
  'Open-Meteo (open-meteo.com), Índice UV calculado según la metodología del Índice UV Solar Mundial ' +
  '(OMS/OMM/PNUMA/ICNIRP). Ver docs/FUENTES.md del proyecto original para el detalle de evaluación de ' +
  'fuentes, incluida la Dirección Meteorológica de Chile (DMC).';

/**
 * Endpoint invocado por Vercel Cron (ver vercel.json) todos los días.
 * También puede probarse manualmente visitando la URL en el navegador o con
 * curl, siempre que se envíe el header Authorization correcto (ver README).
 *
 * NOTA IMPORTANTE: en Vercel no hay disco persistente entre ejecuciones, por
 * lo que esta versión NO guarda histórico en CSV ni preview en archivo local
 * (a diferencia de la versión para servidor/computador propio). Solo genera
 * el reporte y lo envía por correo.
 */
module.exports = async (req, res) => {
  // Verificación de origen: Vercel agrega automáticamente el header
  // "Authorization: Bearer <CRON_SECRET>" cuando la variable de entorno
  // CRON_SECRET está configurada en el proyecto. Esto evita que cualquiera
  // en internet pueda disparar el envío de correos visitando la URL.
  const secretoConfigurado = process.env.CRON_SECRET;
  if (secretoConfigurado) {
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${secretoConfigurado}`) {
      logger.warn('Intento de invocación al endpoint de cron sin autorización válida.');
      res.status(401).json({ ok: false, error: 'No autorizado' });
      return;
    }
  } else {
    logger.warn('CRON_SECRET no está configurado: el endpoint no está protegido. Configúralo en Vercel.');
  }

  logger.info('=== Inicio del proceso de Reporte Diario de Radiación UV Chile (Vercel) ===');
  logger.info(`Capitales regionales configuradas: ${REGIONES.length}`);

  let registros;
  try {
    registros = await obtenerIndiceUVTodasLasCapitales();
  } catch (err) {
    logger.error(`Error obteniendo datos UV: ${err.message}`);
    try {
      await enviarCorreoDeError({ motivo: err.message });
    } catch (mailErr) {
      logger.error(`No fue posible enviar el correo de aviso de error: ${mailErr.message}`);
    }
    res.status(500).json({ ok: false, error: 'No se pudo obtener el Índice UV. Se notificó por correo si fue posible.' });
    return;
  }

  const faltantes = registros.filter((r) => !r.disponible);
  if (faltantes.length > 0) {
    logger.warn(
      `Capitales sin información disponible (${faltantes.length}): ` +
        faltantes.map((f) => f.capital).join(', ')
    );
  }

  const resumen = construirResumenNacional(registros);
  const html = construirHTML({ registros, resumen, fuentesUtilizadas: FUENTES_TEXTO });

  try {
    await enviarCorreo({ asunto: asuntoCorreo(), html });
  } catch (err) {
    logger.error(`Error al enviar el correo: ${err.message}`);
    res.status(500).json({ ok: false, error: 'El reporte se generó pero el envío del correo falló.' });
    return;
  }

  logger.info('=== Proceso finalizado correctamente ===');
  res.status(200).json({
    ok: true,
    capitalesConDatos: registros.length - faltantes.length,
    capitalesSinDatos: faltantes.map((f) => f.capital),
  });
};
