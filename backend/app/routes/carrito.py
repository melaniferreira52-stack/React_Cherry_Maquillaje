from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import Carrito, CarritoItem, Producto, Usuario
from ..schemas import CarritoAgregarRequest, CarritoCantidadRequest

router = APIRouter(prefix="/api/carrito", tags=["Carrito"])


def _obtener_o_crear_carrito(db: Session, id_usuario: int) -> Carrito:
    carrito = db.query(Carrito).filter(Carrito.usuario_id == id_usuario).first()
    if not carrito:
        carrito = Carrito(usuario_id=id_usuario)
        db.add(carrito)
        db.commit()
        db.refresh(carrito)
    return carrito


def _carrito_a_dict(carrito: Carrito) -> dict:
    items_out = [
        {
            "item_id": item.id,
            "id_producto": item.producto_id,
            "nombre": item.producto.nombre,
            "precio": item.producto.precio,
            "cantidad": item.cantidad,
        }
        for item in carrito.items
    ]
    total = sum(float(i["precio"]) * i["cantidad"] for i in items_out)
    return {"items": items_out, "total": total}


@router.get("")
def obtener_carrito(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    carrito = _obtener_o_crear_carrito(db, usuario_actual.id)
    return _carrito_a_dict(carrito)


@router.post("", status_code=status.HTTP_201_CREATED)
def agregar_al_carrito(
    datos: CarritoAgregarRequest,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    producto = db.query(Producto).filter(Producto.id == datos.productoId).first()
    if not producto or not producto.disponible:
        raise HTTPException(status_code=404, detail="Producto no disponible")

    carrito = _obtener_o_crear_carrito(db, usuario_actual.id)

    item = (
        db.query(CarritoItem)
        .filter(CarritoItem.carrito_id == carrito.id, CarritoItem.producto_id == datos.productoId)
        .first()
    )

    if item:
        item.cantidad += datos.cantidad
    else:
        item = CarritoItem(carrito_id=carrito.id, producto_id=datos.productoId, cantidad=datos.cantidad)
        db.add(item)

    db.commit()
    db.refresh(carrito)
    return _carrito_a_dict(carrito)


@router.put("/{item_id}")
def actualizar_cantidad(
    item_id: int,
    datos: CarritoCantidadRequest,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    carrito = _obtener_o_crear_carrito(db, usuario_actual.id)
    item = db.query(CarritoItem).filter(CarritoItem.id == item_id, CarritoItem.carrito_id == carrito.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado en tu carrito")

    item.cantidad = datos.cantidad
    db.commit()
    db.refresh(carrito)
    return _carrito_a_dict(carrito)


@router.delete("/{item_id}")
def eliminar_del_carrito(
    item_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    carrito = _obtener_o_crear_carrito(db, usuario_actual.id)
    item = db.query(CarritoItem).filter(CarritoItem.id == item_id, CarritoItem.carrito_id == carrito.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado en tu carrito")

    db.delete(item)
    db.commit()
    db.refresh(carrito)
    return _carrito_a_dict(carrito)


@router.delete("")
def vaciar_carrito(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    carrito = _obtener_o_crear_carrito(db, usuario_actual.id)
    db.query(CarritoItem).filter(CarritoItem.carrito_id == carrito.id).delete()
    db.commit()
    return {"items": [], "total": 0}
