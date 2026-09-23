from datetime import date, datetime, time, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..models import (
    DetalleVenta,
    Factura,
    PQR,
    Pedido,
    Producto,
    Servicio,
    Usuario,
    Venta,
)

router = APIRouter(prefix="/api/estadisticas", tags=["Estadísticas"])


def _cards_administrador(db: Session) -> list[dict]:
    total_usuarios = db.query(func.count(Usuario.id)).scalar() or 0
    total_productos = db.query(func.count(Producto.id)).scalar() or 0
    total_servicios = db.query(func.count(Servicio.id)).scalar() or 0
    total_pedidos = db.query(func.count(Pedido.id)).scalar() or 0
    total_ventas = db.query(func.count(Venta.id)).scalar() or 0
    total_facturas = db.query(func.count(Factura.id)).scalar() or 0
    total_pqr = db.query(func.count(PQR.id)).scalar() or 0
    pqr_pendientes = (
        db.query(func.count(PQR.id)).filter(PQR.estado == "pendiente").scalar() or 0
    )
    return [
        {"etiqueta": "Usuarios", "valor": total_usuarios, "icono": "👤", "color": "sky"},
        {"etiqueta": "Productos", "valor": total_productos, "icono": "🍦", "color": "rose"},
        {"etiqueta": "Servicios", "valor": total_servicios, "icono": "🎉", "color": "amber"},
        {"etiqueta": "Pedidos", "valor": total_pedidos, "icono": "🧾", "color": "emerald"},
        {"etiqueta": "Ventas", "valor": total_ventas, "icono": "💰", "color": "violet"},
        {"etiqueta": "Facturas", "valor": total_facturas, "icono": "📄", "color": "indigo"},
        {"etiqueta": "PQR recibidas", "valor": total_pqr, "icono": "📥", "color": "cyan"},
        {"etiqueta": "PQR pendientes", "valor": pqr_pendientes, "icono": "⏳", "color": "orange"},
    ]


def _query_ventas_filtradas(
    db: Session,
    desde: datetime,
    hasta: datetime,
    estado: Optional[str],
    cliente: Optional[str],
    producto: Optional[str],
    servicio: Optional[str],
):
    """Query base de Venta aplicando los 6 filtros del requisito 13:
    fecha inicial, fecha final, producto, servicio, estado y cliente."""
    q = db.query(Venta).filter(Venta.fecha_hora >= desde, Venta.fecha_hora <= hasta)

    if estado:
        q = q.filter(Venta.estado == estado)
    else:
        q = q.filter(Venta.estado == "registrada")

    if cliente:
        like = f"%{cliente}%"
        q = q.filter(
            (Venta.cliente_nombre.ilike(like))
            | (Venta.cliente_apellido.ilike(like))
            | (Venta.cliente_correo.ilike(like))
        )

    if producto:
        ids_producto = db.query(DetalleVenta.venta_id).filter(
            DetalleVenta.tipo == "producto",
            DetalleVenta.nombre_item.ilike(f"%{producto}%"),
        )
        q = q.filter(Venta.id.in_(ids_producto))

    if servicio:
        ids_servicio = db.query(DetalleVenta.venta_id).filter(
            DetalleVenta.tipo == "servicio",
            DetalleVenta.nombre_item.ilike(f"%{servicio}%"),
        )
        q = q.filter(Venta.id.in_(ids_servicio))

    return q


def _ventas_por_periodo(ventas: list[Venta], agrupacion: str) -> list[dict]:
    """Agrupa ventas por día, semana o mes (req. 11)."""
    buckets: dict[str, float] = {}
    for venta in ventas:
        fecha_hora = venta.fecha_hora
        if not fecha_hora:
            continue
        if agrupacion == "mes":
            clave = fecha_hora.strftime("%Y-%m")
        elif agrupacion == "semana":
            lunes = (fecha_hora - timedelta(days=fecha_hora.weekday())).date()
            clave = lunes.isoformat()
        else:  # dia
            clave = fecha_hora.date().isoformat()
        buckets[clave] = buckets.get(clave, 0.0) + float(venta.total)

    salida = []
    for clave in sorted(buckets.keys()):
        if agrupacion == "mes":
            etiqueta = datetime.strptime(clave, "%Y-%m").strftime("%b %Y")
        elif agrupacion == "semana":
            etiqueta = f"Sem {datetime.strptime(clave, '%Y-%m-%d').strftime('%d/%m')}"
        else:
            etiqueta = datetime.strptime(clave, "%Y-%m-%d").strftime("%d/%m")
        salida.append({"clave": clave, "etiqueta": etiqueta, "total": buckets[clave]})
    return salida


def _ventas_por_estado(ventas: list[Venta]) -> list[dict]:
    conteo: dict[str, dict] = {}
    for venta in ventas:
        d = conteo.setdefault(venta.estado, {"cantidad": 0, "total": 0.0})
        d["cantidad"] += 1
        d["total"] += float(venta.total)
    return [{"estado": e, **d} for e, d in conteo.items()]


def _top_productos(db: Session, venta_ids: list[int], limite: int = 5) -> list[dict]:
    if not venta_ids:
        return []
    filas = (
        db.query(
            DetalleVenta.nombre_item,
            func.sum(DetalleVenta.cantidad),
            func.sum(DetalleVenta.subtotal),
        )
        .filter(DetalleVenta.tipo == "producto", DetalleVenta.venta_id.in_(venta_ids))
        .group_by(DetalleVenta.nombre_item)
        .order_by(func.sum(DetalleVenta.subtotal).desc())
        .limit(limite)
        .all()
    )
    return [{"nombre": n, "cantidad": int(c), "subtotal": float(s)} for n, c, s in filas]


