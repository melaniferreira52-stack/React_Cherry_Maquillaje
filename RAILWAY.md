# Despliegue de Cherry Beauty en Railway

Guía paso a paso para publicar el Quinto Avance en Railway
(frontend + backend + base de datos MySQL en la nube).

---

## Resumen de lo que vas a crear en Railway

| Servicio | Qué es | Cómo se crea |
|---|---|---|
| `cherry-mysql` | Base de datos MySQL (nube) | Botón "New" → Database → MySQL |
| `cherry-backend` | API FastAPI | De la carpeta `backend/` (Dockerfile) |
| `cherry-frontend` | Sitio React (estático) | De la carpeta `frontend/` (Dockerfile) |

---

## Paso 1: Cuenta y CLI

1. Crea cuenta gratis en https://railway.app (con GitHub).
2. Instala el CLI:
   ```bash
   npm install -g @railway/cli
   ```
3. Inicia sesión:
   ```bash
   railway login
   ```

---

## Paso 2: Base de datos MySQL

1. En el dashboard de Railway: **New → Database → MySQL**.
2. Railway crea el servicio y te genera las variables automáticamente
   (`MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`...).
3. La URL de conexión quedará así (la necesitas para el backend):
   ```
   mysql+pymysql://<USUARIO>:<PASSWORD>@<HOST>:<PUERTO>/<BD>
   ```
   Puedes copiarla desde Variables → DATABASE_URL, o armarla con los
   valores de MYSQL*.
4. **Importa el esquema** (solo la primera vez). Desde tu máquina, con
   el archivo `backend/sql/bd.sql` actualizado, usa un cliente MySQL
   (phpMyAdmin local no sirve para esto; usa mysql CLI o DBeaver) apuntando
   a la URL pública del MySQL de Railway:
   ```bash
   mysql -h <HOST> -P <PUERTO> -u <USUARIO> -p<CLAVE> <BD> < backend/sql/bd.sql
   ```

---

## Paso 3: Backend (API)

1. En Railway: **New → Empty Service** (o **Deploy from GitHub** apuntando a
   la carpeta que contiene `backend/Dockerfile`).
2. Configura las **Variables** del servicio backend:
   ```
   DATABASE_URL=mysql+pymysql://<USUARIO>:<PASSWORD>@<HOST>:<PUERTO>/<BD>
   SECRET_KEY=<clave generada con secrets.token_hex(32)>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   FRONTEND_URL=https://<tu-frontend>.up.railway.app
   OPENAI_API_KEY=            # opcional, para el chatbot con IA
   OPENAI_MODEL=gpt-4o-mini
   ```
3. Railway detecta el `railway.json` y el `Dockerfile` de `backend/` y
   arranca `uvicorn app.main:app`.
4. Genera una **URL pública** (Settings → Networking → Generate Domain).
   Anótala: será la `VITE_API_URL` del frontend.

---

## Paso 4: Frontend (React)

1. En Railway: **New → Empty Service** con la carpeta `frontend/` (tiene su
   propio `Dockerfile` y `railway.json`).
2. Configura las **Variables** para el build:
   ```
   VITE_API_URL=https://<tu-backend>.up.railway.app/api
   ```
   (esta se inyecta en tiempo de build al frontend).
3. Genera una **URL pública**.
4. Verifica: entra a la URL pública, inicia sesión como admin y prueba
   Ventas, Facturas, Reportes, PQR y el chatbot.

---

## Paso 5: Crear el admin en producción

El registro público solo crea clientes. En producción:

```bash
# Desde tu máquina, con el backend local apuntando temporalmente a la BD remota NO.
# Mejor: ejecuta el script dentro del contenedor o con la BD remota:
cd backend
DATABASE_URL="mysql+pymysql://<USUARIO>:<PASSWORD>@<HOST>:<PUERTO>/<BD>" python crear_admin.py
```

Esto crea `admin@cherrybeauty.com` / `Admin_2026*` (cámbiala luego).

---

## Notas importantes

- **Nunca** subas `.env` a GitHub (ya está en `.gitignore`).
- El chatbot funciona **sin** `OPENAI_API_KEY` (usas el motor local con la
  información del sitio). Si la pones, responde con IA real.
- Las imágenes subidas desde el panel se guardan en el contenedor y se
  pierden al redeployar; para persistir en producción conviene adjuntar un
  **Volume** a la carpeta `/app/app/uploads` (Settings → Volumes). En local
  funcionan normal.
- El script `bd.sql` actualizado incluye todas las tablas del Quinto Avance
  (ventas, detalle_ventas, facturas, detalle_facturas, pqr, conversaciones,
  mensajes).