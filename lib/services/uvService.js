const axios = require('axios');
const REGIONES = require('../config/regions');
const { clasificarUV } = require('../config/uvScale');
const { describirCodigo } = require('../config/weatherCodes');
const logger = require('./logger');

/**
 * FUENTE DE DATOS
 * ----------------
 * Fuente primaria configurada: Open-Meteo (https://open-meteo.com), servicio
 * meteorológico gratuito, sin necesidad de API key, que agrega e interpola
 * modelos numéricos oficiales (entre ellos, para Sudamérica, datos derivados
 * de ECMWF/GFS) y publica el "UV Index" siguiendo la misma metodología del
 * Índice UV Solar Mundial (OMS/OMM/PNUMA/ICNIRP).
 *
 * Ver docs/FUENTES.md para el detalle completo de por qué se eligió esta
 * fuente en lugar de (o además de) la Dirección Meteorológica de Chile (DMC).
 *
 * Cada registro que devuelve este servicio queda etiquetado explícitamente
 * con su fuente y con la fecha/hora de generación del dato (sección 4 y 12
 * del requerimiento): nunca se inventa ni interpola un valor faltante.
 */

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const FUENTE_NOMBRE = 'Open-Meteo (UV Index, metodología OMS)';
const TIMEOUT_MS = 15000;

/**
 * Encuentra, dentro del arreglo horario de un día, la hora en que ocurre el
 * valor máximo de índice UV, junto con el código de tiempo en esa hora.
 */
function calcularHoraMaxima(hourlyTimes, hourlyUv, hourlyWeatherCode, fechaHoy) {
  let mejorIdx = -1;
  let mejorValor = -Infinity;

  for (let i = 0; i < hourlyTimes.length; i += 1) {
    const t = hourlyTimes[i];
    if (!t.startsWith(fechaHoy)) continue; // solo horas del día del reporte
    const valor = hourlyUv[i];
    if (valor !== null && valor !== undefined && valor > mejorValor) {
      mejorValor = valor;
      mejorIdx = i;
    }
  }

  if (mejorIdx === -1) {
    return { hora: null, condicion: null };
  }

  const horaTexto = hourlyTimes[mejorIdx].slice(11, 16); // HH:MM
  const condicion = describirCodigo(hourlyWeatherCode ? hourlyWeatherCode[mejorIdx] : null);
  return { hora: horaTexto, condicion };
}

/**
 * Consulta el pronóstico de Índice UV para todas las capitales regionales en
 * una sola solicitud HTTP (Open-Meteo admite listas de lat/lon separadas por
 * coma en un mismo request).
 *
 * @returns {Promise<Array>} un registro por capital, con `disponible: true|false`.
 */
async function obtenerIndiceUVTodasLasCapitales() {
  const latitudes = REGIONES.map((r) => r.lat).join(',');
  const longitudes = REGIONES.map((r) => r.lon).join(',');

  const params = {
    latitude: latitudes,
    longitude: longitudes,
    daily: 'uv_index_max,weathercode',
    hourly: 'uv_index,weathercode',
    timezone: 'America/Santiago',
    forecast_days: 1,
  };

  logger.info(`Consultando fuente UV: ${FUENTE_NOMBRE} -> ${ENDPOINT}`);

  let response;
  try {
    response = await axios.get(ENDPOINT, { params, timeout: TIMEOUT_MS });
  } catch (err) {
    logger.error(`Fallo de conexión con la fuente UV (${FUENTE_NOMBRE}): ${err.message}`);
    throw new Error(`FUENTE_NO_DISPONIBLE: ${err.message}`);
  }

  // Cuando se piden múltiples ubicaciones, Open-Meteo devuelve un arreglo de
  // objetos (uno por ubicación) en el mismo orden en que se enviaron.
  const payload = Array.isArray(response.data) ? response.data : [response.data];

  if (payload.length !== REGIONES.length) {
    logger.warn(
      `La fuente devolvió ${payload.length} ubicaciones pero se solicitaron ${REGIONES.length}.`
    );
  }

  const fechaConsulta = new Date().toISOString();
  const resultados = REGIONES.map((cap, idx) => {
    const datos = payload[idx];

    const registroBase = {
      region: cap.region,
      capital: cap.capital,
      lat: cap.lat,
      lon: cap.lon,
      fuente: FUENTE_NOMBRE,
      fechaConsultaISO: fechaConsulta,
    };

    if (!datos || !datos.daily || datos.daily.uv_index_max === undefined) {
      logger.warn(`Sin datos UV disponibles para ${cap.capital}, ${cap.region}.`);
      return { ...registroBase, disponible: false };
    }

    const indiceUVMax = datos.daily.uv_index_max[0];
    const fechaDatoDiario = datos.daily.time ? datos.daily.time[0] : null;
    const weathercodeDiario = datos.daily.weathercode ? datos.daily.weathercode[0] : null;

    if (indiceUVMax === null || indiceUVMax === undefined) {
      logger.warn(`Valor UV nulo para ${cap.capital}, ${cap.region}.`);
      return { ...registroBase, disponible: false };
    }

    let horaMaxima = null;
    let condicion = describirCodigo(weathercodeDiario);

    if (datos.hourly && datos.hourly.time && datos.hourly.uv_index && fechaDatoDiario) {
      const calc = calcularHoraMaxima(
        datos.hourly.time,
        datos.hourly.uv_index,
        datos.hourly.weathercode,
        fechaDatoDiario
      );
      if (calc.hora) horaMaxima = calc.hora;
      if (calc.condicion) condicion = calc.condicion; // condición horaria es más precisa que la diaria
    }

    const clasificacion = clasificarUV(indiceUVMax);

    return {
      ...registroBase,
      disponible: true,
      indiceUV: Math.round(indiceUVMax * 10) / 10,
      categoria: clasificacion ? clasificacion.categoria : 'Sin información disponible',
      color: clasificacion ? clasificacion.color : '#999999',
      textColor: clasificacion ? clasificacion.textColor : '#FFFFFF',
      horaMaxima,
      condicion,
      fechaActualizacionDato: fechaDatoDiario,
    };
  });

  const disponibles = resultados.filter((r) => r.disponible).length;
  logger.info(`Datos UV obtenidos: ${disponibles}/${REGIONES.length} capitales con información.`);

  if (disponibles === 0) {
    throw new Error('SIN_DATOS: la fuente respondió pero ninguna capital tiene datos utilizables.');
  }

  return resultados;
}

module.exports = { obtenerIndiceUVTodasLasCapitales, FUENTE_NOMBRE };
