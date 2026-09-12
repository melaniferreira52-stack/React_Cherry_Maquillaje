import Header from "../components/Header";
import Carrusel from "../components/carrusel";
import Footer from "../components/Footer";

// Imágenes de la sección "Nuestros favoritos"
import labiales from "../assets/img/labiales.jpg";
import rubores from "../assets/img/rubores.jpg";
import iluminadores from "../assets/img/iluminadores.jpg";

// Imágenes del hero (bienvenida)
import modelos from "../assets/img/modelos.jpg";
import modelos2 from "../assets/img/modelos2.jpg";
import modelos3 from "../assets/img/modelos3.jpg";

const DESTACADOS = [
  {
    imagen: labiales,
    nombre: "Labiales",
    descripcion: "Tonos intensos y de larga duración.",
    fondo: "bg-caramel-soft",
  },
  {
    imagen: rubores,
    nombre: "Rubores",
    descripcion: "Un toque de color fresco y natural.",
    fondo: "bg-strawberry-soft",
  },
  {
    imagen: iluminadores,
    nombre: "Iluminadores",
    descripcion: "Paletas para cada ocasión.",
    fondo: "bg-pistachio-soft",
  },
];

const GALERIA_HERO = [
  { imagen: modelos, palabra: "Elegancia", fondo: "bg-pistachio-soft" },
  { imagen: modelos2, palabra: "Frescura", fondo: "bg-strawberry-soft" },
  { imagen: modelos3, palabra: "Brillo", fondo: "bg-caramel-soft" },
];

function Inicio() {
  return (
    <div>
      <Header />
      <Carrusel />

      {/* Bienvenida */}
      <section className="relative overflow-hidden bg-cream-soft px-6 py-20 sm:px-10 sm:py-24 lg:px-16 xl:px-24 2xl:px-32">
        {/* Detalle decorativo de fondo */}
        <div
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-strawberry-soft opacity-40 blur-3xl"
          aria-hidden="true"
        />

        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-strawberry-soft px-3 py-1 text-[11px] font-extrabold tracking-[0.2em] text-strawberry-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-strawberry-deep" />
            BIENVENIDOS A CHERRY BEAUTY
          </span>

          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            La belleza que{" "}
            <span className="relative inline-block text-strawberry-deep">
              convierte
              <svg
                className="absolute -bottom-1.5 left-0 w-full text-strawberry-soft"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 9 Q50 2 100 6 T198 4"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            cada momento en especial
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-choco-soft">
            Descubre nuestro maquillaje de calidad, elegido con cuidado
            para realzar tu belleza natural.
          </p>
          
          {/* Galería de 3 modelos */}
          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
            {GALERIA_HERO.map((item) => (
              <div key={item.palabra} className="flex flex-col items-center">
                <div className="relative flex h-64 w-64 items-center justify-center sm:h-56 sm:w-56 lg:h-64 lg:w-64">
                  <div
                    className={`absolute inset-0 rotate-3 ${item.fondo}`}
                    style={{ borderRadius: "var(--radius-blob)" }}
                    aria-hidden="true"
                  />
                  <img
                    src={item.imagen}
                    alt={item.palabra}
                    className="relative z-10 h-56 w-56 rounded-full object-cover shadow-lift sm:h-48 sm:w-48 lg:h-56 lg:w-56"
                  />
                </div>
                <p className="mt-4 font-display text-xl font-semibold text-strawberry-deep">
                  {item.palabra}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destacados */}
      <section className="bg-cream px-6 py-20 text-center sm:px-10 sm:py-24 lg:px-16 xl:px-24 2xl:px-32">
        <h2 className="mb-12 text-3xl font-semibold sm:text-4xl">
          Nuestros favoritos
        </h2>

        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3 xl:gap-12">
          {DESTACADOS.map((producto) => (
            <div
              key={producto.nombre}
              className="rounded-3xl border border-border-soft bg-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-lift"
            >
              <span
                className={`mb-4 inline-flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl ${producto.fondo}`}
              >
                <img
                  src={producto.imagen}
                  alt={producto.nombre}
                  className="h-full w-full object-cover"
                />
              </span>
              <h3 className="mb-1 text-xl font-semibold">{producto.nombre}</h3>
              <p className="text-choco-soft">{producto.descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Inicio;