import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PanelToolbar from "../../components/admin/PanelToolbar";
import PanelModal from "../../components/admin/PanelModal";
import {
  listarVentas,
  registrarVenta,
  emitirFactura,
  listarTodosLosPedidos,
  listarFacturas,
  descargarFacturaPDF,
  descargarBlob,
} from "../../lib/api";

const ESTILOS_ESTADO = {
  registrada: "bg-[#d1fae5] text-[#047857]",
  anulada: "bg-[--color-strawberry-soft] text-[--color-strawberry-deep]",
};

const OPCIONES_ESTADO = [
  { value: "", etiqueta: "Todos los estados" },
  { value: "registrada", etiqueta: "Registradas" },
  { value: "anulada", etiqueta: "Anuladas" },
];

export default function AdminVentas({ esAdmin = true }) {
  const { token } = useAuth();

  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Filtros (req. 3: fecha, cliente, producto, servicio, estado, valor)
  const [filtros, setFiltros] = useState({
    fecha_desde: "",
    fecha_hasta: "",
    cliente: "",
    producto: "",
    servicio: "",
    estado: "",
    valor_min: "",
    valor_max: "",
  });

  // Modal registrar venta
  const [pedidos, setPedidos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState("");
  const [descuento, setDescuento] = useState("");
  const [impuestos, setImpuestos] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Facturas emitidas (para saber qué venta ya tiene factura)
  const [facturas, setFacturas] = useState([]);

  function quitarVacios(obj) {
    const limpio = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== "" && v !== null && v !== undefined) limpio[k] = v;
    }
    return limpio;
  }

  async function cargarVentas() {
    setCargando(true);
    try {
      const datos = await listarVentas(token, quitarVacios(filtros));
      setVentas(datos.ventas);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarVentas();
    listarFacturas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function listarFacturas() {
    try {
      const datos = await listarFacturas(token, {});
      setFacturas(datos.facturas);
    } catch {
      setFacturas([]);
    }
  }

  function aplicarFiltros(e) {
    e.preventDefault();
    cargarVentas();
  }

  function limpiarFiltros() {
    setFiltros({
      fecha_desde: "",
      fecha_hasta: "",
      cliente: "",
      producto: "",
      servicio: "",
      estado: "",
      valor_min: "",
      valor_max: "",
    });
  }

  async function abrirFormulario() {
    setErrorFormulario("");
    setMensaje("");
    setMostrarFormulario(true);
    setPedidoSeleccionado("");
    setDescuento("");
    setImpuestos("");
    if (pedidos.length === 0) {
      try {
        const datos = await listarTodosLosPedidos(token);
        setPedidos(datos.pedidos);
      } catch (err) {
        setErrorFormulario(err.message);
      }
    }
  }

  async function manejarRegistro(e) {
    e.preventDefault();
    if (!pedidoSeleccionado) {
      setErrorFormulario("Selecciona un pedido");
      return;
    }
    setEnviando(true);
    setErrorFormulario("");
    try {
      await registrarVenta(token, {
        pedido_id: Number(pedidoSeleccionado),
        descuento: Number(descuento || 0),
        impuestos: Number(impuestos || 0),
      });
      setMensaje("Venta registrada correctamente");
      setMostrarFormulario(false);
      cargarVentas();
    } catch (err) {
      setErrorFormulario(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function manejarEmitirFactura(ventaId) {
    setMensaje("");
    setError("");
    try {
      const datos = await emitirFactura(token, ventaId);
      setMensaje(`Factura ${datos.factura.numero_factura} emitida`);
      listarFacturas();
      cargarVentas();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarDescargarFactura(facturaId) {
    try {
      const respuesta = await descargarFacturaPDF(token, facturaId);
      await descargarBlob(respuesta, `factura_${facturaId}.pdf`);
    } catch (err) {
      setError(err.message);
    }
  }

  const facturaDeVenta = useMemo(() => {
    const mapa = {};
    for (const f of facturas) mapa[f.venta_id] = f;
    return mapa;
  }, [facturas]);

  const totalFiltrado = useMemo(
    () =>
      ventas.reduce((s, v) => s + Number(v.total || 0), 0),
    [ventas]
  );

  return (
    <div>
      {/* Barra de filtros */}
      <form
        onSubmit={aplicarFiltros}
        className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-[--color-border-soft] bg-white p-3 shadow-sm sm:grid-cols-4"
      >
        <label className="text-xs font-semibold text-[--color-choco-soft]">
          Desde
          <input
            type="date"
            value={filtros.fecha_desde}
            onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 px-2 py-1.5 text-sm focus:border-[#38bdf8] focus:outline-none"
          />
        </label>
        <label className="text-xs font-semibold text-[--color-choco-soft]">
          Hasta
          <input
            type="date"
            value={filtros.fecha_hasta}
            onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 px-2 py-1.5 text-sm focus:border-[#38bdf8] focus:outline-none"
          />
        </label>
        <label className="text-xs font-semibold text-[--color-choco-soft]">
          Cliente (correo)
          <input
            type="text"
            value={filtros.cliente}
            onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
            placeholder="correo@..."
            className="mt-1 w-full rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 px-2 py-1.5 text-sm focus:border-[#38bdf8] focus:outline-none"
          />
        </label>
        <label className="text-xs font-semibold text-[--color-choco-soft]">
          Estado
          <select
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 px-2 py-1.5 text-sm focus:border-[#38bdf8] focus:outline-none"
          >
            {OPCIONES_ESTADO.map((op) => (
              <option key={op.value} value={op.value}>
                {op.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[--color-choco-soft]">
          Producto
          <input
            type="text"
            value={filtros.producto}
            onChange={(e) => setFiltros({ ...filtros, producto: e.target.value })}
            placeholder="ej. Labial"
            className="mt-1 w-full rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 px-2 py-1.5 text-sm focus:border-[#38bdf8] focus:outline-none"
          />
        </label>
        <label className="text-xs font-semibold text-[--color-choco-soft]">
          Servicio
          <input
            type="text"
            value={filtros.servicio}
            onChange={(e) => setFiltros({ ...filtros, servicio: e.target.value })}
            placeholder="ej. Domicilio"
            className="mt-1 w-full rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 px-2 py-1.5 text-sm focus:border-[#38bdf8] focus:outline-none"
          />
        </label>
        <label className="text-xs font-semibold text-[--color-choco-soft]">
          Valor mín
          <input
            type="number"
            min="0"
            value={filtros.valor_min}
            onChange={(e) => setFiltros({ ...filtros, valor_min: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 px-2 py-1.5 text-sm focus:border-[#38bdf8] focus:outline-none"
          />
        </label>
        <label className="text-xs font-semibold text-[--color-choco-soft]">
          Valor máx
          <input
            type="number"
            min="0"
            value={filtros.valor_max}
            onChange={(e) => setFiltros({ ...filtros, valor_max: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 px-2 py-1.5 text-sm focus:border-[#38bdf8] focus:outline-none"
          />
        </label>
        <div className="col-span-2 flex items-end gap-2 sm:col-span-4">
          <button
            type="submit"
            className="rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0284c7]"
          >
            🔍 Aplicar filtros
          </button>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="rounded-lg border border-[--color-border-soft] px-4 py-2 text-sm hover:bg-[--color-cream]"
          >
            Limpiar
          </button>
          <div className="ml-auto flex items-center gap-2 rounded-lg bg-[#fffbeb] px-3 py-1.5 text-sm">
            <span className="text-[--color-choco-soft]">Total filtrado:</span>
            <span className="font-bold text-[--color-choco]">
              ${totalFiltrado.toLocaleString("es-CO")}
            </span>
          </div>
        </div>
      </form>

      <div className="mb-4 flex items-center justify-between">
        {mensaje && <p className="text-sm text-[#047857]">{mensaje}</p>}
        {error && <p className="text-sm text-[--color-strawberry-deep]">{error}</p>}
        <button
          onClick={abrirFormulario}
          className="ml-auto rounded-lg bg-gradient-to-r from-[#f43f5e] to-[#db2777] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-[#e11d48] hover:to-[#be185d]"
        >
          + Registrar venta
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[--color-border-soft] bg-white shadow-[--shadow-soft]">
        {cargando ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">Cargando ventas...</p>
        ) : ventas.length === 0 ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">
            No se encontraron ventas con esos filtros. Registra una venta desde un pedido.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d1fae5] bg-[#ecfdf5] text-left text-xs uppercase tracking-wide text-[#065f46]/70">
                  <th className="px-4 py-3"># Venta</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Productos / servicios</th>
                  <th className="px-4 py-3">Subtotal</th>
                  <th className="px-4 py-3">Dto.</th>
                  <th className="px-4 py-3">Imp.</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Factura</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => {
                  const factura = facturaDeVenta[venta.id];
                  return (
                    <tr
                      key={venta.id}
                      className="border-b border-[--color-border-soft] last:border-0 hover:bg-[--color-cream]/40"
                    >
                      <td className="px-4 py-3 text-[--color-choco-soft]">{venta.id}</td>
                      <td className="px-4 py-3 text-[--color-choco-soft]">
                        {venta.fecha_hora
                          ? new Date(venta.fecha_hora).toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[--color-choco]">
                          {venta.cliente_nombre} {venta.cliente_apellido || ""}
                        </p>
                        <p className="text-xs text-[--color-choco-soft]">
                          {venta.cliente_correo}
                        </p>
                      </td>
                      <td className="max-w-[220px] px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {venta.detalles?.map((d, i) => (
                            <span
                              key={i}
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                d.tipo === "producto"
                                  ? "bg-[#ffe4e6] text-[#be123c]"
                                  : "bg-[#fef3c7] text-[#b45309]"
                              }`}
                            >
                              {d.nombre_item} x{d.cantidad}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[--color-choco-soft]">
                        ${Number(venta.subtotal).toLocaleString("es-CO")}
                      </td>
                      <td className="px-4 py-3 text-[--color-choco-soft]">
                        {Number(venta.descuento) > 0
                          ? `$${Number(venta.descuento).toLocaleString("es-CO")}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-[--color-choco-soft]">
                        {Number(venta.impuestos) > 0
                          ? `$${Number(venta.impuestos).toLocaleString("es-CO")}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[--color-choco]">
                        ${Number(venta.total).toLocaleString("es-CO")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            ESTILOS_ESTADO[venta.estado] || "bg-[--color-cream]"
                          }`}
                        >
                          {venta.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {factura ? (
                          <div className="flex flex-col gap-1">
                            <Link
                              to={`/factura/${factura.id}`}
                              className="text-[#0369a1] hover:underline"
                            >
                              {factura.numero_factura}
                            </Link>
                            <button
                              onClick={() => manejarDescargarFactura(factura.id)}
                              className="text-xs text-[#047857] hover:underline"
                            >
                              ⬇ PDF
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => manejarEmitirFactura(venta.id)}
                            className="rounded-lg border border-[#fda4af] px-2 py-1 text-xs font-semibold text-[#be123c] hover:bg-[#fff1f2]"
                          >
                            Emitir factura
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PanelModal
        abierto={mostrarFormulario}
        titulo="Registrar venta"
        subtitulo="Registra la operación comercial a partir de un pedido confirmado."
        onCerrar={() => setMostrarFormulario(false)}
      >
        <form onSubmit={manejarRegistro} className="grid gap-4">
          <div className="rounded-xl border border-[#d1fae5] bg-[#ecfdf5]/60 p-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#065f46]/70">
              Pedido
            </label>
            <select
              value={pedidoSeleccionado}
              onChange={(e) => setPedidoSeleccionado(e.target.value)}
              required
              className="w-full rounded-lg border border-[#a7f3d0] bg-white px-3 py-2 text-sm focus:border-[#10b981] focus:outline-none"
            >
              <option value="">Selecciona un pedido...</option>
              {pedidos.map((pedido) => (
                <option key={pedido.id} value={pedido.id}>
                  #{pedido.id} — {pedido.nombre || pedido.correo} — $
                  {Number(pedido.total).toLocaleString("es-CO")} ({pedido.estado})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-[--color-choco-soft]">
              Descuento ($)
              <input
                type="number"
                min="0"
                value={descuento}
                onChange={(e) => setDescuento(e.target.value)}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-[--color-border-soft] px-3 py-2 text-sm focus:border-[#fb7185] focus:outline-none"
              />
            </label>
            <label className="text-xs font-semibold text-[--color-choco-soft]">
              Impuestos ($)
              <input
                type="number"
                min="0"
                value={impuestos}
                onChange={(e) => setImpuestos(e.target.value)}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-[--color-border-soft] px-3 py-2 text-sm focus:border-[#fb7185] focus:outline-none"
              />
            </label>
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
              {enviando ? "Registrando..." : "Registrar venta"}
            </button>
            <button
              type="button"
              onClick={() => setMostrarFormulario(false)}
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