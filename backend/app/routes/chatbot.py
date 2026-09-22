import os
import re
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import Conversacion, Mensaje, Producto, Servicio, Usuario
from ..schemas import ChatMensajeRequest

load_dotenv()

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

# ---------------------------------------------------------------------------
# CONOCIMIENTO DEL NEGOCIO (información de la página de Cherry Beauty)
# ---------------------------------------------------------------------------
INFORMACION_NEGOCIO = {
    "nombre": "Cherry Beauty",
    "descripcion": "Tienda de maquillaje y belleza. Vende productos de maquillaje y ofrece servicios como domicilio, asesoría de imagen y maquillaje para eventos.",
    "ubicacion": "Manrique, Antioquia",
    "horario": "Lunes a viernes de 6:00 AM a 8:00 PM. Sábados y domingos de 10:00 AM a 9:00 PM.",
    "contacto": "WhatsApp 320 800 6702, correo cherrybeauty@gmail.com",
    "como_comprar": (
        "Para comprar: 1) crea una cuenta o inicia sesión, 2) agrega productos al carrito, "
        "3) confirma tu pedido eligiendo el método de pago (efectivo, tarjeta o transferencia) "
        "y los servicios que quieras (como domicilio), 4) tu pedido queda registrado y puedes "
        "ver la factura en Mi cuenta."
    ),
    "envio": "El servicio de domicilio tiene un costo de $3.000 (pesos colombianos).",
    "metodos_pago": "Efectivo, tarjeta y transferencia.",
    "pqr": (
        "Para presentar una petición, queja o reclamo inicia sesión, entra a 'Mis PQR' dentro "
        "de Mi cuenta y crea una nueva solicitud. Puedes hacer seguimiento del estado: pendiente, "
        "en proceso, respondida o cerrada."
    ),
}

INTENCIONES = [
    {
        "id": "saludo",
        "patrones": [r"\bhola\b", r"\bbuenos días\b", r"\bbuenas tardes\b", r"\bbuenas noches\b", r"\bhey\b", r"^hi$", r"^hello$"],
        "respuesta": "¡Hola! 👋 Soy el asistente virtual de Cherry Beauty. Puedo ayudarte con información sobre productos, precios, horarios, cómo comprar, envíos y PQR. ¿En qué te ayudo?",
    },
    {
        "id": "horario",
        "patrones": [r"horari", r"abren", r"cierran", r"qué horas", r"a qué hora", r"atención al público", r"abierto"],
        "respuesta": "Nuestro horario de atención es: {horario}",
    },
    {
        "id": "ubicacion",
        "patrones": [r"dónde est", r"ubicaci", r"direcci", r"manrique", r"cómo llegar", r"local"],
        "respuesta": "Estamos ubicados en {ubicacion}. {contacto}",
    },
    {
        "id": "contacto",
        "patrones": [r"contacto", r"tel[eé]fono", r"correo", r"whatsapp", r"escribirles", r"comunicarme"],
        "respuesta": "Puedes contactarnos por: {contacto}",
    },
    {
        "id": "envio",
        "patrones": [r"env[ií]o", r"domicilio", r"despacho", r"entrega", r"llega", r"cuánto tarda"],
        "respuesta": "{envio} {como_comprar}",
    },
    {
        "id": "pago",
        "patrones": [r"pago", r"pagar", r"método", r"tarjeta", r"efectivo", r"transferencia", r"nequi", r"daviplata"],
        "respuesta": "Aceptamos: {metodos_pago}",
    },
    {
        "id": "comprar",
        "patrones": [r"c[oó]mo comprar", r"qu[eé] comprar", r"hacer pedido", r"pedido", r"ordenar", r"comprar un", r"proceso de compra", r"carrito"],
        "respuesta": "{como_comprar}",
    },
    {
        "id": "pqr",
        "patrones": [r"\bpqr\b", r"queja", r"reclamo", r"petici[oó]n", r"reclamar", r"quejarme", r"devoluci[oó]n", r"devolver"],
        "respuesta": "{pqr}",
    },
    {
        "id": "cita",
        "patrones": [r"cita", r"agendar", r"agendamiento", r"servicio de maquillaje", r"maquillaje para eventos", r"asesor[ií]a", r"reservar"],
        "respuesta": "Ofrecemos servicios de maquillaje: asesoría de imagen y maquillaje, y maquillaje para eventos (fiestas, sesiones de fotos y eventos especiales). Puedes agendar una cita desde la página 'Agendar cita' de nuestro sitio web.",
    },
    {
        "id": "servicios",
        "patrones": [r"qu[eé] servicios", r"servicios tienen", r"qu[eé] ofrecen", r"lista de servicios"],
        "respuesta": "Nuestros servicios son: {servicios}",
    },
    {
        "id": "productos",
        "patrones": [r"producto", r"cat[aá]logo", r"qu[eé] venden", r"tienen labial", r"precio de", r"cu[aá]nto vale", r"cu[aá]nto cuesta", r"cu[aá]nto cuestan", r"precios"],
        "respuesta": "{productos_destacados}",
    },
    {
        "id": "agradecimiento",
        "patrones": [r"gracias", r"muchas gracias", r"thank"],
        "respuesta": "¡Con gusto! 😊 Si necesitas algo más, aquí estoy. Que tengas un lindo día.",
    },
    {
        "id": "despedida",
        "patrones": [r"chao", r"adi[oó]s", r"hasta luego", r"nos vemos", r"bye", r"me voy"],
        "respuesta": "¡Hasta luego! 👋 Recuerda que puedes volver cuando quieras. Cherry Beauty te espera.",
    },
]


