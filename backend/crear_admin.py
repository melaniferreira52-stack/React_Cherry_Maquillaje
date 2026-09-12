"""
Script utilitario: crea (o actualiza) el usuario administrador inicial
directamente en la base de datos usando el mismo hashing que la API.

Uso:
    1. Activa el entorno virtual.
    2. Ajusta los datos del administrador más abajo si lo deseas.
    3. Ejecuta: python crear_admin.py
"""

from app.auth import hash_password
from app.database import SessionLocal
from app.models import Cliente, Usuario

# --- datos del administrador inicial (ajústalos a tu gusto) ---
ADMIN_EMAIL = "admin@cherrybeauty.com"
ADMIN_PASSWORD = "Admin_2026*"
ADMIN_NOMBRE = "Admin"
ADMIN_APELLIDO = "Cherry Beauty"
ADMIN_TIPO_DOCUMENTO = "CC"
ADMIN_NUMERO_DOCUMENTO = "1000000000"
ADMIN_DIRECCION = "Copacabana - Antioquia"
ADMIN_TELEFONO = "3000000000"
# ----------------------------------------------------------------


def main():
    db = SessionLocal()
    try:
        existente = db.query(Usuario).filter(Usuario.correo == ADMIN_EMAIL).first()
        if existente:
            print(f"Ya existe un usuario con el correo {ADMIN_EMAIL}. No se hizo ningún cambio.")
            return

        nuevo_admin = Usuario(
            nombre="",
            correo=ADMIN_EMAIL,
            password=hash_password(ADMIN_PASSWORD),
            rol="administrador",
            estado="activo",
        )
        db.add(nuevo_admin)
        db.flush()

        db.add(
            Cliente(
                usuario_id=nuevo_admin.id,
                nombre=ADMIN_NOMBRE,
                apellido=ADMIN_APELLIDO,
                tipo_documento=ADMIN_TIPO_DOCUMENTO,
                numero_documento=ADMIN_NUMERO_DOCUMENTO,
                direccion=ADMIN_DIRECCION,
                telefono=ADMIN_TELEFONO,
            )
        )
        db.commit()
        print("Administrador creado con éxito:")
        print(f"  correo:   {ADMIN_EMAIL}")
        print(f"  password: {ADMIN_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
