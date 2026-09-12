import { useEffect } from "react";

/**
 * Ventana modal centrada, reutilizada por los formularios de "agregar/editar"
 * en los paneles de administración (Usuarios, Productos, Servicios, Pedidos).
 * Pensada con el mismo lenguaje visual que las páginas de inicio de sesión
 * y registro: tarjeta blanca redondeada, acento de marca arriba, fondo oscuro
 * difuminado detrás.
 */
export default function PanelModal({ abierto, titulo, subtitulo, onCerrar, children }) {
  useEffect(() => {
    if (!abierto) return;
    function manejarTecla(e) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", manejarTecla);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", manejarTecla);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="panel-modal-titulo"
    >
      {/* Fondo */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="absolute inset-0 bg-[--color-choco]/60 backdrop-blur-sm animate-[fadeIn_.15s_ease-out]"
      />

      {/* Tarjeta */}
      <div className="relative w-full max-w-lg animate-[popIn_.18s_ease-out] rounded-2xl bg-white shadow-2xl">
        <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-[--color-strawberry] via-[--color-strawberry-deep] to-[--color-caramel-deep]" />

        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div>
            <h2
              id="panel-modal-titulo"
              className="font-display text-xl font-semibold text-[--color-choco]"
            >
              {titulo}
            </h2>
            {subtitulo && (
              <p className="mt-1 text-sm text-[--color-choco-soft]">{subtitulo}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-full p-1.5 text-[--color-choco-soft] transition hover:bg-[--color-cream] hover:text-[--color-choco]"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 pb-6 pt-4">{children}</div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn {
          from { opacity: 0; transform: translateY(8px) scale(.98) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
      `}</style>
    </div>
  );
}
