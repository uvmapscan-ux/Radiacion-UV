# Análisis de fuentes de Índice UV para Chile

## 1. Fuentes evaluadas

### 1.1 Dirección Meteorológica de Chile (DMC / MeteoChile) — fuente oficial nacional
La DMC mantiene una red nacional de estaciones que miden el Índice de Radiación UV y publica
tanto valores observados como pronósticos en su portal web. Se identificaron dos vías posibles:

- **Portal web público** (`meteochile.gob.cl/.../radiacion_uv.xhtml`): al intentar acceder de forma
  automatizada, el sitio responde con una verificación de navegador (protección anti-bot tipo
  Cloudflare/JS challenge). Esto significa que **no puede consultarse de forma confiable ni estable
  mediante scraping automatizado**, ya que cualquier cambio en la protección o el HTML rompería el
  sistema, y hacerlo además puede infringir los términos de uso del sitio.
- **API de climatología DMC** (`climatologia.meteochile.gob.cl/application/servicios/getRecienteUvb`):
  existe un servicio de datos abiertos que entrega valores **observados** (cada 5 minutos, no
  pronóstico) del índice UV de las estaciones de la red nacional. Para usarlo se requiere:
  1. Registrar un correo y solicitar manualmente un `token`/`apiKey` personal (no es autogestionable
     por completo ni instantáneo).
  2. Las estaciones disponibles no necesariamente coinciden una a una con las 16 capitales regionales
     solicitadas (algunas capitales no tienen estación de radiación UV propia).
  3. El servicio entrega **valores observados**, no un pronóstico diario para "hoy" que cubra todo el
     país de forma homogénea.

**Conclusión sobre DMC:** es la fuente oficial y debe citarse como referencia primaria del país, pero
presenta una limitación real y documentada para este proyecto: no ofrece, sin gestión manual previa
de credenciales, un pronóstico diario automatizable y homogéneo para las 16 capitales regionales.

### 1.2 Open-Meteo (open-meteo.com) — fuente seleccionada para la automatización
Servicio meteorológico gratuito, sin necesidad de API key, con alta disponibilidad, que publica el
`uv_index_max` diario y `uv_index` horario para cualquier coordenada del planeta, calculado con la
misma metodología del Índice UV Solar Mundial (OMS/OMM/PNUMA/ICNIRP) a partir de modelos numéricos
(CAMS/ECMWF, entre otros). Ventajas para este proyecto:

- No requiere registro ni token: reduce puntos de falla y facilita la operación diaria automática.
- Permite consultar **las 16 ubicaciones en una sola llamada HTTP** (lat/lon separados por coma),
  minimizando riesgo de fallas parciales de red.
- Entrega pronóstico horario, lo que permite calcular la **hora aproximada del máximo UV** y la
  condición meteorológica en ese momento, tal como pide la sección 4 del requerimiento.
- Es ampliamente usado como fuente de referencia meteorológica por productos de terceros y medios.

### 1.3 Otras alternativas descartadas
- **Meteored / weatherandradar / tutiempo**: portales de terceros sin API pública documentada apta
  para consumo automatizado estable; harían necesario scraping frágil.
- **Servicios comerciales con API key de pago** (p. ej. proveedores meteorológicos premium): se
  descartaron para la primera versión por requerir gestión de suscripción/costos; el diseño del
  servicio `uvService.js` permite reemplazar la fuente fácilmente si en el futuro se opta por una de
  estas opciones o se obtiene el token de la API de climatología de la DMC.

## 2. Decisión adoptada

Se utiliza **Open-Meteo** como fuente automatizada primaria para el pronóstico diario de las 16
capitales regionales, dejando indicado explícitamente en cada correo que la metodología del Índice UV
corresponde al estándar OMS/OMM, y documentando aquí la limitación identificada en el acceso
automatizado a la DMC.

**Recomendación a futuro:** si se desea usar directamente datos de la DMC, se debe:
1. Solicitar el `apiKey` personal en el sistema de datos abiertos de climatología de la DMC.
2. Mapear qué capitales regionales cuentan con estación de radiación UV propia.
3. Adaptar `src/services/uvService.js` para consumir `getRecienteUvb` (u otro endpoint DMC
   equivalente) en paralelo o en reemplazo de Open-Meteo, aplicando la misma lógica de clasificación
   ya implementada en `src/config/uvScale.js`.

## 3. Escala de clasificación utilizada

Se verificó contra fuentes públicas de salud/meteorología (OMS y servicios meteorológicos que aplican
la misma escala en la región, como el SMN de Argentina) que la escala solicitada es correcta:

| Índice UV | Categoría |
|-----------|-----------|
| 0–2       | Bajo      |
| 3–5       | Moderado  |
| 6–7       | Alto      |
| 8–10      | Muy alto  |
| 11+       | Extremo   |

Esta escala está implementada en `src/config/uvScale.js`.
