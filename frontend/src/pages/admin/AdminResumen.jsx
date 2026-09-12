import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerUsuarios,
  obtenerProductosAdmin,
  obtenerServiciosAdmin,
  listarTodosLosPedidos,
} from "../../lib/api";

const TARJETAS_VACIAS = [
  { etiqueta: "Usuarios", valor: "—", icono: "👤", color: "sky" },
  { etiqueta: "Productos", valor: "—", icono: "🍦", color: "rose" },
  { etiqueta: "Servicios", valor: "—", icono: "🎉", color: "amber" },
  { etiqueta: "Pedidos", valor: "—", icono: "🧾", color: "emerald" },
];

const ESTILOS_COLOR = {
  sky: "bg-[#e0f2fe] text-[#0369a1]",
  rose: "bg-[#ffe4e6] text-[#be123c]",
  amber: "bg-[#fef3c7] text-[#b45309]",
  emerald: "bg-[#d1fae5] text-[#047857]",
};

const ACCIONES_RAPIDAS = [
  {
    id: "pedidos",
    etiqueta: "Agregar pedido",
    icono: "🧾",
    clases: "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46] hover:bg-[#d1fae5]",
  },
  {
    id: "servicios",
    etiqueta: "Agregar servicio",
    icono: "🎉",
    clases: "border-[#fde68a] bg-[#fffbeb] text-[#92400e] hover:bg-[#fef3c7]",
  },
  {
    id: "productos",
    etiqueta: "Agregar producto",
    icono: "🍦",
    clases: "border-[#ffe4e6] bg-[#fff1f2] text-[#9f1239] hover:bg-[#ffe4e6]",
  },
  {
    id: "usuarios",
    etiqueta: "Agregar usuario",
    icono: "👤",
    clases: "border-[#bae6fd] bg-[#f0f9ff] text-[#075985] hover:bg-[#e0f2fe]",
  },
];

export default function AdminResumen({ onAccionRapida }) {
  const { token } = useAuth();
  const [tarjetas, setTarjetas] = useState(TARJETAS_VACIAS);
  const [pedidosPendientes, setPedidosPendientes] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarResumen() {
      try {
        const [usuarios, productos, servicios, pedidos] = await Promise.all([
          obtenerUsuarios(token).catch(() => ({ usuarios: [] })),
          obtenerProductosAdmin(token).catch(() => ({ productos: [] })),
          obtenerServiciosAdmin(token).catch(() => ({ servicios: [] })),
          listarTodosLosPedidos(token).catch(() => ({ pedidos: [] })),
        ]);

        setTarjetas([
          { etiqueta: "Usuarios", valor: usuarios.usuarios.length, icono: "👤", color: "sky" },
          { etiqueta: "Productos", valor: productos.productos.length, icono: "🍦", color: "rose" },
          { etiqueta: "Servicios", valor: servicios.servicios.length, icono: "🎉", color: "amber" },
          { etiqueta: "Pedidos", valor: pedidos.pedidos.length, icono: "🧾", color: "emerald" },
        ]);
        setPedidosPendientes(
          pedidos.pedidos.filter((p) => p.estado === "pendiente").length
        );
      } finally {
        setCargando(false);
      }
    }

    cargarResumen();
  }, [token]);

  return (
    <div>
      <p className="mb-6 text-sm text-[--color-choco-soft]">
        Vista rápida del estado actual de Cherry Beauty.
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tarjetas.map((tarjeta) => (
          <div
            key={tarjeta.etiqueta}
            className="rounded-xl border border-[--color-border-soft] bg-white p-5 shadow-[--shadow-soft]"
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full text-xl ${
                ESTILOS_COLOR[tarjeta.color]
              }`}
            >
              {tarjeta.icono}
            </div>
            <p className="font-display text-3xl font-semibold text-[--color-choco]">
              {cargando ? "…" : tarjeta.valor}
            </p>
            <p className="text-sm text-[--color-choco-soft]">{tarjeta.etiqueta}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[--color-choco-soft]">
          Acciones rápidas
        </p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ACCIONES_RAPIDAS.map((accion) => (
            <button
              key={accion.id}
              onClick={() => onAccionRapida?.(accion.id)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold shadow-sm transition ${accion.clases}`}
            >
              <span className="text-xl leading-none">{accion.icono}</span>
              <span>+ {accion.etiqueta}</span>
            </button>
          ))}
        </div>
      </div>

      {!cargando && pedidosPendientes !== null && (
        <div
          className={`mt-6 rounded-xl border p-4 text-sm ${
            pedidosPendientes > 0
              ? "border-[#fde68a] bg-[#fffbeb] text-[#92400e]"
              : "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]"
          }`}
        >
          {pedidosPendientes > 0 ? (
            <>
              Tienes <strong>{pedidosPendientes}</strong>{" "}
              {pedidosPendientes === 1 ? "pedido pendiente" : "pedidos pendientes"} por
              gestionar.
            </>
          ) : (
            "No hay pedidos pendientes por el momento."
          )}
        </div>
      )}
    </div>
  );
}