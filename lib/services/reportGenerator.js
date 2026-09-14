const { FUENTE_NOMBRE } = require('./uvService');

function fechaChileTexto() {
  return new Date().toLocaleDateString('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function fechaChileDDMMAAAA() {
  return fechaChileTexto(); // ya viene DD-MM-AAAA con locale es-CL y separador '-'
}

function horaGeneracionChile() {
  return new Date().toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Construye el texto del resumen ejecutivo nacional (sección 5) a partir de
 * los datos reales del día. No usa valores fijos ni de ejemplo.
 */
function construirResumenNacional(registros) {
  const disponibles = registros.filter((r) => r.disponible);
  const conteo = { Bajo: 0, Moderado: 0, Alto: 0, 'Muy alto': 0, Extremo: 0 };

  disponibles.forEach((r) => {
    if (conteo[r.categoria] !== undefined) conteo[r.categoria] += 1;
  });

  if (disponibles.length === 0) {
    return {
      texto: 'No fue posible obtener el Índice UV para ninguna capital regional en esta fecha. Consulte la sección de errores.',
      conteo,
      maxUV: null,
      ciudadesMax: [],
    };
  }

  const maxUV = Math.max(...disponibles.map((r) => r.indiceUV));
  const ciudadesMax = disponibles.filter((r) => r.indiceUV === maxUV).map((r) => `${r.capital}`);
  const destacadas = disponibles.filter((r) => r.categoria === 'Muy alto' || r.categoria === 'Extremo');

  let texto = `Para hoy ${fechaChileTexto()} se registran niveles de radiación UV variables a lo largo de Chile. `;
  texto += `El máximo previsto entre las 16 capitales regionales corresponde a ${ciudadesMax.join(' y ')}, con Índice UV ${maxUV}. `;
  texto += `Distribución por categoría: ${conteo.Bajo} en nivel Bajo, ${conteo.Moderado} en Moderado, ${conteo.Alto} en Alto, `;
  texto += `${conteo['Muy alto']} en Muy Alto y ${conteo.Extremo} en Extremo. `;

  if (destacadas.length > 0) {
    texto += `Se identifican ${destacadas.length} capital(es) regional(es) en categoría Muy Alta o Extrema, que requieren especial precaución frente a la exposición solar.`;
  } else {
    texto += 'Ninguna capital regional se encuentra hoy en categoría Muy Alta o Extrema según los datos disponibles.';
  }

  if (disponibles.length < registros.length) {
    const faltantes = registros.length - disponibles.length;
    texto += ` (Nota: ${faltantes} capital(es) no cuentan con información disponible para hoy.)`;
  }

  return { texto, conteo, maxUV, ciudadesMax };
}

function filaTabla(r) {
  if (!r.disponible) {
    return `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">${r.region}</td>
        <td style="padding:8px;border:1px solid #ddd;">${r.capital}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;" colspan="4">
          <em>Sin información disponible</em>
        </td>
      </tr>`;
  }
  return `
    <tr>
      <td style="padding:8px;border:1px solid #ddd;">${r.region}</td>
      <td style="padding:8px;border:1px solid #ddd;">${r.capital}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right;">${r.indiceUV}</td>
      <td style="padding:8px;border:1px solid #ddd;background:${r.color};color:${r.textColor};font-weight:bold;text-align:center;">
        ${r.categoria}
      </td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center;">${r.horaMaxima || '—'}</td>
      <td style="padding:8px;border:1px solid #ddd;">${r.condicion || '—'}</td>
    </tr>`;
}

function construirTablaHTML(registros) {
  const filas = registros.map(filaTabla).join('\n');
  return `
    <table style="width:100%;border-collapse:collapse;font-family:Arial, sans-serif;font-size:14px;">
      <thead>
        <tr style="background:#2c3e50;color:#ffffff;">
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Región</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Capital</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:right;">Índice UV</th>
          <th style="padding:8px;border:1px solid #ddd;">Nivel</th>
          <th style="padding:8px;border:1px solid #ddd;">Hora máx.</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Condición</th>
        </tr>
      </thead>
      <tbody>
        ${filas}
      </tbody>
    </table>`;
}

function construirSeccionAlertas(registros) {
  const destacadas = registros.filter((r) => r.disponible && (r.categoria === 'Muy alto' || r.categoria === 'Extremo'));

  if (destacadas.length === 0) {
    return `
      <div style="background:#eafaf1;border-left:4px solid #2ECC71;padding:12px 16px;margin:16px 0;font-family:Arial, sans-serif;">
        <strong>⚠️ ZONAS DE MAYOR EXPOSICIÓN UV</strong>
        <p style="margin:8px 0 0 0;">No existen capitales regionales en categoría Muy Alta o Extrema según los datos disponibles para hoy.</p>
      </div>`;
  }

  const items = destacadas
    .map((r) => {
      const etiqueta = r.categoria === 'Extremo' ? 'EXPOSICIÓN EXTREMA' : 'EXPOSICIÓN MUY ALTA';
      return `<li><strong>${r.capital} (${r.region})</strong> — Índice UV ${r.indiceUV} — <span style="color:${r.color === '#8E44AD' ? '#8E44AD' : '#E74C3C'};font-weight:bold;">${etiqueta}</span></li>`;
    })
    .join('\n');

  return `
    <div style="background:#fdf2f2;border-left:4px solid #E74C3C;padding:12px 16px;margin:16px 0;font-family:Arial, sans-serif;">
      <strong>⚠️ ZONAS DE MAYOR EXPOSICIÓN UV</strong>
      <ul style="margin:8px 0 0 0;padding-left:20px;">
        ${items}
      </ul>
    </div>`;
}

const RECOMENDACIONES_HTML = `
  <ul style="font-family:Arial, sans-serif;font-size:14px;line-height:1.5;padding-left:20px;">
    <li>Evitar la exposición solar directa entre las 11:00 y las 16:00 horas, especialmente en categorías Alta o superior.</li>
    <li>Usar protector solar de amplio espectro (FPS 30 o superior), reaplicándolo cada 2 horas y después de sudar o mojarse.</li>
    <li>Utilizar sombrero de ala ancha, lentes de sol con filtro UV y ropa que cubra la piel expuesta.</li>
    <li>Buscar sombra siempre que sea posible, incluso en días nublados, ya que la radiación UV puede seguir siendo alta.</li>
    <li>Extremar precauciones en superficies reflectantes (nieve, agua, arena), que aumentan la radiación recibida.</li>
  </ul>
  <p style="font-family:Arial, sans-serif;font-size:14px;line-height:1.5;">
    <strong>Trabajos y actividades prolongadas al aire libre:</strong> planificar las tareas de mayor exposición
    fuera del rango de mayor radiación (antes de las 11:00 o después de las 16:00), disponer de zonas de sombra
    para pausas, reforzar el uso de elementos de protección personal (bloqueador, manga larga, casco con protección
    de cuello) y mantener hidratación constante.
  </p>
  <p style="font-family:Arial, sans-serif;font-size:12px;color:#666;">
    Recomendaciones basadas en criterios generales de protección solar difundidos por organismos de salud pública
    y servicios meteorológicos oficiales (OMS/OMM, MINSAL). No reemplazan indicaciones médicas específicas.
  </p>`;

function construirSeccionCharla(charla) {
  if (!charla) return '';

  const puntosHTML = charla.puntos
    .map((p) => `<li style="margin-bottom:6px;">${p}</li>`)
    .join('\n');

  return `
    <div style="background:#eef6fb;border-left:4px solid #154360;padding:16px;margin:20px 0;font-family:Arial, sans-serif;">
      <h2 style="font-size:16px;color:#154360;margin-top:0;">🦺 Charla de Seguridad del día (${charla.numero}/${charla.total})</h2>
      <h3 style="font-size:15px;color:#154360;margin-bottom:4px;">${charla.titulo}</h3>
      <p style="font-size:13px;color:#555;font-style:italic;margin-top:0;">${charla.objetivo}</p>
      <ul style="font-size:14px;line-height:1.5;padding-left:20px;margin:10px 0;">
        ${puntosHTML}
      </ul>
      <p style="font-size:14px;line-height:1.5;font-weight:bold;color:#154360;margin-bottom:0;">
        💡 ${charla.reflexion}
      </p>
    </div>`;
}

function construirHTML({ registros, resumen, fuentesUtilizadas, charla }) {
  const fecha = fechaChileDDMMAAAA();
  const hora = horaGeneracionChile();

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Reporte Diario Radiación UV Chile</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f7;">
  <div style="max-width:680px;margin:0 auto;padding:16px;font-family:Arial, sans-serif;color:#2c3e50;">

    <div style="background:#154360;color:#ffffff;padding:20px;border-radius:6px 6px 0 0;">
      <h1 style="margin:0;font-size:20px;">☀️ MAPSCAN — Reporte Diario de Radiación UV Chile</h1>
      <p style="margin:4px 0 0 0;font-size:14px;">${fecha}</p>
    </div>

    <div style="background:#ffffff;padding:16px;border:1px solid #e0e0e0;border-top:none;">
      <h2 style="font-size:16px;color:#154360;">Resumen nacional</h2>
      <p style="font-size:14px;line-height:1.5;">${resumen.texto}</p>

      ${construirSeccionAlertas(registros)}

      <h2 style="font-size:16px;color:#154360;">Detalle por región y capital (norte a sur)</h2>
      ${construirTablaHTML(registros)}
      <p style="font-size:12px;color:#666;margin-top:6px;">
        Escala OMS: 0–2 Bajo · 3–5 Moderado · 6–7 Alto · 8–10 Muy alto · 11+ Extremo.
      </p>

      <h2 style="font-size:16px;color:#154360;">Recomendaciones de protección</h2>
      ${RECOMENDACIONES_HTML}

      ${construirSeccionCharla(charla)}

      <h2 style="font-size:16px;color:#154360;">Fuentes utilizadas</h2>
      <p style="font-size:13px;line-height:1.5;">${fuentesUtilizadas}</p>

      <p style="font-size:12px;color:#888;">Reporte generado el ${fecha} a las ${hora} (hora de Chile).</p>
    </div>

    <div style="background:#eeeeee;padding:12px 16px;border-radius:0 0 6px 6px;font-size:11px;color:#777;">
      Reporte generado automáticamente. Los valores corresponden a información/pronósticos publicados por las
      fuentes indicadas y pueden variar durante el día.
    </div>
  </div>
</body>
</html>`;
}

function asuntoCorreo() {
  return `Reporte Diario Radiación UV Chile | ${fechaChileDDMMAAAA()}`;
}

module.exports = {
  construirResumenNacional,
  construirHTML,
  asuntoCorreo,
  fechaChileDDMMAAAA,
};
