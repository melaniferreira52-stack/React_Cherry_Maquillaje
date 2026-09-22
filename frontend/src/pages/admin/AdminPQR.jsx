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
  peticion: "bg-[#e0f2fe] text-[#0369a1]",
  queja: "bg-[#fef3c7] text-[#b45309]",
  reclamo: "bg-[#ffe4e6] text-[#be123c]",
};

const ESTILOS_ESTADO = {
  pendiente: "bg-[--color-strawberry-soft] text-[--color-strawberry-deep]",
  en_proceso: "bg-[#e0f2fe] text-[#0369a1]",
  respondida: "bg-[#d1fae5] text-[#047857]",
  cerrada: "bg-[--color-cream] text-[--color-choco-soft]",
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

  const [expandidO, setExpandido] = useState(null);
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function cargarPQR() {
    setCargando(true);
    try {
      const datos = await listarPQR(token, {
        estado: filtroEstado || undefined,
        tipo: filtroTipo || undefined,
      });
      setPqr(datos.pqr);
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

  const pendientes = useMemo(
    () => pqr.filter((p) => p.estado === "pendiente").length,
    [pqr]
  );

  async function manejarEstado(id, estado) {
    setError("");
    setMensaje("");
    try {
      await cambiarEstadoPQR(token, id, estado);
      setMensaje("Estado actualizado");
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
      setMensaje("PQR respondida");
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
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 px-3 py-2 text-sm text-[--color-choco] focus:border-[#38bdf8] focus:bg-white focus:outline-none"
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
            className="rounded-lg border border-[#bae6fd] bg-[#f0f9ff]/60 px-3 py-2 text-sm text-[--color-choco] focus:border-[#38bdf8] focus:bg-white focus:outline-none"
          >
            <option value="">Todos los tipos</option>
            <option value="peticion">Peticiones</option>
            <option value="queja">Quejas</option>
            <option value="reclamo">Reclamos</option>
          </select>
        </div>
        <div className="rounded-lg bg-[#fffbeb] px-3 py-1.5 text-sm">
          <span className="text-[--color-choco-soft]">Pendientes:</span>{" "}
          <strong className="text-[#b45309]">{pendientes}</strong>
        </div>
      </div>

      {mensaje && <p className="mb-3 text-sm text-[#047857]">{mensaje}</p>}
      {error && <p className="mb-3 text-sm text-[--color-strawberry-deep]">{error}</p>}

      {cargando ? (
        <p className="p-6 text-sm text-[--color-choco-soft]">Cargando PQR...</p>
      ) : pqr.length === 0 ? (
        <p className="p-6 text-sm text-[--color-choco-soft]">
          No hay solicitudes PQR registradas.
        </p>
      ) : (
        <div className="space-y-3">
          {pqr.map((item) => {
            const expandido = expandidO === item.id;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-[--color-border-soft] bg-white shadow-sm"
              >
                <button
                  onClick={() => setExpandido(expandido ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={expandido}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base ${
                        ESTILOS_TIPO[item.tipo] || "bg-[--color-cream]"
                      }`}
                    >
                      {item.tipo === "peticion" ? "📨" : item.tipo === "queja" ? "😠" : "🚨"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[--color-choco]">
                        #{item.id} — {item.asunto}
                      </p>
                      <p className="text-sm text-[--color-choco-soft]">
                        {ETIQUETAS_TIPO[item.tipo] || item.tipo} ·{" "}
                        {item.creado_en
                          ? new Date(item.creado_en).toLocaleDateString("es-CO")
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        ESTILOS_ESTADO[item.estado] || "bg-[--color-cream]"
                      }`}
                    >
                      {item.estado}
                    </span>
                    <span className={`text-[--color-choco-soft] ${expandido ? "rotate-180" : ""}`}>
                      ⌄
                    </span>
                  </div>
                </button>

                {expandido && (
                  <div className="border-t border-[--color-border-soft] px-5 py-4">
                    <p className="mb-2 text-sm text-[--color-choco-soft]">Mensaje</p>
                    <p className="rounded-lg bg-[--color-cream]/60 p-3 text-sm text-[--color-choco]">
                      {item.mensaje}
                    </p>

                    {item.respuesta && (
                      <div className="mt-3">
                        <p className="mb-1 text-sm text-[--color-choco-soft]">Respuesta</p>
                        <p className="rounded-lg bg-[#ecfdf5] p-3 text-sm text-[#065f46]">
                          {item.respuesta}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <select
                        value={item.estado}
                        onChange={(e) => manejarEstado(item.id, e.target.value)}
                        className="rounded-lg border border-[--color-border-soft] px-2 py-1.5 text-xs font-semibold"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="en_proceso">En proceso</option>
                        <option value="respondida">Respondida</option>
                        <option value="cerrada">Cerrada</option>
                      </select>
                    </div>

                    {item.estado !== "respondida" && item.estado !== "cerrada" && (
                      <div className="mt-3 rounded-lg border border-[#a7f3d0] bg-[#ecfdf5]/50 p-3">
                        <textarea
                          value={respuesta}
                          onChange={(e) => setRespuesta(e.target.value)}
                          placeholder="Escribe la respuesta al cliente..."
                          rows={2}
                          className="w-full rounded-lg border border-[#a7f3d0] bg-white px-3 py-2 text-sm focus:border-[#10b981] focus:outline-none"
                        />
                        <button
                          onClick={() => manejarRespuesta(item.id)}
                          disabled={enviando}
                          className="mt-2 rounded-lg bg-[#059669] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#047857] disabled:opacity-60"
                        >
                          {enviando ? "Enviando..." : "Responder y marcar respondida"}
                        </button>
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