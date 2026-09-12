from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import hash_password
from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..models import Cliente, Usuario
from ..schemas import UsuarioEstadoUpdate, UsuarioUpdate, usuario_a_out

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])

ROLES_VALIDOS = ("cliente", "empleado", "administrador")


class UsuarioCrearAdmin(BaseModel):
    nombre: str
    apellido: str | None = None
    correo: str
    contrasena: str
    rol: str = "cliente"


@router.post("", status_code=status.HTTP_201_CREATED)
def crear_usuario(
    datos: UsuarioCrearAdmin,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador")),
):
    """Un administrador crea una cuenta manualmente (sin pasar por /api/registro).
    No se crea fila en `clientes` -- igual que los usuarios sembrados a mano,
    el nombre se guarda en el campo legado `usuarios.nombre`."""
    if datos.rol not in ROLES_VALIDOS:
        raise HTTPException(status_code=400, detail="Rol inválido")

    if not datos.contrasena or len(datos.contrasena) < 6:
        raise HTTPException(
            status_code=400, detail="La contraseña debe tener al menos 6 caracteres"
        )

    if db.query(Usuario).filter(Usuario.correo == datos.correo).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    nombre_completo = datos.nombre.strip()
    if datos.apellido:
        nombre_completo = f"{nombre_completo} {datos.apellido.strip()}".strip()

    nuevo_usuario = Usuario(
        nombre=nombre_completo,
        correo=datos.correo,
        password=hash_password(datos.contrasena),
        rol=datos.rol,
        estado="activo",
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return {"usuario": usuario_a_out(nuevo_usuario)}


@router.get("")
def listar_usuarios(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Solo administradores y empleados pueden listar todos los usuarios."""
    usuarios = db.query(Usuario).all()
    return {"usuarios": [usuario_a_out(u) for u in usuarios]}


@router.get("/{id_usuario}")
def obtener_usuario(
    id_usuario: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    if usuario_actual.rol not in ("administrador", "empleado") and usuario_actual.id != id_usuario:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver este usuario")

    usuario = db.query(Usuario).filter(Usuario.id == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"usuario": usuario_a_out(usuario)}


@router.put("/{id_usuario}")
def actualizar_usuario(
    id_usuario: int,
    datos: UsuarioUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """El propio usuario puede editar sus datos; solo un administrador puede cambiar el rol."""
    es_admin = usuario_actual.rol == "administrador"

    if not es_admin and usuario_actual.id != id_usuario:
        raise HTTPException(status_code=403, detail="No tienes permisos para editar este usuario")

    if datos.rol is not None and not es_admin:
        raise HTTPException(status_code=403, detail="Solo un administrador puede cambiar el rol")

    usuario = db.query(Usuario).filter(Usuario.id == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if datos.correo and datos.correo != usuario.correo:
        if db.query(Usuario).filter(Usuario.correo == datos.correo).first():
            raise HTTPException(status_code=400, detail="El correo ya está en uso")
        usuario.correo = datos.correo

    if datos.rol is not None:
        usuario.rol = datos.rol

    cliente = usuario.cliente
    if cliente:
        if datos.nombre is not None:
            cliente.nombre = datos.nombre
        if datos.apellido is not None:
            cliente.apellido = datos.apellido
        if datos.direccion is not None:
            cliente.direccion = datos.direccion
        if datos.telefono is not None:
            cliente.telefono = datos.telefono
    elif datos.nombre is not None:
        # Usuarios sin fila en `clientes` (p. ej. sembrados manualmente): usamos el campo legado.
        usuario.nombre = datos.nombre

    db.commit()
    db.refresh(usuario)
    return {"usuario": usuario_a_out(usuario)}


@router.patch("/{id_usuario}/estado")
def cambiar_estado_usuario(
    id_usuario: int,
    datos: UsuarioEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador")),
):
    usuario = db.query(Usuario).filter(Usuario.id == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario.estado = datos.estado
    db.commit()
    db.refresh(usuario)
    return {"usuario": usuario_a_out(usuario)}


@router.delete("/{id_usuario}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_usuario(
    id_usuario: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador")),
):
    if id_usuario == usuario_actual.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propio usuario")

    usuario = db.query(Usuario).filter(Usuario.id == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    db.delete(usuario)  # ON DELETE CASCADE ya elimina su fila en `clientes`, `carritos`, etc.
    db.commit()
    return None