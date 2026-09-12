import re
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


class UsuarioCreate(BaseModel):
    """Coincide con el formulario RegisterForm.jsx del frontend."""

    nombre: str = Field(min_length=2, max_length=60)
    apellido: str = Field(min_length=2, max_length=60)
    tipoDocumento: str
    numeroDocumento: str = Field(min_length=5, max_length=20)
    direccion: str = Field(min_length=3, max_length=150)
    telefono: str
    correo: EmailStr
    password: str = Field(min_length=8, max_length=72)
    confirmarPassword: Optional[str] = None

    @field_validator("tipoDocumento")
    @classmethod
    def validar_tipo_documento(cls, v: str) -> str:
        v = v.upper()
        if v not in ("CC", "TI", "CE", "PA"):
            raise ValueError("tipoDocumento debe ser uno de: CC, TI, CE, PA")
        return v

    @field_validator("numeroDocumento")
    @classmethod
    def validar_numero_documento(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("El número de documento solo debe contener dígitos")
        return v

    @field_validator("telefono")
    @classmethod
    def validar_telefono(cls, v: str) -> str:
        if not re.fullmatch(r"\d{7,15}", v):
            raise ValueError("El teléfono debe contener entre 7 y 15 dígitos")
        return v

    @field_validator("password")
    @classmethod
    def validar_password(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("La contraseña debe tener al menos una mayúscula")
        if not re.search(r"[a-z]", v):
            raise ValueError("La contraseña debe tener al menos una minúscula")
        if not re.search(r"\d", v):
            raise ValueError("La contraseña debe tener al menos un número")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("La contraseña debe tener al menos un carácter especial")
        return v


class UsuarioUpdate(BaseModel):
    """PUT /usuarios/:id — admin puede incluir 'rol'; el propio usuario solo sus datos."""

    nombre: Optional[str] = Field(default=None, min_length=2, max_length=60)
    apellido: Optional[str] = Field(default=None, min_length=2, max_length=60)
    direccion: Optional[str] = Field(default=None, max_length=150)
    telefono: Optional[str] = None
    correo: Optional[EmailStr] = None
    rol: Optional[str] = None

    @field_validator("rol")
    @classmethod
    def validar_rol(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("cliente", "empleado", "administrador"):
            raise ValueError("rol debe ser uno de: cliente, empleado, administrador")
        return v


class UsuarioEstadoUpdate(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: str) -> str:
        if v not in ("activo", "inactivo"):
            raise ValueError("estado debe ser 'activo' o 'inactivo'")
        return v


class UsuarioOut(BaseModel):
    """Forma que espera el frontend: id, nombre, apellido, correo, rol (plano)."""

    id: int
    nombre: str
    apellido: Optional[str] = None
    correo: EmailStr
    rol: str
    estado: str
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    fecha_registro: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


def usuario_a_out(usuario) -> UsuarioOut:
    cliente = usuario.cliente
    return UsuarioOut(
        id=usuario.id,
        nombre=cliente.nombre if cliente else usuario.nombre,
        apellido=cliente.apellido if cliente else None,
        correo=usuario.correo,
        rol=usuario.rol,
        estado=usuario.estado,
        tipo_documento=cliente.tipo_documento if cliente else None,
        numero_documento=cliente.numero_documento if cliente else None,
        direccion=cliente.direccion if cliente else None,
        telefono=cliente.telefono if cliente else None,
        fecha_registro=usuario.fecha_registro,
    )


# ---------------------------------------------------------------------------
# AUTENTICACIÓN
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    correo: EmailStr
    password: str
    recordar: Optional[bool] = False


class TokenResponse(BaseModel):
    token: str
    usuario: UsuarioOut


class SolicitarRecuperacionRequest(BaseModel):
    correo: EmailStr


class VerificarCodigoRequest(BaseModel):
    correo: EmailStr
    codigo: str = Field(min_length=6, max_length=6)


class CambiarPasswordRequest(BaseModel):
    correo: EmailStr
    codigo: Optional[str] = None
    token: Optional[str] = None  # alias legado, por si llega desde un enlace antiguo
    nuevaPassword: str = Field(min_length=8, max_length=72)

    @field_validator("nuevaPassword")
    @classmethod
    def validar_password(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("La contraseña debe tener al menos una mayúscula")
        if not re.search(r"[a-z]", v):
            raise ValueError("La contraseña debe tener al menos una minúscula")
        if not re.search(r"\d", v):
            raise ValueError("La contraseña debe tener al menos un número")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("La contraseña debe tener al menos un carácter especial")
        return v


# ---------------------------------------------------------------------------
# PRODUCTOS
# ---------------------------------------------------------------------------
class ProductoCreate(BaseModel):
    slug: str = Field(min_length=2, max_length=40)
    nombre: str = Field(min_length=2, max_length=60)
    descripcion: str = Field(min_length=2, max_length=255)
    precio: Decimal = Field(gt=0)
    imagen_url: Optional[str] = None


class ProductoUpdate(BaseModel):
    slug: Optional[str] = Field(default=None, min_length=2, max_length=40)
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=60)
    descripcion: Optional[str] = Field(default=None, min_length=2, max_length=255)
    precio: Optional[Decimal] = Field(default=None, gt=0)
    imagen_url: Optional[str] = None
    disponible: Optional[bool] = None


class ProductoOut(BaseModel):
    id: int
    slug: str
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    imagen_url: Optional[str] = None
    disponible: bool

    model_config = ConfigDict(from_attributes=True)


def producto_a_out(p) -> ProductoOut:
    return ProductoOut(
        id=p.id,
        slug=p.slug,
        nombre=p.nombre,
        descripcion=p.descripcion,
        precio=p.precio,
        imagen_url=p.imagen_url,
        disponible=bool(p.disponible),
    )


# ---------------------------------------------------------------------------
# SERVICIOS
# ---------------------------------------------------------------------------
class ServicioCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=60)
    descripcion: str = Field(min_length=2, max_length=255)
    precio: Decimal = Field(ge=0)


class ServicioUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=60)
    descripcion: Optional[str] = Field(default=None, min_length=2, max_length=255)
    precio: Optional[Decimal] = Field(default=None, ge=0)
    disponible: Optional[bool] = None


class ServicioOut(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    precio: Decimal
    disponible: bool

    model_config = ConfigDict(from_attributes=True)


def servicio_a_out(s) -> ServicioOut:
    return ServicioOut(
        id=s.id,
        nombre=s.nombre,
        descripcion=s.descripcion,
        precio=s.precio,
        disponible=bool(s.disponible),
    )


# ---------------------------------------------------------------------------
# CARRITO
# ---------------------------------------------------------------------------
class CarritoAgregarRequest(BaseModel):
    productoId: int
    cantidad: int = Field(default=1, ge=1)


class CarritoCantidadRequest(BaseModel):
    cantidad: int = Field(ge=1)


class CarritoItemOut(BaseModel):
    item_id: int
    id_producto: int
    nombre: str
    precio: Decimal
    cantidad: int


class CarritoOut(BaseModel):
    items: list[CarritoItemOut]
    total: Decimal


# ---------------------------------------------------------------------------
# PEDIDOS
# ---------------------------------------------------------------------------
class PedidoCrear(BaseModel):
    metodo_pago: str = "efectivo"
    servicios: list[int] = Field(default_factory=list)

    @field_validator("metodo_pago")
    @classmethod
    def validar_metodo_pago(cls, v: str) -> str:
        permitidos = {"efectivo", "tarjeta", "transferencia"}
        if v not in permitidos:
            raise ValueError(f"metodo_pago debe ser uno de: {', '.join(permitidos)}")
        return v


class PedidoEstadoUpdate(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: str) -> str:
        permitidos = {"pendiente", "en_proceso", "entregado", "cancelado"}
        if v not in permitidos:
            raise ValueError(f"estado debe ser uno de: {', '.join(permitidos)}")
        return v


class DetallePedidoOut(BaseModel):
    nombre: str
    precio: Decimal
    cantidad: int


class DetalleServicioOut(BaseModel):
    nombre: str
    precio: Decimal


class PedidoOut(BaseModel):
    id: int
    total: Decimal
    estado: str
    metodo_pago: str
    creado_en: Optional[datetime] = None
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    correo: Optional[str] = None
    detalles: Optional[list[DetallePedidoOut]] = None
    servicios: Optional[list[DetalleServicioOut]] = None