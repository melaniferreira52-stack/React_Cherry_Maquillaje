import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { misPedidos, obtenerPerfil } from "../lib/api";
import DashboardLayout from "../components/Admin/DashboardLayout";

const ETIQUETAS_DOCUMENTO = {
  CC: "Cédula de ciudadanía",
  TI: "Tarjeta de identidad",
  CE: "Cédula de extranjería",
  PA: "Pasaporte",
};

const ESTILOS_ESTADO = {
  pendiente: "bg-amber-50 text-amber-700 border border-amber-200",
  en_proceso: "bg-sky-50 text-sky-700 border border-sky-200",
  entregado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelado: "bg-rose-50 text-rose-700 border border-rose-200",
};

const SECCIONES = [
  { id: "pedidos", etiqueta: "Mis pedidos", icono: "🧾" },
  { id: "servicios", etiqueta: "Mis servicios", icono: "📅" },
  { id: "datos", etiqueta: "Mis datos", icono: "👤" },
];

export default function ClientePanel() {
  const { token, usuario, cerrarSesion } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [seccionActiva, setSeccionActiva] = useState("pedidos");
  const [pedidoExpandido, setPedidoExpandido] = useState(null);

  useEffect(() => {
    Promise.all([obtenerPerfil(token), misPedidos(token)])
      .then(([datosPerfil, datosPedidos]) => {
        setPerfil(datosPerfil.usuario);
        setPedidos(datosPedidos.pedidos);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [token]);

  // Mientras carga el perfil completo, usamos lo que ya hay en la sesión
  const nombre = perfil?.nombre ?? usuario?.nombre;
  const apellido = perfil?.apellido ?? usuario?.apellido;

  // Un pedido que trae servicios (agendados desde "Agendar cita") lo tratamos
  // como cita de servicio; el resto son compras normales de producto.
  const pedidosProductos = useMemo(
    () => pedidos.filter((p) => !(p.servicios?.length > 0)),
    [pedidos]
  );
  const pedidosServicios = useMemo(
    () => pedidos.filter((p) => p.servicios?.length > 0),
    [pedidos]
  );

  const resumenPedidos = useMemo(() => {
    const total = pedidosProductos.length;
    const enCurso = pedidosProductos.filter(
      (p) => p.estado === "pendiente" || p.estado === "en_proceso"
    ).length;
    const gastado = pedidosProductos
      .filter((p) => p.estado !== "cancelado")
      .reduce((suma, p) => suma + Number(p.total || 0), 0);
    return { total, enCurso, gastado };
  }, [pedidosProductos]);

  return (
    <DashboardLayout
      rolEtiqueta="Cliente"
      nombreUsuario={nombre || usuario?.correo}
      secciones={SECCIONES}
      seccionActiva={seccionActiva}
      onCambiarSeccion={setSeccionActiva}
      breadcrumb="Cherry Beauty"
      tituloPagina={SECCIONES.find((s) => s.id === seccionActiva)?.etiqueta}
      onCerrarSesion={cerrarSesion}
    >
      {/* Saludo + tarjetas de resumen (siempre visibles arriba) */}
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold text-[--color-choco]">
          Hola, {nombre || usuario?.correo} 👋
        </h2>
        <p className="text-sm text-[--color-choco-soft]">
          Aquí puedes ver tus pedidos y datos de cuenta.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-lg">
            🧾
          </span>
          <div>
            <p className="font-display text-2xl font-semibold text-rose-950">
              {cargando ? "…" : resumenPedidos.total}
            </p>
            <p className="text-xs text-rose-400">Pedidos</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg">
            ⏳
          </span>
          <div>
            <p className="font-display text-2xl font-semibold text-rose-950">
              {cargando ? "…" : resumenPedidos.enCurso}
            </p>
            <p className="text-xs text-rose-400">En curso</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg">
            💰
          </span>
          <div>
            <p className="font-display text-2xl font-semibold text-rose-950">
              {cargando ? "…" : `$${resumenPedidos.gastado.toLocaleString("es-CO")}`}
            </p>
            <p className="text-xs text-rose-400">Total comprado</p>
          </div>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

      {seccionActiva === "datos" && (
        <div className="animate-[fadeSlideIn_.2s_ease-out] rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-semibold text-rose-950">
            Mis datos
          </h2>

          {cargando ? (
            <p className="text-sm text-rose-400">Cargando tus datos...</p>
          ) : (
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-rose-400">Nombre</dt>
                <dd className="font-medium text-rose-950">
                  {nombre} {apellido}
                </dd>
              </div>
              <div>
                <dt className="text-rose-400">Correo</dt>
                <dd className="font-medium text-rose-950">{usuario?.correo}</dd>
              </div>
              {perfil?.tipo_documento && (
                <div>
                  <dt className="text-rose-400">Documento</dt>
                  <dd className="font-medium text-rose-950">
                    {ETIQUETAS_DOCUMENTO[perfil.tipo_documento] || perfil.tipo_documento}{" "}
                    #{perfil.numero_documento}
                  </dd>
                </div>
              )}
              {perfil?.telefono && (
                <div>
                  <dt className="text-rose-400">Teléfono</dt>
                  <dd className="font-medium text-rose-950">{perfil.telefono}</dd>
                </div>
              )}
              {perfil?.direccion && (
                <div className="sm:col-span-2">
                  <dt className="text-rose-400">Dirección</dt>
                  <dd className="font-medium text-rose-950">{perfil.direccion}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      )}

      {seccionActiva === "pedidos" && (
        <div className="animate-[fadeSlideIn_.2s_ease-out] space-y-3">
          {cargando && (
            <p className="text-sm text-rose-400">Cargando tus pedidos...</p>
          )}

          {!cargando && pedidosProductos.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-white p-10 text-center">
              <span className="mb-2 block text-3xl">🛍️</span>
              <p className="text-sm text-rose-400">
                Todavía no has hecho ningún pedido.
              </p>
              <Link
                to="/"
                className="mt-3 inline-block rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                Ver el menú →
              </Link>
            </div>
          )}

          {pedidosProductos.map((pedido) => {
            const expandido = pedidoExpandido === pedido.id;
            return (
              <div
                key={pedido.id}
                className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() =>
                    setPedidoExpandido(expandido ? null : pedido.id)
                  }
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={expandido}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-base">
                      🧾
                    </span>
                    <div>
                      <p className="font-medium text-rose-950">
                        Pedido #{pedido.id}
                      </p>
                      <p className="text-sm text-rose-400">
                        {new Date(pedido.creado_en).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        ESTILOS_ESTADO[pedido.estado] || "bg-rose-50 text-rose-600 border border-rose-200"
                      }`}
                    >
                      {pedido.estado}
                    </span>
                    <p className="font-display text-base font-semibold text-rose-950">
                      ${Number(pedido.total).toLocaleString("es-CO")}
                    </p>
                    <span
                      className={`text-rose-300 transition-transform duration-200 ${
                        expandido ? "rotate-180" : ""
                      }`}
                    >
                      ⌄
                    </span>
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-200 ease-out ${
                    expandido ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="flex items-center justify-between border-t border-rose-100 bg-rose-50/60 px-5 py-3">
                      <p className="text-sm text-rose-400">
                        Consulta el detalle completo y descarga tu comprobante.
                      </p>
                      <Link
                        to={`/factura/${pedido.id}`}
                        className="whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-rose-600 shadow-sm ring-1 ring-rose-200 transition hover:bg-rose-100"
                      >
                        Ver factura →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {seccionActiva === "servicios" && (
        <div className="animate-[fadeSlideIn_.2s_ease-out] space-y-3">
          {cargando && (
            <p className="text-sm text-rose-400">Cargando tus citas...</p>
          )}

          {!cargando && pedidosServicios.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-white p-10 text-center">
              <span className="mb-2 block text-3xl">📅</span>
              <p className="text-sm text-rose-400">
                Todavía no has agendado ningún servicio.
              </p>
              <Link
                to="/agendar-cita"
                className="mt-3 inline-block rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                Agendar cita →
              </Link>
            </div>
          )}

          {pedidosServicios.map((pedido) => (
            <div
              key={pedido.id}
              className="overflow-hidden rounded-2xl border border-rose-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-base">
                    📅
                  </span>
                  <div>
                    <p className="font-medium text-rose-950">
                      {pedido.servicios.map((s) => s.nombre).join(", ")}
                    </p>
                    <p className="text-sm text-rose-400">
                      Agendado el{" "}
                      {new Date(pedido.creado_en).toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    ESTILOS_ESTADO[pedido.estado] || "bg-rose-50 text-rose-600 border border-rose-200"
                  }`}
                >
                  {pedido.estado}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </DashboardLayout>
  );
}