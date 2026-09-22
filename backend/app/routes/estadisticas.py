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


def _ventas_por_periodo(
    db: Session,
    desde: datetime,
    hasta: datetime,
    agrupacion: str,
) -> list[dict]:
    """Agrupa ventas por día, semana o mes (req. 11)."""
    consulta = db.query(Venta.fecha_hora, Venta.total).filter(
        Venta.fecha_hora >= desde,
        Venta.fecha_hora <= hasta,
        Venta.estado == "registrada",
    )
    pares = consulta.all()
    buckets: dict[str, float] = {}
    for fecha_hora, total in pares:
        if not fecha_hora:
            continue
        if agrupacion == "mes":
            clave = fecha_hora.strftime("%Y-%m")
            etiqueta = fecha_hora.strftime("%b %Y")
        elif agrupacion == "semana":
            # Semana ISO (lunes a domingo)
            lunes = (fecha_hora - timedelta(days=fecha_hora.weekday())).date()
            clave = lunes.isoformat()
            etiqueta = f"Sem {lunes.strftime('%d/%m')}"
        else:  # dia
            clave = fecha_hora.date().isoformat()
            etiqueta = fecha_hora.strftime("%d/%m")
        buckets[clave] = buckets.get(clave, 0.0) + float(total)
    return [
        {"clave": k, "etiqueta": etiqueta, "total": v}
        for k, v, etiqueta in _ordenar(buckets)
    ]


def _ordenar(buckets: dict[str, float]) -> list[tuple[str, float, str]]:
    # Reconstruye la etiqueta ordenando por clave (que es ISO cuando es dia/semana/mes)
    salida = []
    for k in sorted(buckets.keys()):
        if "-" in k and len(k) == 10:  # fecha ISO
            etiqueta = datetime.strptime(k, "%Y-%m-%d").strftime("%d/%m")
        elif "-" in k and len(k) == 7:
            etiqueta = datetime.strptime(k, "%Y-%m").strftime("%b %Y")
        else:
            etiqueta = k
        salida.append((k, buckets[k], etiqueta))
    return salida


def _ventas_por_estado(db: Session) -> list[dict]:
    filas = (
        db.query(Venta.estado, func.count(Venta.id), func.coalesce(func.sum(Venta.total), 0))
        .group_by(Venta.estado)
        .all()
    )
    return [{"estado": e, "cantidad": c, "total": float(t)} for e, c, t in filas]


def _top_productos(db: Session, limite: int = 5) -> list[dict]:
    filas = (
        db.query(DetalleVenta.nombre_item, func.sum(DetalleVenta.cantidad), func.sum(DetalleVenta.subtotal))
        .filter(DetalleVenta.tipo == "producto")
        .group_by(DetalleVenta.nombre_item)
        .order_by(func.sum(DetalleVenta.subtotal).desc())
        .limit(limite)
        .all()
    )
    return [{"nombre": n, "cantidad": int(c), "subtotal": float(s)} for n, c, s in filas]


def _pqr_por_estado(db: Session) -> list[dict]:
    filas = (
        db.query(PQR.estado, func.count(PQR.id))
        .group_by(PQR.estado)
        .all()
    )
    return [{"estado": e, "cantidad": c} for e, c in filas]


@router.get("/admin")
def estadisticas_admin(
    fecha_desde: Optional[date] = Query(None, alias="fecha_desde"),
    fecha_hasta: Optional[date] = Query(None, alias="fecha_hasta"),
    agrupacion: str = Query("dia"),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador")),
):
    """Dashboard administrativo: indicadores + series (req. 10, 11, 13, 15)."""
    hoy = date.today()
    desde = datetime.combine(fecha_desde or (hoy - timedelta(days=30)), time.min)
    hasta = datetime.combine(fecha_hasta or hoy, time.max)
    if agrupacion not in ("dia", "semana", "mes"):
        agrupacion = "dia"

    return {
        "cards": _cards_administrador(db),
        "ventas_por_periodo": _ventas_por_periodo(db, desde, hasta, agrupacion),
        "ventas_por_estado": _ventas_por_estado(db),
        "top_productos": _top_productos(db),
        "pqr_por_estado": _pqr_por_estado(db),
        "filtros": {"fecha_desde": desde.date().isoformat(), "fecha_hasta": hasta.date().isoformat(), "agrupacion": agrupacion},
    }


@router.get("/empleado")
def estadisticas_empleado(
    fecha_desde: Optional[date] = Query(None, alias="fecha_desde"),
    fecha_hasta: Optional[date] = Query(None, alias="fecha_hasta"),
    agrupacion: str = Query("dia"),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Dashboard del empleado: ventas, facturación y PQR (sin usuarios)."""
    hoy = date.today()
    desde = datetime.combine(fecha_desde or (hoy - timedelta(days=30)), time.min)
    hasta = datetime.combine(fecha_hasta or hoy, time.max)
    if agrupacion not in ("dia", "semana", "mes"):
        agrupacion = "dia"

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
        "ventas_por_periodo": _ventas_por_periodo(db, desde, hasta, agrupacion),
        "ventas_por_estado": _ventas_por_estado(db),
        "top_productos": _top_productos(db),
        "pqr_por_estado": _pqr_por_estado(db),
        "filtros": {"fecha_desde": desde.date().isoformat(), "fecha_hasta": hasta.date().isoformat(), "agrupacion": agrupacion},
    }


@router.get("/cliente")
def estadisticas_cliente(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Dashboard del cliente: sus ventas, facturas y PQR (req. 12)."""
    ventas = (
        db.query(Venta)
        .filter(Venta.usuario_id == usuario_actual.id)
        .all()
    )
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
            {
                "id": v.id,
                "total": v.total,
                "estado": v.estado,
                "fecha": v.fecha_hora,
            }
            for v in sorted(ventas, key=lambda x: x.fecha_hora or datetime.min, reverse=True)[:5]
        ],
    }