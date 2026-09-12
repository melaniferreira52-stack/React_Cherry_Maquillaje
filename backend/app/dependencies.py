from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from .auth import decodificar_token
from .database import get_db
from .models import Usuario

# tokenUrl es solo referencial para la documentación de Swagger
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Verifica: existencia del token, validez, firma, expiración y usuario asociado.
    """
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decodificar_token(token)
        email: str | None = payload.get("sub")
        if email is None:
            raise credenciales_invalidas
    except JWTError:
        raise credenciales_invalidas

    # CORREGIDO: la columna en el modelo Usuario se llama `correo`, no `email`.
    usuario = db.query(Usuario).filter(Usuario.correo == email).first()
    if usuario is None:
        raise credenciales_invalidas

    if usuario.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no está activo",
        )

    return usuario


def require_roles(*roles_permitidos: str):
    """
    Dependencia parametrizada para restringir endpoints según el rol del
    usuario autenticado. Uso:

        @router.get("/admin-only")
        def endpoint(usuario: Usuario = Depends(require_roles("administrador"))):
            ...
    """

    def verificador(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        # CORREGIDO: `rol` es un Enum de texto plano en el modelo (no una
        # relación con un objeto Rol), así que se compara directamente.
        if usuario.rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción",
            )
        return usuario

    return verificador