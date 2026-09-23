import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import {
  estadisticasAdmin,
  obtenerProductosAdmin,
  obtenerServiciosAdmin,
} from "../../lib/api";

const ESTILOS_COLOR = {
  sky: "bg-sky-50 text-sky-700 border-sky-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const COLOR_VENTA_ESTADO = { registrada: "#10b981", anulada: "#f43f5e" };
const COLOR_PQR_ESTADO = {
  pendiente: "#f59e0b",
  en_proceso: "#0ea5e9",
  respondida: "#10b981",
  cerrada: "#94a3b8",
};
const PALETA_PRODUCTOS = ["#0ea5e9", "#e11d48", "#f59e0b", "#10b981", "#8b5cf6"];

function fechaISOHaceDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

const FILTROS_INICIALES = {
  fecha_desde: fechaISOHaceDias(30),
  fecha_hasta: new Date().toISOString().slice(0, 10),
  agrupacion: "dia",
  producto: "",
  servicio: "",
  estado: "",
  cliente: "",
};

export default function AdminResumen() {
  const { token } = useAuth();
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [productos, setProductos] = useState([]);
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    obtenerProductosAdmin(token).then((r) => setProductos(r.productos || [])).catch(() => {});
    obtenerServiciosAdmin(token).then((r) => setServicios(r.servicios || [])).catch(() => {});
  }, [token]);

  async function cargarEstadisticas(filtrosAEnviar) {
    setCargando(true);
    try {
      const resultado = await estadisticasAdmin(token, filtrosAEnviar);
      setDatos(resultado);
    } catch {
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarEstadisticas(filtros);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function actualizarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function resetearFiltros() {
    setFiltros(FILTROS_INICIALES);
    cargarEstadisticas(FILTROS_INICIALES);
  }

  // Mapeo de datos del período
  const datosPeriodo = useMemo(
    () => (datos?.ventas_por_periodo || []).map((p) => ({ nombre: p.etiqueta, total: p.total })),
    [datos]
  );

  // Cálculo de tendencia general (Compara primer vs último dato del período cargado)
  const tendenciaVentas = useMemo(() => {
    if (datosPeriodo.length < 2) return { porcentaje: 0, esSubida: true };
    const primero = datosPeriodo[0].total || 0;
    const ultimo = datosPeriodo[datosPeriodo.length - 1].total || 0;
    if (primero === 0) return { porcentaje: 100, esSubida: true };
    const diff = ((ultimo - primero) / primero) * 100;
    return {
      porcentaje: Math.abs(Math.round(diff)),
      esSubida: diff >= 0,
    };
  }, [datosPeriodo]);

  const datosTopProductos = useMemo(
    () => (datos?.top_productos || []).map((p) => ({ nombre: p.nombre, total: p.subtotal })),
    [datos]
  );

  const datosVentaEstado = useMemo(
    () => (datos?.ventas_por_estado || []).map((v) => ({ nombre: v.estado, valor: v.cantidad })),
    [datos]
  );

  const datosPqrEstado = useMemo(
    () => (datos?.pqr_por_estado || []).map((p) => ({ nombre: p.estado, valor: p.cantidad })),
    [datos]
  );

  // Gauge Salud
  const totalVentasPeriodo = datosVentaEstado.reduce((acc, v) => acc + v.valor, 0);
  const registradas = datosVentaEstado.find((v) => v.nombre === "registrada")?.valor || 0;
  const porcentajeSalud = totalVentasPeriodo ? Math.round((registradas / totalVentasPeriodo) * 100) : 0;
  const datosGauge = [
    {
      nombre: "salud",
      valor: porcentajeSalud,
      fill: porcentajeSalud >= 80 ? "#10b981" : porcentajeSalud >= 50 ? "#f59e0b" : "#f43f5e",
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header explicativo */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[--color-choco]">Resumen Ejecutivo</h2>
          <p className="text-sm text-[--color-choco-soft]">
            Métricas clave, comportamiento de ventas y estado general de Cherry Beauty.
          </p>
        </div>
      </div>

      {/* Panel de Filtros Rediseñado */}
      <div className="rounded-2xl border border-[--color-border-soft] bg-white/80 p-5 shadow-sm backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[--color-choco-soft]">
            🔍 Filtros de Consulta
          </span>
          <button
            onClick={resetearFiltros}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
          >
            Restablecer Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Desde</label>
            <input
              type="date"
              value={filtros.fecha_desde}
              onChange={(e) => actualizarFiltro("fecha_desde", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 transition focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Hasta</label>
            <input
              type="date"
              value={filtros.fecha_hasta}
              onChange={(e) => actualizarFiltro("fecha_hasta", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 transition focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Agrupar por</label>
            <select
              value={filtros.agrupacion}
              onChange={(e) => actualizarFiltro("agrupacion", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 transition focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
            >
              <option value="dia">Día</option>
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Producto</label>
            <select
              value={filtros.producto}
              onChange={(e) => actualizarFiltro("producto", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 transition focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
            >
              <option value="">Todos</option>
              {productos.map((p) => (
                <option key={p.id} value={p.nombre}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Servicio</label>
            <select
              value={filtros.servicio}
              onChange={(e) => actualizarFiltro("servicio", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 transition focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
            >
              <option value="">Todos</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.nombre}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Estado Venta</label>
            <select
              value={filtros.estado}
              onChange={(e) => actualizarFiltro("estado", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 transition focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
            >
              <option value="">Todos</option>
              <option value="registrada">Registrada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Cliente</label>
            <input
              type="text"
              placeholder="Buscar..."
              value={filtros.cliente}
              onChange={(e) => actualizarFiltro("cliente", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 transition focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => cargarEstadisticas(filtros)}
            disabled={cargando}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
          >
            {cargando ? "Cargando..." : "Aplicar Filtros"}
          </button>
        </div>
      </div>

      {/* KPI Cards principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(datos?.cards || []).map((tarjeta) => (
          <div
            key={tarjeta.etiqueta}
            className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {tarjeta.etiqueta}
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl border text-base ${
                  ESTILOS_COLOR[tarjeta.color] || ESTILOS_COLOR.sky
                }`}
              >
                {tarjeta.icono}
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="font-display text-2xl font-bold text-slate-800">
                {cargando ? "…" : tarjeta.valor}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Métricas de Salud + Estados */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Salud de ventas */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-2">
            <h3 className="font-display text-base font-bold text-slate-800">🎯 Salud de Ventas</h3>
            <p className="text-xs text-slate-500">% Ventas efectivas (no anuladas)</p>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <RadialBarChart
              data={datosGauge}
              innerRadius="75%"
              outerRadius="100%"
              startAngle={180}
              endAngle={0}
              barSize={16}
            >
              <RadialBar
                dataKey="valor"
                cornerRadius={10}
                fill={datosGauge[0].fill}
                background={{ fill: "#f1f5f9" }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="-mt-14 text-center">
            <p className="font-display text-3xl font-extrabold text-slate-800">{porcentajeSalud}%</p>
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                porcentajeSalud >= 80
                  ? "bg-emerald-100 text-emerald-800"
                  : porcentajeSalud >= 50
                  ? "bg-amber-100 text-amber-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {porcentajeSalud >= 80 ? "Óptimo" : porcentajeSalud >= 50 ? "Regular" : "Atención requerida"}
            </span>
          </div>
        </div>

        {/* Ventas por Estado */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-2">
            <h3 className="font-display text-base font-bold text-slate-800">🧾 Ventas por Estado</h3>
            <p className="text-xs text-slate-500">Distribución de registros</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={datosVentaEstado}
                dataKey="valor"
                nameKey="nombre"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
              >
                {datosVentaEstado.map((v) => (
                  <Cell key={v.nombre} fill={COLOR_VENTA_ESTADO[v.nombre] || "#94a3b8"} />
                ))}
              </Pie>
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* PQR por Estado */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-2">
            <h3 className="font-display text-base font-bold text-slate-800">🍓 PQR por Estado</h3>
            <p className="text-xs text-slate-500">Solicitudes y reclamos</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={datosPqrEstado}
                dataKey="valor"
                nameKey="nombre"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
              >
                {datosPqrEstado.map((p) => (
                  <Cell key={p.nombre} fill={COLOR_PQR_ESTADO[p.nombre] || "#94a3b8"} />
                ))}
              </Pie>
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comportamiento y Tendencia de Ventas (Subidas y Bajadas) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Barras por Período */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-slate-800">📊 Ventas por Período</h3>
              <p className="text-xs text-slate-500">
                {filtros.fecha_desde} al {filtros.fecha_hasta}
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={datosPeriodo}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="nombre" fontSize={11} stroke="#64748b" />
              <YAxis fontSize={11} stroke="#64748b" />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Bar dataKey="total" fill="#e11d48" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tendencia en Área Suave con Badge de Subida / Bajada */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-slate-800">📈 Tendencia y Flujo de Ventas</h3>
              <p className="text-xs text-slate-500">Comportamiento en el tiempo</p>
            </div>
            {/* Indicator de Subida o Bajada */}
            <div
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                tendenciaVentas.esSubida
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              <span>{tendenciaVentas.esSubida ? "▲" : "▼"}</span>
              <span>{tendenciaVentas.porcentaje}%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={datosPeriodo}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="nombre" fontSize={11} stroke="#64748b" />
              <YAxis fontSize={11} stroke="#64748b" />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#be123c"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorVentas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Ranking de Productos */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-display text-base font-bold text-slate-800">🏆 Top Productos Vendidos</h3>
            <p className="text-xs text-slate-500">Ingresos generados por producto</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={datosTopProductos} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" fontSize={11} stroke="#64748b" />
              <YAxis type="category" dataKey="nombre" fontSize={11} stroke="#64748b" width={110} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                {datosTopProductos.map((_, i) => (
                  <Cell key={i} fill={PALETA_PRODUCTOS[i % PALETA_PRODUCTOS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}