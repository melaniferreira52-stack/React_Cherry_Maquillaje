import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Input from "../components/Input";
import Button from "../components/Button";

function Contacto() {
  const [formulario, setFormulario] = useState({
    nombre: "",
    correo: "",
    mensaje: "",
  });
  const [enviado, setEnviado] = useState(false);

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
    setEnviado(false);
  };

  const manejarEnvio = (evento) => {
    evento.preventDefault();
    setEnviado(true);
    setFormulario({ nombre: "", correo: "", mensaje: "" });
  };

  return (
    <>
      <Header />

    <main className="bg-stramberry">
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-6 pb-8 pt-20 text-center sm:px-10">
          <span className="rounded-full bg-strawberry-soft px-4 py-1 text-xs font-extrabold tracking-[0.2em] text-strawberry-deep">
            ESTAMOS PARA TI
          </span>
          <h1 className="text-4xl font-semibold">Contáctanos</h1>
          <p className="text-lg text-choco-soft">
            ¿Tienes alguna pregunta? Escríbenos y estaremos encantados de
            ayudarte.
          </p>
        </section>

        <section className="mx-auto grid max-w-4xl gap-8 px-6 py-12 sm:px-10 md:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl bg-choco p-9 text-white shadow-lift">
            <h2 className="mb-2.5 text-xl font-semibold text-vanilla">
              Información de contacto
            </h2>
            <p className="leading-loose text-white/90">📍 Manrique - Antioquia</p>
            <p className="leading-loose text-white/90">📞 320 800 6702</p>
            <p className="leading-loose text-white/90">📧 cherrybeauty@gmail.com</p>

            <h2 className="mb-2.5 mt-7 text-xl font-semibold text-vanilla">
              Horarios
            </h2>
            <p className="leading-loose text-white/90">Lunes - Viernes</p>
            <p className="leading-loose text-white/90">6:00 AM - 8:00 PM</p>
            <p className="leading-loose text-white/90">Sábados y Domingos</p>
            <p className="leading-loose text-white/90">10:00 AM - 9:00 PM</p>
          </div>

          <form
            onSubmit={manejarEnvio}
            className="flex flex-col gap-4 rounded-3xl border border-border-soft bg-white p-9 shadow-soft"
          >
            <Input
              id="nombre"
              name="nombre"
              label="Nombre"
              value={formulario.nombre}
              onChange={manejarCambio}
              placeholder="Escribe tu nombre"
            />

            <Input
              id="correo"
              name="correo"
              type="email"
              label="Correo electrónico"
              value={formulario.correo}
              onChange={manejarCambio}
              placeholder="Escribe tu correo"
            />

            <div>
              <label
                htmlFor="mensaje"
                className="mb-1 block text-sm font-bold text-choco"
              >
                Mensaje
              </label>
              <textarea
                id="mensaje"
                name="mensaje"
                rows="6"
                value={formulario.mensaje}
                onChange={manejarCambio}
                placeholder="Escribe tu mensaje"
                className="w-full resize-y rounded-2xl border border-border-soft bg-cream-soft px-4 py-3 text-[15px] text-choco outline-none transition-colors focus:border-caramel focus:ring-4 focus:ring-caramel-soft"
              />
            </div>

            {enviado && (
              <div className="rounded-2xl border border-pistachio bg-pistachio-soft px-4 py-3 text-sm font-semibold text-pistachio-deep">
                ✅ ¡Gracias! Tu mensaje fue enviado.
              </div>
            )}

            <Button type="submit" variant="secondary" className="self-start px-9">
              Enviar mensaje
            </Button>
          </form>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default Contacto;
