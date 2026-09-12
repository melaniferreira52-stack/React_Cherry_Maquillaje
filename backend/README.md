# Backend — Cherry Beauty (FastAPI + MySQL)

Backend desarrollado en **FastAPI**, conectado a **MySQL** (pensado para usarse
con **XAMPP**), con autenticación mediante **JWT**, contraseñas cifradas con
**bcrypt**, control de roles (administrador, empleado, cliente) y CRUD
completo de usuarios, productos y servicios.

## 1. Estructura del proyecto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py            # Punto de entrada, CORS, registro de routers
│   ├── database.py        # Conexión SQLAlchemy con MySQL (lee DATABASE_URL del .env)
│   ├── models.py          # Tablas: usuarios, clientes, productos, servicios, pedidos...
│   ├── schemas.py         # Validaciones Pydantic (entrada/salida de la API)
│   ├── auth.py            # Hashing de contraseñas + generación/verificación JWT
│   ├── dependencies.py    # Dependencias: get_current_user, require_roles(...)
│   ├── utils_correo.py    # Envío del correo de recuperación de contraseña
│   └── routes/
│       ├── auth.py        # POST /api/auth/login
│       ├── usuarios.py    # Registro + CRUD de usuarios + /me/perfil
│       ├── productos.py   # CRUD de productos (lo que usa el panel admin/empleado)
│       ├── servicios.py   # CRUD de servicios
│       ├── carrito.py     # Carrito de compras del cliente
│       └── pedidos.py     # Pedidos / facturación
├── sql/
│   └── bd.sql              # Script de creación de la BD `cherry_maquillaje`
├── crear_admin.py          # Script para crear el primer usuario administrador
├── requirements.txt
└── .env                     # Variables de entorno (ya viene con valores de ejemplo)
```

## 2. Conectar la base de datos con XAMPP

1. Abre el **Panel de control de XAMPP** e inicia los módulos **Apache** y
   **MySQL**.
2. Entra a **phpMyAdmin** (botón "Admin" junto a MySQL, o
   `http://localhost/phpmyadmin`).
3. Crea una base de datos nueva llamada **`cherry_maquillaje`**
   (cotejamiento `utf8mb4_unicode_ci`).
4. Entra a esa base de datos → pestaña **Importar** → selecciona el archivo
   `backend/sql/bd.sql` de este proyecto → **Continuar**.
   Esto crea todas las tablas (`usuarios`, `productos`, `servicios`,
   `carritos`, `pedidos`, etc.) y deja precargados 10 productos de
   maquillaje y 3 servicios de ejemplo.
5. Revisa el archivo `backend/.env`: por defecto XAMPP usa el usuario
   `root` sin contraseña en el puerto `3306`, que es justo lo que ya trae
   configurado:

   ```
   DATABASE_URL=mysql+pymysql://root:@localhost:3306/cherry_maquillaje
   ```

   Si tu instalación de XAMPP tiene otra contraseña de MySQL o corre en
   otro puerto, ajusta esta línea (formato:
   `mysql+pymysql://usuario:password@host:puerto/nombre_bd`).

## 3. Instalación paso a paso

### 3.1. Crear y activar el entorno virtual

```bash
cd backend
python -m venv venv
```

Windows:
```bash
venv\Scripts\activate
```

Linux/Mac:
```bash
source venv/bin/activate
```

### 3.2. Instalar dependencias

```bash
pip install -r requirements.txt
```

Esto instala FastAPI, Uvicorn, SQLAlchemy, PyMySQL (el driver que conecta
con MySQL/XAMPP), bcrypt, python-jose (JWT), pydantic, etc. No necesitas
instalar nada más manualmente.

### 3.3. Variables de entorno

El archivo `backend/.env` ya viene con valores por defecto listos para
XAMPP. Solo revisa/ajusta si lo necesitas:

```
DATABASE_URL=mysql+pymysql://root:@localhost:3306/cherry_maquillaje
SECRET_KEY=cambia_esta_clave_secreta_por_una_generada_con_secrets.token_hex(32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=http://localhost:5173

BREVO_SMTP_HOST=smtp.gmail.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=tu_correo@gmail.com
BREVO_SMTP_KEY=tu_clave_de_aplicacion
EMAIL_FROM=tu_correo@gmail.com
```

