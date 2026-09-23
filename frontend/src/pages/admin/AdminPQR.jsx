import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  listarPQR,
  cambiarEstadoPQR,
  responderPQR,
} from "../../lib/api";

const ETIQUETAS_TIPO = {
  peticion: "Petición",
  queja: "Queja",
  reclamo: "Reclamo",
};

const ESTILOS_TIPO = {
  peticion: "bg-sky-100 text-sky-700 border-sky-200",
  queja: "bg-amber-100 text-amber-700 border-amber-200",
  reclamo: "bg-rose-100 text-rose-700 border-rose-200",
};

const ESTILOS_ESTADO = {
  pendiente: "bg-amber-50 text-amber-700 border-amber-200",
  en_proceso: "bg-blue-50 text-blue-700 border-blue-200",
  respondida: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cerrada: "bg-stone-100 text-stone-600 border-stone-200",
};

const OPCIONES_ESTADO = [
  { value: "", etiqueta: "Todos los estados" },
  { value: "pendiente", etiqueta: "Pendientes" },
  { value: "en_proceso", etiqueta: "En proceso" },
  { value: "respondida", etiqueta: "Respondidas" },
  { value: "cerrada", etiqueta: "Cerradas" },
];

export default function AdminPQR({ esAdmin = true }) {
  const { token } = useAuth();

  const [pqr, setPqr] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [expandido, setExpandido] = useState(null);
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function cargarPQR() {
    setCargando(true);
    try {
      const datos = await listarPQR(token, {
        estado: filtroEstado || undefined,
        tipo: filtroTipo || undefined,
      });
      setPqr(datos.pqr || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarPQR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, filtroTipo]);

  // Métricas para el Dashboard Superior
  const metricas = useMemo(() => {
    return {
      total: pqr.length,
      pendientes: pqr.filter((p) => p.estado === "pendiente").length,
      enProceso: pqr.filter((p) => p.estado === "en_proceso").length,
      respondidas: pqr.filter((p) => p.estado === "respondida").length,
    };
  }, [pqr]);

  // Filtrado dinámico por texto de búsqueda
  const pqrFiltradas = useMemo(() => {
    if (!busqueda.trim()) return pqr;
    const q = busqueda.toLowerCase();
    return pqr.filter(
      (item) =>
        item.asunto?.toLowerCase().includes(q) ||
        String(item.id).includes(q) ||
        item.mensaje?.toLowerCase().includes(q)
    );
  }, [pqr, busqueda]);

  async function manejarEstado(id, estado) {
    setError("");
    setMensaje("");
    try {
      await cambiarEstadoPQR(token, id, estado);
      setMensaje("Estado actualizado correctamente");
      cargarPQR();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarRespuesta(id) {
    if (!respuesta.trim()) {
      setError("Escribe una respuesta antes de enviar");
      return;
    }
    setEnviando(true);
    setError("");
    setMensaje("");
    try {
      await responderPQR(token, id, respuesta.trim(), "respondida");
      setMensaje("PQR respondida con éxito");
      setRespuesta("");
      setExpandido(null);
      cargarPQR();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 📊 TARJETAS DE DASHBOARD INTERACTIVAS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setFiltroEstado("")}
          className={`group flex flex-col justify-between rounded-2xl border p-4 text-left transition-all hover:shadow-md ${
            filtroEstado === ""
              ? "border-[--color-strawberry-soft] bg-white ring-2 ring-[--color-strawberry-soft]/40"
              : "border-slate-100 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[--color-choco-soft]">Total PQR</span>
            <span className="text-lg">📁</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[--color-choco]">{metricas.total}</p>
        </button>

        <button
          type="button"
          onClick={() => setFiltroEstado(filtroEstado === "pendiente" ? "" : "pendiente")}
          className={`group flex flex-col justify-between rounded-2xl border p-4 text-left transition-all hover:shadow-md ${
            filtroEstado === "pendiente"
              ? "border-amber-300 bg-amber-50/50 ring-2 ring-amber-300/40"
              : "border-slate-100 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">Pendientes</span>
            <span className="text-lg">⏳</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-800">{metricas.pendientes}</p>
        </button>

        <button
          type="button"
          onClick={() => setFiltroEstado(filtroEstado === "en_proceso" ? "" : "en_proceso")}
          className={`group flex flex-col justify-between rounded-2xl border p-4 text-left transition-all hover:shadow-md ${
            filtroEstado === "en_proceso"
              ? "border-blue-300 bg-blue-50/50 ring-2 ring-blue-300/40"
              : "border-slate-100 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-700">En Proceso</span>
            <span className="text-lg">⚙️</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-800">{metricas.enProceso}</p>
        </button>

        <button
          type="button"
          onClick={() => setFiltroEstado(filtroEstado === "respondida" ? "" : "respondida")}
          className={`group flex flex-col justify-between rounded-2xl border p-4 text-left transition-all hover:shadow-md ${
            filtroEstado === "respondida"
              ? "border-emerald-300 bg-emerald-50/50 ring-2 ring-emerald-300/40"
              : "border-slate-100 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Respondidas</span>
            <span className="text-lg">✅</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-800">{metricas.respondidas}</p>
        </button>
      </div>

      {/* 🔍 BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por asunto, ID o contenido..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 pl-9 text-sm text-[--color-choco] placeholder-slate-400 focus:border-[--color-strawberry-soft] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[--color-strawberry-soft]/20"
          />
          <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-[--color-choco] focus:border-[--color-strawberry-soft] focus:bg-white focus:outline-none"
          >
            {OPCIONES_ESTADO.map((op) => (
              <option key={op.value} value={op.value}>
                {op.etiqueta}
              </option>
            ))}
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-[--color-choco] focus:border-[--color-strawberry-soft] focus:bg-white focus:outline-none"
          >
            <option value="">Todos los tipos</option>
            <option value="peticion">Peticiones</option>
            <option value="queja">Quejas</option>
            <option value="reclamo">Reclamos</option>
          </select>
        </div>
      </div>

      {/* NOTIFICACIONES */}
      {mensaje && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>✨</span> {mensaje}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* 📋 LISTA DE PQR */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white py-12 text-center shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[--color-strawberry-soft] border-t-transparent"></div>
          <p className="mt-3 text-sm font-medium text-[--color-choco-soft]">Cargando solicitudes PQR...</p>
        </div>
      ) : pqrFiltradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center shadow-sm">
          <p className="text-2xl">📬</p>
          <p className="mt-2 text-sm font-medium text-[--color-choco]">No se encontraron solicitudes PQR.</p>
          <p className="text-xs text-[--color-choco-soft]">Prueba cambiando los filtros de búsqueda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pqrFiltradas.map((item) => {
            const isExpanded = expandido === item.id;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white transition-all shadow-sm hover:shadow-md"
              >
                {/* CABECERA DE LA SOLICITUD */}
                <button
                  type="button"
                  onClick={() => setExpandido(isExpanded ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-slate-50/50 sm:p-5"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg border ${
                        ESTILOS_TIPO[item.tipo] || "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {item.tipo === "peticion" ? "📨" : item.tipo === "queja" ? "😠" : "🚨"}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">#{item.id}</span>
                        <h4 className="truncate font-semibold text-[--color-choco]">
                          {item.asunto}
                        </h4>
                      </div>
                      <p className="mt-0.5 text-xs text-[--color-choco-soft]">
                        <span className="font-medium text-slate-600">{ETIQUETAS_TIPO[item.tipo] || item.tipo}</span> ·{" "}
                        {item.creado_en
                          ? new Date(item.creado_en).toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Fecha no disponible"}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                        ESTILOS_ESTADO[item.estado] || "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {item.estado.replace("_", " ")}
                    </span>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-transform ${isExpanded ? "rotate-180 bg-slate-100 text-slate-600" : ""}`}>
                      ▼
                    </div>
                  </div>
                </button>

                {/* CONTENIDO EXPANDIBLE */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/30 p-4 sm:p-5 space-y-4">
                    {/* Mensaje original */}
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[--color-choco-soft]">
                        Mensaje del Cliente
                      </p>
                      <div className="rounded-xl border border-slate-100 bg-white p-3.5 text-sm text-[--color-choco] leading-relaxed shadow-sm">
                        {item.mensaje}
                      </div>
                    </div>

                    {/* Respuesta actual si existe */}
                    {item.respuesta && (
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                          Respuesta enviada
                        </p>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-sm text-emerald-900 leading-relaxed">
                          {item.respuesta}
                        </div>
                      </div>
                    )}

                    {/* Acciones de administración */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[--color-choco-soft]">Cambiar estado:</span>
                        <select
                          value={item.estado}
                          onChange={(e) => manejarEstado(item.id, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[--color-choco] focus:border-[--color-strawberry-soft] focus:outline-none"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_proceso">En proceso</option>
                          <option value="respondida">Respondida</option>
                          <option value="cerrada">Cerrada</option>
                        </select>
                      </div>
                    </div>

                    {/* Formulario de respuesta */}
                    {item.estado !== "respondida" && item.estado !== "cerrada" && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                        <label className="block text-xs font-semibold text-emerald-800">
                          Redactar Respuesta Oficial
                        </label>
                        <textarea
                          value={respuesta}
                          onChange={(e) => setRespuesta(e.target.value)}
                          placeholder="Escribe la respuesta detallada para el cliente..."
                          rows={3}
                          className="w-full rounded-xl border border-emerald-200 bg-white p-3 text-sm text-[--color-choco] placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => manejarRespuesta(item.id)}
                            disabled={enviando}
                            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-60 shadow-sm"
                          >
                            {enviando ? "Enviando respuesta..." : "Responder y marcar respondida"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}