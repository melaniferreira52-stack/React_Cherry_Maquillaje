import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { obtenerServicios } from "../lib/api";
import modelos7 from "../assets/img/modelos7.jpg";
import modelos8 from "../assets/img/modelos8.jpg";
import modelos9 from "../assets/img/modelos9.jpg";
import modelos10 from "../assets/img/modelos10.jpg";

const ESTILOS_TARJETA = [
  { icono: "💄", fondo: "bg-strawberry-soft", acento: "bg-strawberry" },
  { icono: "🌸", fondo: "bg-pistachio-soft", acento: "bg-pistachio-deep" },
  { icono: "✨", fondo: "bg-caramel-soft", acento: "bg-caramel" },
];

const BENEFICIOS = [
  { icono: "🌿", titulo: "Productos naturales", texto: "Seguros y de calidad" },
  { icono: "✅", titulo: "Profesionales certificadas", texto: "Con experiencia comprobada" },
  { icono: "💗", titulo: "Atención personalizada", texto: "Pensada para ti" },
];

const GALERIA = [
  { imagen: modelos8, alt: "Clientas Cherry Beauty 1" },
  { imagen: modelos9, alt: "Clientas Cherry Beauty 2" },
  { imagen: modelos10, alt: "Clientas Cherry Beauty 3" },
];

