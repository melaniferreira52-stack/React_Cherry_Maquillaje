import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { obtenerDetallePedido } from "../lib/api";

const ETIQUETAS_METODO_PAGO = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

const ETIQUETAS_ESTADO = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function Factura() {
  const { id } = useParams();
  const { token, usuario } = useAuth();

  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerDetallePedido(token, id)
      .then((datos) => setPedido(datos.pedido))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [token, id]);

  if (cargando) {
    return (
      <main className="min-h-screen bg-cream px-4 py-16">
        <p className="text-center text-choco-soft">Cargando tu factura...</p>
      </main>
    );
  }

  if (error || !pedido) {
    return (
      <main className="min-h-screen bg-cream px-4 py-16 text-center">
        <p className="mb-4 font-semibold text-strawberry-deep">
          {error || "No se pudo encontrar este pedido."}
        </p>
        <Link to="/mi-cuenta" className="font-bold text-caramel-deep hover:underline">
          ← Volver a Mi cuenta
        </Link>
      </main>
    );
  }

  const fecha = pedido.creado_en ? new Date(pedido.creado_en) : new Date();

  return (
    <main className="min-h-screen bg-gradient-to-br from-cream via-cream-soft to-strawberry-soft px-4 py-16 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-2xl print:hidden">
        <div className="mb-4 flex justify-end gap-3">
          <Link
            to="/mi-cuenta"
            className="rounded-full border border-caramel-soft px-6 py-2.5 text-sm font-bold text-caramel-deep hover:bg-caramel-soft"
          >
            ← Mi cuenta
          </Link>
          <button
            onClick={() => window.print()}
            className="rounded-full bg-caramel px-6 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-caramel-deep"
          >
            🖨️ Imprimir factura
          </button>
        </div>
      </div>

      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-lift sm:p-10 print:rounded-none print:shadow-none">
        {/* Encabezado */}
        <div className="mb-8 flex items-start justify-between border-b border-border-soft pb-6">
          <div>
            <h1 className="text-2xl font-bold text-choco-deep">Cherry Beauty</h1>
            <p className="text-sm text-choco-soft">Maquillaje y Belleza</p>
            <p className="text-sm text-choco-soft">Copacabana - Antioquia</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-caramel-deep">Factura</p>
            <p className="text-sm text-choco-soft">Pedido #{pedido.id}</p>
            <p className="text-sm text-choco-soft">
              {fecha.toLocaleDateString("es-CO")} - {fecha.toLocaleTimeString("es-CO")}
            </p>
          </div>
        </div>

        {/* Datos del cliente */}
        <div className="mb-8 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-choco-soft">Cliente</p>
            <p className="font-semibold text-choco-deep">
              {pedido.nombre ? `${pedido.nombre} ${pedido.apellido || ""}` : usuario?.nombre}
            </p>
          </div>
          <div>
            <p className="text-choco-soft">Correo</p>
            <p className="font-semibold text-choco-deep">
              {pedido.correo || usuario?.correo}
            </p>
          </div>
          <div>
            <p className="text-choco-soft">Método de pago</p>
            <p className="font-semibold text-choco-deep">
              {ETIQUETAS_METODO_PAGO[pedido.metodo_pago] || pedido.metodo_pago}
            </p>
          </div>
          <div>
            <p className="text-choco-soft">Estado del pedido</p>
            <p className="font-semibold text-choco-deep">
              {ETIQUETAS_ESTADO[pedido.estado] || pedido.estado}
            </p>
          </div>
        </div>

        {/* Detalle de productos */}
        {pedido.detalles && pedido.detalles.length > 0 && (
          <table className="mb-6 w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft text-left text-choco-soft">
                <th className="py-2">Producto</th>
                <th className="py-2 text-center">Cantidad</th>
                <th className="py-2 text-right">Precio unit.</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.detalles.map((detalle, indice) => (
                <tr key={indice} className="border-b border-border-soft/50">
                  <td className="py-2 text-choco-deep">{detalle.nombre}</td>
                  <td className="py-2 text-center text-choco-deep">{detalle.cantidad}</td>
                  <td className="py-2 text-right text-choco-deep">
                    ${Number(detalle.precio).toLocaleString("es-CO")}
                  </td>
                  <td className="py-2 text-right font-semibold text-choco-deep">
                    ${(Number(detalle.precio) * detalle.cantidad).toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Detalle de servicios */}
        {pedido.servicios && pedido.servicios.length > 0 && (
          <table className="mb-8 w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft text-left text-choco-soft">
                <th className="py-2">Servicio</th>
                <th className="py-2 text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {pedido.servicios.map((servicio, indice) => (
                <tr key={indice} className="border-b border-border-soft/50">
                  <td className="py-2 text-choco-deep">{servicio.nombre}</td>
                  <td className="py-2 text-right font-semibold text-choco-deep">
                    ${Number(servicio.precio).toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Total */}
        <div className="flex justify-end border-t border-border-soft pt-4">
          <div className="text-right">
            <p className="text-sm text-choco-soft">Total pagado</p>
            <p className="text-2xl font-bold text-strawberry-deep">
              ${Number(pedido.total).toLocaleString("es-CO")}
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-choco-soft/70">
          Gracias por tu compra en Cherry Beauty 🍒
        </p>
      </section>
    </main>
  );
}