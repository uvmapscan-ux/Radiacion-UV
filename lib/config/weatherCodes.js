/**
 * Códigos de tiempo presente WMO (WW), usados por Open-Meteo.
 * https://open-meteo.com/en/docs -> "WMO Weather interpretation codes"
 */
const WMO_CODES = {
  0: 'Cielo despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla con escarcha',
  51: 'Llovizna débil',
  53: 'Llovizna moderada',
  55: 'Llovizna intensa',
  56: 'Llovizna helada débil',
  57: 'Llovizna helada intensa',
  61: 'Lluvia débil',
  63: 'Lluvia moderada',
  65: 'Lluvia intensa',
  66: 'Lluvia helada débil',
  67: 'Lluvia helada intensa',
  71: 'Nevada débil',
  73: 'Nevada moderada',
  75: 'Nevada intensa',
  77: 'Granizo pequeño',
  80: 'Chubascos débiles',
  81: 'Chubascos moderados',
  82: 'Chubascos violentos',
  85: 'Chubascos de nieve débiles',
  86: 'Chubascos de nieve intensos',
  95: 'Tormenta eléctrica',
  96: 'Tormenta con granizo débil',
  99: 'Tormenta con granizo intenso',
};

function describirCodigo(codigo) {
  if (codigo === null || codigo === undefined) return null;
  return WMO_CODES[codigo] || `Código WMO ${codigo}`;
}

module.exports = { describirCodigo };