def _construir_conocimiento(db: Session) -> dict:
    """Carga la información viva de la página (catálogo real desde la BD)."""
    productos = (
        db.query(Producto).filter(Producto.disponible == True).all()  # noqa: E712
    )
    servicios = (
        db.query(Servicio).filter(Servicio.disponible == True).all()  # noqa: E712
    )

    if productos:
        destacados = ", ".join(
            f"{p.nombre} (${float(p.precio):,.0f})".replace(",", ".") for p in productos[:8]
        )
        lista = ", ".join(p.nombre for p in productos[:12])
    else:
        destacados = "Por el momento estamos actualizando el catálogo."
        lista = ""

    if servicios:
        lista_servicios = ", ".join(
            f"{s.nombre} (${float(s.precio):,.0f})".replace(",", ".") if s.precio else s.nombre
            for s in servicios
        )
    else:
        lista_servicios = ""

    info = dict(INFORMACION_NEGOCIO)
    info["productos_destacados"] = (
        f"Estos son algunos de nuestros productos: {destacados}. "
        "Puedes ver el catálogo completo en la sección 'Productos' del sitio."
    )
    info["lista_productos"] = lista
    info["servicios"] = lista_servicios or "Consultando servicios disponibles."
    return info


def _responder_local(mensaje: str, info: dict) -> str:
    """Motor propio del chatbot: responde con la información del sitio
    buscando intenciones por palabras clave."""
    texto = mensaje.lower()
    for intencion in INTENCIONES:
        for patron in intencion["patrones"]:
            if re.search(patron, texto):
                respuesta = intencion["respuesta"]
                try:
                    respuesta = respuesta.format(**info)
                except (KeyError, IndexError):
                    pass
                return respuesta
    return (
        "No estoy seguro de haber entendido tu pregunta 🤔. Puedo ayudarte con: "
        "productos y precios, horarios, ubicación, envíos, métodos de pago, cómo comprar, "
        "agendar citas y PQR. ¿Me cuentas qué necesitas?"
    )


def _responder_con_ia(mensaje: str, info: dict, api_key: str) -> Optional[str]:
    """Conector opcional con OpenAI (usando la clave propia del usuario).
    Devuelve None si algo falla, para que el motor local tome el control."""
    try:
        from openai import OpenAI

        cliente = OpenAI(api_key=api_key)
        sistema = (
            "Eres el asistente virtual de Cherry Beauty, una tienda de maquillaje y belleza "
            "en Colombia. Responde SIEMPRE en español, de forma amable y breve (máx. 3 frases). "
            "Usa únicamente esta información del negocio:\n"
            + "\n".join(f"- {k}: {v}" for k, v in info.items())
        )
        respuesta = cliente.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": sistema},
                {"role": "user", "content": mensaje},
            ],
            max_tokens=200,
            temperature=0.4,
        )
        texto = respuesta.choices[0].message.content.strip()
        return texto if texto else None
    except Exception:
        return None


@router.post("/mensaje", status_code=status.HTTP_200_OK)
def enviar_mensaje_chatbot(
    datos: ChatMensajeRequest,
    db: Session = Depends(get_db),
):
    """Recibe un mensaje del usuario, lo guarda, genera la respuesta con la IA
    (motor propio con conocimiento del sitio + OpenAI opcional) y la guarda."""
    conversacion = None
    if datos.conversacion_id:
        conversacion = db.query(Conversacion).filter(Conversacion.id == datos.conversacion_id).first()
        if not conversacion:
            raise HTTPException(status_code=404, detail="Conversación no encontrada")

    if not conversacion:
        conversacion = Conversacion(usuario_id=None)
        db.add(conversacion)
        db.flush()

    db.add(Mensaje(conversacion_id=conversacion.id, rol="usuario", contenido=datos.mensaje))

    info = _construir_conocimiento(db)
    api_key = os.getenv("OPENAI_API_KEY", "").strip()

    respuesta = None
    if api_key:
        respuesta = _responder_con_ia(datos.mensaje, info, api_key)
    if not respuesta:
        respuesta = _responder_local(datos.mensaje, info)

    db.add(Mensaje(conversacion_id=conversacion.id, rol="bot", contenido=respuesta))
    db.commit()

    return {
        "conversacion_id": conversacion.id,
        "respuesta": respuesta,
        "motor": "openai" if (api_key and respuesta != _responder_local(datos.mensaje, info)) else "local",
    }


@router.get("/mis-conversaciones")
def mis_conversaciones(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Historial de conversaciones del usuario logueado."""
    conversaciones = (
        db.query(Conversacion)
        .filter(Conversacion.usuario_id == usuario_actual.id)
        .order_by(Conversacion.creado_en.desc())
        .limit(20)
        .all()
    )
    return {
        "conversaciones": [
            {
                "id": c.id,
                "creado_en": c.creado_en,
                "mensajes": [
                    {"id": m.id, "rol": m.rol, "contenido": m.contenido, "creado_en": m.creado_en}
                    for m in c.mensajes
                ],
            }
            for c in conversaciones
        ]
    }