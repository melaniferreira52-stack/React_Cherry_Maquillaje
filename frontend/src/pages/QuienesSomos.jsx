import Header from "../components/Header";
import Footer from "../components/Footer";
import modelos6 from "../assets/img/modelos6.jpg";
import modelos2 from "../assets/img/modelos2.jpg";

const VALORES = [
  {
    icono: "💖",
    titulo: "Calidad",
    texto: "Seleccionamos cada producto pensando en su durabilidad y acabado.",
    fondo: "bg-strawberry-soft",
  },
  {
    icono: "🌿",
    titulo: "Cercanía",
    texto: "Te acompañamos para encontrar el tono y producto ideal para ti.",
    fondo: "bg-pistachio-soft",
  },
  {
    icono: "✨",
    titulo: "Confianza",
    texto: "Precios justos y transparencia en cada compra que realizas.",
    fondo: "bg-caramel-soft",
  },
];

const ESTADISTICAS = [
  { numero: "+500", etiqueta: "Clientas felices" },
  { numero: "100%", etiqueta: "Calidad garantizada" },
  { numero: "3", etiqueta: "Años de experiencia" },
];

function QuienesSomos() {
  return (
    <div>
      <Header />

      <main className="bg-strawberry-soft/30">
        {/* Hero con imagen de fondo */}
        <section className="relative flex min-h-[480px] items-center overflow-hidden sm:min-h-[560px]">
          <img
            src={modelos6}
            alt="Cherry Beauty"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-choco/75 via-choco/35 to-transparent"
            aria-hidden="true"
          />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 sm:px-10">
            <div className="max-w-lg text-white">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-extrabold tracking-[0.2em]">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                CONÓCENOS
              </span>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
                La belleza que nace de ti
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-white/90">
                Somos Cherry Beauty, una tienda de maquillaje dedicada a
                realzar tu belleza natural con productos de calidad y buenos
                precios.
              </p>
              <a
                href="/productos"
                className="mt-6 inline-block rounded-full bg-strawberry-deep px-7 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                Ver colección
              </a>
            </div>
          </div>
        </section>

        {/* Barra de estadísticas superpuesta */}
        <div className="relative z-10 mx-auto -mt-8 max-w-4xl px-6 sm:-mt-10 sm:px-10">
          <div className="grid grid-cols-3 divide-x divide-border-soft rounded-3xl bg-white p-6 shadow-lift sm:p-8">
            {ESTADISTICAS.map((stat) => (
              <div key={stat.etiqueta} className="text-center">
                <p className="text-2xl font-bold text-strawberry-deep sm:text-3xl">
                  {stat.numero}
                </p>
                <p className="mt-1 text-xs text-choco-soft sm:text-sm">
                  {stat.etiqueta}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Nuestra historia, con imagen a un lado */}
        <section className="bg-white px-6 pb-16 pt-20 sm:px-10 sm:pt-24">
          <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
            <div className="relative mx-auto flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
              <div
                className="absolute inset-0 rotate-3 bg-pistachio-soft"
                style={{ borderRadius: "var(--radius-blob)" }}
                aria-hidden="true"
              />
              <img
                src={modelos2}
                alt="Equipo Cherry Beauty"
                className="relative z-10 h-64 w-64 rounded-full object-cover shadow-lift sm:h-72 sm:w-72"
              />
            </div>

            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-pistachio-soft px-4 py-1 text-xs font-extrabold tracking-[0.2em] text-choco">
                NUESTRA HISTORIA
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold text-choco">
                Un sueño hecho realidad
              </h2>
              <p className="mt-4 text-base leading-relaxed text-choco-soft">
                Cherry Beauty nació con la idea de ofrecer maquillaje de
                calidad, con tonos y acabados pensados para todo tipo de
                piel.
              </p>
              <p className="mt-3 text-base leading-relaxed text-choco-soft">
                Queremos que cada persona que nos visite encuentre el
                producto ideal para expresar su propio estilo.
              </p>
            </div>
          </div>
        </section>

        {/* Lo que nos define */}
        <section className="relative overflow-hidden px-6 py-16 sm:px-10">
          <div
            className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-caramel-soft opacity-30 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-5xl">
            <div className="mx-auto mb-10 max-w-xl text-center">
              <h2 className="font-display text-3xl font-semibold text-choco">
                Lo que nos define
              </h2>
              <p className="mt-2 text-choco-soft">
                Los valores que guían cada detalle de Cherry Beauty.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {VALORES.map((valor) => (
                <div
                  key={valor.titulo}
                  className="rounded-3xl border border-border-soft bg-white p-8 text-center shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-lift"
                >
                  <span
                    className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl ${valor.fondo}`}
                  >
                    {valor.icono}
                  </span>
                  <h3 className="mb-2 text-xl font-semibold text-choco">
                    {valor.titulo}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-choco-soft">
                    {valor.texto}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cita destacada */}
        <section className="bg-white px-6 py-14 text-center sm:px-10">
          <div className="mx-auto max-w-2xl">
            <span className="text-4xl text-strawberry-soft" aria-hidden="true">
              “
            </span>
            <p className="font-display text-xl italic leading-relaxed text-choco sm:text-2xl">
              Cada producto que elegimos está pensado para hacerte sentir tan
              hermosa por dentro como por fuera.
            </p>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-strawberry-deep">
              Equipo Cherry Beauty
            </p>
          </div>
        </section>

        {/* Misión y visión */}
        <section className="mx-auto grid max-w-4xl gap-7 px-6 py-16 sm:grid-cols-2 sm:px-10">
          <article className="rounded-3xl border border-border-soft bg-cream-soft p-9">
            <h2 className="relative mb-3 inline-block text-2xl font-semibold after:mt-2.5 after:block after:h-1 after:w-11 after:rounded-full after:bg-strawberry">
              Nuestra misión
            </h2>
            <p className="text-[15.5px] leading-relaxed text-choco-soft">
              Ofrecer productos de maquillaje de excelente calidad,
              brindando una experiencia agradable y un servicio cercano a
              nuestras clientas.
            </p>
          </article>

          <article className="rounded-3xl border border-border-soft bg-cream-soft p-9">
            <h2 className="relative mb-3 inline-block text-2xl font-semibold after:mt-2.5 after:block after:h-1 after:w-11 after:rounded-full after:bg-pistachio-deep">
              Nuestra visión
            </h2>
            <p className="text-[15.5px] leading-relaxed text-choco-soft">
              Ser una tienda de maquillaje reconocida por la calidad de
              nuestros productos, nuestra atención y la satisfacción de
              nuestras clientas.
            </p>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default QuienesSomos;