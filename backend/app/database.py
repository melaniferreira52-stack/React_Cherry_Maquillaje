import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL no está configurada. Verifica tu archivo .env"
    )

engine = create_engine(
    DATABASE_URL,
    echo=False,          # cambia a True si quieres ver el SQL generado en consola
    pool_pre_ping=True,  # evita errores por conexiones caídas (MySQL "gone away")
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    """
    Dependencia de FastAPI que entrega una sesión de base de datos
    y garantiza que se cierre al finalizar la petición.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
