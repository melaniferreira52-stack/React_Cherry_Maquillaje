import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { obtenerServicios, crearPedidoDesdeCarrito } from "../lib/api";

export default function AgendarCita() {
  const { estaLogueado, token } = useAuth();
  const navigate = useNavigate();

  const [servicios, setServicios] = useState([]);
  const [servicioElegido, setServicioElegido] = useState("");
  const [fecha, setFecha] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  useEffect(() => {
    obtenerServicios()
      .then((datos) => setServicios(datos.servicios))
      .catch(() => setServicios([]));
  }, []);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError("");

    if (!estaLogueado) {
      navigate("/login");
      return;
    }

    if (!servicioElegido) {
      setError("Elige un servicio para continuar");
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await crearPedidoDesdeCarrito(token, "efectivo", [
        Number(servicioElegido),
      ]);
      setExito(true);

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
      setEnviando(false);
    }
  }

  return (
    <div>
      <Header />

      <main className="bg-strawberry-soft/30 px-6 py-20 sm:px-10">
        <section className="mx-auto max-w-xl">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-strawberry-soft px-4 py-1 text-xs font-extrabold tracking-[0.2em] text-strawberry-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-strawberry-deep" />
              RESERVA TU ESPACIO
            </span>
            <h1 className="mt-3 font-display text-4xl font-semibold text-choco">
              Agendar cita
            </h1>
            <p className="mt-3 text-choco-soft">
              Elige el servicio que necesitas y lo dejamos registrado en tu
              cuenta.
            </p>
          </div>

          {!estaLogueado && (
            <p className="mb-5 rounded-2xl border border-caramel-soft bg-caramel-soft/40 px-4 py-3 text-center text-sm font-semibold text-caramel-deep">
              Inicia sesión para poder agendar tu cita 💄
            </p>
          )}

          {error && (
            <div className="mb-5 rounded-2xl border border-strawberry-deep bg-strawberry-soft px-4 py-3 text-sm font-semibold text-strawberry-deep">
              {error}
            </div>
          )}

          {exito && (
            <div className="mb-5 rounded-2xl border border-pistachio bg-pistachio-soft px-4 py-3 text-sm font-semibold text-pistachio-deep">
              ✅ ¡Tu cita fue registrada! Redirigiendo...
            </div>
          )}

          <form
            onSubmit={manejarEnvio}
            className="flex flex-col gap-5 rounded-3xl border border-border-soft bg-white p-8 shadow-soft"
          >
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-choco">
                Servicio
              </label>
              <select
                required
                value={servicioElegido}
                onChange={(e) => setServicioElegido(e.target.value)}
                className="w-full rounded-2xl border border-border-soft px-4 py-3 text-choco outline-none focus:border-strawberry-deep"
              >
                <option value="">Selecciona un servicio</option>
                {servicios.map((servicio) => (
                  <option key={servicio.id} value={servicio.id}>
                    {servicio.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-choco">
                Fecha preferida
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-2xl border border-border-soft px-4 py-3 text-choco outline-none focus:border-strawberry-deep"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-choco">
                Mensaje (opcional)
              </label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-2xl border border-border-soft px-4 py-3 text-choco outline-none focus:border-strawberry-deep"
                placeholder="Cuéntanos algo más sobre lo que necesitas"
              />
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="mt-2 rounded-full bg-strawberry-deep px-7 py-3.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-50"
            >
              {enviando ? "Agendando..." : "Agendar cita"}
            </button>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
}