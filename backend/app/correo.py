import os
import smtplib
import ssl
from email.message import EmailMessage

from dotenv import load_dotenv

load_dotenv()

EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "CherryBeauty")


def enviar_codigo_recuperacion(destinatario: str, nombre: str, codigo: str) -> None:
    if not EMAIL_USER or not EMAIL_PASSWORD:
        raise RuntimeError("Faltan EMAIL_USER o EMAIL_PASSWORD en el .env")

    mensaje = EmailMessage()
    mensaje["Subject"] = "Tu código de recuperación - CherryBeauty"
    mensaje["From"] = f"{EMAIL_FROM_NAME} <{EMAIL_USER}>"
    mensaje["To"] = destinatario
    mensaje.set_content(
        f"Hola {nombre},\n\n"
        f"Tu código de recuperación es: {codigo}\n\n"
        "Vence en 10 minutos. Si no lo pediste tú, ignora este correo."
    )

    contexto = ssl.create_default_context()
    with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=15) as servidor:
        servidor.starttls(context=contexto)
        servidor.login(EMAIL_USER, EMAIL_PASSWORD)
        servidor.send_message(mensaje)