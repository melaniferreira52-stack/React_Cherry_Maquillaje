import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/img/logo.png";
import { useAuth } from "../context/AuthContext";

const ENLACES = [
  { to: "/", texto: "Inicio" },
  { to: "/productos", texto: "Productos" },
  { to: "/servicios", texto: "Servicios" },
  { to: "/quienes-somos", texto: "Quiénes Somos" },
  { to: "/contacto", texto: "Contacto" },
];

// Según el rol del usuario logueado, decide a qué panel enlazarlo
function obtenerEnlacePanel(rol) {
  if (rol === "administrador") return { to: "/admin", texto: "Panel Admin" };
  if (rol === "empleado") return { to: "/empleado", texto: "Panel Empleado" };
  return { to: "/mi-cuenta", texto: "Mi cuenta" };
}

function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const menuUsuarioRef = useRef(null);

  const { estaLogueado, usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const enlacePanel = estaLogueado ? obtenerEnlacePanel(usuario?.rol) : null;

  const manejarCerrarSesion = () => {
    cerrarSesion();
    setMenuAbierto(false);
    setMenuUsuarioAbierto(false);
    navigate("/");
  };

  // Cierra el desplegable de usuario si se hace clic afuera
  useEffect(() => {
    function manejarClicAfuera(evento) {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(evento.target)) {
        setMenuUsuarioAbierto(false);
      }
    }
    document.addEventListener("mousedown", manejarClicAfuera);
    return () => document.removeEventListener("mousedown", manejarClicAfuera);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-cream/95 shadow-sm backdrop-blur-md">
      <div className="flex h-[130px] w-full items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-24 2xl:px-32">
        <Link
          to="/"
          className="flex items-center gap-3"
          onClick={() => setMenuAbierto(false)}
        >
          <img
            src={logo}
            alt="Cherry Beauty"
            className="h-24 w-24 rounded-full object-cover shadow-soft sm:h-28 sm:w-28"
          />
          <span className="font-display text-2xl font-bold text-strawberry-deep sm:text-3xl">
            Cherry
          </span>
        </Link>

        {/* Navegación de escritorio */}
        <nav className="hidden items-center gap-3 lg:flex">
          {ENLACES.map((enlace, indice) => (
            <span key={enlace.to} className="flex items-center gap-3">
              <Link
                to={enlace.to}
                className="text-lg font-semibold text-caramel-deep transition-colors hover:text-strawberry-deep"
              >
                {enlace.texto}
              </Link>
              {indice < ENLACES.length - 1 && (
                <span className="text-caramel-soft" aria-hidden="true">
                  |
                </span>
              )}
            </span>
          ))}

          {estaLogueado ? (
            <div className="flex items-center gap-3">
              <span className="text-caramel-soft" aria-hidden="true">
                |
              </span>

              <Link
                to="/carrito"
                className="text-lg font-semibold text-caramel-deep transition-colors hover:text-strawberry-deep"
              >
                Carrito
              </Link>

              <span className="text-caramel-soft" aria-hidden="true">
                |
              </span>

              {/* Desplegable de cuenta: Bienvenido, X -> Mi cuenta / Panel + Cerrar sesión */}
              <div className="relative" ref={menuUsuarioRef}>
                <button
                  type="button"
                  onClick={() => setMenuUsuarioAbierto((prev) => !prev)}
                  aria-expanded={menuUsuarioAbierto}
                  className="flex items-center gap-1.5 rounded-full border border-caramel-soft px-5 py-2.5 text-sm font-semibold text-choco-soft transition-all hover:bg-caramel-soft"
                >
                  Bienvenido, {usuario?.nombre || "cliente"}
                  <svg
                    viewBox="0 0 20 20"
                    className={`h-4 w-4 fill-current transition-transform duration-200 ${
                      menuUsuarioAbierto ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  >
                    <path d="M5.25 7.5l4.75 5 4.75-5H5.25z" />
                  </svg>
                </button>

                {menuUsuarioAbierto && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-48 overflow-hidden rounded-2xl border border-border-soft bg-cream shadow-lift">
                    <Link
                      to={enlacePanel.to}
                      onClick={() => setMenuUsuarioAbierto(false)}
                      className="block px-5 py-3 text-left font-semibold text-caramel-deep transition-colors hover:bg-caramel-soft"
                    >
                      {enlacePanel.texto}
                    </Link>
                    <button
                      type="button"
                      onClick={manejarCerrarSesion}
                      className="block w-full px-5 py-3 text-left font-semibold text-strawberry-deep transition-colors hover:bg-strawberry-soft"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <span className="text-caramel-soft" aria-hidden="true">
                |
              </span>
              <Link
                to="/login"
                className="rounded-full bg-caramel px-8 py-3.5 text-lg font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-caramel-deep hover:shadow-lift"
              >
                Iniciar Sesión
              </Link>
            </>
          )}
        </nav>

        {/* Botón hamburguesa (solo en móvil/tablet) */}
        <button
          type="button"
          onClick={() => setMenuAbierto((prev) => !prev)}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
          className="flex h-12 w-12 flex-col items-center justify-center gap-1.5 rounded-full bg-caramel-soft lg:hidden"
        >
          <span
            className={`h-0.5 w-6 rounded-full bg-caramel-deep transition-all duration-300 ${
              menuAbierto ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`h-0.5 w-6 rounded-full bg-caramel-deep transition-all duration-300 ${
              menuAbierto ? "opacity-0" : ""
            }`}
          />
          <span
            className={`h-0.5 w-6 rounded-full bg-caramel-deep transition-all duration-300 ${
              menuAbierto ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Menú desplegable móvil (se mantiene apilado, sin el dropdown de escritorio) */}
      <nav
        className={`overflow-hidden bg-cream transition-all duration-300 lg:hidden ${
          menuAbierto ? "max-h-[32rem] border-t border-border-soft" : "max-h-0"
        }`}
      >
        <div className="flex flex-col items-center gap-1 px-6 py-4">
          {ENLACES.map((enlace) => (
            <Link
              key={enlace.to}
              to={enlace.to}
              onClick={() => setMenuAbierto(false)}
              className="w-full rounded-2xl px-4 py-3 text-center text-lg font-semibold text-caramel-deep transition-colors hover:bg-caramel-soft"
            >
              {enlace.texto}
            </Link>
          ))}

          {estaLogueado ? (
            <>
              <Link
                to="/carrito"
                onClick={() => setMenuAbierto(false)}
                className="w-full rounded-2xl px-4 py-3 text-center text-lg font-semibold text-caramel-deep transition-colors hover:bg-caramel-soft"
              >
                Carrito
              </Link>

              <Link
                to={enlacePanel.to}
                onClick={() => setMenuAbierto(false)}
                className="w-full rounded-2xl px-4 py-3 text-center text-lg font-semibold text-caramel-deep transition-colors hover:bg-caramel-soft"
              >
                {enlacePanel.texto}
              </Link>

              <p className="mt-2 text-center text-sm font-semibold text-choco-soft">
                Bienvenido, {usuario?.nombre || "cliente"}
              </p>
              <button
                type="button"
                onClick={manejarCerrarSesion}
                className="mt-1 w-full rounded-full border border-caramel-soft px-8 py-3.5 text-center text-lg font-bold text-caramel-deep transition-all hover:bg-caramel-soft"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMenuAbierto(false)}
              className="mt-2 w-full rounded-full bg-caramel px-8 py-3.5 text-center text-lg font-bold text-white shadow-soft transition-all hover:bg-caramel-deep"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;