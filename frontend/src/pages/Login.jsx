import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import Modal from "../components/Modal";
import RegisterForm from "../components/RegisterForm";
import RecoverPassword from "../components/RecoverPassword";
import logo from "../assets/img/logo.png";
import { iniciarSesion as iniciarSesionApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// A dónde mandar a cada rol después de iniciar sesión
function rutaSegunRol(rol) {
  if (rol === "administrador") return "/admin";
  if (rol === "empleado") return "/empleado";
  return "/"; // cliente sigue viendo la tienda normalmente
}

function Login() {
  const navigate = useNavigate();
  const { iniciarSesion: guardarSesion } = useAuth();

  const [formulario, setFormulario] = useState({
    correo: "",
    password: "",
    recordar: false,
  });

  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);

  const validarCampo = (name, value) => {
    if (name === "correo") {
      if (!value.trim()) return "El correo es obligatorio";
      if (!REGEX_CORREO.test(value)) return "Ingresa un correo válido";
      return "";
    }

    if (name === "password") {
      if (!value) return "La contraseña es obligatoria";
      if (value.length < 8) return "Mínimo 8 caracteres";
      return "";
    }

    return "";
  };

  const manejarCambio = (evento) => {
    const { name, value, type, checked } = evento.target;
    const nuevoValor = type === "checkbox" ? checked : value;

    setFormulario((prev) => ({ ...prev, [name]: nuevoValor }));
    setMensaje("");

    if (type !== "checkbox") {
      setErrores((prev) => ({ ...prev, [name]: validarCampo(name, nuevoValor) }));
    }
  };

  const manejarLogin = async (evento) => {
    evento.preventDefault();
    setMensaje("");

    const nuevosErrores = {
      correo: validarCampo("correo", formulario.correo),
      password: validarCampo("password", formulario.password),
    };

    setErrores(nuevosErrores);

    if (nuevosErrores.correo || nuevosErrores.password) return;

    setCargando(true);

    try {
      const respuesta = await iniciarSesionApi({
        correo: formulario.correo,
        password: formulario.password,
        recordar: formulario.recordar,
      });

      guardarSesion(respuesta.token, respuesta.usuario);
      setMensaje("✅ Inicio de sesión exitoso");

      const destino = rutaSegunRol(respuesta.usuario.rol);
      setTimeout(() => navigate(destino), 900);
    } catch (error) {
      setMensaje(`❌ ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  const manejarRegistroExitoso = (correoRegistrado) => {
    setMostrarRegistro(false);
    setFormulario((prev) => ({ ...prev, correo: correoRegistrado, password: "" }));
    setMensaje("✅ Registro exitoso. Ahora inicia sesión con tu nueva cuenta.");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-cream via-cream-soft to-strawberry-soft px-4 py-16">
      {/* Botón de regresar en la esquina derecha */}
      <Link
        to="/"
        className="fixed right-6 top-6 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-choco transition hover:bg-white hover:shadow-soft sm:right-8 sm:top-8"
        title="Volver a la tienda"
      >
        <span className="text-lg">←</span>
        Volver
      </Link>

      <div className="w-full max-w-md rounded-3xl bg-cream p-8 shadow-lift sm:p-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link
            to="/"
            className="mb-4 flex items-center justify-center"
          >
            <img
              src={logo}
              alt="Cherry Beauty"
              className="h-32 w-32 rounded-full object-cover shadow-soft"
            />
          </Link>

          <span className="mb-3 inline-block rounded-full bg-caramel-soft px-4 py-1 text-xs font-extrabold tracking-[0.2em] text-caramel-deep">
            BIENVENIDO
          </span>

          <h1 className="text-3xl font-semibold">Iniciar sesión</h1>
          <p className="mt-1 text-choco-soft">
            Ingresa y descubre tus productos favoritos
          </p>
        </div>

        <form onSubmit={manejarLogin} className="flex flex-col gap-4">
          <Input
            id="correo"
            name="correo"
            type="email"
            label="Correo electrónico"
            value={formulario.correo}
            onChange={manejarCambio}
            placeholder="correo@ejemplo.com"
            error={errores.correo}
            autoComplete="email"
          />

          <Input
            id="password"
            name="password"
            type={verPassword ? "text" : "password"}
            label="Contraseña"
            value={formulario.password}
            onChange={manejarCambio}
            placeholder="Tu contraseña"
            error={errores.password}
            autoComplete="current-password"
            rightSlot={
              <button
                type="button"
                onClick={() => setVerPassword((prev) => !prev)}
                aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="flex items-center"
              >
                <IconoOjo visible={verPassword} />
              </button>
            }
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 font-semibold text-choco-soft">
              <input
                type="checkbox"
                name="recordar"
                checked={formulario.recordar}
                onChange={manejarCambio}
                className="h-4 w-4 rounded accent-caramel"
              />
              Recordarme
            </label>

            <button
              type="button"
              onClick={() => setMostrarRecuperar(true)}
              className="font-bold text-caramel-deep hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

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

          <Button type="submit" disabled={cargando} className="w-full">
            {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>

          <p className="mt-1 text-center text-sm text-choco-soft">
            ¿No tienes una cuenta?{" "}
            <button
              type="button"
              onClick={() => setMostrarRegistro(true)}
              className="font-bold text-strawberry-deep hover:underline"
            >
              Crear una cuenta
            </button>
          </p>
        </form>
      </div>

      {/* Modal de registro */}
      <Modal
        abierto={mostrarRegistro}
        onCerrar={() => setMostrarRegistro(false)}
        labelledBy="titulo-registro"
        size="lg"
      >
        <RegisterForm onRegistroExitoso={manejarRegistroExitoso} />
      </Modal>

      {/* Modal de recuperar contraseña */}
      <Modal
        abierto={mostrarRecuperar}
        onCerrar={() => setMostrarRecuperar(false)}
        labelledBy="titulo-recuperar"
      >
        <RecoverPassword onVolver={() => setMostrarRecuperar(false)} />
      </Modal>
    </main>
  );
}

export default Login;