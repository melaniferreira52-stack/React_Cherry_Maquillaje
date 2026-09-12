import { useState } from "react";

/**
 * Botón flotante de WhatsApp, reutilizable y con posición fija.
 *
 * Uso básico (ya trae un número de ejemplo, cámbialo por el real):
 *   <WhatsAppButton numero="573001234567" />
 *
 * Con mensaje predefinido:
 *   <WhatsAppButton numero="573001234567" mensaje="Hola, quiero hacer un pedido" />
 */
function WhatsAppButton({
  numero = "57 320 800 6702", // ⚠️ Reemplaza por el número real de Cherry Beauty (código país + número, sin +)
  mensaje = "Hola, quiero más información sobre Cherry Beauty 🍒",
}) {
  const [mostrarTexto, setMostrarTexto] = useState(false);

  const enlace = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

  return (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setMostrarTexto(true)}
      onMouseLeave={() => setMostrarTexto(false)}
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-4 text-white shadow-lift transition-all hover:-translate-y-0.5 hover:shadow-xl sm:bottom-8 sm:right-8"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7 fill-white"
        aria-hidden="true"
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.21-8.24 8.21Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.15.17-.29.19-.53.06-.25-.12-1.04-.38-1.99-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.77-1.84-.2-.48-.41-.42-.56-.42-.14 0-.31-.01-.47-.01a.9.9 0 0 0-.66.31c-.23.24-.86.85-.86 2.07 0 1.22.89 2.4 1.02 2.57.12.17 1.75 2.67 4.24 3.75.59.26 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z" />
      </svg>

      <span
        className={`overflow-hidden whitespace-nowrap font-semibold transition-all duration-300 ${
          mostrarTexto ? "max-w-xs opacity-100" : "max-w-0 opacity-0"
        }`}
      >
        Escríbenos
      </span>
    </a>
  );
}

export default WhatsAppButton;