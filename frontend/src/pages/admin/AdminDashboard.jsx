import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  estadisticasAdmin,
  estadisticasEmpleado,
} from "../../lib/api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

const COLORES_BARRA = {
  sky: "#0ea5e9",
  rose: "#f43f5e",
  amber: "#f59e0b",
  emerald: "#10b981",
  violet: "#8b5cf6",
  indigo: "#6366f1",
  cyan: "#06b6d4",
  orange: "#f97316",
};

const ESTILOS_CARD = {
  sky: "bg-[#e0f2fe] text-[#0369a1]",
  rose: "bg-[#ffe4e6] text-[#be123c]",
  amber: "bg-[#fef3c7] text-[#b45309]",
  emerald: "bg-[#d1fae5] text-[#047857]",
  violet: "bg-[#ede9fe] text-[#6d28d9]",
  indigo: "bg-[#e0e7ff] text-[#4338ca]",
  cyan: "bg-[#cffafe] text-[#0e7490]",
  orange: "bg-[#ffedd5] text-[#c2410c]",
};

const ETIQUETAS_ESTADO = {
  registrada: "Registrada",
  anulada: "Anulada",
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  respondida: "Respondida",
  cerrada: "Cerrada",
};

export default function AdminDashboard({ esAdmin = true }) {
  const { token, usuario } = useAuth();

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const hoy = new Date().toISOString().slice(0, 10);
  const hace30 = new Date(Date.now() - 30 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  const [filtros, setFiltros] = useState({
    fecha_desde: hace30,
    fecha_hasta: hoy,
    agrupacion: "dia",
  });

  async function cargarDatos() {
    setCargando(true);
    setError("");
    try {
      const fn = esAdmin ? estadisticasAdmin : estadisticasEmpleado;
      const respuesta = await fn(token, filtros);
      setDatos(respuesta);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const serie = useMemo(() => {
    if (!datos) return [];
    return (datos.ventas_por_periodo || []).map((p) => ({
      etiqueta: p.etiqueta,
      Ventas: p.total,
    }));
  }, [datos]);

  const datosEstado = useMemo(() => {
    if (!datos) return [];
    return (datos.ventas_por_estado || []).map((e) => ({
      estado: ETIQUETAS_ESTADO[e.estado] || e.estado,
      cantidad: e.cantidad,
    }));
  }, [datos]);

  const topProductos = useMemo(() => {
    if (!datos) return [];
    return (datos.top_productos || []).map((p) => ({
      nombre: p.nombre,
      vendido: p.subtotal,
    }));
  }, [datos]);

  const pqrEstado = useMemo(() => {
    if (!datos) return [];
    return (datos.pqr_por_estado || []).map((p) => ({
      estado: ETIQUETAS_ESTADO[p.estado] || p.estado,
      cantidad: p.cantidad,
    }));
  }, [datos]);

  return (
    <div className="space-y-6">
      {/* Filtros de fechas */}
      <div className="flex flex-col gap-2 rounded-xl border border-[--color-border-soft] bg-white p-3 shadow-sm sm:flex-row sm:items-end">
        <label className="text-xs font-semibold text-[--color-choco-soft]">
          Desde
          <input
            type="date"
            value={filtros.fecha_desde}
            max={filtros.fecha_hasta}
            onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 px-2 py-1.5 text-sm sm:w-40 focus:border-[#38bdf8] focus:outline-none"
          />
        </label>
        <label className="text-xs font-semibold text-[--color-choco-soft]">
          Hasta
          <input
            type="date"
            value={filtros.fecha_hasta}
            min={filtros.fecha_desde}
            onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 px-2 py-1.5 text-sm sm:w-40 focus:border-[#38bdf8] focus:outline-none"
          />
        </label>
        <label className="text-xs font-semibold text-[--color-choco-soft]">
          Agrupar por
          <select
            value={filtros.agrupacion}
            onChange={(e) => setFiltros({ ...filtros, agrupacion: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 px-2 py-1.5 text-sm sm:w-40 focus:border-[#38bdf8] focus:outline-none"
          >
            <option value="dia">Día</option>
            <option value="semana">Semana</option>
            <option value="mes">Mes</option>
          </select>
        </label>
        <button
          onClick={cargarDatos}
          className="rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0284c7]"
        >
          Aplicar
        </button>
      </div>

      {error && <p className="text-sm text-[--color-strawberry-deep]">{error}</p>}

      {cargando ? (
        <p className="p-6 text-sm text-[--color-choco-soft]">Cargando indicadores...</p>
      ) : !datos ? (
        <p className="p-6 text-sm text-[--color-choco-soft]">
          No hay datos para mostrar.
        </p>
      ) : (
        <>
          {/* Tarjetas de indicadores (req. 10, 13, 15) */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {datos.cards.map((card) => (
              <div
                key={card.etiqueta}
                className="rounded-xl border border-[--color-border-soft] bg-white p-4 shadow-sm"
              >
                <div
                  className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full text-lg ${
                    ESTILOS_CARD[card.color] || ESTILOS_CARD.sky
                  }`}
                >
                  {card.icono}
                </div>
                <p className="font-display text-2xl font-semibold text-[--color-choco]">
                  {typeof card.valor === "number" && card.valor > 1000
                    ? `$${Number(card.valor).toLocaleString("es-CO")}`
                    : String(card.valor)}
                </p>
                <p className="text-xs text-[--color-choco-soft]">{card.etiqueta}</p>
              </div>
            ))}
          </div>

          {/* Gráficos principales */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Gráfico de barras: ventas por periodo (req. 13) */}
            <div className="rounded-xl border border-[--color-border-soft] bg-white p-5 shadow-sm">
              <h3 className="mb-1 font-display text-base font-semibold text-[--color-choco]">
                📊 Ventas por periodo
              </h3>
              <p className="mb-4 text-xs text-[--color-choco-soft]">
                {datos.filtros?.fecha_desde} → {datos.filtros?.fecha_hasta}
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serie} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
                    <XAxis
                      dataKey="etiqueta"
                      tick={{ fontSize: 11, fill: "var(--color-choco-soft)" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-choco-soft)" }}
                      tickFormatter={(v) => `$${v.toLocaleString("es-CO")}`}
                    />
                    <Tooltip
                      formatter={(v) => [`$${Number(v).toLocaleString("es-CO")}`, "Ventas"]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--color-border-soft)",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="Ventas" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico lineal: tendencia (req. 14) */}
            <div className="rounded-xl border border-[--color-border-soft] bg-white p-5 shadow-sm">
              <h3 className="mb-1 font-display text-base font-semibold text-[--color-choco]">
                📈 Tendencia de ventas
              </h3>
              <p className="mb-4 text-xs text-[--color-choco-soft]">
                Evolución del valor vendido en el periodo
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serie} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
                    <XAxis
                      dataKey="etiqueta"
                      tick={{ fontSize: 11, fill: "var(--color-choco-soft)" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-choco-soft)" }}
                      tickFormatter={(v) => `$${v.toLocaleString("es-CO")}`}
                    />
                    <Tooltip
                      formatter={(v) => [`$${Number(v).toLocaleString("es-CO")}`, "Ventas"]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--color-border-soft)",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Ventas"
                      stroke="#db2777"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#db2777" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top productos */}
            <div className="rounded-xl border border-[--color-border-soft] bg-white p-5 shadow-sm">
              <h3 className="mb-1 font-display text-base font-semibold text-[--color-choco]">
                🏆 Top productos vendidos
              </h3>
              <p className="mb-4 text-xs text-[--color-choco-soft]">
                Por valor acumulado de ventas
              </p>
              {topProductos.length === 0 ? (
                <p className="py-6 text-center text-sm text-[--color-choco-soft]">
                  Sin productos vendidos todavía.
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topProductos}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: "var(--color-choco-soft)" }}
                        tickFormatter={(v) => `$${v.toLocaleString("es-CO")}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="nombre"
                        width={130}
                        tick={{ fontSize: 11, fill: "var(--color-choco-soft)" }}
                      />
                      <Tooltip
                        formatter={(v) => [`$${Number(v).toLocaleString("es-CO")}`, "Vendido"]}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid var(--color-border-soft)",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="vendido" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Estado de ventas y PQR */}
            <div className="rounded-xl border border-[--color-border-soft] bg-white p-5 shadow-sm">
              <h3 className="mb-1 font-display text-base font-semibold text-[--color-choco]">
                📋 Estado de ventas
              </h3>
              <p className="mb-4 text-xs text-[--color-choco-soft]">
                Cantidad de ventas por estado
              </p>
              {datosEstado.length === 0 ? (
                <p className="py-6 text-center text-sm text-[--color-choco-soft]">
                  Sin ventas registradas.
                </p>
              ) : (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosEstado} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" />
                      <XAxis
                        dataKey="estado"
                        tick={{ fontSize: 11, fill: "var(--color-choco-soft)" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "var(--color-choco-soft)" }}
                      />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                        {datosEstado.map((_, i) => (
                          <Cell key={i} fill={["#10b981", "#f43f5e", "#f59e0b", "#6366f1"][i % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <h3 className="mb-1 mt-6 font-display text-base font-semibold text-[--color-choco]">
                📥 PQR por estado
              </h3>
              {pqrEstado.length === 0 ? (
                <p className="py-4 text-center text-sm text-[--color-choco-soft]">
                  Sin PQR registradas.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {pqrEstado.map((p) => (
                    <div key={p.estado} className="flex items-center gap-3">
                      <span className="w-24 text-xs font-semibold text-[--color-choco-soft]">
                        {p.estado}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[--color-cream]">
                        <div
                          className="h-full rounded-full bg-[#f97316]"
                          style={{
                            width: `${
                              pqrEstado.reduce((s, x) => s + x.cantidad, 0)
                                ? (p.cantidad / pqrEstado.reduce((s, x) => s + x.cantidad, 0)) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-bold text-[--color-choco]">
                        {p.cantidad}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}