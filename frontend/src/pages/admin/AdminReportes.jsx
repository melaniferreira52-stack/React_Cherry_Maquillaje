import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  reporteVentasDiarias,
  descargarReportePDF,
  descargarReporteExcel,
  descargarBlob,
} from "../../lib/api";

export default function AdminReportes({ esAdmin = true }) {
  const { token } = useAuth();

  const hoy = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(hoy);
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [descargando, setDescargando] = useState("");

  async function cargarReporte(fechaElegida = fecha) {
    setCargando(true);
    setError("");
    try {
      const datos = await reporteVentasDiarias(token, fechaElegida);
      setReporte(datos);
    } catch (err) {
      setError(err.message);
      setReporte(null);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarReporte(hoy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function manejarDescarga(tipo) {
    setDescargando(tipo);
    setError("");
    try {
      if (tipo === "pdf") {
        const respuesta = await descargarReportePDF(token, fecha);
        await descargarBlob(respuesta, `reporte_ventas_${fecha}.pdf`);
      } else {
        const respuesta = await descargarReporteExcel(token, fecha);
        await descargarBlob(respuesta, `reporte_ventas_${fecha}.xlsx`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDescargando("");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      {/* Panel lateral: selección de fecha y descargas */}
      <div className="rounded-xl border border-[--color-border-soft] bg-white p-5 shadow-sm h-fit">
        <h3 className="font-display text-lg font-semibold text-[--color-choco]">
          📅 Reporte diario de ventas
        </h3>
        <p className="mt-1 text-sm text-[--color-choco-soft]">
          Consulta las ventas registradas de un día y exporta el reporte.
        </p>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[--color-choco-soft]">
          Fecha del reporte
        </label>
        <input
          type="date"
          value={fecha}
          max={hoy}
          onChange={(e) => {
            setFecha(e.target.value);
            if (e.target.value) cargarReporte(e.target.value);
          }}
          className="mt-1 w-full rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 px-3 py-2 text-sm focus:border-[#38bdf8] focus:outline-none"
        />

        {error && <p className="mt-3 text-sm text-[--color-strawberry-deep]">{error}</p>}

        {reporte && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#ecfdf5] p-3 text-center">
                <p className="font-display text-2xl font-semibold text-[#047857]">
                  {reporte.totales.cantidad_ventas}
                </p>
                <p className="text-xs text-[--color-choco-soft]">Ventas</p>
              </div>
              <div className="rounded-xl bg-[#fffbeb] p-3 text-center">
                <p className="font-display text-2xl font-semibold text-[#b45309]">
                  ${Number(reporte.totales.total_ventas).toLocaleString("es-CO")}
                </p>
                <p className="text-xs text-[--color-choco-soft]">Total del día</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => manejarDescarga("pdf")}
                disabled={descargando === "pdf"}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#f43f5e] to-[#db2777] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-[#e11d48] hover:to-[#be185d] disabled:opacity-60"
              >
                {descargando === "pdf" ? "Generando..." : "⬇ Descargar PDF"}
              </button>
              <button
                onClick={() => manejarDescarga("excel")}
                disabled={descargando === "excel"}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#16a34a] px-4 py-2.5 text-sm font-semibold text-[#15803d] transition hover:bg-[#f0fdf4] disabled:opacity-60"
              >
                {descargando === "excel" ? "Generando..." : "⬇ Descargar Excel"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Vista previa del reporte */}
      <div className="rounded-xl border border-[--color-border-soft] bg-white shadow-sm">
        <div className="border-b border-[--color-border-soft] px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-[--color-choco]">
            {reporte?.proyecto || "Cherry Beauty — Maquillaje y Belleza"}
          </h3>
          <p className="text-sm text-[--color-choco-soft]">
            Reporte diario de ventas —{" "}
            {fecha ? new Date(fecha).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
          </p>
        </div>

        {cargando ? (
          <p className="p-8 text-sm text-[--color-choco-soft]">Cargando reporte...</p>
        ) : !reporte ? (
          <p className="p-8 text-sm text-[--color-choco-soft]">
            No hay reporte para esta fecha.
          </p>
        ) : reporte.ventas.length === 0 ? (
          <p className="p-8 text-sm text-[--color-choco-soft]">
            No hubo ventas registradas en esta fecha.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d1fae5] bg-[#ecfdf5] text-left text-xs uppercase tracking-wide text-[#065f46]/70">
                  <th className="px-5 py-3"># Venta</th>
                  <th className="px-5 py-3">Hora</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Productos / servicios</th>
                  <th className="px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {reporte.ventas.map((venta) => (
                  <tr
                    key={venta.numero_venta}
                    className="border-b border-[--color-border-soft] last:border-0 hover:bg-[--color-cream]/40"
                  >
                    <td className="px-5 py-3 text-[--color-choco-soft]">
                      {venta.numero_venta}
                    </td>
                    <td className="px-5 py-3 text-[--color-choco-soft]">
                      {venta.fecha_hora}
                    </td>
                    <td className="px-5 py-3 font-medium text-[--color-choco]">
                      {venta.cliente}
                    </td>
                    <td className="px-5 py-3 text-[--color-choco-soft]">
                      {venta.detalle}
                    </td>
                    <td className="px-5 py-3 font-semibold text-[--color-choco]">
                      ${Number(venta.total).toLocaleString("es-CO")}
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#fffbeb]">
                  <td className="px-5 py-3 font-semibold text-[--color-choco]">
                    Totales del día
                  </td>
                  <td />
                  <td />
                  <td className="px-5 py-3 text-sm text-[--color-choco-soft]">
                    {reporte.totales.cantidad_ventas}{" "}
                    {reporte.totales.cantidad_ventas === 1 ? "venta" : "ventas"}
                  </td>
                  <td className="px-5 py-3 font-bold text-[--color-choco]">
                    ${Number(reporte.totales.total_ventas).toLocaleString("es-CO")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}