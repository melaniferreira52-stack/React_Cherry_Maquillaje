from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_roles
from ..models import Servicio, Usuario
from ..schemas import ServicioCreate, ServicioUpdate, servicio_a_out

router = APIRouter(prefix="/api/servicios", tags=["Servicios"])


@router.get("")
def listar_servicios(db: Session = Depends(get_db)):
    """Público: catálogo de servicios disponibles."""
    servicios = db.query(Servicio).filter(Servicio.disponible == True).all()  # noqa: E712
    return {"servicios": [servicio_a_out(s) for s in servicios]}


@router.get("/admin/todos")
def listar_todos_los_servicios(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    servicios = db.query(Servicio).all()
    return {"servicios": [servicio_a_out(s) for s in servicios]}


@router.get("/{id_servicio}")
def obtener_servicio(id_servicio: int, db: Session = Depends(get_db)):
    servicio = db.query(Servicio).filter(Servicio.id == id_servicio).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return servicio_a_out(servicio)


@router.post("", status_code=status.HTTP_201_CREATED)
def crear_servicio(
    datos: ServicioCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    nuevo_servicio = Servicio(**datos.model_dump())
    db.add(nuevo_servicio)
    db.commit()
    db.refresh(nuevo_servicio)
    return servicio_a_out(nuevo_servicio)


@router.put("/{id_servicio}")
def actualizar_servicio(
    id_servicio: int,
    datos: ServicioUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    servicio = db.query(Servicio).filter(Servicio.id == id_servicio).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(servicio, campo, valor)

    db.commit()
    db.refresh(servicio)
    return servicio_a_out(servicio)


@router.delete("/{id_servicio}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_servicio(
    id_servicio: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador")),
):
    servicio = db.query(Servicio).filter(Servicio.id == id_servicio).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    db.delete(servicio)
    db.commit()
    return None
