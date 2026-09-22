from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..models import PQR, Usuario
from ..schemas import PQRCrear, PQRResponder, PQRUpdateEstado

router = APIRouter(prefix="/api/pqr", tags=["PQR"])


def _pqr_a_dict(pqr: PQR) -> dict:
    return {
        "id": pqr.id,
        "usuario_id": pqr.usuario_id,
        "tipo": pqr.tipo,
        "asunto": pqr.asunto,
        "mensaje": pqr.mensaje,
        "estado": pqr.estado,
        "respuesta": pqr.respuesta,
        "creado_en": pqr.creado_en,
        "actualizado_en": pqr.actualizado_en,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def crear_pqr(
    datos: PQRCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """El cliente registra una petición, queja o reclamo (req. 16)."""
    pqr = PQR(
        usuario_id=usuario_actual.id,
        tipo=datos.tipo,
        asunto=datos.asunto,
        mensaje=datos.mensaje,
        estado="pendiente",
    )
    db.add(pqr)
    db.commit()
    db.refresh(pqr)
    return {"pqr": _pqr_a_dict(pqr)}


@router.get("/mias")
def mis_pqr(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """El cliente consulta el estado de sus solicitudes."""
    pqr_list = (
        db.query(PQR)
        .filter(PQR.usuario_id == usuario_actual.id)
        .order_by(PQR.creado_en.desc())
        .all()
    )
    return {"pqr": [_pqr_a_dict(p) for p in pqr_list]}


@router.get("")
def listar_pqr(
    estado: str | None = Query(None),
    tipo: str | None = Query(None),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Bandeja de PQR para administración (req. 16)."""
    consulta = db.query(PQR)
    if estado:
        consulta = consulta.filter(PQR.estado == estado)
    if tipo:
        consulta = consulta.filter(PQR.tipo == tipo)
    pqr_list = consulta.order_by(PQR.creado_en.desc()).all()
    return {"pqr": [_pqr_a_dict(p) for p in pqr_list]}


@router.get("/{id_pqr}")
def obtener_pqr(
    id_pqr: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    pqr = db.query(PQR).filter(PQR.id == id_pqr).first()
    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrada")
    if usuario_actual.rol not in ("administrador", "empleado") and pqr.usuario_id != usuario_actual.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver esta PQR")
    return {"pqr": _pqr_a_dict(pqr)}


@router.patch("/{id_pqr}/estado")
def actualizar_estado_pqr(
    id_pqr: int,
    datos: PQRUpdateEstado,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    pqr = db.query(PQR).filter(PQR.id == id_pqr).first()
    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrada")
    pqr.estado = datos.estado
    db.commit()
    db.refresh(pqr)
    return {"pqr": _pqr_a_dict(pqr)}


@router.patch("/{id_pqr}/responder")
def responder_pqr(
    id_pqr: int,
    datos: PQRResponder,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Responde una PQR y la pasa a 'respondida' (req. 16)."""
    pqr = db.query(PQR).filter(PQR.id == id_pqr).first()
    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrada")
    pqr.respuesta = datos.respuesta
    pqr.estado = datos.estado
    db.commit()
    db.refresh(pqr)
    return {"pqr": _pqr_a_dict(pqr)}