- `SECRET_KEY`: cámbiala por una clave propia (en Python:
  `import secrets; secrets.token_hex(32)`).
- Los datos `BREVO_SMTP_*` solo son necesarios para que el correo de
  "recuperar contraseña" se envíe de verdad. Si los dejas vacíos o de
  ejemplo, el backend igual funciona: el código de recuperación se
  imprime en la consola del backend en vez de enviarse por correo (muy
  útil mientras pruebas en local).

### 3.4. Base de datos

Ya la creaste en el paso 2 importando `sql/bd.sql` desde phpMyAdmin. Al
iniciar el backend (paso 3.5), FastAPI también revisa que las tablas
existan (`Base.metadata.create_all`), pero eso **no reemplaza** haber
importado el `.sql` — hazlo siempre primero.

### 3.5. Crear el primer usuario administrador

El registro público (`/api/usuarios/registro`) solo crea clientes, así que
para entrar al panel de administrador usa el script incluido:

```bash
python crear_admin.py
```

Por defecto crea:
- correo: `admin@cherrybeauty.com`
- contraseña: `Admin_2026*`

(Puedes cambiar estos valores editando las constantes al inicio de
`crear_admin.py` antes de ejecutarlo.)

Para crear un usuario **empleado**, regístrate normalmente desde el
frontend (queda como "cliente") y luego, ya logueado como administrador,
entra al panel admin → Usuarios → cambia su rol a "empleado".

### 3.6. Ejecutar el servidor

```bash
uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000
- Documentación interactiva (Swagger): http://127.0.0.1:8000/docs

## 4. Cómo funciona el CRUD de productos (agregar / eliminar)

Todo ya está conectado de punta a punta, no hay que tocar código:

- El **panel de administrador y empleado** (`/admin` y `/empleado` en el
  frontend) llaman a estos endpoints:
  - `GET /api/productos/admin/todos` — lista todo el catálogo (incluye no
    disponibles).
  - `POST /api/productos` — crea un producto nuevo.
  - `PUT /api/productos/{id}` — edita un producto.
  - `DELETE /api/productos/{id}` — elimina un producto (si tiene pedidos o
    carritos asociados, el backend te pide marcarlo como "no disponible"
    en su lugar, para no romper el historial de pedidos).
- El catálogo público (`/productos` en el frontend) usa
  `GET /api/productos`, que solo trae los que están `disponible = 1`.

Es decir: cualquier producto que agregues o elimines desde el panel de
administrador se refleja automáticamente en la base de datos
`cherry_maquillaje` y en la tienda — no necesitas editar el `.sql` ni el
código para gestionar el catálogo día a día.

## 5. Endpoints principales

| Método | Ruta                            | Acceso                            |
|--------|----------------------------------|------------------------------------|
| POST   | /api/usuarios/registro           | Público (crea un cliente)          |
| POST   | /api/auth/login                  | Público                            |
| GET    | /api/usuarios/me/perfil          | Usuario autenticado (cualquiera)   |
| GET    | /api/usuarios                    | Administrador, empleado            |
| PATCH  | /api/usuarios/{id}/estado         | Administrador                      |
| DELETE | /api/usuarios/{id}                | Administrador                      |
| GET    | /api/productos                   | Público                            |
| GET    | /api/productos/admin/todos       | Administrador, empleado            |
| POST   | /api/productos                   | Administrador, empleado            |
| PUT    | /api/productos/{id}                | Administrador, empleado            |
| DELETE | /api/productos/{id}                | Administrador                      |
| GET    | /api/servicios                   | Público                            |
| POST   | /api/servicios                   | Administrador, empleado            |
| GET    | /api/carrito                     | Cliente autenticado                |
| POST   | /api/pedidos                     | Cliente autenticado                |
| GET    | /api/pedidos                     | Administrador, empleado (todos) / Cliente (los suyos) |

## 6. Notas de seguridad

- Las contraseñas nunca se almacenan en texto plano: se guardan como hash
  bcrypt (`$2b$12$...`).
- El archivo `.env` real **no debe subirse** a ningún repositorio público
  (ya está en `.gitignore`).
- La autorización de roles siempre se valida en el backend, aunque el
  frontend también oculte opciones según el rol.
