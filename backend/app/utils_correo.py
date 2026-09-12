import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = os.getenv("BREVO_SMTP_HOST", "smtp-relay.brevo.com")
SMTP_PORT = int(os.getenv("BREVO_SMTP_PORT", "587"))
SMTP_USER = os.getenv("BREVO_SMTP_USER")
SMTP_KEY = os.getenv("BREVO_SMTP_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM", "no-reply@cherrybeauty.com")


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
    Envía el código de recuperación de 6 dígitos por correo (con diseño HTML,
    y una versión en texto plano como respaldo para clientes que no rendericen HTML).

    Si BREVO_SMTP_USER / BREVO_SMTP_KEY no están configurados en el .env
    (por ejemplo en desarrollo local), no falla la petición: solo imprime
    el código en la consola del backend para que puedas seguir probando.
    """
    asunto = "Tu código de recuperación - Cherry Beauty"

    if not SMTP_USER or not SMTP_KEY:
        print(f"[DEV] Código de recuperación para {correo_destino}: {codigo}")
        return

    mensaje = MIMEMultipart("alternative")
    mensaje["Subject"] = asunto
    mensaje["From"] = f"Cherry Beauty <{EMAIL_FROM}>"
    mensaje["To"] = correo_destino

    # Se adjuntan ambas versiones; los clientes de correo modernos muestran
    # la HTML y usan la de texto plano como respaldo automático.
    mensaje.attach(MIMEText(_cuerpo_texto_plano(nombre, codigo), "plain", "utf-8"))
    mensaje.attach(MIMEText(_cuerpo_html(nombre, codigo), "html", "utf-8"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as servidor:
            servidor.starttls()
            servidor.login(SMTP_USER, SMTP_KEY)
            servidor.sendmail(EMAIL_FROM, [correo_destino], mensaje.as_string())
    except Exception as error:
        # No queremos que un fallo de correo tumbe el flujo de recuperación;
        # lo dejamos registrado en consola para depurar.
        print(f"[ERROR envío de correo] {error}. Código para {correo_destino}: {codigo}")