function formatearPrecio(precio) {
  const numero = Number(precio);
  return numero > 0
    ? numero.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
    : "Sin costo adicional";
}

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerServicios()
      .then((datos) => setServicios(datos.servicios))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div>
      <Header />

      <main className="bg-cream">
        {/* Hero dividido, estilo Glowora */}
        <section className="relative overflow-hidden bg-strawberry-soft/40 px-6 py-16 sm:px-10 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
            <div className="text-center md:text-left">
              <span className="text-xs font-extrabold tracking-[0.2em] text-strawberry-deep">
                PARA TI
              </span>
              <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-choco sm:text-5xl">
                Realza tu{" "}
                <span className="text-strawberry-deep">belleza natural</span>
              </h1>
              <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-choco-soft md:mx-0">
                Además de nuestro maquillaje, ofrecemos servicios pensados
                para hacerte sentir radiante en cada ocasión.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <a
                  href="#servicios"
                  className="rounded-full bg-choco px-7 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  Ver servicios
                </a>
                <a
                  href="/agendar-cita"
                  className="flex items-center gap-2 rounded-full border-2 border-choco/20 px-6 py-3 text-sm font-semibold text-choco transition-all hover:bg-white"
                >
                  Agendar cita
                </a>
              </div>

              {/* Franja de beneficios */}
              <div className="mt-8 flex flex-wrap justify-center gap-6 md:justify-start">
                {BENEFICIOS.map((beneficio) => (
                  <div key={beneficio.titulo} className="flex items-center gap-2">
                    <span className="text-xl">{beneficio.icono}</span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-choco">
                        {beneficio.titulo}
                      </p>
                      <p className="text-[11px] text-choco-soft">
                        {beneficio.texto}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Imagen con insignia circular */}
            <div className="relative mx-auto h-80 w-full max-w-md sm:h-96">
              <img
                src={modelos7}
                alt="Servicios Cherry Beauty"
                className="h-full w-full rounded-[2.5rem] object-cover shadow-lift"
              />
              <div className="absolute -left-6 top-8 flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center shadow-lift sm:-left-10">
                <p className="text-lg font-bold text-strawberry-deep">100%</p>
                <p className="px-2 text-[10px] leading-tight text-choco-soft">
                  Satisfacción garantizada
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Banda: galería de 3 fotos */}
        <section className="relative overflow-hidden bg-choco px-6 py-16 sm:px-10 sm:py-20">
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-strawberry/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-strawberry/10 blur-3xl" />

          <div className="relative mx-auto max-w-6xl text-center">
            <span className="text-xs font-extrabold tracking-[0.2em] text-strawberry">
              NUESTRAS CLIENTAS
            </span>
            <h3 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
              Momentos que nos inspiran
            </h3>

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {GALERIA.map((foto) => (
                <div
                  key={foto.alt}
                  className="group relative mx-auto h-64 w-full max-w-xs overflow-hidden rounded-3xl border-2 border-strawberry/30 shadow-lift sm:h-72"
                >
                  <img
                    src={foto.imagen}
                    alt={foto.alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Estadísticas, en fondo rosa pastel */}
        <section className="bg-strawberry-soft/60 px-6 py-16 text-center sm:px-10">
          <span className="text-xs font-extrabold tracking-[0.2em] text-strawberry-deep">
            RESULTADOS QUE HABLAN
          </span>
          <h3 className="mt-2 font-display text-2xl font-semibold text-choco sm:text-3xl">
            La confianza de nuestras clientas
          </h3>

          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-4">
            <div className="flex min-w-[150px] flex-1 flex-col items-center gap-2 rounded-2xl bg-white px-5 py-6 shadow-soft">
              <span className="text-2xl">💕</span>
              <p className="text-3xl font-bold text-strawberry-deep">+500</p>
              <p className="text-sm text-choco-soft">Clientas felices</p>
            </div>

            <div className="flex min-w-[150px] flex-1 flex-col items-center gap-2 rounded-2xl bg-white px-5 py-6 shadow-soft">
              <span className="text-2xl">⭐</span>
              <p className="text-3xl font-bold text-strawberry-deep">4.9</p>
              <p className="text-sm text-choco-soft">Calificación promedio</p>
            </div>

            <div className="flex min-w-[150px] flex-1 flex-col items-center gap-2 rounded-2xl bg-white px-5 py-6 shadow-soft">
              <span className="text-2xl">🏆</span>
              <p className="text-3xl font-bold text-strawberry-deep">100%</p>
              <p className="text-sm text-choco-soft">Satisfacción</p>
            </div>
          </div>
        </section>

        {/* Estado: cargando */}
        {cargando && (
          <p className="px-6 py-20 text-center text-lg text-choco-soft">
            Cargando servicios...
          </p>
        )}

        {/* Estado: error */}
        {error && (
          <p className="px-6 py-20 text-center text-lg font-semibold text-strawberry-deep">
            {error}
          </p>
        )}

        {/* Estado: vacío */}
        {!cargando && !error && servicios.length === 0 && (
          <p className="px-6 py-20 text-center text-lg text-choco-soft">
            Por ahora no hay servicios disponibles.
          </p>
        )}

        {/* Grilla de servicios */}
        {!cargando && !error && servicios.length > 0 && (
          <section id="servicios" className="px-6 py-20 sm:px-10">
            <h2 className="mb-10 text-center font-display text-3xl font-semibold text-choco">
              Nuestros servicios
            </h2>
            <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {servicios.map((servicio, indice) => {
                const estilo = ESTILOS_TARJETA[indice % ESTILOS_TARJETA.length];
                return (
                  <div
                    key={servicio.id}
                    className="group rounded-3xl border border-border-soft bg-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-lift"
                  >
                    <span
                      className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full text-3xl transition-transform duration-300 group-hover:scale-110 ${estilo.fondo}`}
                    >
                      {estilo.icono}
                    </span>
                    <h3 className="mb-2 text-xl font-semibold text-choco">
                      {servicio.nombre}
                    </h3>
                    <p className="mb-5 text-[15px] leading-relaxed text-choco-soft">
                      {servicio.descripcion}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-strawberry-deep">
                        {formatearPrecio(servicio.precio)}
                      </p>
                      <span
                        className={`h-1.5 w-10 rounded-full ${estilo.acento}`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Cierre / llamado a la acción */}
        <section className="bg-strawberry-soft/40 px-6 py-14 text-center sm:px-10">
          <div className="mx-auto max-w-xl">
            <h2 className="mb-3 font-display text-2xl font-semibold text-choco sm:text-3xl">
              ¿Tienes dudas sobre nuestros servicios?
            </h2>
            <p className="mb-6 text-choco-soft">
              Escríbenos y con gusto te asesoramos para elegir la mejor
              opción para ti.
            </p>
            <a
              href="/contacto"
              className="inline-block rounded-full bg-strawberry-deep px-7 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              Contáctanos
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}