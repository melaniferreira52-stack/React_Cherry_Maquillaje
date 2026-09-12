from sqlalchemy import (
    Column,
    Integer,
    String,
    Enum,
    Boolean,
    Numeric,
    DateTime,
    ForeignKey,
    TIMESTAMP,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False, default="")  # legado; el perfil real vive en Cliente
    correo = Column(String(150), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    rol = Column(Enum("cliente", "empleado", "administrador"), nullable=False, default="cliente")
    estado = Column(Enum("activo", "inactivo"), nullable=False, default="activo")

    # Recuperación de contraseña. Reutilizamos estas 2 columnas ya existentes
    # para guardar el código de 6 dígitos (no un token largo por enlace).
    reset_token = Column(String(255), nullable=True)
    reset_token_expira = Column(DateTime, nullable=True)

    fecha_registro = Column(TIMESTAMP, server_default=func.now())

    cliente = relationship(
        "Cliente", back_populates="usuario", uselist=False, cascade="all, delete-orphan"
    )
    carrito = relationship(
        "Carrito", back_populates="usuario", uselist=False, cascade="all, delete-orphan"
    )


class Cliente(Base):
    """Datos de perfil (nombre, documento, contacto) de cada usuario registrado."""

    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), unique=True, nullable=False)
    nombre = Column(String(60), nullable=False)
    apellido = Column(String(60), nullable=False)
    tipo_documento = Column(Enum("CC", "TI", "CE", "PA"), nullable=False)
    numero_documento = Column(String(20), unique=True, nullable=False)
    direccion = Column(String(150), nullable=False)
    telefono = Column(String(15), nullable=False)
    creado_en = Column(TIMESTAMP, server_default=func.now())

    usuario = relationship("Usuario", back_populates="cliente")


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    slug = Column(String(40), unique=True, nullable=False)
    nombre = Column(String(60), nullable=False)
    descripcion = Column(String(255), nullable=False)
    precio = Column(Numeric(10, 2), nullable=False)
    imagen_url = Column(String(255), nullable=True)
    disponible = Column(Boolean, default=True)
    creado_en = Column(TIMESTAMP, server_default=func.now())


class Servicio(Base):
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(60), nullable=False)
    descripcion = Column(String(255), nullable=False)
    precio = Column(Numeric(10, 2), default=0)
    disponible = Column(Boolean, default=True)
    creado_en = Column(TIMESTAMP, server_default=func.now())


class Carrito(Base):
    __tablename__ = "carritos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), unique=True, nullable=False)
    creado_en = Column(TIMESTAMP, server_default=func.now())

    usuario = relationship("Usuario", back_populates="carrito")
    items = relationship("CarritoItem", back_populates="carrito", cascade="all, delete-orphan")


class CarritoItem(Base):
    __tablename__ = "carrito_items"
    __table_args__ = (UniqueConstraint("carrito_id", "producto_id", name="unico_producto_por_carrito"),)

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    carrito_id = Column(Integer, ForeignKey("carritos.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    agregado_en = Column(TIMESTAMP, server_default=func.now())

    carrito = relationship("Carrito", back_populates="items")
    producto = relationship("Producto")


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    estado = Column(
        Enum("pendiente", "en_proceso", "entregado", "cancelado"),
        nullable=False,
        default="pendiente",
    )
    metodo_pago = Column(
        Enum("efectivo", "tarjeta", "transferencia"),
        nullable=False,
        default="efectivo",
    )
    total = Column(Numeric(10, 2), nullable=False)
    creado_en = Column(TIMESTAMP, server_default=func.now())
    actualizado_en = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    usuario = relationship("Usuario")
    items = relationship("PedidoItem", back_populates="pedido", cascade="all, delete-orphan")
    servicios = relationship("PedidoServicio", back_populates="pedido", cascade="all, delete-orphan")


class PedidoItem(Base):
    __tablename__ = "pedido_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    nombre_producto = Column(String(60), nullable=False)  # snapshot al momento del pedido
    precio_unitario = Column(Numeric(10, 2), nullable=False)
    cantidad = Column(Integer, nullable=False)

    pedido = relationship("Pedido", back_populates="items")


class PedidoServicio(Base):
    __tablename__ = "pedido_servicios"
    __table_args__ = (UniqueConstraint("pedido_id", "servicio_id", name="unico_servicio_por_pedido"),)

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    servicio_id = Column(Integer, ForeignKey("servicios.id"), nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)

    pedido = relationship("Pedido", back_populates="servicios")
    servicio = relationship("Servicio")