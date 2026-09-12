import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import crear_access_token, hash_password, verify_password
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Cliente, Usuario
from ..schemas import (
    CambiarPasswordRequest,
    LoginRequest,
    SolicitarRecuperacionRequest,
    TokenResponse,
    UsuarioCreate,
    VerificarCodigoRequest,
    usuario_a_out,
)
from ..utils_correo import enviar_codigo_recuperacion

router = APIRouter(prefix="/api", tags=["Autenticación"])


# ---------------------------------------------------------------------------
# REGISTRO PÚBLICO DE CLIENTES  ->  POST /api/registro
# Crea una fila en `usuarios` (credenciales) y otra en `clientes` (perfil)
# ---------------------------------------------------------------------------
@router.post("/registro", status_code=status.HTTP_201_CREATED)
def registro(datos: UsuarioCreate, db: Session = Depends(get_db)):
    if datos.confirmarPassword is not None and datos.confirmarPassword != datos.password:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")

    if db.query(Usuario).filter(Usuario.correo == datos.correo).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    if db.query(Cliente).filter(Cliente.numero_documento == datos.numeroDocumento).first():
        raise HTTPException(status_code=400, detail="El número de documento ya está registrado")

    try:
        nuevo_usuario = Usuario(
            nombre="",  # el nombre real vive en Cliente; se deja vacío como en los registros existentes
            correo=datos.correo,
            password=hash_password(datos.password),
            rol="cliente",
            estado="activo",
        )
        db.add(nuevo_usuario)
        db.flush()  # para obtener nuevo_usuario.id antes del commit

        nuevo_cliente = Cliente(
            usuario_id=nuevo_usuario.id,
            nombre=datos.nombre,
            apellido=datos.apellido,
            tipo_documento=datos.tipoDocumento,
            numero_documento=datos.numeroDocumento,
            direccion=datos.direccion,
            telefono=datos.telefono,
        )
        db.add(nuevo_cliente)
        db.commit()
        db.refresh(nuevo_usuario)
        return {"usuario": usuario_a_out(nuevo_usuario)}
    except ValueError as error:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(error))
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="No fue posible registrar el usuario")


# ---------------------------------------------------------------------------
# LOGIN  ->  POST /api/login
# ---------------------------------------------------------------------------
@router.post("/login", response_model=TokenResponse)
def login(credenciales: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.correo == credenciales.correo).first()

    credenciales_incorrectas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Correo o contraseña incorrectos",
    )

    if not usuario or not verify_password(credenciales.password, usuario.password):
        raise credenciales_incorrectas

    if usuario.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario se encuentra inactivo",
        )

    token = crear_access_token(
        data={"sub": usuario.correo, "id_usuario": usuario.id, "rol": usuario.rol}
    )

    return TokenResponse(token=token, usuario=usuario_a_out(usuario))


# ---------------------------------------------------------------------------
# PERFIL DEL USUARIO AUTENTICADO  ->  GET /api/perfil
# ---------------------------------------------------------------------------
@router.get("/perfil")
def perfil(usuario_actual: Usuario = Depends(get_current_user)):
    return {"usuario": usuario_a_out(usuario_actual)}


# ---------------------------------------------------------------------------
# RECUPERACIÓN DE CONTRASEÑA (código de 6 dígitos por correo)
# Reutiliza las columnas existentes reset_token / reset_token_expira.
# ---------------------------------------------------------------------------
@router.post("/recuperar-password")
def recuperar_password(datos: SolicitarRecuperacionRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.correo == datos.correo).first()

    # Por seguridad, siempre respondemos igual exista o no el correo.
    if usuario:
        codigo = f"{random.randint(0, 999999):06d}"
        usuario.reset_token = codigo
        usuario.reset_token_expira = datetime.utcnow() + timedelta(minutes=10)
        db.commit()
        nombre_para_correo = usuario.cliente.nombre if usuario.cliente else usuario.correo
        enviar_codigo_recuperacion(usuario.correo, nombre_para_correo, codigo)

    return {"mensaje": "Si el correo está registrado, recibirás un código de 6 dígitos."}


@router.post("/verificar-codigo")
def verificar_codigo(datos: VerificarCodigoRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.correo == datos.correo).first()

    error_codigo = HTTPException(status_code=400, detail="El código es incorrecto o ya expiró")

    if not usuario or not usuario.reset_token:
        raise error_codigo
    if usuario.reset_token != datos.codigo:
        raise error_codigo
    if not usuario.reset_token_expira or usuario.reset_token_expira < datetime.utcnow():
        raise error_codigo

    return {"mensaje": "Código verificado correctamente"}


@router.post("/cambiar-password")
def cambiar_password(datos: CambiarPasswordRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.correo == datos.correo).first()

    error_codigo = HTTPException(status_code=400, detail="El código es incorrecto o ya expiró")

    codigo_recibido = datos.codigo or datos.token
    if not usuario or not usuario.reset_token or not codigo_recibido:
        raise error_codigo
    if usuario.reset_token != codigo_recibido:
        raise error_codigo
    if not usuario.reset_token_expira or usuario.reset_token_expira < datetime.utcnow():
        raise error_codigo

    usuario.password = hash_password(datos.nuevaPassword)
    usuario.reset_token = None
    usuario.reset_token_expira = None
    db.commit()

    return {"mensaje": "Contraseña actualizada correctamente"}
