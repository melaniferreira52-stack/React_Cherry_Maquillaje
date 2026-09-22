import io
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..models import DetalleFactura, Factura, Usuario, Venta
from ..schemas import FacturaOut

router = APIRouter(prefix="/api/facturas", tags=["Facturas"])


def _factura_a_dict(factura: Factura, incluir_detalles: bool = False) -> dict:
    datos = {
        "id": factura.id,
        "venta_id": factura.venta_id,
        "numero_factura": factura.numero_factura,
        "cliente_nombre": factura.cliente_nombre,
        "cliente_apellido": factura.cliente_apellido,
        "cliente_correo": factura.cliente_correo,
        "subtotal": factura.subtotal,
        "impuestos": factura.impuestos,
        "total": factura.total,
        "estado": factura.estado,
        "creado_en": factura.creado_en,
    }
    if incluir_detalles:
        datos["detalles"] = [
            {
                "id": d.id,
                "tipo": d.tipo,
                "nombre_item": d.nombre_item,
                "cantidad": d.cantidad,
                "precio_unitario": d.precio_unitario,
                "subtotal": d.subtotal,
            }
            for d in factura.detalles
        ]
    return datos


def _generar_numero_factura(db: Session) -> str:
    """Número consecutivo tipo FAC-0001 (req. 7)."""
    ultima = (
        db.query(Factura.numero_factura)
        .order_by(Factura.id.desc())
        .first()
    )
    if not ultima:
        return "FAC-0001"
    try:
        correlativo = int(ultima[0].replace("FAC-", ""))
    except ValueError:
        correlativo = 0
    return f"FAC-{correlativo + 1:04d}"


