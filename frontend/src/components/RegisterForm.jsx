import { useState } from "react";
import Input from "./Input";
import Select from "./Select";
import Button from "./Button";
import logo from "../assets/img/logo.png";
import { registrarUsuario } from "../lib/api";

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
const REGEX_DOCUMENTO = /^[0-9]{6,12}$/;
const REGEX_TELEFONO = /^[0-9]{7,10}$/;

const TIPOS_DOCUMENTO = [
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "TI", label: "Tarjeta de identidad" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "PA", label: "Pasaporte" },
];

const VACIO = {
  nombre: "",
  apellido: "",
  tipoDocumento: "",
  numeroDocumento: "",
  direccion: "",
  telefono: "",
  correo: "",
  password: "",
  confirmarPassword: "",
};

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

/**
 * Formulario de registro de clientes. Se usa dentro del Modal
 * que se abre desde Login ("Crear cuenta"). Valida en tiempo real
 * mientras el usuario escribe.
 */
function RegisterForm({ onRegistroExitoso }) {
  const [formulario, setFormulario] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensajeServidor, setMensajeServidor] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmarPassword, setVerConfirmarPassword] = useState(false);

  const validarCampo = (name, value, formularioActual) => {
    switch (name) {
      case "nombre":
      case "apellido":
        if (!value.trim()) return "Este campo es obligatorio";
        if (value.trim().length < 2) return "Mínimo 2 caracteres";
        if (value.trim().length > 40) return "Máximo 40 caracteres";
        if (!REGEX_SOLO_LETRAS.test(value)) return "Solo se permiten letras";
        return "";

      case "tipoDocumento":
        if (!value) return "Selecciona un tipo de documento";
        return "";

      case "numeroDocumento":
        if (!value.trim()) return "El número de documento es obligatorio";
        if (!REGEX_DOCUMENTO.test(value))
          return "Debe tener entre 6 y 12 dígitos numéricos";
        return "";

      case "direccion":
        if (!value.trim()) return "La dirección es obligatoria";
        if (value.trim().length < 5) return "Mínimo 5 caracteres";
        if (value.trim().length > 80) return "Máximo 80 caracteres";
        return "";

      case "telefono":
        if (!value.trim()) return "El teléfono es obligatorio";
        if (!REGEX_TELEFONO.test(value))
          return "Debe tener entre 7 y 10 dígitos numéricos";
        return "";

      case "correo":
        if (!value.trim()) return "El correo es obligatorio";
        if (!REGEX_CORREO.test(value)) return "Ingresa un correo válido";
        return "";

      case "password":
        if (!value) return "La contraseña es obligatoria";
        if (value.length < 8) return "Mínimo 8 caracteres";
        if (value.length > 20) return "Máximo 20 caracteres";
        return "";

      case "confirmarPassword":
        if (!value) return "Debes confirmar tu contraseña";
        if (value !== formularioActual.password)
          return "Las contraseñas no coinciden";
        return "";

      default:
        return "";
    }
  };

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;

    // Restringe caracteres no permitidos mientras se escribe
    let valorLimpio = value;
    if (name === "numeroDocumento" || name === "telefono") {
      valorLimpio = value.replace(/[^0-9]/g, "");
    }
    if (name === "nombre" || name === "apellido") {
      valorLimpio = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "");
    }

    const nuevoFormulario = { ...formulario, [name]: valorLimpio };
    setFormulario(nuevoFormulario);

    const mensajeError = validarCampo(name, valorLimpio, nuevoFormulario);
    const nuevosErrores = { ...errores, [name]: mensajeError };

    // Si cambia la contraseña, revalida también la confirmación
    if (name === "password" && nuevoFormulario.confirmarPassword) {
      nuevosErrores.confirmarPassword = validarCampo(
        "confirmarPassword",
        nuevoFormulario.confirmarPassword,
        nuevoFormulario
      );
    }

    setErrores(nuevosErrores);
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    setMensajeServidor("");

    const nuevosErrores = {};
    Object.keys(formulario).forEach((campo) => {
      const mensaje = validarCampo(campo, formulario[campo], formulario);
      if (mensaje) nuevosErrores[campo] = mensaje;
    });

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) return;

    setEnviando(true);

    try {
      await registrarUsuario(formulario);

      const correoRegistrado = formulario.correo;
      setFormulario(VACIO);
      setErrores({});
      onRegistroExitoso?.(correoRegistrado);
    } catch (error) {
      setMensajeServidor(error.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-center">
        <img
          src={logo}
          alt="Cherry Beauty"
          className="h-28 w-28 rounded-full object-cover shadow-soft"
        />
      </div>

      <span className="mb-3 inline-block rounded-full bg-strawberry-soft px-4 py-1 text-xs font-extrabold tracking-[0.2em] text-strawberry-deep">
        NUEVO CLIENTE
      </span>

      <h2 id="titulo-registro" className="mb-1 text-3xl font-semibold">
        Crear cuenta
      </h2>

      <p className="mb-6 text-choco-soft">Únete a Cherry Beauty 🍒</p>

      <form onSubmit={manejarEnvio} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="reg-nombre"
            name="nombre"
            label="Nombre"
            value={formulario.nombre}
            onChange={manejarCambio}
            placeholder="Tu nombre"
            maxLength={40}
            error={errores.nombre}
          />

          <Input
            id="reg-apellido"
            name="apellido"
            label="Apellido"
            value={formulario.apellido}
            onChange={manejarCambio}
            placeholder="Tu apellido"
            maxLength={40}
            error={errores.apellido}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="reg-tipo-documento"
            name="tipoDocumento"
            label="Tipo de documento"
            value={formulario.tipoDocumento}
            onChange={manejarCambio}
            options={TIPOS_DOCUMENTO}
            error={errores.tipoDocumento}
          />

          <Input
            id="reg-numero-documento"
            name="numeroDocumento"
            label="Número de documento"
            value={formulario.numeroDocumento}
            onChange={manejarCambio}
            placeholder="Sin puntos ni espacios"
            maxLength={12}
            error={errores.numeroDocumento}
          />
        </div>

        <Input
          id="reg-direccion"
          name="direccion"
          label="Dirección"
          value={formulario.direccion}
          onChange={manejarCambio}
          placeholder="Calle 10 # 20 - 30"
          maxLength={80}
          error={errores.direccion}
        />

        <Input
          id="reg-telefono"
          name="telefono"
          label="Teléfono"
          value={formulario.telefono}
          onChange={manejarCambio}
          placeholder="3000000000"
          maxLength={10}
          error={errores.telefono}
        />

        <Input
          id="reg-correo"
          name="correo"
          type="email"
          label="Correo electrónico"
          value={formulario.correo}
          onChange={manejarCambio}
          placeholder="correo@ejemplo.com"
          error={errores.correo}
          autoComplete="email"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="reg-password"
            name="password"
            type={verPassword ? "text" : "password"}
            label="Contraseña"
            value={formulario.password}
            onChange={manejarCambio}
            placeholder="Mínimo 8 caracteres"
            maxLength={20}
            error={errores.password}
            autoComplete="new-password"
            rightSlot={
              <BotonOjo
                visible={verPassword}
                onClick={() => setVerPassword((prev) => !prev)}
                etiqueta={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              />
            }
          />

          <Input
            id="reg-confirmar-password"
            name="confirmarPassword"
            type={verConfirmarPassword ? "text" : "password"}
            label="Confirmar contraseña"
            value={formulario.confirmarPassword}
            onChange={manejarCambio}
            placeholder="Repite tu contraseña"
            maxLength={20}
            error={errores.confirmarPassword}
            autoComplete="new-password"
            rightSlot={
              <BotonOjo
                visible={verConfirmarPassword}
                onClick={() => setVerConfirmarPassword((prev) => !prev)}
                etiqueta={verConfirmarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              />
            }
          />
        </div>

        {mensajeServidor && (
          <div className="rounded-2xl border border-strawberry-deep bg-strawberry-soft px-4 py-3 text-sm font-semibold text-strawberry-deep">
            {mensajeServidor}
          </div>
        )}

        <Button type="submit" variant="secondary" disabled={enviando} className="w-full">
          {enviando ? "Registrando..." : "Registrarme"}
        </Button>
      </form>
      
    </div>
  );
}

export default RegisterForm;