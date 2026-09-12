import { useState } from "react";
import { Link } from "react-router-dom";

/**
 * Shell de dashboard con sidebar fijo + encabezado, reutilizado por
 * AdminPanel (rol administrador) y EmpleadoPanel (rol empleado).
 *
 * secciones: [{ id, etiqueta, icono }]
 */
export default function DashboardLayout({
  marca = "Cherry Beauty",
  rolEtiqueta = "Administrador",
  nombreUsuario,
  secciones,
  seccionActiva,
  onCambiarSeccion,
  breadcrumb,
  tituloPagina,
  onCerrarSesion,
  children,
}) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const seccionActual = secciones.find((s) => s.id === seccionActiva);

  return (
    <div className="min-h-screen bg-white md:flex">
      {/* Botón para abrir el menú en móvil */}
      <div className="flex items-center justify-between border-b border-pink-200 bg-pink-100 px-4 py-3 md:hidden">
        <span className="font-display text-lg font-semibold text-pink-900">
          {marca}
        </span>
        <button
          onClick={() => setMenuMovilAbierto((v) => !v)}
          className="rounded-lg border border-pink-300 px-3 py-1.5 text-sm text-pink-900"
          aria-label="Abrir menú"
        >
          ☰ Menú
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          menuMovilAbierto ? "block" : "hidden"
        } shrink-0 bg-pink-100 text-pink-900 md:block md:w-64`}
      >
        <div className="flex h-full flex-col md:sticky md:top-0 md:h-screen">
          <div className="hidden flex-col items-center gap-3 px-6 py-6 text-center md:flex">
            <img
              src="/src/assets/img/logo.png"
              alt="Cherry Beauty"
              className="h-10 w-10 rounded-full object-cover ring-2 ring-pink-400"
            />
            <div>
              <p className="font-display text-lg font-semibold text-pink-900">
                {marca}
              </p>
              <p className="text-xs uppercase tracking-wide text-pink-900/70">
                Panel {rolEtiqueta}
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {secciones.map((seccion) => (
              <button
                key={seccion.id}
                onClick={() => {
                  onCambiarSeccion(seccion.id);
                  setMenuMovilAbierto(false);
                }}
                className={`flex w-full items-center justify-center gap-3 rounded-lg px-4 py-2.5 text-center text-sm font-medium transition ${
                  seccionActiva === seccion.id
                    ? "bg-pink-400 text-white"
                    : "text-pink-900 hover:bg-white/50"
                }`}
              >
                <span className="text-base leading-none">{seccion.icono}</span>
                {seccion.etiqueta}
              </button>
            ))}
          </nav>

          {/* Cerrar sesión, al final del sidebar */}
          <div className="border-t border-pink-200 px-3 py-4">
            <button
              onClick={() => {
                setMenuMovilAbierto(false);
                onCerrarSesion();
              }}
              className="flex w-full items-center justify-center gap-3 rounded-lg px-4 py-2.5 text-center text-sm font-medium text-pink-900 transition hover:bg-white/50"
            >
              <span className="text-base leading-none">⏻</span>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <div className="min-w-0 flex-1 bg-white">
        <header className="relative z-20 flex flex-col gap-1 border-b border-[--color-border-soft] bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[--color-caramel-deep]">
              {breadcrumb || marca}
            </p>
            <h1 className="font-display text-2xl font-semibold text-[--color-choco]">
              {tituloPagina || seccionActual?.etiqueta}
            </h1>
          </div>

          {/* Espaciador invisible para "empujar" el bloque de usuario a la derecha en desktop */}
          <div className="hidden sm:block sm:w-0" />

          <div className="flex items-center gap-2 self-start sm:self-auto sm:ml-auto">
            <div className="flex items-center gap-2 rounded-full bg-[--color-cream] px-3 py-1.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[--color-strawberry] text-sm font-semibold text-white">
                {(nombreUsuario || "?").charAt(0).toUpperCase()}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-[--color-choco]">
                  {nombreUsuario}
                </p>
                <p className="text-xs text-[--color-choco-soft]">{rolEtiqueta}</p>
              </div>
            </div>

            {/* Solo el botón de volver al sitio - botón de apagado removido */}
            <Link
              to="/"
              title="Volver al sitio"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[--color-choco-soft] transition hover:bg-[--color-cream] hover:text-[--color-choco]"
            >
              <span className="text-base leading-none">↩</span>
            </Link>
          </div>
        </header>

        <main className="bg-white px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}