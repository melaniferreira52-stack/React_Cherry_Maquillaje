import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv

load_dotenv()

EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "CherryBeauty")


def _cuerpo_texto_plano(nombre: str, codigo: str) -> str:
    """Versión sin formato, para clientes de correo que no muestran HTML."""
    return (
        f"Hola {nombre},\n\n"
        f"Tu código de recuperación de contraseña es: {codigo}\n"
        f"Este código vence en 10 minutos.\n\n"
        f"Si tú no solicitaste este cambio, ignora este correo.\n\n"
        f"— Cherry Beauty"
    )


def _cuerpo_html(nombre: str, codigo: str) -> str:
    """Versión con diseño (colores de la marca), para clientes de correo modernos."""
    return f"""\
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:0; background-color:#FFF0F5; font-family: Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF0F5; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="max-width:480px; background-color:#FFFFFF; border-radius:24px; overflow:hidden; box-shadow:0 8px 24px rgba(90,60,40,0.12);">

            <!-- Encabezado -->
            <tr>
              <td style="background-color:#C9184A; padding:32px 24px; text-align:center;">
                <div style="font-size:34px; line-height:1;">🍒</div>
                <div style="color:#FFF0F5; font-size:12px; font-weight:bold; letter-spacing:3px; margin-top:10px;">
                  CHERRY BEAUTY
                </div>
              </td>
            </tr>

            <!-- Cuerpo -->
            <tr>
              <td style="padding:32px 28px; font-family: Arial, Helvetica, sans-serif;">
                <p style="margin:0 0 4px 0; color:#7A1F2B; font-size:20px; font-weight:bold;">
                  Hola {nombre},
                </p>
                <p style="margin:0 0 24px 0; color:#9C5A6B; font-size:15px; line-height:1.5;">
                  Recibimos una solicitud para restablecer tu contraseña. Usa este código para continuar:
                </p>

                <!-- Código -->
                <div style="text-align:center; margin:0 0 24px 0;">
                  <span style="display:inline-block; background-color:#FFD6E0; color:#C9184A;
                               font-size:32px; font-weight:bold; letter-spacing:8px;
                               padding:16px 28px; border-radius:16px;">
                    {codigo}
                  </span>
                </div>

                <p style="margin:0 0 8px 0; color:#9C5A6B; font-size:14px; text-align:center;">
                  Este código vence en <strong>10 minutos</strong>.
                </p>

                <hr style="border:none; border-top:1px solid #F3D3DA; margin:28px 0;" />

                <p style="margin:0; color:#B98290; font-size:12px; line-height:1.5; text-align:center;">
                  Si tú no solicitaste este cambio, puedes ignorar este correo con tranquilidad —
                  tu cuenta sigue segura.
                </p>
              </td>
            </tr>

            <!-- Pie -->
            <tr>
              <td style="background-color:#FFF0F5; padding:18px; text-align:center;">
                <span style="color:#B98290; font-size:12px;">
                  © Cherry Beauty — Maquillaje y Belleza
                </span>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


def enviar_codigo_recuperacion(correo_destino: str, nombre: str, codigo: str) -> None:
    """
    Envía el código de recuperación de 6 dígitos por Gmail (SMTP), con diseño HTML
    y una versión en texto plano como respaldo.

    Si EMAIL_USER / EMAIL_PASSWORD no están en el .env, no falla la petición:
    imprime el código en la consola del backend para poder seguir probando.
    """
    asunto = "Tu código de recuperación - Cherry Beauty"

    if not EMAIL_USER or not EMAIL_PASSWORD:
        print(f"[DEV] Código de recuperación para {correo_destino}: {codigo}")
        return

    mensaje = MIMEMultipart("alternative")
    mensaje["Subject"] = asunto
    mensaje["From"] = f"{EMAIL_FROM_NAME} <{EMAIL_USER}>"
    mensaje["To"] = correo_destino

    mensaje.attach(MIMEText(_cuerpo_texto_plano(nombre, codigo), "plain", "utf-8"))
    mensaje.attach(MIMEText(_cuerpo_html(nombre, codigo), "html", "utf-8"))

    try:
        contexto = ssl.create_default_context()
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=15) as servidor:
            servidor.starttls(context=contexto)
            servidor.login(EMAIL_USER, EMAIL_PASSWORD)
            servidor.sendmail(EMAIL_USER, [correo_destino], mensaje.as_string())
    except Exception as error:
        # No tumba el flujo de recuperación; deja el error en la consola para depurar.
        print(f"[ERROR envío de correo] {error}. Código para {correo_destino}: {codigo}")