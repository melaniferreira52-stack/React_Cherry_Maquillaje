import { useEffect, useRef, useState } from "react";
import { enviarMensajeChatbot } from "../lib/api";

const MENSAJES_INICIALES = [
  {
    rol: "bot",
    contenido:
      "¡Hola! 👋 Soy Cerezita, la asistente virtual de Cherry Beauty 🍒. Puedo ayudarte con productos, precios, horarios, envíos, cómo comprar, citas y PQR. ¿En qué te ayudo hoy?",
  },
];

export default function ChatbotWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState(MENSAJES_INICIALES);
  const [texto, setTexto] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [conversacionId, setConversacionId] = useState(null);
  const [error, setError] = useState("");
  const fondoRef = useRef(null);

  useEffect(() => {
    if (fondoRef.current) {
      fondoRef.current.scrollTop = fondoRef.current.scrollHeight;
    }
  }, [mensajes, escribiendo]);

  async function manejarEnvio(e) {
    e.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje || escribiendo) return;
    setTexto("");
    setError("");
    setMensajes((prev) => [...prev, { rol: "usuario", contenido: mensaje }]);
    setEscribiendo(true);
    try {
      const datos = await enviarMensajeChatbot(mensaje, conversacionId);
      setConversacionId(datos.conversacion_id);
      setMensajes((prev) => [
        ...prev,
        { rol: "bot", contenido: datos.respuesta },
      ]);
    } catch (err) {
      setError(err.message);
      setMensajes((prev) => [
        ...prev,
        {
          rol: "bot",
          contenido:
            "Lo siento, tuve un problema para responder. Inténtalo de nuevo en un momento 🙏",
        },
      ]);
    } finally {
      setEscribiendo(false);
    }
  }

  return (
    <>
      {/* Contenedor del Botón flotante del Chatbot */}
      <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2 sm:bottom-28 sm:right-8">
        
        {/* Etiqueta / Tooltip permanente "Hola, Soy Cerezita" (Visible cuando el chat está cerrado) */}
        {!abierto && (
          <div className="relative flex items-center rounded-full border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#be123c] shadow-lg animate-bounce">
            Hola, Soy Cerezita 🍒
            {/* Pequeña flecha que apunta al botón */}
            <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 border-y-4 border-l-6 border-y-transparent border-l-white"></span>
          </div>
        )}

        {/* Botón flotante */}
        <button
          onClick={() => setAbierto((v) => !v)}
          aria-label={abierto ? "Cerrar chat" : "Abrir chat"}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f43f5e] to-[#be185d] text-white shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
          style={{ boxShadow: "0 8px 24px rgba(190, 24, 93, 0.35)" }}
        >
          {abierto ? (
            <span className="text-xl font-bold leading-none">✕</span>
          ) : (
            <span className="text-2xl leading-none">🍒</span>
          )}
        </button>
      </div>

      {/* Ventana del chat */}
      {abierto && (
        <div
          className="fixed bottom-44 right-6 z-50 flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-2xl sm:bottom-48 sm:right-8"
          role="dialog"
          aria-label="Chat de Cerezita"
        >
          {/* Encabezado */}
          <div className="bg-gradient-to-r from-[#f43f5e] to-[#be185d] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg">
                🍒
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">Cerezita</p>
                <p className="text-xs text-white/80">
                  Asistente de Cherry Beauty · en línea
                </p>
              </div>
            </div>
          </div>

          {/* Mensajes */}
          <div
            ref={fondoRef}
            className="flex h-72 flex-col gap-2 overflow-y-auto bg-[#fff7f7] p-3"
          >
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.rol === "usuario"
                    ? "self-end rounded-br-sm bg-[#f43f5e] text-white"
                    : "self-start rounded-bl-sm border border-rose-100 bg-white text-[--color-choco]"
                }`}
              >
                {m.contenido}
              </div>
            ))}
            {escribiendo && (
              <div className="self-start rounded-2xl rounded-bl-sm border border-rose-100 bg-white px-3 py-2 text-sm text-[--color-choco-soft]">
                Cerezita está escribiendo<span className="animate-pulse">...</span>
              </div>
            )}
          </div>

          {error && (
            <p className="border-t border-rose-100 bg-rose-50 px-3 py-1.5 text-xs text-[--color-strawberry-deep]">
              {error}
            </p>
          )}

          {/* Sugerencias rápidas */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-rose-100 bg-white px-3 py-2">
            {["Horarios", "Envíos", "Cómo comprar", "Productos"].map((sug) => (
              <button
                key={sug}
                onClick={() => setTexto(sug)}
                className="whitespace-nowrap rounded-full border border-rose-200 px-2.5 py-1 text-xs font-medium text-[#be123c] hover:bg-rose-50"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={manejarEnvio}
            className="flex gap-2 border-t border-rose-100 bg-white p-2.5"
          >
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 rounded-full border border-rose-200 px-4 py-2 text-sm focus:border-[#f43f5e] focus:outline-none"
              aria-label="Escribe tu mensaje"
            />
            <button
              type="submit"
              disabled={!texto.trim() || escribiendo}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f43f5e] to-[#be185d] text-white transition hover:scale-105 disabled:opacity-40"
              aria-label="Enviar mensaje"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}