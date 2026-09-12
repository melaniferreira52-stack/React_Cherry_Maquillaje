# Frontend — Cherry Beauty (React + Vite + Tailwind)

Tienda de maquillaje construida con **React 19**, **Vite**, **Tailwind CSS
v4** y **React Router DOM**. Consume la API de `backend/` (FastAPI + MySQL).

## 1. Instalación

```bash
cd frontend
npm install
```

Esto instala React, React Router DOM y Tailwind (ya declarados en
`package.json`), no necesitas agregar nada manualmente.

## 2. Variables de entorno

El archivo `frontend/.env` ya viene configurado para desarrollo local:

```
VITE_API_URL=http://localhost:8000/api
```

Debe apuntar a donde esté corriendo el backend (ver README de `backend/`).
Si despliegas el backend en otra URL/puerto, cambia este valor.

## 3. Ejecutar en desarrollo

```bash
npm run dev
```

Por defecto abre en http://localhost:5173

> Importante: el backend debe estar corriendo (`uvicorn app.main:app
> --reload`) y conectado a la base de datos `cherry_maquillaje` en XAMPP
> para que el catálogo, el login y los paneles funcionen.

## 4. Estructura relevante

```
frontend/src/
├── assets/img/          # Logo + imágenes de productos (ver sección 5)
├── components/          # Header, Footer, Carrusel, formularios, panel Admin...
├── context/AuthContext.jsx
├── data/productos.js    # Catálogo local (nombres, descripciones e imágenes
│                         # que se muestran junto a los datos que vienen del
│                         # backend — el "id" debe coincidir con el "slug"
│                         # del producto en la base de datos)
├── lib/api.js            # Cliente centralizado que llama a la API
├── pages/                # Rutas: Inicio, Productos, Servicios, Login...
│   └── admin/             # Panel de administrador
└── index.css              # Tokens de la paleta de color (rosa / blanco / rojo cherry)
```

## 5. Imágenes — cómo poner tus fotos reales

En `frontend/src/assets/img/` ya dejé una imagen "placeholder" (con el
nombre correcto) por cada producto de ejemplo:

| Archivo                    | Producto                     |
|-----------------------------|-------------------------------|
| `labial-cherry.jpg`         | Labial Cherry Red             |
| `base-natural.jpg`          | Base Líquida Natural           |
| `rubor-rosa.jpg`             | Rubor en Polvo Rosa            |
| `sombras-nude.jpg`           | Paleta de Sombras Nude         |
| `delineador-negro.jpg`       | Delineador Líquido Negro       |
| `mascara-pestanas.jpg`       | Máscara de Pestañas            |
| `brocha-set.jpg`             | Set de Brochas Profesionales   |
| `gloss-labial.jpg`           | Gloss Labial Brillante         |
| `corrector.jpg`              | Corrector Líquido              |
| `paleta-especial.jpg`        | Paleta Especial Cherry Edition |
| `logo.png`                   | Logo de Cherry Beauty (ya diseñado, no hace falta cambiarlo) |

Para poner tu foto real de cada producto: **reemplaza el archivo
manteniendo exactamente el mismo nombre** (por ejemplo, sobrescribe
`labial-cherry.jpg` con tu propia foto de labial, en formato `.jpg`). No
necesitas tocar ningún código — `data/productos.js` ya importa cada imagen
por su nombre de archivo.

Si agregas un producto **nuevo** desde el panel de administrador (que se
guarda en la base de datos), la foto que subas ahí se maneja por separado
mediante el campo `imagen_url` de cada producto — no necesita estar en
esta carpeta.

## 6. Paneles según rol

- `/admin` → solo rol **administrador**: gestión de productos, servicios,
  usuarios y pedidos.
- `/empleado` → **administrador y empleado**: gestión de productos,
  servicios y pedidos.
- `/mi-cuenta` → cualquier cliente logueado: su perfil y pedidos.

El rol de cada usuario se guarda en la base de datos (tabla `usuarios`,
columna `rol`) y se asigna desde el panel de administrador.
