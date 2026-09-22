import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  listarFacturas,
  descargarFacturaPDF,
  descargarBlob,
  anularFactura,
} from "../../lib/api";

const ESTILOS_ESTADO = {
  emitida: "bg-[#d1fae5] text-[#047857]",
  anulada: "bg-[--color-strawberry-soft] text-[--color-strawberry-deep]",
};

export default function AdminFacturas({ esAdmin = true }) {
  const { token } = useAuth();

  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [filtros, setFiltros] = useState({
    numero: "",
    cliente: "",
    fecha_desde: "",
    fecha_hasta: "",
  });

  async function cargarFacturas() {
    setCargando(true);
    const params = {};
    for (const [k, v] of Object.entries(filtros)) {
      if (v) params[k] = v;
    }
    try {
      const datos = await listarFacturas(token, params);
      setFacturas(datos.facturas);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarFacturas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function manejarDescargar(factura) {
    setError("");
    setMensaje("");
    try {
      const respuesta = await descargarFacturaPDF(token, factura.id);
      await descargarBlob(respuesta, `${factura.numero_factura}.pdf`);
      setMensaje("Factura descargada");
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarAnular(factura) {
    setError("");
    setMensaje("");
    try {
      await anularFactura(token, factura.id);
      setMensaje(`Factura ${factura.numero_factura} anulada`);
      cargarFacturas();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          cargarFacturas();
        }}
        className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-[--color-border-soft] bg-white p-3 shadow-sm sm:grid-cols-4"
      >
        <label className="text-xs font-semibold text-[--color-choco-soft]">
          N° factura
          <input
            type="text"
            value={filtros.numero}
            onChange={(e) => setFiltros({ ...filtros, numero: e.target.value })}
            placeholder="FAC-"
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
        <div className="col-span-2 flex items-end gap-2 sm:col-span-4">
          <button
            type="submit"
            className="rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0284c7]"
          >
            🔍 Buscar
          </button>
          <button
            type="button"
            onClick={() =>
              setFiltros({ numero: "", cliente: "", fecha_desde: "", fecha_hasta: "" })
            }
            className="rounded-lg border border-[--color-border-soft] px-4 py-2 text-sm hover:bg-[--color-cream]"
          >
            Limpiar
          </button>
        </div>
      </form>

      {mensaje && <p className="mb-3 text-sm text-[#047857]">{mensaje}</p>}
      {error && <p className="mb-3 text-sm text-[--color-strawberry-deep]">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-[--color-border-soft] bg-white shadow-[--shadow-soft]">
        {cargando ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">Cargando facturas...</p>
        ) : facturas.length === 0 ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">
            No hay facturas emitidas todavía. Emite una factura desde la sección Ventas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#ffe4e6] bg-[#fff1f2] text-left text-xs uppercase tracking-wide text-[#9f1239]/70">
                  <th className="px-4 py-3">Factura</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Subtotal</th>
                  <th className="px-4 py-3">Impuestos</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((factura) => (
                  <tr
                    key={factura.id}
                    className="border-b border-[--color-border-soft] last:border-0 hover:bg-[--color-cream]/40"
                  >
                    <td className="px-4 py-3 font-semibold text-[--color-choco]">
                      {factura.numero_factura}
                    </td>
                    <td className="px-4 py-3 text-[--color-choco-soft]">
                      {factura.creado_en
                        ? new Date(factura.creado_en).toLocaleDateString("es-CO")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[--color-choco]">
                        {factura.cliente_nombre} {factura.cliente_apellido || ""}
                      </p>
                      <p className="text-xs text-[--color-choco-soft]">
                        {factura.cliente_correo}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[--color-choco-soft]">
                      ${Number(factura.subtotal).toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3 text-[--color-choco-soft]">
                      {Number(factura.impuestos) > 0
                        ? `$${Number(factura.impuestos).toLocaleString("es-CO")}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[--color-choco]">
                      ${Number(factura.total).toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          ESTILOS_ESTADO[factura.estado] || "bg-[--color-cream]"
                        }`}
                      >
                        {factura.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => manejarDescargar(factura)}
                          className="rounded-lg bg-[#ecfdf5] px-2 py-1 text-xs font-semibold text-[#047857] hover:bg-[#d1fae5]"
                        >
                          ⬇ PDF
                        </button>
                        <Link
                          to={`/factura/${factura.id}`}
                          className="rounded-lg border border-[--color-border-soft] px-2 py-1 text-xs font-semibold text-[#0369a1] hover:bg-[#f0f9ff]"
                        >
                          Ver
                        </Link>
                        {esAdmin && factura.estado === "emitida" && (
                          <button
                            onClick={() => manejarAnular(factura)}
                            className="rounded-lg border border-[#fda4af] px-2 py-1 text-xs font-semibold text-[#be123c] hover:bg-[#fff1f2]"
                          >
                            Anular
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}