# Despliegue gratuito — Render + Neon + Vercel + Brevo

Todo el stack en tiers gratuitos, sin tarjeta de crédito (verificado julio 2026).

> ⚠️ Estado del mercado: **Koyeb** cerró su tier gratuito (adquirida por Mistral,
> feb 2026) y **Fly.io** ya no ofrece plan gratis a cuentas nuevas. La combinación
> de abajo es la que queda sólida.

| Pieza | Servicio | Límites del tier gratuito |
|---|---|---|
| API (backend) | [Render](https://render.com) web service con Docker | 750 h/mes; se duerme tras 15 min sin tráfico (despierta en 30–50 s) |
| PostgreSQL | [Neon](https://neon.tech) | 0.5 GB, 100 CU-h/mes, sin caducidad |
| SPA (frontend) | [Vercel](https://vercel.com) | hosting estático ilimitado razonable |
| SMTP | [Brevo](https://brevo.com) | 300 emails/día para siempre |
| Dominio (opcional) | [eu.org](https://nic.eu.org) o [is-a.dev](https://is-a.dev) | gratis; eu.org tarda días en aprobarse |
| Keep-alive (opcional) | [cron-job.org](https://cron-job.org) o UptimeRobot | ping cada 10 min para evitar el sleep |

## 1. Neon (base de datos)

1. Crea el proyecto `hotel-erp` (región EU). Copia la **pooled connection string**.
2. Guarda host, usuario, contraseña y base de datos.

## 2. Brevo (SMTP)

1. Cuenta gratuita → **SMTP & API → SMTP**. Copia servidor (`smtp-relay.brevo.com`),
   puerto `587`, login y clave SMTP.
2. Verifica un remitente (tu Gmail sirve).

## 3. Render (backend)

1. **New → Web Service** → conecta el repo de GitHub → root directory `backend`,
   runtime **Docker**, plan **Free**.
2. Variables de entorno:

```
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://<host-pooled-neon>/<db>?sslmode=require
DB_USERNAME=<usuario>
DB_PASSWORD=<contraseña>
APP_JWT_SECRET=<64 bytes en base64: openssl rand -base64 64 | tr -d '\n'>
APP_CORS_ORIGINS=https://<tu-app>.vercel.app
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=<login-brevo>
MAIL_PASSWORD=<clave-smtp-brevo>
APP_MAIL_FROM=<remitente-verificado>
```

3. Deploy. Primera vez: Flyway crea todo el esquema y los datos demo.
4. Prueba: `https://<servicio>.onrender.com/api/health` y `/swagger-ui.html`.

## 4. Vercel (frontend)

1. **Add New → Project** → mismo repo → root directory `frontend` (Vite detectado).
2. Variable de entorno: `VITE_API_URL=https://<servicio>.onrender.com`.
3. Deploy → añade la URL resultante a `APP_CORS_ORIGINS` en Render (redeploy).

## 5. Retoques finales

- **Sleep de Render**: crea un cron en cron-job.org que haga GET a
  `/api/health` cada 10 min (los 750 h/mes dan para un servicio siempre activo).
- **Dominio propio**: pide `tunombre.eu.org` (o `tunombre.is-a.dev` vía PR) y
  apúntalo con CNAME a Vercel; añade el dominio también en CORS.
- **Cold start de Neon**: ya contemplado en `application-prod.yml` (pool pequeño,
  timeouts generosos). El primer request tras inactividad puede tardar unos segundos.

## Checklist de humo en producción

1. `/api/health` responde `UP`.
2. Login con `client@hotel-erp.dev` desde la URL de Vercel.
3. Reserva de prueba → email de confirmación llega vía Brevo.
4. Login `admin@hotel-erp.dev` → dashboard con datos.
