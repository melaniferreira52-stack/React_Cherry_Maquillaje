/**
 * Barra de herramientas reutilizable para las tablas de administración:
 * buscador + (opcional) filtro por estado + (opcional) botón de acción.
 */
export default function PanelToolbar({
  busqueda,
  onCambiarBusqueda,
  placeholderBusqueda = "Buscar...",
  filtro,
  onCambiarFiltro,
  opcionesFiltro,
  textoAccion,
  onAccion,
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0ea5e9]">
            🔍
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => onCambiarBusqueda(e.target.value)}
            placeholder={placeholderBusqueda}
            className="w-full rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 py-2 pl-9 pr-3 text-sm text-[--color-choco] placeholder:text-[--color-choco-soft] focus:border-[#38bdf8] focus:bg-white focus:outline-none"
          />
        </div>

        {opcionesFiltro && (
          <select
            value={filtro}
            onChange={(e) => onCambiarFiltro(e.target.value)}
            className="rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 px-3 py-2 text-sm text-[--color-choco] focus:border-[#38bdf8] focus:bg-white focus:outline-none"
          >
            {opcionesFiltro.map((op) => (
              <option key={op.value} value={op.value}>
                {op.etiqueta}
              </option>
            ))}
          </select>
        )}
      </div>

      {textoAccion && (
        <button
          onClick={onAccion}
          className="whitespace-nowrap rounded-lg bg-gradient-to-r from-[#f43f5e] to-[#db2777] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-[#e11d48] hover:to-[#be185d]"
        >
          + {textoAccion}
        </button>
      )}
    </div>
  );
}