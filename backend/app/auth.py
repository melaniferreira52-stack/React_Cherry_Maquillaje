import os
from datetime import datetime, timedelta, timezone

import bcrypt
from dotenv import load_dotenv
from jose import JWTError, jwt

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY no está configurada. Verifica tu archivo .env")


# ---------------------------------------------------------------------------
# HASHING DE CONTRASEÑAS
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    """
    Genera un hash seguro de la contraseña.
    bcrypt trabaja con un máximo de 72 bytes.
    """
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        raise ValueError("La contraseña no puede superar los 72 bytes.")

    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    password_bytes = password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


# ---------------------------------------------------------------------------
# JSON WEB TOKEN
# ---------------------------------------------------------------------------
def crear_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Crea un JWT firmado. El payload típico incluye:
    sub (email), id_usuario, rol, exp
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decodificar_token(token: str) -> dict:
    """
    Decodifica y valida el token. Lanza JWTError si es inválido/expirado.
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])