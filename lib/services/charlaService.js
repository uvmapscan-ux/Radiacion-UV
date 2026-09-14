const CHARLAS = require('../config/charlas');

/**
 * Selecciona la charla de seguridad correspondiente al día, de forma
 * determinística (sin necesidad de guardar estado en ningún lado, ya que
 * Vercel no tiene disco persistente).
 *
 * Se cuentan los días transcurridos desde una fecha de referencia fija
 * (2026-01-01) y se usa el resto de la división por 60 (la cantidad total
 * de charlas) para elegir el índice del día. Esto garantiza que, dentro de
 * cualquier ventana de 60 días corridos, cada charla aparece exactamente
 * una vez antes de que el ciclo vuelva a empezar.
 */
const FECHA_REFERENCIA = Date.UTC(2026, 0, 1); // 2026-01-01 en UTC
const MS_POR_DIA = 24 * 60 * 60 * 1000;

function obtenerFechaChileYMD() {
  // Devuelve la fecha de HOY en zona horaria America/Santiago, como YYYY-MM-DD
  const fmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Santiago' });
  return fmt.format(new Date()); // ej: "2026-09-15"
}

function obtenerCharlaDeHoy() {
  const hoyYMD = obtenerFechaChileYMD();
  const hoyUTC = Date.UTC(
    Number(hoyYMD.slice(0, 4)),
    Number(hoyYMD.slice(5, 7)) - 1,
    Number(hoyYMD.slice(8, 10))
  );

  const diasTranscurridos = Math.floor((hoyUTC - FECHA_REFERENCIA) / MS_POR_DIA);
  // Módulo seguro también para fechas anteriores a la referencia
  const indice = ((diasTranscurridos % CHARLAS.length) + CHARLAS.length) % CHARLAS.length;

  return { ...CHARLAS[indice], numero: indice + 1, total: CHARLAS.length };
}

module.exports = { obtenerCharlaDeHoy };
