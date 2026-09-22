import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import PanelToolbar from "../../components/admin/PanelToolbar";
import PanelModal from "../../components/admin/PanelModal";
import Input from "../../components/Input";
import Select from "../../components/Select";
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  eliminarUsuario,
} from "../../lib/api";

const ROLES = ["cliente", "empleado", "administrador"];

const OPCIONES_ROL = ROLES.map((rol) => ({
  value: rol,
  label: rol.charAt(0).toUpperCase() + rol.slice(1),
}));

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

// Límites de caracteres para cada campo del formulario "Agregar usuario"
const LIMITES = {
  nombre: 30,
  apellido: 30,
  correo: 60,
  contrasena: 20,
};

// Valida un campo del formulario y devuelve un mensaje de error, o ""
// si el valor es válido (usado tanto en tiempo real como al enviar).
function validarCampoUsuario(name, value) {
  switch (name) {
    case "nombre":
      if (!value.trim()) return "El nombre es obligatorio";
      if (value.trim().length < 2) return "Mínimo 2 caracteres";
      if (value.length > LIMITES.nombre) return `Máximo ${LIMITES.nombre} caracteres`;
      if (!REGEX_SOLO_LETRAS.test(value)) return "Solo se permiten letras";
      return "";

    case "apellido":
      // Este campo es opcional: solo se valida si el admin escribió algo.
      if (!value.trim()) return "";
      if (value.trim().length < 2) return "Mínimo 2 caracteres";
      if (value.length > LIMITES.apellido) return `Máximo ${LIMITES.apellido} caracteres`;
      if (!REGEX_SOLO_LETRAS.test(value)) return "Solo se permiten letras";
      return "";

    case "correo":
      if (!value.trim()) return "El correo es obligatorio";
      if (value.length > LIMITES.correo) return `Máximo ${LIMITES.correo} caracteres`;
      if (!REGEX_CORREO.test(value)) return "Ingresa un correo válido";
      return "";

    case "contrasena":
      if (!value) return "La contraseña temporal es obligatoria";
      if (value.length < 6) return "Mínimo 6 caracteres";
      if (value.length > LIMITES.contrasena) return `Máximo ${LIMITES.contrasena} caracteres`;
      return "";

    default:
      return "";
  }
}

// Mensaje verde que se muestra cuando el campo ya es válido.
const MENSAJES_EXITO = {
  nombre: "Nombre correcto",
  apellido: "Apellido correcto",
  correo: "Correo correcto",
  contrasena: "Contraseña válida",
};

// Orden en el que se muestran las 4 líneas de estado debajo del formulario:
// nombre y correo a la izquierda, apellido y contraseña a la derecha.
const ESTADO_IZQUIERDA = ["nombre", "correo"];
const ESTADO_DERECHA = ["apellido", "contrasena"];

