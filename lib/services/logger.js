/**
 * En Vercel no existe disco persistente entre ejecuciones, así que este
 * logger solo escribe a consola. Vercel captura automáticamente esos logs
 * y los muestra en el dashboard del proyecto (pestaña "Logs"), por lo que
 * sigues teniendo trazabilidad de cada ejecución sin necesidad de archivos.
 *
 * Nunca se registran contraseñas ni tokens (se redactan si aparecieran).
 */

function nowChile() {
  return new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });
}

function redact(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/(SMTP_PASSWORD\s*=\s*)(\S+)/gi, '$1[REDACTADO]')
    .replace(/(password["']?\s*[:=]\s*["']?)([^"'\s,}]+)/gi, '$1[REDACTADO]');
}

function write(level, message) {
  const line = `[${nowChile()}] [${level}] ${redact(message)}`;
  const consoleFn = level === 'ERROR' ? console.error : console.log;
  consoleFn(line);
}

module.exports = {
  info: (msg) => write('INFO', msg),
  warn: (msg) => write('WARN', msg),
  error: (msg) => write('ERROR', msg),
};
