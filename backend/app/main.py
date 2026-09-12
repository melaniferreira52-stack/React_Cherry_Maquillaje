import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routes import auth, carrito, pedidos, productos, servicios, usuarios

load_dotenv()

# Crea las tablas si no existen (además del script bd.sql que puedes ejecutar manualmente)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API Cherry Beauty",
    description="Backend desarrollado con FastAPI, JWT y MySQL, alineado con el frontend React de Cherry Beauty.",
    version="2.0.0",
)

# CORS: permite que el Frontend (React + Vite) consuma la API
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sirve las imágenes subidas desde el panel de administrador
# (backend/uploads/productos/archivo.jpg queda disponible en
# http://127.0.0.1:8000/uploads/productos/archivo.jpg)
CARPETA_UPLOADS = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(os.path.join(CARPETA_UPLOADS, "productos"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=CARPETA_UPLOADS), name="uploads")


# Registro de routers (todos bajo el prefijo /api, tal como lo espera el frontend)
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(productos.router)
app.include_router(servicios.router)
app.include_router(carrito.router)
app.include_router(pedidos.router)


@app.get("/")
def inicio():
    return {
        "success": True,
        "message": "API funcionando correctamente",
    }
