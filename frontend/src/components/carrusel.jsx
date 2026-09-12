import { useState, useEffect, useRef, useCallback } from "react";
import { destacadosCarrusel } from "../data/carrusel";

const INTERVALO = 4500;

function Carrusel() {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const touchX = useRef(null);

  const siguiente = useCallback(() => {
    setActual((prev) => (prev + 1) % destacadosCarrusel.length);
  }, []);

  const anterior = useCallback(() => {
    setActual((prev) => (prev - 1 + destacadosCarrusel.length) % destacadosCarrusel.length);
  }, []);

  useEffect(() => {
    if (pausado) return;
    const intervalo = setInterval(siguiente, INTERVALO);
    return () => clearInterval(intervalo);
  }, [pausado, siguiente]);

  const manejarTeclado = (evento) => {
    if (evento.key === "ArrowRight") siguiente();
    if (evento.key === "ArrowLeft") anterior();
  };

  const manejarTouchStart = (evento) => {
    touchX.current = evento.touches[0].clientX;
  };

  const manejarTouchEnd = (evento) => {
    if (touchX.current === null) return;
    const delta = evento.changedTouches[0].clientX - touchX.current;
    if (delta > 50) anterior();
    else if (delta < -50) siguiente();
    touchX.current = null;
  };

  return (
    <section
      className="relative h-[460px] w-full overflow-hidden bg-cream-soft outline-none focus-visible:outline-2 focus-visible:outline-caramel sm:h-[560px] lg:h-[640px]"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Productos destacados"
      tabIndex={0}
      onKeyDown={manejarTeclado}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      onTouchStart={manejarTouchStart}
      onTouchEnd={manejarTouchEnd}
    >
      {/* Fondo desenfocado: rellena los espacios que deja object-contain */}
      <div
        key={`fondo-${actual}`}
        className="absolute inset-0 z-0 scale-125 bg-cover bg-center brightness-[0.75] saturate-[1.15] blur-3xl transition-all duration-700"
        style={{ backgroundImage: `url(${destacadosCarrusel[actual].imagen})` }}
        aria-hidden="true"
      />

      {/* Capa suave para que el fondo no se vea tan crudo */}
      <div
        className="pointer-events-none absolute inset-0 z-[5] bg-choco/10"
        aria-hidden="true"
      />

      {/* Imagen principal: completa, sin recortes */}
      <img
        key={actual}
        src={destacadosCarrusel[actual].imagen}
        alt={destacadosCarrusel[actual].titulo}
        className="relative z-10 mx-auto block h-full w-full animate-[carruselAparecer_0.7s_ease] object-contain drop-shadow-[0_10px_40px_rgba(0,0,0,0.35)] motion-reduce:animate-none"
      />

      {/* Degradado inferior para legibilidad del texto */}
      <div
        className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-choco/80 via-choco/10 to-transparent"
        aria-hidden="true"
      />

      <button
        onClick={anterior}
        aria-label="Imagen anterior"
        className="absolute left-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-caramel-deep shadow-soft transition-all hover:scale-110 hover:bg-white sm:left-8 sm:h-14 sm:w-14"
      >
        ❮
      </button>

      <button
        onClick={siguiente}
        aria-label="Imagen siguiente"
        className="absolute right-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-caramel-deep shadow-soft transition-all hover:scale-110 hover:bg-white sm:right-8 sm:h-14 sm:w-14"
      >
        ❯
      </button>

      <div
        className="absolute inset-x-6 bottom-16 z-30 text-white sm:inset-x-auto sm:bottom-24 sm:left-[8%] sm:max-w-xl"
        aria-live="polite"
      >
        <h2 className="mb-3 font-display text-3xl font-semibold text-white [text-shadow:0_2px_12px_rgb(0_0_0_/_0.25)] sm:text-5xl">
          {destacadosCarrusel[actual].titulo}
        </h2>
        <p className="max-w-lg text-base leading-relaxed text-white/90 sm:text-lg">
          {destacadosCarrusel[actual].descripcion}
        </p>
      </div>

      <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-2.5 sm:bottom-8">
        {destacadosCarrusel.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setActual(index)}
            aria-label={`Mostrar ${item.titulo}`}
            className={`h-2.5 w-2.5 rounded-full transition-all sm:h-3 sm:w-3 ${
              actual === index
                ? "scale-125 bg-strawberry opacity-100"
                : "bg-white opacity-50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

export default Carrusel;