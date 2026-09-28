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

// Límites máximos de caracteres por campo (se usan en maxLength, validación y contador)
const LIMITES = {
  nombre: 40,
  apellido: 40,
  numeroDocumento: 12,
  direccion: 80,
  telefono: 10,
  correo: 50,
  password: 20,
  confirmarPassword: 20,
};

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

// Muestra el contador "actual/máximo" debajo de un campo
function CampoConContador({ valor, max, children }) {
  const lleno = valor.length >= max;
  return (
    <div>
      {children}
      <p
        className={`mt-1 text-right text-xs font-semibold ${
          lleno ? "text-strawberry-deep" : "text-choco-soft"
        }`}
      >
        {valor.length}/{max}
      </p>
    </div>
  );
}

// Circulito de estado (vacío / con check) para cada ítem de la checklist
function ItemValidacion({ etiqueta, valido }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
          valido
            ? "border-strawberry-deep bg-strawberry-deep"
            : "border-border-soft bg-white"
        }`}
      >
        {valido && (
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-none stroke-white" strokeWidth="3">
            <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={valido ? "text-choco" : "text-choco-soft"}>{etiqueta}</span>
    </li>
  );
}

/**
 * Formulario de registro de clientes. Se usa dentro del Modal
 * que se abre desde Login ("Crear cuenta"). Valida en tiempo real
 * mientras el usuario escribe y muestra el contador de caracteres.
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
        if (value.trim().length > LIMITES[name]) return `Máximo ${LIMITES[name]} caracteres`;
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
        if (value.trim().length > LIMITES.direccion)
          return `Máximo ${LIMITES.direccion} caracteres`;
        return "";

      case "telefono":
        if (!value.trim()) return "El teléfono es obligatorio";
        if (!REGEX_TELEFONO.test(value))
          return "Debe tener entre 7 y 10 dígitos numéricos";
        return "";

      case "correo":
        if (!value.trim()) return "El correo es obligatorio";
        if (value.length > LIMITES.correo) return `Máximo ${LIMITES.correo} caracteres`;
        if (!REGEX_CORREO.test(value)) return "Ingresa un correo válido";
        return "";

      case "password":
        if (!value) return "La contraseña es obligatoria";
        if (value.length < 8) return "Mínimo 8 caracteres";
        if (value.length > LIMITES.password) return `Máximo ${LIMITES.password} caracteres`;
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

  // Estado de validez de cada campo, calculado en cada render para que
  // la checklist reaccione al instante mientras la persona va escribiendo.
  const camposValidos = {
    nombre: formulario.nombre !== "" && !validarCampo("nombre", formulario.nombre, formulario),
    apellido: formulario.apellido !== "" && !validarCampo("apellido", formulario.apellido, formulario),
    tipoDocumento: !validarCampo("tipoDocumento", formulario.tipoDocumento, formulario),
    numeroDocumento:
      formulario.numeroDocumento !== "" &&
      !validarCampo("numeroDocumento", formulario.numeroDocumento, formulario),
    direccion: formulario.direccion !== "" && !validarCampo("direccion", formulario.direccion, formulario),
    telefono: formulario.telefono !== "" && !validarCampo("telefono", formulario.telefono, formulario),
    correo: formulario.correo !== "" && !validarCampo("correo", formulario.correo, formulario),
    password: formulario.password !== "" && !validarCampo("password", formulario.password, formulario),
    confirmarPassword:
      formulario.confirmarPassword !== "" &&
      !validarCampo("confirmarPassword", formulario.confirmarPassword, formulario),
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
          <CampoConContador valor={formulario.nombre} max={LIMITES.nombre}>
            <Input
              id="reg-nombre"
              name="nombre"
              label="Nombre"
              value={formulario.nombre}
              onChange={manejarCambio}
              placeholder="Tu nombre"
              maxLength={LIMITES.nombre}
              error={errores.nombre}
            />
          </CampoConContador>

          <CampoConContador valor={formulario.apellido} max={LIMITES.apellido}>
            <Input
              id="reg-apellido"
              name="apellido"
              label="Apellido"
              value={formulario.apellido}
              onChange={manejarCambio}
              placeholder="Tu apellido"
              maxLength={LIMITES.apellido}
              error={errores.apellido}
            />
          </CampoConContador>
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

          <CampoConContador
            valor={formulario.numeroDocumento}
            max={LIMITES.numeroDocumento}
          >
            <Input
              id="reg-numero-documento"
              name="numeroDocumento"
              label="Número de documento"
              value={formulario.numeroDocumento}
              onChange={manejarCambio}
              placeholder="Sin puntos ni espacios"
              maxLength={LIMITES.numeroDocumento}
              error={errores.numeroDocumento}
            />
          </CampoConContador>
        </div>

        <CampoConContador valor={formulario.direccion} max={LIMITES.direccion}>
          <Input
            id="reg-direccion"
            name="direccion"
            label="Dirección"
            value={formulario.direccion}
            onChange={manejarCambio}
            placeholder="Calle 10 # 20 - 30"
            maxLength={LIMITES.direccion}
            error={errores.direccion}
          />
        </CampoConContador>

        <CampoConContador valor={formulario.telefono} max={LIMITES.telefono}>
          <Input
            id="reg-telefono"
            name="telefono"
            label="Teléfono"
            value={formulario.telefono}
            onChange={manejarCambio}
            placeholder="3000000000"
            maxLength={LIMITES.telefono}
            error={errores.telefono}
          />
        </CampoConContador>

        <CampoConContador valor={formulario.correo} max={LIMITES.correo}>
          <Input
            id="reg-correo"
            name="correo"
            type="email"
            label="Correo electrónico"
            value={formulario.correo}
            onChange={manejarCambio}
            placeholder="correo@ejemplo.com"
            maxLength={LIMITES.correo}
            error={errores.correo}
            autoComplete="email"
          />
        </CampoConContador>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoConContador valor={formulario.password} max={LIMITES.password}>
            <Input
              id="reg-password"
              name="password"
              type={verPassword ? "text" : "password"}
              label="Contraseña"
              value={formulario.password}
              onChange={manejarCambio}
              placeholder="Mínimo 8 caracteres"
              maxLength={LIMITES.password}
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
          </CampoConContador>

          <CampoConContador
            valor={formulario.confirmarPassword}
            max={LIMITES.confirmarPassword}
          >
            <Input
              id="reg-confirmar-password"
              name="confirmarPassword"
              type={verConfirmarPassword ? "text" : "password"}
              label="Confirmar contraseña"
              value={formulario.confirmarPassword}
              onChange={manejarCambio}
              placeholder="Repite tu contraseña"
              maxLength={LIMITES.confirmarPassword}
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
          </CampoConContador>
        </div>

        {/* Checklist de validaciones, estilo lista de requisitos */}
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-2xl border border-border-soft bg-cream-soft px-5 py-4">
          <ItemValidacion etiqueta="Nombre" valido={camposValidos.nombre} />
          <ItemValidacion etiqueta="Apellido" valido={camposValidos.apellido} />
          <ItemValidacion etiqueta="Tipo de documento" valido={camposValidos.tipoDocumento} />
          <ItemValidacion etiqueta="Número de documento" valido={camposValidos.numeroDocumento} />
          <ItemValidacion etiqueta="Dirección" valido={camposValidos.direccion} />
          <ItemValidacion etiqueta="Teléfono" valido={camposValidos.telefono} />
          <ItemValidacion etiqueta="Correo" valido={camposValidos.correo} />
          <ItemValidacion etiqueta="Contraseña" valido={camposValidos.password} />
          <ItemValidacion etiqueta="Confirmar contraseña" valido={camposValidos.confirmarPassword} />
        </ul>

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