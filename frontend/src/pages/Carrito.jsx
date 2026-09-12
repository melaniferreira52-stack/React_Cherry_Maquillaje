import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  obtenerCarrito,
  actualizarCantidadCarrito,
  eliminarDelCarrito,
  crearPedidoDesdeCarrito,
} from "../lib/api";

const METODOS_PAGO = [
  { valor: "efectivo", etiqueta: "Efectivo" },
  { valor: "tarjeta", etiqueta: "Tarjeta" },
  { valor: "transferencia", etiqueta: "Transferencia" },
];

export default function Carrito() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [metodoPago, setMetodoPago] = useState("efectivo");

  async function cargarCarrito() {
    setCargando(true);
    try {
      const datos = await obtenerCarrito(token);
      setItems(datos.items);
      setTotal(datos.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarCarrito();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function manejarCambioCantidad(itemId, cantidad) {
    if (cantidad < 1) return;

    setError("");
    try {
      await actualizarCantidadCarrito(token, itemId, cantidad);
      cargarCarrito();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarEliminar(itemId) {
    setError("");
    try {
      await eliminarDelCarrito(token, itemId);
      cargarCarrito();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarConfirmarPedido() {
    setError("");
    setMensaje("");
    setConfirmando(true);

    try {
      const respuesta = await crearPedidoDesdeCarrito(token, metodoPago);
      setMensaje("✅ ¡Pedido confirmado! Generando tu factura...");
      setItems([]);
      setTotal(0);

      const idPedido = respuesta?.pedido?.id;
      setTimeout(() => {
        if (idPedido) {
          navigate(`/factura/${idPedido}`);
        } else {
          navigate("/mi-cuenta");
        }
      }, 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirmando(false);
    }
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-cream px-4 py-16">
        <p className="text-center text-choco-soft">Cargando tu carrito...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-cream via-cream-soft to-strawberry-soft px-4 py-16">
      <section className="mx-auto max-w-3xl rounded-3xl bg-cream p-8 shadow-lift sm:p-10">
        <div className="mb-6 text-center">
          <span className="mb-3 inline-block rounded-full bg-caramel-soft px-4 py-1 text-xs font-extrabold tracking-[0.2em] text-caramel-deep">
            TU PEDIDO
          </span>
          <h1 className="text-3xl font-semibold">Mi carrito</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-strawberry-deep bg-strawberry-soft px-4 py-3 text-sm font-semibold text-strawberry-deep">
            {error}
          </div>
        )}
        {mensaje && (
          <div className="mb-4 rounded-2xl border border-pistachio bg-pistachio-soft px-4 py-3 text-sm font-semibold text-pistachio-deep">
            {mensaje}
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-center text-choco-soft">
            Tu carrito está vacío.{" "}
            <button
              onClick={() => navigate("/productos")}
              className="font-bold text-strawberry-deep hover:underline"
            >
              Ver productos
            </button>
          </p>
        ) : (
          <>
            <div className="mb-6 space-y-3">
              {items.map((item) => (
                <div
                  key={item.item_id}
                  className="flex items-center justify-between rounded-2xl border border-border-soft bg-cream-soft px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-choco-deep">{item.nombre}</p>
                    <p className="text-sm text-choco-soft">
                      ${Number(item.precio).toLocaleString("es-CO")} c/u
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-caramel-soft">
                      <button
                        onClick={() =>
                          manejarCambioCantidad(item.item_id, item.cantidad - 1)
                        }
                        className="px-3 py-1 font-bold text-caramel-deep hover:bg-caramel-soft rounded-l-full"
                      >
                        −
                      </button>
                      <span className="px-3 font-semibold text-choco-deep">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() =>
                          manejarCambioCantidad(item.item_id, item.cantidad + 1)
                        }
                        className="px-3 py-1 font-bold text-caramel-deep hover:bg-caramel-soft rounded-r-full"
                      >
                        +
                      </button>
                    </div>

                    <p className="w-24 text-right font-bold text-choco-deep">
                      ${(Number(item.precio) * item.cantidad).toLocaleString("es-CO")}
                    </p>

                    <button
                      onClick={() => manejarEliminar(item.item_id)}
                      className="text-sm font-bold text-strawberry-deep hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Selector de método de pago */}
            <div className="mb-6 border-t border-border-soft pt-6">
              <p className="mb-3 font-semibold text-choco-deep">¿Cómo vas a pagar?</p>
              <div className="grid grid-cols-3 gap-3">
                {METODOS_PAGO.map((metodo) => (
                  <button
                    key={metodo.valor}
                    type="button"
                    onClick={() => setMetodoPago(metodo.valor)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                      metodoPago === metodo.valor
                        ? "border-caramel bg-caramel-soft text-caramel-deep"
                        : "border-border-soft bg-white text-choco-soft hover:border-caramel-soft"
                    }`}
                  >
                    {metodo.etiqueta}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-border-soft pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xl font-bold text-choco-deep">
                Total: ${Number(total).toLocaleString("es-CO")}
              </p>
              <button
                onClick={manejarConfirmarPedido}
                disabled={confirmando}
                className="rounded-full bg-caramel px-8 py-3.5 text-lg font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-caramel-deep hover:shadow-lift disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {confirmando ? "Confirmando..." : "Confirmar pedido"}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}