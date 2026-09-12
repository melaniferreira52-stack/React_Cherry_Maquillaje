import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import logo from "../assets/img/logo.png";
import { restablecerPassword } from "../lib/api";

// Ícono de ojo (abierto / tachado) para mostrar u ocultar la contraseña
function IconoOjo({ visible }) {
  if (visible) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-choco-soft" strokeWidth="2">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-choco-soft" strokeWidth="2">
      <path
        d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.6 20.6 0 0 1 5.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 7 11 7a20.7 20.7 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M1 1l22 22" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BotonOjo({ visible, onClick, etiqueta }) {
  return (
    <button type="button" onClick={onClick} aria-label={etiqueta} className="flex items-center">
      <IconoOjo visible={visible} />
    </button>
  );
}

export default function RestablecerPassword() {
  const [parametros] = useSearchParams();
  const navigate = useNavigate();

  const token = parametros.get("token") || "";
  const correo = parametros.get("correo") || "";

  const [formulario, setFormulario] = useState({
    nuevaPassword: "",
    confirmar: "",
  });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const [verNuevaPassword, setVerNuevaPassword] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  const enlaceInvalido = !token || !correo;

  function manejarCambio(e) {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
    setMensaje("");
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setMensaje("");

    const nuevosErrores = {};

    if (formulario.nuevaPassword.length < 8) {
      nuevosErrores.nuevaPassword = "Mínimo 8 caracteres";
    }

    if (formulario.confirmar !== formulario.nuevaPassword) {
      nuevosErrores.confirmar = "Las contraseñas no coinciden";
    }

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) return;

    setCargando(true);

    try {
      await restablecerPassword({
        correo,
        token,
        nuevaPassword: formulario.nuevaPassword,
      });

      setExito(true);
      setMensaje("✅ Tu contraseña fue actualizada correctamente.");

      setTimeout(() => navigate("/login"), 1800);
    } catch (error) {
      setMensaje(`❌ ${error.message}`);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cream via-cream-soft to-strawberry-soft px-4 py-16">
      <div className="w-full max-w-md rounded-3xl bg-cream p-8 shadow-lift sm:p-10">
        <div className="mb-6 text-center">
          <Link to="/" className="mb-4 inline-flex items-center justify-center">
            <img
              src={logo}
              alt="Cherry Beauty"
              className="h-32 w-32 rounded-full object-cover shadow-soft"
            />
          </Link>

          <h1 className="text-3xl font-semibold">Restablecer contraseña</h1>
          <p className="mt-1 text-choco-soft">
            Elige una nueva contraseña para tu cuenta
          </p>
        </div>

        {enlaceInvalido ? (
          <div className="rounded-2xl border border-strawberry-deep bg-strawberry-soft px-4 py-3 text-center text-sm font-semibold text-strawberry-deep">
            Este enlace no es válido. Solicita uno nuevo desde{" "}
            <Link to="/login" className="underline">
              Iniciar sesión
            </Link>
            .
          </div>
        ) : (
          <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
            <Input
              id="nuevaPassword"
              name="nuevaPassword"
              type={verNuevaPassword ? "text" : "password"}
              label="Nueva contraseña"
              value={formulario.nuevaPassword}
              onChange={manejarCambio}
              placeholder="Mínimo 8 caracteres"
              error={errores.nuevaPassword}
              disabled={exito}
              autoComplete="new-password"
              rightSlot={
                <BotonOjo
                  visible={verNuevaPassword}
                  onClick={() => setVerNuevaPassword((prev) => !prev)}
                  etiqueta={verNuevaPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                />
              }
            />

            <Input
              id="confirmar"
              name="confirmar"
              type={verConfirmar ? "text" : "password"}
              label="Confirmar contraseña"
              value={formulario.confirmar}
              onChange={manejarCambio}
              placeholder="Repite la contraseña"
              error={errores.confirmar}
              disabled={exito}
              autoComplete="new-password"
              rightSlot={
                <BotonOjo
                  visible={verConfirmar}
                  onClick={() => setVerConfirmar((prev) => !prev)}
                  etiqueta={verConfirmar ? "Ocultar contraseña" : "Mostrar contraseña"}
                />
              }
            />

            {mensaje && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  mensaje.startsWith("❌")
                    ? "border-strawberry-deep bg-strawberry-soft text-strawberry-deep"
                    : "border-pistachio bg-pistachio-soft text-pistachio-deep"
                }`}
              >
                {mensaje}
              </div>
            )}

            <Button type="submit" disabled={cargando || exito} className="w-full">
              {cargando ? "Guardando..." : "Guardar nueva contraseña"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}