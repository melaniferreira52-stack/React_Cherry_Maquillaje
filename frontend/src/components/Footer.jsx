import logo from "../assets/img/logo-blanco.png";

function Footer() {
  return (
    <footer className="relative bg-choco pt-16 text-white">
      {/* Borde superior tipo ondas decorativas */}
      <div
        className="absolute -top-6 left-0 h-6 w-full bg-choco"
        style={{
          clipPath:
            "polygon(0% 0%, 100% 0%, 100% 40%, 92% 100%, 84% 40%, 76% 100%, 68% 40%, 60% 100%, 52% 40%, 44% 100%, 36% 40%, 28% 100%, 20% 40%, 12% 100%, 4% 40%, 0% 100%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 pb-11 sm:px-10 md:flex-row md:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="Cherry"
              className="h-16 w-auto object-contain"
            />
            <h2 className="font-display text-2xl font-bold" style={{ color: "#ffffff" }}>
              Cherry
            </h2>
          </div>
          <p className="mt-3 leading-relaxed text-white/85">
            Maquillaje de calidad para realzar tu belleza en cada momento.
          </p>
        </div>

        <div className="flex-1">
          <h3 className="mb-3 text-lg font-bold text-vanilla">Contacto</h3>
          <p className="my-1.5 text-white/85">📍 Manrique - Antioquia</p>
          <p className="my-1.5 text-white/85">📞 320 800 6702</p>
          <p className="my-1.5 text-white/85">✉️ cherrybeauty@gmail.com</p>
        </div>

        <div className="flex-1">
          <h3 className="mb-3 text-lg font-bold text-vanilla">Horarios</h3>
          <p className="my-1.5 text-white/85">Lunes - Viernes</p>
          <p className="my-1.5 text-white/85">6:00 AM - 8:00 PM</p>
          <p className="my-1.5 text-white/85">Sábados y Domingos</p>
          <p className="my-1.5 text-white/85">10:00 AM - 9:00 PM</p>
        </div>
        <div className="mt-7 overflow-hidden rounded-2xl border border-white/15">
          <iframe
          
          title="Ubicación Cherry Beauty"
          src="https://maps.google.com/maps?q=Manrique,+Medell%C3%ADn,+Antioquia,+Colombia&z=15&output=embed"
          width="100%"
          height="180"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          />
          </div>
          </div>

      <div className="border-t border-white/15 px-6 py-5 text-center">
        <p className="text-sm text-white/65">
          © 2026 Cherry Beauty. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

export default Footer;