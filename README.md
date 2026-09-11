# Reporte Diario de Radiación UV Chile — versión Vercel

Esta es una versión adaptada del proyecto original para funcionar como una **función serverless en
Vercel**, disparada automáticamente todos los días por **Vercel Cron Jobs**. No guarda histórico en
archivos (Vercel no tiene disco persistente entre ejecuciones): solo consulta el Índice UV, genera el
reporte y lo envía por correo.

## 1. ¿Qué cambia respecto a la versión "computador propio"?

| | Versión servidor/computador | Versión Vercel |
|---|---|---|
| Cómo se programa el envío diario | `node-cron` (proceso que corre todo el día) | Vercel Cron Jobs (Vercel lo dispara solo) |
| Dónde vive el código | Tu computador o un servidor | En la nube de Vercel |
| Histórico CSV / logs en archivo | Sí (`/data`, `/logs`) | No — Vercel no tiene disco persistente |
| Zona horaria del horario de envío | Directamente America/Santiago | Se configura en **UTC** (ver sección 4) |

## 2. Requisitos

- Una cuenta gratuita en https://vercel.com (puedes crearla con GitHub, GitLab o correo).
- Los mismos datos de correo SMTP que usarías en la versión anterior (ver sección 3).

## 3. Paso a paso para desplegar

1. **Sube esta carpeta a un repositorio de GitHub** (crea un repo nuevo, por ejemplo
   `reporte-uv-chile-vercel`, y sube todos estos archivos).
2. **Entra a vercel.com**, inicia sesión, haz clic en **"Add New" → "Project"** y selecciona ese
   repositorio de GitHub. Vercel detectará automáticamente que es un proyecto Node y lo desplegará.
3. **Configura las variables de entorno**: dentro del proyecto en Vercel, ve a
   **Settings → Environment Variables** y agrega una por una (mira `.env.example` para ver cuáles):
   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, `EMAIL_TO`, `CRON_SECRET`.
   Para `SMTP_PASSWORD` con Gmail, recuerda usar una "Contraseña de aplicación" (ver nota más abajo).
4. **Vuelve a desplegar** (Vercel suele redeployar solo al guardar variables; si no, ve a
   **Deployments** y elige "Redeploy").
5. Verifica en **Settings → Cron Jobs** que aparece el job `/api/cron` programado.

### Nota Gmail
Activa la verificación en dos pasos en tu cuenta de Google y genera una contraseña de aplicación en
https://myaccount.google.com/apppasswords. Usa esos 16 caracteres como `SMTP_PASSWORD`.

## 4. Sobre el horario (07:00 hora de Chile) — importante

Vercel Cron programa los horarios **en UTC**, y Chile continental cambia de huso horario dos veces al
año (actualmente, desde el 6 de septiembre de 2026, está en horario de verano UTC-3; vuelve a UTC-4
alrededor de abril de 2027). Esto quedó configurado en `vercel.json` como:

```json
"schedule": "0 10 * * *"
```

Eso equivale a las **07:00 en horario de verano (UTC-3)**, que es el que rige actualmente. Cuando
Chile vuelva al horario de invierno (UTC-4, hacia abril), deberás cambiar esa línea a:

```json
"schedule": "0 11 * * *"
```

y volver a desplegar (o subir el cambio a GitHub, que redeploya solo). Es el único ajuste manual que
requiere este sistema a lo largo del año.

También ten en cuenta que, en el plan gratuito (Hobby), Vercel **no garantiza el minuto exacto**: la
ejecución puede ocurrir en cualquier momento dentro de la hora programada.

## 5. Probar manualmente antes de confiar en el cron automático

Puedes probar el endpoint visitando su URL directamente (por ejemplo
`https://tu-proyecto.vercel.app/api/cron`). Si configuraste `CRON_SECRET`, necesitas enviar el header
`Authorization: Bearer TU_CRON_SECRET`, por ejemplo con curl:

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" https://tu-proyecto.vercel.app/api/cron
```

Esto generará y **enviará un correo real** de inmediato — úsalo para tu primera prueba.

## 6. Revisar que corrió correctamente

En el dashboard de Vercel, entra al proyecto → pestaña **"Logs"** (o **"Cron Jobs" → ver
ejecuciones**). Ahí verás las mismas líneas de registro que antes se guardaban en archivos: capitales
consultadas, capitales sin datos, confirmación de envío o errores.

## 7. Fuente de los datos

Igual que en la versión original: **Open-Meteo**, con la metodología OMS/OMM para el Índice UV. El
detalle completo del análisis de fuentes (incluida la Dirección Meteorológica de Chile y por qué no
se usó directamente) está en `FUENTES.md`.

## 8. Limitación a tener en cuenta

Al no guardar histórico, si en el futuro quieres analizar la evolución del Índice UV por región a lo
largo del tiempo, vas a necesitar agregar un almacenamiento externo (por ejemplo Vercel Blob, o una
base de datos gratuita como Supabase). El código está organizado en `lib/services/` precisamente para
que sea fácil agregar ese paso después sin tener que rehacer todo lo demás.
