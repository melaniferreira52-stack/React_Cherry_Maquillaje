import { useEffect } from "react";

/**
 * Modal genérico y reutilizable.
 * Se cierra al hacer clic fuera, al presionar Escape o con el botón ✕.
 *
 * size: "md" (predeterminado, ideal para formularios cortos como
 * RecoverPassword) | "lg" (para formularios más grandes como el registro)
 */
function Modal({ abierto, onCerrar, children, labelledBy, size = "md" }) {
  useEffect(() => {
    if (!abierto) return;

    const manejarEscape = (evento) => {
      if (evento.key === "Escape") onCerrar();
    };

    document.addEventListener("keydown", manejarEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", manejarEscape);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const anchoMaximo = size === "lg" ? "max-w-2xl" : "max-w-md";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-choco/50 px-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
      onClick={onCerrar}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(evento) => evento.stopPropagation()}
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-cream p-8 shadow-lift animate-[popIn_0.25s_ease] sm:p-10 ${anchoMaximo}`}
      >
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute right-5 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-cream-soft text-xl text-choco-soft transition hover:bg-strawberry-soft hover:text-strawberry-deep"
        >
          ×
        </button>

        {children}
      </div>
    </div>
  );
}

export default Modal;