def _pqr_por_estado(db: Session) -> list[dict]:
    filas = db.query(PQR.estado, func.count(PQR.id)).group_by(PQR.estado).all()
    return [{"estado": e, "cantidad": c} for e, c in filas]


def _resolver_filtros_comunes(
    fecha_desde: Optional[date],
    fecha_hasta: Optional[date],
    agrupacion: str,
) -> tuple[datetime, datetime, str]:
    hoy = date.today()
    desde = datetime.combine(fecha_desde or (hoy - timedelta(days=30)), time.min)
    hasta = datetime.combine(fecha_hasta or hoy, time.max)
    if agrupacion not in ("dia", "semana", "mes"):
        agrupacion = "dia"
    return desde, hasta, agrupacion


def _bloque_ventas(
    db: Session,
    desde: datetime,
    hasta: datetime,
    agrupacion: str,
    estado: Optional[str],
    cliente: Optional[str],
    producto: Optional[str],
    servicio: Optional[str],
) -> dict:
    ventas = _query_ventas_filtradas(db, desde, hasta, estado, cliente, producto, servicio).all()
    venta_ids = [v.id for v in ventas]
    return {
        "ventas_por_periodo": _ventas_por_periodo(ventas, agrupacion),
        "ventas_por_estado": _ventas_por_estado(ventas),
        "top_productos": _top_productos(db, venta_ids),
        "filtros": {
            "fecha_desde": desde.date().isoformat(),
            "fecha_hasta": hasta.date().isoformat(),
            "agrupacion": agrupacion,
            "estado": estado,
            "cliente": cliente,
            "producto": producto,
            "servicio": servicio,
        },
    }


@router.get("/admin")
def estadisticas_admin(
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    agrupacion: str = Query("dia"),
    estado: Optional[str] = Query(None),
    cliente: Optional[str] = Query(None),
    producto: Optional[str] = Query(None),
    servicio: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador")),
):
    """Dashboard administrativo: indicadores + series (req. 10, 11, 13, 15)."""
    desde, hasta, agrupacion = _resolver_filtros_comunes(fecha_desde, fecha_hasta, agrupacion)
    bloque = _bloque_ventas(db, desde, hasta, agrupacion, estado, cliente, producto, servicio)
    return {
        "cards": _cards_administrador(db),
        "pqr_por_estado": _pqr_por_estado(db),
        **bloque,
    }


@router.get("/empleado")
def estadisticas_empleado(
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    agrupacion: str = Query("dia"),
    estado: Optional[str] = Query(None),
    cliente: Optional[str] = Query(None),
    producto: Optional[str] = Query(None),
    servicio: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Dashboard del empleado: ventas, facturación y PQR (sin usuarios)."""
    desde, hasta, agrupacion = _resolver_filtros_comunes(fecha_desde, fecha_hasta, agrupacion)
    bloque = _bloque_ventas(db, desde, hasta, agrupacion, estado, cliente, producto, servicio)

    total_ventas = db.query(func.count(Venta.id)).scalar() or 0
    total_facturado = (
        db.query(func.coalesce(func.sum(Venta.total), 0))
        .filter(Venta.estado == "registrada")
        .scalar()
        or 0
    )
    pqr_pendientes = (
        db.query(func.count(PQR.id)).filter(PQR.estado == "pendiente").scalar() or 0
    )

    return {
        "cards": [
            {"etiqueta": "Ventas", "valor": total_ventas, "icono": "💰", "color": "emerald"},
            {"etiqueta": "Facturado", "valor": round(float(total_facturado), 2), "icono": "💵", "color": "amber"},
            {"etiqueta": "PQR pendientes", "valor": pqr_pendientes, "icono": "⏳", "color": "orange"},
            {"etiqueta": "Pedidos", "valor": db.query(func.count(Pedido.id)).scalar() or 0, "icono": "🧾", "color": "sky"},
        ],
        "pqr_por_estado": _pqr_por_estado(db),
        **bloque,
    }


@router.get("/cliente")
def estadisticas_cliente(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Dashboard del cliente: sus ventas, facturas y PQR (req. 12)."""
    ventas = db.query(Venta).filter(Venta.usuario_id == usuario_actual.id).all()
    facturas = (
        db.query(Factura)
        .join(Venta, Venta.id == Factura.venta_id)
        .filter(Venta.usuario_id == usuario_actual.id)
        .all()
    )
    pqr_list = db.query(PQR).filter(PQR.usuario_id == usuario_actual.id).all()

    total_compras = sum(float(v.total) for v in ventas if v.estado == "registrada")
    total_ventas = len([v for v in ventas if v.estado == "registrada"])
    pqr_en_curso = len([p for p in pqr_list if p.estado in ("pendiente", "en_proceso")])

    return {
        "cards": [
            {"etiqueta": "Mis ventas", "valor": total_ventas, "icono": "🧾", "color": "sky"},
            {"etiqueta": "Total comprado", "valor": round(total_compras, 2), "icono": "💵", "color": "emerald"},
            {"etiqueta": "Mis facturas", "valor": len(facturas), "icono": "📄", "color": "indigo"},
            {"etiqueta": "PQR en curso", "valor": pqr_en_curso, "icono": "⏳", "color": "orange"},
        ],
        "ultimas_ventas": [
            {"id": v.id, "total": v.total, "estado": v.estado, "fecha": v.fecha_hora}
            for v in sorted(ventas, key=lambda x: x.fecha_hora or datetime.min, reverse=True)[:5]
        ],
    }