// Una línea del resumen de validación: flecha verde + texto cuando el
// campo ya es válido, o un punto gris neutro mientras tanto (el error
// puntual de cada campo se sigue mostrando debajo de su propia casilla).
function LineaEstadoCampo({ campo, formulario, erroresCampos }) {
  const valor = formulario[campo];
  const esValido = !erroresCampos[campo] && Boolean(valor);
  const etiquetas = {
    nombre: "Nombre",
    apellido: "Apellido",
    correo: "Correo",
    contrasena: "Contraseña",
  };

  return (
    <p
      className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
        esValido ? "text-[#059669]" : "text-[--color-choco-soft]/50"
      }`}
    >
      <span aria-hidden="true">{esValido ? "➜" : "○"}</span>
      {esValido ? MENSAJES_EXITO[campo] : etiquetas[campo]}
    </p>
  );
}

// Ícono de ojo (abierto / tachado) para mostrar u ocultar la contraseña.
// Mismo patrón que ya usa RegisterForm.jsx / Login.jsx.
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

const OPCIONES_ESTADO = [
  { value: "todos", etiqueta: "Todos los estados" },
  { value: "activo", etiqueta: "Activos" },
  { value: "inactivo", etiqueta: "Inactivos" },
];

const FORMULARIO_VACIO = {
  nombre: "",
  apellido: "",
  correo: "",
  contrasena: "",
  rol: "cliente",
};

export default function AdminUsuarios({
  esAdmin = true,
  abrirCrearInicial = false,
  onConsumirCrearInicial,
}) {
  const { token, usuario: usuarioActual } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [erroresCampos, setErroresCampos] = useState({});
  const [verContrasena, setVerContrasena] = useState(false);

  async function cargarUsuarios() {
    setCargando(true);
    try {
      const datos = await obtenerUsuarios(token);
      setUsuarios(datos.usuarios);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (esAdmin && abrirCrearInicial) {
      abrirFormulario();
      onConsumirCrearInicial?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirCrearInicial]);

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return usuarios.filter((usuario) => {
      const coincideTexto =
        !texto ||
        `${usuario.nombre || ""} ${usuario.apellido || ""}`
          .toLowerCase()
          .includes(texto) ||
        usuario.correo.toLowerCase().includes(texto);
      const coincideEstado =
        filtroEstado === "todos" || usuario.estado === filtroEstado;
      return coincideTexto && coincideEstado;
    });
  }, [usuarios, busqueda, filtroEstado]);

  function manejarCambioFormulario(e) {
    const { name, value } = e.target;

    // Limita cuánto se puede escribir en cada campo (nombre, apellido,
    // correo, contraseña) aunque el usuario intente pegar texto más largo.
    let valorLimpio =
      LIMITES[name] != null ? value.slice(0, LIMITES[name]) : value;

    // Mientras escribe nombre/apellido, quita cualquier carácter que no
    // sea letra o espacio (números, símbolos, etc. no se dejan ni teclear).
    if (name === "nombre" || name === "apellido") {
      valorLimpio = valorLimpio.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "");
    }

    const nuevoFormulario = { ...formulario, [name]: valorLimpio };
    setFormulario(nuevoFormulario);

    let mensajeError = validarCampoUsuario(name, valorLimpio);

    // El correo puede tener un formato perfectamente válido y aun así ya
    // estar registrado. Como el panel ya tiene la lista completa de
    // usuarios cargada en memoria (usuarios), la comparamos aquí mismo
    // en vez de esperar a que el backend lo rechace al enviar.
    if (name === "correo" && !mensajeError) {
      const correoNormalizado = valorLimpio.trim().toLowerCase();
      const yaExiste = usuarios.some(
        (u) => u.correo.trim().toLowerCase() === correoNormalizado
      );
      if (yaExiste) mensajeError = "Este correo ya está registrado";
    }

    setErroresCampos({
      ...erroresCampos,
      [name]: mensajeError,
    });
  }

  function abrirFormulario() {
    setFormulario(FORMULARIO_VACIO);
    setErrorFormulario("");
    setErroresCampos({});
    setVerContrasena(false);
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setFormulario(FORMULARIO_VACIO);
    setErrorFormulario("");
    setErroresCampos({});
    setVerContrasena(false);
  }

  async function manejarEnvioFormulario(e) {
    e.preventDefault();
    setErrorFormulario("");

    // Revalida todos los campos justo antes de enviar, por si el usuario
    // no llegó a "tocar" alguno (por ejemplo, dejó el apellido vacío
    // después de haber escrito algo y borrarlo).
    const nuevosErrores = {};
    ["nombre", "apellido", "correo", "contrasena"].forEach((campo) => {
      const mensaje = validarCampoUsuario(campo, formulario[campo]);
      if (mensaje) nuevosErrores[campo] = mensaje;
    });

    if (!nuevosErrores.correo) {
      const correoNormalizado = formulario.correo.trim().toLowerCase();
      const yaExiste = usuarios.some(
        (u) => u.correo.trim().toLowerCase() === correoNormalizado
      );
      if (yaExiste) nuevosErrores.correo = "Este correo ya está registrado";
    }

    setErroresCampos(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      setErrorFormulario("Revisa los campos marcados en rojo antes de continuar");
      return;
    }

    setEnviando(true);
    try {
      await crearUsuario(token, formulario);
      setMensaje("Usuario creado correctamente");
      cerrarFormulario();
      cargarUsuarios();
    } catch (err) {
      setErrorFormulario(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function manejarCambioRol(id, nuevoRol) {
    setMensaje("");
    setError("");
    try {
      await actualizarUsuario(token, id, { rol: nuevoRol });
      setMensaje("Rol actualizado correctamente");
      cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarCambioEstado(usuario) {
    setMensaje("");
    setError("");
    const nuevoEstado = usuario.estado === "activo" ? "inactivo" : "activo";
    try {
      await cambiarEstadoUsuario(token, usuario.id, nuevoEstado);
      setMensaje(`Usuario marcado como ${nuevoEstado}`);
      cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarEliminar(id) {
    if (
      !window.confirm(
        "¿Eliminar este usuario permanentemente? Se recomienda usar 'Desactivar' en su lugar."
      )
    ) {
      return;
    }

    setMensaje("");
    setError("");
    try {
      await eliminarUsuario(token, id);
      setMensaje("Usuario eliminado");
      cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PanelToolbar
        busqueda={busqueda}
        onCambiarBusqueda={setBusqueda}
        placeholderBusqueda="Buscar por nombre o correo..."
        filtro={filtroEstado}
        onCambiarFiltro={setFiltroEstado}
        opcionesFiltro={OPCIONES_ESTADO}
        textoAccion={esAdmin ? "Agregar usuario" : undefined}
        onAccion={esAdmin ? abrirFormulario : undefined}
      />

      {mensaje && <p className="mb-4 text-sm text-[#047857]">{mensaje}</p>}
      {error && <p className="mb-4 text-sm text-[--color-strawberry-deep]">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-[--color-border-soft] bg-white shadow-[--shadow-soft]">
        {cargando ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">Cargando usuarios...</p>
        ) : usuariosFiltrados.length === 0 ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">
            No se encontraron usuarios con esos filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0f2fe] bg-[#f0f9ff] text-left text-xs uppercase tracking-wide text-[#075985]/70">
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  {esAdmin && <th className="px-4 py-3">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => {
                  const esUsuarioActual = usuario.id === usuarioActual?.id;

                  return (
                    <tr
                      key={usuario.id}
                      className="border-b border-[--color-border-soft] last:border-0 hover:bg-[--color-cream]/40"
                    >
                      <td className="px-4 py-3 font-medium text-[--color-choco]">
                        {usuario.nombre
                          ? `${usuario.nombre} ${usuario.apellido || ""}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-[--color-choco-soft]">
                        {usuario.correo}
                      </td>
                      <td className="px-4 py-3">
                        {esAdmin ? (
                          <select
                            value={usuario.rol}
                            disabled={esUsuarioActual}
                            onChange={(e) =>
                              manejarCambioRol(usuario.id, e.target.value)
                            }
                            className="rounded border border-[--color-border-soft] px-2 py-1 text-sm disabled:bg-[--color-cream]"
                          >
                            {ROLES.map((rol) => (
                              <option key={rol} value={rol}>
                                {rol}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="capitalize">{usuario.rol}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            usuario.estado === "activo"
                              ? "bg-[#d1fae5] text-[#047857]"
                              : "bg-[--color-cream] text-[--color-choco-soft]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              usuario.estado === "activo" ? "bg-[#22c55e]" : "bg-[#9ca3af]"
                            }`}
                          />
                          {usuario.estado === "activo" ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      {esAdmin && (
                        <td className="space-x-3 px-4 py-3">
                          <button
                            onClick={() => manejarCambioEstado(usuario)}
                            disabled={esUsuarioActual}
                            className="text-[#b45309] hover:underline disabled:text-[--color-choco-soft]/40"
                          >
                            {usuario.estado === "activo" ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            onClick={() => manejarEliminar(usuario.id)}
                            disabled={esUsuarioActual}
                            className="text-[--color-strawberry-deep] hover:underline disabled:text-[--color-choco-soft]/40"
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PanelModal
        abierto={esAdmin && mostrarFormulario}
        titulo="Agregar usuario"
        subtitulo="Crea una cuenta manualmente y asígnale un rol."
        onCerrar={cerrarFormulario}
      >
        <form onSubmit={manejarEnvioFormulario} noValidate className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <Input
              id="admin-usr-nombre"
              name="nombre"
              value={formulario.nombre}
              onChange={manejarCambioFormulario}
              placeholder="Nombre"
              maxLength={LIMITES.nombre}
              error={erroresCampos.nombre}
            />
          </div>

          <div className="sm:col-span-1">
            <Input
              id="admin-usr-apellido"
              name="apellido"
              value={formulario.apellido}
              onChange={manejarCambioFormulario}
              placeholder="Apellido"
              maxLength={LIMITES.apellido}
              error={erroresCampos.apellido}
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              id="admin-usr-correo"
              name="correo"
              type="email"
              value={formulario.correo}
              onChange={manejarCambioFormulario}
              placeholder="Correo"
              maxLength={LIMITES.correo}
              error={erroresCampos.correo}
            />
          </div>

          <div className="sm:col-span-1">
            <Input
              id="admin-usr-contrasena"
              name="contrasena"
              type={verContrasena ? "text" : "password"}
              value={formulario.contrasena}
              onChange={manejarCambioFormulario}
              placeholder="Contraseña temporal"
              maxLength={LIMITES.contrasena}
              error={erroresCampos.contrasena}
              rightSlot={
                <BotonOjo
                  visible={verContrasena}
                  onClick={() => setVerContrasena((prev) => !prev)}
                  etiqueta={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                />
              }
            />
          </div>

          <div className="sm:col-span-1">
            <Select
              id="admin-usr-rol"
              name="rol"
              value={formulario.rol}
              onChange={manejarCambioFormulario}
              options={OPCIONES_ROL}
            />
          </div>

          {/* Resumen de validación: 2 líneas a la izquierda, 2 a la derecha */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg bg-[--color-cream]/40 px-3 py-2 sm:col-span-2">
            <div className="flex flex-col gap-1">
              {ESTADO_IZQUIERDA.map((campo) => (
                <LineaEstadoCampo
                  key={campo}
                  campo={campo}
                  formulario={formulario}
                  erroresCampos={erroresCampos}
                />
              ))}
            </div>
            <div className="flex flex-col gap-1">
              {ESTADO_DERECHA.map((campo) => (
                <LineaEstadoCampo
                  key={campo}
                  campo={campo}
                  formulario={formulario}
                  erroresCampos={erroresCampos}
                />
              ))}
            </div>
          </div>

          {errorFormulario && (
            <p className="text-sm font-semibold text-[--color-strawberry-deep] sm:col-span-2">
              {errorFormulario}
            </p>
          )}

          <div className="flex gap-3 pt-1 sm:col-span-2">
            <button
              type="submit"
              disabled={
                enviando ||
                !formulario.nombre ||
                !formulario.correo ||
                !formulario.contrasena ||
                Boolean(erroresCampos.nombre) ||
                Boolean(erroresCampos.apellido) ||
                Boolean(erroresCampos.correo) ||
                Boolean(erroresCampos.contrasena)
              }
              className="rounded-lg bg-gradient-to-r from-[#f43f5e] to-[#db2777] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-[#e11d48] hover:to-[#be185d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? "Creando..." : "Crear usuario"}
            </button>
            <button
              type="button"
              onClick={cerrarFormulario}
              className="rounded-lg border border-[--color-border-soft] px-4 py-2 text-sm hover:bg-[--color-cream]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </PanelModal>
    </div>
  );
}