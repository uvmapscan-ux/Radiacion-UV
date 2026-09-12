/**
 * Escala de Índice UV según la Organización Mundial de la Salud (OMS/WHO),
 * adoptada también por servicios meteorológicos nacionales de la región
 * (incluido el Servicio Meteorológico Nacional de Argentina y publicada por
 * MeteoChile en sus contenidos de difusión pública sobre radiación UV).
 *
 * Referencia: "Global Solar UV Index: A Practical Guide" (OMS/OMM/PNUMA/ICNIRP).
 *
 *   0–2   -> Bajo
 *   3–5   -> Moderado
 *   6–7   -> Alto
 *   8–10  -> Muy alto
 *   11+   -> Extremo
 */

const SCALE = [
  { min: 0, max: 2, categoria: 'Bajo', color: '#2ECC71', textColor: '#0B3D19' },
  { min: 3, max: 5, categoria: 'Moderado', color: '#F1C40F', textColor: '#5C4700' },
  { min: 6, max: 7, categoria: 'Alto', color: '#E67E22', textColor: '#5A2D00' },
  { min: 8, max: 10, categoria: 'Muy alto', color: '#E74C3C', textColor: '#FFFFFF' },
  { min: 11, max: Infinity, categoria: 'Extremo', color: '#8E44AD', textColor: '#FFFFFF' },
];

function clasificarUV(indiceUV) {
  if (indiceUV === null || indiceUV === undefined || Number.isNaN(indiceUV)) {
    return null;
  }
  const redondeado = Math.round(indiceUV);
  return SCALE.find((tramo) => redondeado >= tramo.min && redondeado <= tramo.max) || null;
}

module.exports = { SCALE, clasificarUV };
