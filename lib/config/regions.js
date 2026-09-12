/**
 * Listado oficial de las 16 regiones de Chile y sus capitales regionales.
 * Ordenado geográficamente de NORTE a SUR (requisito de la sección 6 del reporte).
 *
 * Las coordenadas corresponden al centro urbano de cada capital regional y se
 * usan para consultar el pronóstico de Índice UV por ubicación geográfica.
 */

module.exports = [
  { region: 'Arica y Parinacota', capital: 'Arica', lat: -18.4783, lon: -70.3126 },
  { region: 'Tarapacá', capital: 'Iquique', lat: -20.2141, lon: -70.1522 },
  { region: 'Antofagasta', capital: 'Antofagasta', lat: -23.6509, lon: -70.3975 },
  { region: 'Atacama', capital: 'Copiapó', lat: -27.3668, lon: -70.3323 },
  { region: 'Coquimbo', capital: 'La Serena', lat: -29.9027, lon: -71.2519 },
  { region: 'Valparaíso', capital: 'Valparaíso', lat: -33.0472, lon: -71.6127 },
  { region: 'Metropolitana de Santiago', capital: 'Santiago', lat: -33.4489, lon: -70.6693 },
  { region: "O'Higgins", capital: 'Rancagua', lat: -34.1708, lon: -70.7444 },
  { region: 'Maule', capital: 'Talca', lat: -35.4264, lon: -71.6554 },
  { region: 'Ñuble', capital: 'Chillán', lat: -36.6066, lon: -72.1034 },
  { region: 'Biobío', capital: 'Concepción', lat: -36.8201, lon: -73.0444 },
  { region: 'La Araucanía', capital: 'Temuco', lat: -38.7359, lon: -72.5904 },
  { region: 'Los Ríos', capital: 'Valdivia', lat: -39.8142, lon: -73.2459 },
  { region: 'Los Lagos', capital: 'Puerto Montt', lat: -41.4693, lon: -72.9424 },
  { region: 'Aysén', capital: 'Coyhaique', lat: -45.5752, lon: -72.0662 },
  { region: 'Magallanes y de la Antártica Chilena', capital: 'Punta Arenas', lat: -53.1638, lon: -70.9171 },
];
