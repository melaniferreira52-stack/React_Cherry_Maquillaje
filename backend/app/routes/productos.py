import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_roles
from ..models import Producto, Usuario
from ..schemas import ProductoCreate, ProductoUpdate, producto_a_out

router = APIRouter(prefix="/api/productos", tags=["Productos"])

# Carpeta donde quedan guardadas físicamente las imágenes subidas desde el
# panel de administrador. Se sirve como archivos estáticos en main.py bajo
# la ruta /uploads (ver "app.mount" en main.py).
CARPETA_UPLOADS = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "productos")
EXTENSIONES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp"}
TAMANO_MAXIMO_MB = 5


@router.post("/subir-imagen")
async def subir_imagen_producto(
    archivo: UploadFile = File(...),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """
    Recibe una imagen desde el formulario del panel de administrador
    (input type="file"), la guarda en backend/uploads/productos/ con un
    nombre único, y devuelve la URL relativa que hay que guardar en el
    campo imagen_url del producto.
    """
    extension = os.path.splitext(archivo.filename or "")[1].lower()
    if extension not in EXTENSIONES_PERMITIDAS:
        raise HTTPException(
            status_code=400,
            detail="Formato de imagen no permitido. Usa JPG, PNG o WEBP.",
        )

    contenido = await archivo.read()
    if len(contenido) > TAMANO_MAXIMO_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"La imagen no puede pesar más de {TAMANO_MAXIMO_MB} MB.",
        )

    os.makedirs(CARPETA_UPLOADS, exist_ok=True)

    nombre_archivo = f"{uuid.uuid4().hex}{extension}"
    ruta_completa = os.path.join(CARPETA_UPLOADS, nombre_archivo)

    with open(ruta_completa, "wb") as f:
        f.write(contenido)

    return {"imagen_url": f"/uploads/productos/{nombre_archivo}"}


@router.get("")
def listar_productos(db: Session = Depends(get_db)):
    """Público: catálogo de productos disponibles."""
    productos = db.query(Producto).filter(Producto.disponible == True).all()  # noqa: E712
    return {"productos": [producto_a_out(p) for p in productos]}


@router.get("/admin/todos")
def listar_todos_los_productos(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Panel admin: incluye productos no disponibles."""
    productos = db.query(Producto).all()
    return {"productos": [producto_a_out(p) for p in productos]}


@router.get("/{id_producto}")
def obtener_producto(id_producto: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto_a_out(producto)


@router.post("", status_code=status.HTTP_201_CREATED)
def crear_producto(
    datos: ProductoCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    if db.query(Producto).filter(Producto.slug == datos.slug).first():
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese slug")

    nuevo_producto = Producto(**datos.model_dump())
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return producto_a_out(nuevo_producto)


@router.put("/{id_producto}")
def actualizar_producto(
    id_producto: int,
    datos: ProductoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    producto = db.query(Producto).filter(Producto.id == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    cambios = datos.model_dump(exclude_unset=True)

    if "slug" in cambios and cambios["slug"] != producto.slug:
        if db.query(Producto).filter(Producto.slug == cambios["slug"]).first():
            raise HTTPException(status_code=400, detail="Ya existe un producto con ese slug")

    for campo, valor in cambios.items():
        setattr(producto, campo, valor)

    db.commit()
    db.refresh(producto)
    return producto_a_out(producto)


@router.delete("/{id_producto}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(
    id_producto: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador")),
):
    producto = db.query(Producto).filter(Producto.id == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    try:
        db.delete(producto)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar: el producto tiene pedidos o carritos asociados. "
            "Márcalo como 'no disponible' en su lugar.",
        )
    return None
