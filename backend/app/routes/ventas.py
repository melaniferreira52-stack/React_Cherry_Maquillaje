from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..models import (
    DetalleVenta,
    Pedido,
    PedidoItem,
    PedidoServicio,
    Usuario,
    Venta,
)
from ..schemas import VentaCrear, VentaEstadoUpdate

router = APIRouter(prefix="/api/ventas", tags=["Ventas"])


def _venta_a_dict(venta: Venta, incluir_detalles: bool = False) -> dict:
    datos = {
        "id": venta.id,
        "pedido_id": venta.pedido_id,
        "usuario_id": venta.usuario_id,
        "cliente_nombre": venta.cliente_nombre,
        "cliente_apellido": venta.cliente_apellido,
        "cliente_correo": venta.cliente_correo,
        "subtotal": venta.subtotal,
        "descuento": venta.descuento,
        "impuestos": venta.impuestos,
        "total": venta.total,
        "estado": venta.estado,
        "fecha_hora": venta.fecha_hora,
    }
    if incluir_detalles:
        datos["detalles"] = [
            {
                "id": d.id,
                "tipo": d.tipo,
                "producto_id": d.producto_id,
                "servicio_id": d.servicio_id,
                "nombre_item": d.nombre_item,
                "cantidad": d.cantidad,
                "precio_unitario": d.precio_unitario,
                "subtotal": d.subtotal,
            }
            for d in venta.detalles
        ]
    return datos


@router.post("", status_code=status.HTTP_201_CREATED)
def registrar_venta(
    datos: VentaCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Registra una venta manualmente a partir de un pedido existente si no fue generada automáticamente."""
    if db.query(Venta).filter(Venta.pedido_id == datos.pedido_id).first():
        raise HTTPException(
            status_code=400,
            detail="Este pedido ya tiene una venta registrada",
        )

    pedido = (
        db.query(Pedido)
        .options(
            joinedload(Pedido.items),
            joinedload(Pedido.servicios),
            joinedload(Pedido.usuario),
        )
        .filter(Pedido.id == datos.pedido_id)
        .first()
    )
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    if pedido.estado == "cancelado":
        raise HTTPException(
            status_code=400, detail="No se puede registrar una venta de un pedido cancelado"
        )

    cliente = pedido.usuario.cliente if pedido.usuario else None
    cliente_nombre = cliente.nombre if cliente else (pedido.usuario.nombre if pedido.usuario else "Desconocido")
    cliente_apellido = cliente.apellido if cliente else None
    cliente_correo = pedido.usuario.correo if pedido.usuario else None
    if not cliente_correo:
        raise HTTPException(status_code=404, detail="El pedido no tiene cliente asociado")

    subtotal = sum(
        float(item.precio_unitario) * item.cantidad for item in pedido.items
    ) + sum(float(ps.precio_unitario) for ps in pedido.servicios)

    descuento = float(datos.descuento or 0)
    impuestos = float(datos.impuestos or 0)
    total = subtotal - descuento + impuestos
    if total < 0:
        raise HTTPException(status_code=400, detail="El descuento no puede superar el subtotal")

    venta = Venta(
        pedido_id=pedido.id,
        usuario_id=usuario_actual.id,
        cliente_nombre=cliente_nombre,
        cliente_apellido=cliente_apellido,
        cliente_correo=cliente_correo,
        subtotal=subtotal,
        descuento=descuento,
        impuestos=impuestos,
        total=total,
        estado="registrada",
    )
    db.add(venta)
    db.flush()

    for item in pedido.items:
        db.add(
            DetalleVenta(
                venta_id=venta.id,
                tipo="producto",
                producto_id=item.producto_id,
                servicio_id=None,
                nombre_item=item.nombre_producto,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                subtotal=float(item.precio_unitario) * item.cantidad,
            )
        )
    for ps in pedido.servicios:
        db.add(
            DetalleVenta(
                venta_id=venta.id,
                tipo="servicio",
                producto_id=None,
                servicio_id=ps.servicio_id,
                nombre_item=ps.servicio.nombre if ps.servicio else "Servicio",
                cantidad=1,
                precio_unitario=ps.precio_unitario,
                subtotal=float(ps.precio_unitario),
            )
        )

    if pedido.estado == "pendiente":
        pedido.estado = "en_proceso"

    db.commit()
    db.refresh(venta)
    return {"venta": _venta_a_dict(venta, incluir_detalles=True)}


@router.get("")
def listar_ventas(
    fecha_desde: Optional[date] = Query(None, alias="fecha_desde"),
    fecha_hasta: Optional[date] = Query(None, alias="fecha_hasta"),
    cliente: Optional[str] = Query(None),
    producto: Optional[str] = Query(None),
    servicio: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    valor_min: Optional[float] = Query(None, alias="valor_min"),
    valor_max: Optional[float] = Query(None, alias="valor_max"),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Historial de ventas con filtros por fecha, cliente, producto, servicio, estado y valor."""
    consulta = db.query(Venta).options(joinedload(Venta.detalles))

    if fecha_desde:
        consulta = consulta.filter(Venta.fecha_hora >= datetime.combine(fecha_desde, datetime.min.time()))
    if fecha_hasta:
        consulta = consulta.filter(Venta.fecha_hora <= datetime.combine(fecha_hasta, datetime.max.time()))
    if cliente:
        consulta = consulta.filter(Venta.cliente_correo.ilike(f"%{cliente}%"))
    if estado:
        consulta = consulta.filter(Venta.estado == estado)
    if valor_min is not None:
        consulta = consulta.filter(Venta.total >= valor_min)
    if valor_max is not None:
        consulta = consulta.filter(Venta.total <= valor_max)
    if producto:
        consulta = consulta.join(DetalleVenta).filter(
            DetalleVenta.tipo == "producto",
            DetalleVenta.nombre_item.ilike(f"%{producto}%"),
        )
    if servicio:
        consulta = consulta.join(DetalleVenta).filter(
            DetalleVenta.tipo == "servicio",
            DetalleVenta.nombre_item.ilike(f"%{servicio}%"),
        )

    ventas = consulta.order_by(Venta.fecha_hora.desc()).all()
    return {"ventas": [_venta_a_dict(v, incluir_detalles=True) for v in ventas]}


@router.get("/mias")
def mis_ventas(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """El cliente consulta sus propias ventas."""
    ventas = (
        db.query(Venta)
        .options(joinedload(Venta.detalles))
        .filter(Venta.usuario_id == usuario_actual.id)
        .order_by(Venta.fecha_hora.desc())
        .all()
    )
    return {"ventas": [_venta_a_dict(v, incluir_detalles=True) for v in ventas]}


@router.get("/{id_venta}")
def obtener_venta(
    id_venta: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    venta = (
        db.query(Venta)
        .options(joinedload(Venta.detalles))
        .filter(Venta.id == id_venta)
        .first()
    )
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if usuario_actual.rol not in ("administrador", "empleado") and venta.usuario_id != usuario_actual.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver esta venta")
    return {"venta": _venta_a_dict(venta, incluir_detalles=True)}


@router.patch("/{id_venta}/estado")
def actualizar_estado_venta(
    id_venta: int,
    datos: VentaEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador")),
):
    venta = db.query(Venta).filter(Venta.id == id_venta).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    venta.estado = datos.estado
    db.commit()
    db.refresh(venta)
    return {"venta": _venta_a_dict(venta)}