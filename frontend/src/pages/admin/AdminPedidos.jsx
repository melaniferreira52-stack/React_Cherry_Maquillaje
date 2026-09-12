import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PanelToolbar from "../../components/admin/PanelToolbar";
import PanelModal from "../../components/admin/PanelModal";
import {
  listarTodosLosPedidos,
  actualizarEstadoPedido,
  crearPedidoManual,
  obtenerProductosAdmin,
} from "../../lib/api";

const ESTADOS = ["pendiente", "en_proceso", "entregado", "cancelado"];

const OPCIONES_ESTADO = [
  { value: "todos", etiqueta: "Todos los estados" },
  ...ESTADOS.map((estado) => ({ value: estado, etiqueta: estado })),
];

const ESTILOS_ESTADO = {
  pendiente: "bg-[--color-cream] text-[#b45309]",
  en_proceso: "bg-[#e0f2fe] text-[#0369a1]",
  entregado: "bg-[#d1fae5] text-[#047857]",
  cancelado: "bg-[--color-strawberry-soft] text-[--color-strawberry-deep]",
};

let contadorLinea = 0;
function lineaVacia() {
  contadorLinea += 1;
  return { clave: contadorLinea, producto_id: "", cantidad: 1 };
}

export default function AdminPedidos({
  abrirCrearInicial = false,
  onConsumirCrearInicial,
}) {
  const { token } = useAuth();

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [productos, setProductos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [correoCliente, setCorreoCliente] = useState("");
  const [lineas, setLineas] = useState([lineaVacia()]);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function cargarPedidos() {
    setCargando(true);
    try {
      const datos = await listarTodosLosPedidos(token);
      setPedidos(datos.pedidos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (abrirCrearInicial) {
      abrirFormulario();
      onConsumirCrearInicial?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirCrearInicial]);

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return pedidos.filter((pedido) => {
      const nombreCliente = pedido.nombre
        ? `${pedido.nombre} ${pedido.apellido || ""}`
        : pedido.correo;
      const coincideTexto =
        !texto ||
        nombreCliente.toLowerCase().includes(texto) ||
        String(pedido.id).includes(texto);
      const coincideEstado =
        filtroEstado === "todos" || pedido.estado === filtroEstado;
      return coincideTexto && coincideEstado;
    });
  }, [pedidos, busqueda, filtroEstado]);

  async function manejarCambioEstado(id, nuevoEstado) {
    setMensaje("");
    setError("");
    try {
      await actualizarEstadoPedido(token, id, nuevoEstado);
      setMensaje("Estado del pedido actualizado");
      cargarPedidos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function abrirFormulario() {
    setCorreoCliente("");
    setLineas([lineaVacia()]);
    setErrorFormulario("");
    setMostrarFormulario(true);
    if (productos.length === 0) {
      try {
        const datos = await obtenerProductosAdmin(token);
        setProductos(datos.productos.filter((p) => p.disponible));
      } catch (err) {
        setErrorFormulario(err.message);
      }
    }
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
  }

  function actualizarLinea(clave, campo, valor) {
    setLineas((prev) =>
      prev.map((linea) =>
        linea.clave === clave ? { ...linea, [campo]: valor } : linea
      )
    );
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, lineaVacia()]);
  }

  function quitarLinea(clave) {
    setLineas((prev) =>
      prev.length > 1 ? prev.filter((linea) => linea.clave !== clave) : prev
    );
  }

  const totalEstimado = useMemo(() => {
    return lineas.reduce((suma, linea) => {
      const producto = productos.find(
        (p) => String(p.id) === String(linea.producto_id)
      );
      if (!producto) return suma;
      return suma + Number(producto.precio) * Number(linea.cantidad || 0);
    }, 0);
  }, [lineas, productos]);

  async function manejarEnvioFormulario(e) {
    e.preventDefault();
    setErrorFormulario("");

    const items = lineas
      .filter((linea) => linea.producto_id && Number(linea.cantidad) > 0)
      .map((linea) => ({
        producto_id: Number(linea.producto_id),
        cantidad: Number(linea.cantidad),
      }));

    if (items.length === 0) {
      setErrorFormulario("Agrega al menos un producto con cantidad válida.");
      return;
    }

    setEnviando(true);
    try {
      await crearPedidoManual(token, { correo_cliente: correoCliente, items });
      setMensaje("Pedido creado correctamente");
      cerrarFormulario();
      cargarPedidos();
    } catch (err) {
      setErrorFormulario(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <PanelToolbar
        busqueda={busqueda}
        onCambiarBusqueda={setBusqueda}
        placeholderBusqueda="Buscar por cliente o # de pedido..."
        filtro={filtroEstado}
        onCambiarFiltro={setFiltroEstado}
        opcionesFiltro={OPCIONES_ESTADO}
        textoAccion="Agregar pedido"
        onAccion={abrirFormulario}
      />

      {mensaje && <p className="mb-4 text-sm text-[#047857]">{mensaje}</p>}
      {error && <p className="mb-4 text-sm text-[--color-strawberry-deep]">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-[--color-border-soft] bg-white shadow-[--shadow-soft]">
        {cargando ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">Cargando pedidos...</p>
        ) : pedidosFiltrados.length === 0 ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">
            {pedidos.length === 0
              ? "Todavía no hay pedidos registrados."
              : "No se encontraron pedidos con esos filtros."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d1fae5] bg-[#ecfdf5] text-left text-xs uppercase tracking-wide text-[#065f46]/70">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Servicios</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Factura</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map((pedido) => (
                  <tr
                    key={pedido.id}
                    className="border-b border-[--color-border-soft] last:border-0 hover:bg-[--color-cream]/40"
                  >
                    <td className="px-4 py-3 text-[--color-choco-soft]">{pedido.id}</td>
                    <td className="px-4 py-3 font-medium text-[--color-choco]">
                      {pedido.nombre ? `${pedido.nombre} ${pedido.apellido}` : pedido.correo}
                    </td>
                    <td className="px-4 py-3">
                      {pedido.servicios && pedido.servicios.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {pedido.servicios.map((servicio, indice) => (
                            <span
                              key={indice}
                              className="rounded-full bg-[--color-strawberry-soft] px-2 py-0.5 text-xs font-semibold text-[--color-strawberry-deep]"
                            >
                              {servicio.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-[--color-choco-soft]/60">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[--color-choco-soft]">
                      ${Number(pedido.total).toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3 text-[--color-choco-soft]">
                      {new Date(pedido.creado_en).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={pedido.estado}
                        onChange={(e) => manejarCambioEstado(pedido.id, e.target.value)}
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${
                          ESTILOS_ESTADO[pedido.estado] || "bg-[--color-cream]"
                        }`}
                      >
                        {ESTADOS.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/factura/${pedido.id}`}
                        className="text-[#0369a1] hover:underline"
                      >
                        Ver factura
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PanelModal
        abierto={mostrarFormulario}
        titulo="Agregar pedido"
        subtitulo="Regístralo a nombre de un cliente ya existente."
        onCerrar={cerrarFormulario}
      >
        <form onSubmit={manejarEnvioFormulario} className="grid gap-4">
          {/* Tarjeta: cliente */}
          <div className="rounded-xl border border-[#e0f2fe] bg-[#f0f9ff]/60 p-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#075985]/70">
              Cliente
            </label>
            <input
              type="email"
              value={correoCliente}
              onChange={(e) => setCorreoCliente(e.target.value)}
              placeholder="correo@cliente.com"
              required
              className="w-full rounded-lg border border-[#bae6fd] bg-white px-3 py-2 text-sm focus:border-[#38bdf8] focus:outline-none"
            />
          </div>

          {/* Tarjeta: productos */}
          <div className="rounded-xl border border-[#ffe4e6] bg-[#fff1f2]/50 p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#9f1239]/70">
              Productos
            </label>

            <div className="space-y-2">
              {lineas.map((linea) => (
                <div
                  key={linea.clave}
                  className="flex gap-2 rounded-lg border border-[#ffe4e6] bg-white p-2 shadow-sm"
                >
                  <select
                    value={linea.producto_id}
                    onChange={(e) =>
                      actualizarLinea(linea.clave, "producto_id", e.target.value)
                    }
                    required
                    className="flex-1 rounded-lg border border-[--color-border-soft] px-3 py-2 text-sm focus:border-[#fb7185] focus:outline-none"
                  >
                    <option value="">Selecciona un producto...</option>
                    {productos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre} — $
                        {Number(producto.precio).toLocaleString("es-CO")}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={linea.cantidad}
                    onChange={(e) =>
                      actualizarLinea(linea.clave, "cantidad", e.target.value)
                    }
                    className="w-16 rounded-lg border border-[--color-border-soft] px-2 py-2 text-center text-sm focus:border-[#fb7185] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => quitarLinea(linea.clave)}
                    disabled={lineas.length === 1}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#f43f5e] transition hover:bg-[#ffe4e6] disabled:opacity-30"
                    aria-label="Quitar producto"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={agregarLinea}
              className="mt-3 w-full rounded-lg border border-dashed border-[#fda4af] py-2 text-sm font-semibold text-[#e11d48] transition hover:bg-[#ffe4e6]/60"
            >
              + Agregar otro producto
            </button>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-[#fffbeb] to-[#fff1f2] px-4 py-3">
            <span className="text-sm font-medium text-[--color-choco-soft]">
              Total estimado
            </span>
            <span className="font-display text-xl font-semibold text-[--color-choco]">
              ${totalEstimado.toLocaleString("es-CO")}
            </span>
          </div>

          {errorFormulario && (
            <p className="text-sm text-[--color-strawberry-deep]">{errorFormulario}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-gradient-to-r from-[#f43f5e] to-[#db2777] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-[#e11d48] hover:to-[#be185d] disabled:opacity-60"
            >
              {enviando ? "Creando..." : "Crear pedido"}
            </button>
            <button
              type="button"
              onClick={cerrarFormulario}
              className="rounded-lg border border-[--color-border-soft] px-4 py-2 text-sm hover:bg-[--color-cream]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </PanelModal>
    </div>
  );
}