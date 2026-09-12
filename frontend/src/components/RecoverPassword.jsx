import { useState } from "react";

import Input from "./Input";
import Button from "./Button";

import {
  solicitarRecuperacion,
  verificarCodigoRecuperacion,
  cambiarPasswordRecuperacion,
} from "../lib/api";

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

function BotonOjo({ visible, onClick, etiqueta }) {
  return (
    <button type="button" onClick={onClick} aria-label={etiqueta} className="flex items-center">
      <IconoOjo visible={visible} />
    </button>
  );
}

function RecoverPassword({ onVolver }) {
  // =====================================
  // ESTADOS
  // =====================================

  const [correo, setCorreo] = useState("");

  const [codigo, setCodigo] = useState("");

  const [nuevaPassword, setNuevaPassword] = useState("");

  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [verNuevaPassword, setVerNuevaPassword] = useState(false);
  const [verConfirmarPassword, setVerConfirmarPassword] = useState(false);

  // Paso actual:
  // 1 = correo
  // 2 = código
  // 3 = nueva contraseña
  const [paso, setPaso] = useState(1);

  const [error, setError] = useState("");

  const [mensaje, setMensaje] = useState("");

  const [cargando, setCargando] = useState(false);

  // =====================================
  // CAMBIO DE CORREO
  // =====================================

  const manejarCambioCorreo = (evento) => {
    const valor = evento.target.value;

    setCorreo(valor);

    setError("");

    setMensaje("");
  };

  // =====================================
  // CAMBIO DE CÓDIGO
  // =====================================

  const manejarCambioCodigo = (evento) => {
    // Solo permitir números
    const valor = evento.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setCodigo(valor);

    setError("");

    setMensaje("");
  };

  // =====================================
  // CAMBIO DE CONTRASEÑA
  // =====================================

  const manejarCambioPassword = (evento) => {
    setNuevaPassword(evento.target.value);

    setError("");

    setMensaje("");
  };

  // =====================================
  // CAMBIO DE CONFIRMACIÓN
  // =====================================

  const manejarCambioConfirmarPassword = (evento) => {
    setConfirmarPassword(evento.target.value);

    setError("");

    setMensaje("");
  };

  // =====================================
  // PASO 1
  // SOLICITAR CÓDIGO
  // =====================================

  const manejarSolicitarCodigo = async (evento) => {
    evento.preventDefault();

    setError("");

    setMensaje("");

    // Validar correo vacío
    if (!correo.trim()) {
      setError("El correo es obligatorio");
      return;
    }

    // Validar formato
    if (!REGEX_CORREO.test(correo)) {
      setError("Ingresa un correo válido");
      return;
    }

    setCargando(true);

    try {
      await solicitarRecuperacion(correo);

      // Pasamos al paso 2
      setPaso(2);

      setMensaje(
        "Si el correo está registrado, recibirás un código de 6 dígitos."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // =====================================
  // PASO 2
  // VERIFICAR CÓDIGO
  // =====================================

  const manejarVerificarCodigo = async (evento) => {
    evento.preventDefault();

    setError("");

    setMensaje("");

    if (!codigo) {
      setError("El código es obligatorio");
      return;
    }

    if (!/^\d{6}$/.test(codigo)) {
      setError("El código debe tener 6 dígitos");
      return;
    }

    setCargando(true);

    try {
      await verificarCodigoRecuperacion({
        correo,
        codigo,
      });

      // Pasamos al paso 3
      setPaso(3);

      setMensaje("Código verificado correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // =====================================
  // PASO 3
  // CAMBIAR CONTRASEÑA
  // =====================================

  const manejarCambiarPassword = async (evento) => {
    evento.preventDefault();

    setError("");

    setMensaje("");

    // Validar contraseña
    if (!nuevaPassword) {
      setError("La nueva contraseña es obligatoria");
      return;
    }

    if (nuevaPassword.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres");
      return;
    }

    if (nuevaPassword.length > 20) {
      setError("La contraseña debe tener máximo 20 caracteres");
      return;
    }

    // Confirmar contraseña
    if (!confirmarPassword) {
      setError("Debes confirmar la contraseña");
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setCargando(true);

    try {
      await cambiarPasswordRecuperacion({
        correo,
        codigo,
        nuevaPassword,
      });

      setMensaje(
        "✅ Contraseña actualizada correctamente. Ya puedes iniciar sesión."
      );

      // Limpiar contraseña
      setNuevaPassword("");
      setConfirmarPassword("");

    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // =====================================
  // VOLVER AL PASO ANTERIOR
  // =====================================

  const volverPasoAnterior = () => {
    setError("");

    setMensaje("");

    if (paso === 2) {
      setPaso(1);
      setCodigo("");
    }

    if (paso === 3) {
      setPaso(2);
      setNuevaPassword("");
      setConfirmarPassword("");
    }
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <div>

      {/* =====================================
          ENCABEZADO
      ===================================== */}

      <span className="mb-3 inline-block rounded-full bg-pistachio-soft px-4 py-1 text-xs font-extrabold tracking-[0.2em] text-pistachio-deep">
        RECUPERAR ACCESO
      </span>

      <h2
        id="titulo-recuperar"
        className="mb-1 text-3xl font-semibold text-caramel-deep"
      >
        ¿Olvidaste tu contraseña?
      </h2>

      <p className="mb-6 text-choco-soft">
        {paso === 1 &&
          "Escribe tu correo y te enviaremos un código de recuperación."}

        {paso === 2 &&
          "Revisa tu correo e ingresa el código de 6 dígitos que recibiste."}

        {paso === 3 &&
          "Escribe tu nueva contraseña para recuperar el acceso a tu cuenta."}
      </p>

      {/* =====================================
          MENSAJE DE ERROR
      ===================================== */}

      {error && (
        <div className="mb-4 rounded-2xl border border-strawberry-deep bg-strawberry-soft px-4 py-3 text-sm font-semibold text-strawberry-deep">
          ❌ {error}
        </div>
      )}

      {/* =====================================
          MENSAJE DE ÉXITO
      ===================================== */}

      {mensaje && !error && (
        <div className="mb-4 rounded-2xl border border-pistachio bg-pistachio-soft px-4 py-3 text-sm font-semibold text-pistachio-deep">
          {mensaje}
        </div>
      )}

      {/* =====================================
          PASO 1 — CORREO
      ===================================== */}

      {paso === 1 && (
        <form
          onSubmit={manejarSolicitarCodigo}
          className="flex flex-col gap-4"
        >
          <Input
            id="recuperar-correo"
            name="correo"
            label="Correo electrónico"
            type="email"
            value={correo}
            onChange={manejarCambioCorreo}
            placeholder="correo@ejemplo.com"
            error=""
            autoComplete="email"
          />

          <Button
            type="submit"
            variant="secondary"
            disabled={cargando}
            className="w-full"
          >
            {cargando
              ? "Enviando código..."
              : "Enviar código"}
          </Button>

          <button
            type="button"
            onClick={onVolver}
            className="mt-1 text-center text-sm font-bold text-caramel-deep hover:underline"
          >
            ← Volver a iniciar sesión
          </button>
        </form>
      )}

      {/* =====================================
          PASO 2 — CÓDIGO
      ===================================== */}

      {paso === 2 && (
        <form
          onSubmit={manejarVerificarCodigo}
          className="flex flex-col gap-4"
        >
          <Input
            id="recuperar-codigo"
            name="codigo"
            label="Código de recuperación"
            type="text"
            inputMode="numeric"
            value={codigo}
            onChange={manejarCambioCodigo}
            placeholder="123456"
            maxLength={6}
            error=""
            autoComplete="one-time-code"
          />

          <p className="text-center text-sm text-choco-soft">
            El código tiene una duración de <strong>10 minutos</strong>.
          </p>

          <Button
            type="submit"
            variant="secondary"
            disabled={cargando}
            className="w-full"
          >
            {cargando
              ? "Verificando..."
              : "Verificar código"}
          </Button>

          <button
            type="button"
            onClick={volverPasoAnterior}
            className="text-center text-sm font-bold text-caramel-deep hover:underline"
          >
            ← Cambiar correo
          </button>
        </form>
      )}

      {/* =====================================
          PASO 3 — NUEVA CONTRASEÑA
      ===================================== */}

      {paso === 3 && (
        <form
          onSubmit={manejarCambiarPassword}
          className="flex flex-col gap-4"
        >
          <Input
            id="nueva-password"
            name="nuevaPassword"
            type={verNuevaPassword ? "text" : "password"}
            label="Nueva contraseña"
            value={nuevaPassword}
            onChange={manejarCambioPassword}
            placeholder="Mínimo 8 caracteres"
            maxLength={20}
            error=""
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
            id="confirmar-nueva-password"
            name="confirmarPassword"
            type={verConfirmarPassword ? "text" : "password"}
            label="Confirmar nueva contraseña"
            value={confirmarPassword}
            onChange={manejarCambioConfirmarPassword}
            placeholder="Repite tu contraseña"
            maxLength={20}
            error=""
            autoComplete="new-password"
            rightSlot={
              <BotonOjo
                visible={verConfirmarPassword}
                onClick={() => setVerConfirmarPassword((prev) => !prev)}
                etiqueta={verConfirmarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              />
            }
          />

          <Button
            type="submit"
            variant="secondary"
            disabled={cargando}
            className="w-full"
          >
            {cargando
              ? "Actualizando..."
              : "Cambiar contraseña"}
          </Button>

          <button
            type="button"
            onClick={volverPasoAnterior}
            className="text-center text-sm font-bold text-caramel-deep hover:underline"
          >
            ← Volver al código
          </button>
        </form>
      )}

    </div>
  );
}

export default RecoverPassword;