@router.post("/emitir", status_code=status.HTTP_201_CREATED)
def emitir_factura(
    venta_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Genera una factura a partir de una venta registrada (req. 7)."""
    venta = (
        db.query(Venta)
        .options(joinedload(Venta.detalles))
        .filter(Venta.id == venta_id)
        .first()
    )
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    if db.query(Factura).filter(Factura.venta_id == venta_id).first():
        raise HTTPException(status_code=400, detail="Esta venta ya tiene una factura emitida")

    factura = Factura(
        venta_id=venta.id,
        numero_factura=_generar_numero_factura(db),
        cliente_nombre=venta.cliente_nombre,
        cliente_apellido=venta.cliente_apellido,
        cliente_correo=venta.cliente_correo,
        subtotal=venta.subtotal,
        impuestos=venta.impuestos,
        total=venta.total,
        estado="emitida",
    )
    db.add(factura)
    db.flush()

    for d in venta.detalles:
        db.add(
            DetalleFactura(
                factura_id=factura.id,
                tipo=d.tipo,
                nombre_item=d.nombre_item,
                cantidad=d.cantidad,
                precio_unitario=d.precio_unitario,
                subtotal=d.subtotal,
            )
        )

    db.commit()
    db.refresh(factura)
    return {"factura": _factura_a_dict(factura, incluir_detalles=True)}


@router.get("")
def listar_facturas(
    numero: Optional[str] = Query(None),
    cliente: Optional[str] = Query(None),
    fecha_desde: Optional[date] = Query(None, alias="fecha_desde"),
    fecha_hasta: Optional[date] = Query(None, alias="fecha_hasta"),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Consulta de facturas por número, cliente o fecha (req. 8)."""
    consulta = db.query(Factura).options(joinedload(Factura.detalles))
    if numero:
        consulta = consulta.filter(Factura.numero_factura.ilike(f"%{numero}%"))
    if cliente:
        consulta = consulta.filter(Factura.cliente_correo.ilike(f"%{cliente}%"))
    if fecha_desde:
        consulta = consulta.filter(Factura.creado_en >= datetime.combine(fecha_desde, datetime.min.time()))
    if fecha_hasta:
        consulta = consulta.filter(Factura.creado_en <= datetime.combine(fecha_hasta, datetime.max.time()))
    facturas = consulta.order_by(Factura.creado_en.desc()).all()
    return {"facturas": [_factura_a_dict(f, incluir_detalles=True) for f in facturas]}


@router.get("/mias")
def mis_facturas(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """El cliente consulta sus propias facturas."""
    facturas = (
        db.query(Factura)
        .options(joinedload(Factura.detalles))
        .join(Venta, Venta.id == Factura.venta_id)
        .filter(Venta.usuario_id == usuario_actual.id)
        .order_by(Factura.creado_en.desc())
        .all()
    )
    return {"facturas": [_factura_a_dict(f, incluir_detalles=True) for f in facturas]}


@router.get("/{id_factura}")
def obtener_factura(
    id_factura: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    factura = (
        db.query(Factura)
        .options(joinedload(Factura.detalles))
        .filter(Factura.id == id_factura)
        .first()
    )
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    venta = db.query(Venta).filter(Venta.id == factura.venta_id).first()
    es_propia = venta and venta.usuario_id == usuario_actual.id
    if usuario_actual.rol not in ("administrador", "empleado") and not es_propia:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver esta factura")

    return {"factura": _factura_a_dict(factura, incluir_detalles=True)}


@router.get("/{id_factura}/pdf")
def descargar_factura_pdf(
    id_factura: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Descarga de la factura en PDF (req. 9)."""
    factura = (
        db.query(Factura)
        .options(joinedload(Factura.detalles))
        .filter(Factura.id == id_factura)
        .first()
    )
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    venta = db.query(Venta).filter(Venta.id == factura.venta_id).first()
    es_propia = venta and venta.usuario_id == usuario_actual.id
    if usuario_actual.rol not in ("administrador", "empleado") and not es_propia:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver esta factura")

    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import mm
        from reportlab.platypus import (
            Paragraph,
            SimpleDocTemplate,
            Spacer,
            Table,
            TableStyle,
        )
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="El paquete reportlab no está instalado en el servidor",
        )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=f"Factura {factura.numero_factura} - Cherry Beauty",
    )

    estilos = getSampleStyleSheet()
    titulo = ParagraphStyle("Titulo", parent=estilos["Title"], fontSize=18, textColor=colors.HexColor("#9f1239"))
    subtitulo = ParagraphStyle("Subtitulo", parent=estilos["Normal"], fontSize=10, textColor=colors.HexColor("#78350f"))
    normal = estilos["Normal"]
    encabezado = ParagraphStyle("Enc", parent=normal, fontSize=9, textColor=colors.HexColor("#57534e"))
    celda = ParagraphStyle("Celda", parent=normal, fontSize=8.5)

    elementos = []
    elementos.append(Paragraph("Cherry Beauty", titulo))
    elementos.append(Paragraph("Maquillaje y Belleza — Copacabana, Antioquia", subtitulo))
    elementos.append(Paragraph("Factura de venta", subtitulo))
    elementos.append(Spacer(1, 6 * mm))

    # Datos generales
    fecha_factura = factura.creado_en or datetime.now()
    datos_generales = Table(
        [
            [Paragraph("N° Factura", encabezado), Paragraph(factura.numero_factura, normal)],
            [Paragraph("Fecha", encabezado), Paragraph(fecha_factura.strftime("%d/%m/%Y %H:%M"), normal)],
            [Paragraph("Cliente", encabezado), Paragraph(
                f"{factura.cliente_nombre} {factura.cliente_apellido or ''}".strip(), normal
            )],
            [Paragraph("Correo", encabezado), Paragraph(factura.cliente_correo, normal)],
            [Paragraph("Estado", encabezado), Paragraph(factura.estado, normal)],
        ],
        colWidths=[35 * mm, 120 * mm],
    )
    elementos.append(datos_generales)
    elementos.append(Spacer(1, 6 * mm))

    # Detalle
    encabezados = ["Ítem", "Cant.", "Precio unit.", "Subtotal"]
    filas = [encabezados]
    for d in factura.detalles:
        filas.append([
            Paragraph(d.nombre_item, celda),
            str(d.cantidad),
            f"${float(d.precio_unitario):,.0f}".replace(",", "."),
            f"${float(d.subtotal):,.0f}".replace(",", "."),
        ])
    tabla = Table(filas, colWidths=[95 * mm, 15 * mm, 30 * mm, 30 * mm])
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ffe4e6")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#9f1239")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#fecdd3")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fff7f7")]),
            ]
        )
    )
    elementos.append(tabla)
    elementos.append(Spacer(1, 6 * mm))

    # Totales
    totales = Table(
        [
            ["Subtotal", f"${float(factura.subtotal):,.0f}".replace(",", ".")],
            ["Impuestos", f"${float(factura.impuestos):,.0f}".replace(",", ".")],
            ["Total", f"${float(factura.total):,.0f}".replace(",", ".")],
        ],
        colWidths=[140 * mm, 30 * mm],
    )
    totales.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -2), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, -1), (-1, -1), 12),
                ("TEXTCOLOR", (0, -1), (-1, -1), colors.HexColor("#9f1239")),
                ("LINEABOVE", (0, -1), (-1, -1), 0.8, colors.HexColor("#fda4af")),
            ]
        )
    )
    elementos.append(totales)
    elementos.append(Spacer(1, 8 * mm))
    elementos.append(Paragraph("Gracias por tu compra en Cherry Beauty 🍒", subtitulo))
    elementos.append(
        Paragraph(
            f"Reporte generado el {datetime.now().strftime('%d/%m/%Y %H:%M')} — Cherry Beauty",
            encabezado,
        )
    )

    doc.build(elementos)
    buffer.seek(0)
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="factura_{factura.numero_factura}.pdf"'
        },
    )


@router.patch("/{id_factura}/estado")
def anular_factura(
    id_factura: int,
    estado: str,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador")),
):
    if estado not in ("emitida", "anulada"):
        raise HTTPException(status_code=400, detail="estado debe ser 'emitida' o 'anulada'")
    factura = db.query(Factura).filter(Factura.id == id_factura).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    factura.estado = estado
    db.commit()
    db.refresh(factura)
    return {"factura": _factura_a_dict(factura)}