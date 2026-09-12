import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import PanelToolbar from "../../components/admin/PanelToolbar";
import PanelModal from "../../components/admin/PanelModal";
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  eliminarUsuario,
} from "../../lib/api";

const ROLES = ["cliente", "empleado", "administrador"];

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
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  }

  function abrirFormulario() {
    setFormulario(FORMULARIO_VACIO);
    setErrorFormulario("");
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setFormulario(FORMULARIO_VACIO);
    setErrorFormulario("");
  }

  async function manejarEnvioFormulario(e) {
    e.preventDefault();
    setErrorFormulario("");
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
        <form onSubmit={manejarEnvioFormulario} className="grid gap-3 sm:grid-cols-2">
          <input
            name="nombre"
            value={formulario.nombre}
            onChange={manejarCambioFormulario}
            placeholder="Nombre"
            required
            className="rounded-lg border border-[--color-border-soft] px-3 py-2 text-sm focus:border-[--color-strawberry-deep] focus:outline-none sm:col-span-1"
          />
          <input
            name="apellido"
            value={formulario.apellido}
            onChange={manejarCambioFormulario}
            placeholder="Apellido"
            className="rounded-lg border border-[--color-border-soft] px-3 py-2 text-sm focus:border-[--color-strawberry-deep] focus:outline-none sm:col-span-1"
          />
          <input
            name="correo"
            type="email"
            value={formulario.correo}
            onChange={manejarCambioFormulario}
            placeholder="Correo"
            required
            className="rounded-lg border border-[--color-border-soft] px-3 py-2 text-sm focus:border-[--color-strawberry-deep] focus:outline-none sm:col-span-2"
          />
          <input
            name="contrasena"
            type="password"
            value={formulario.contrasena}
            onChange={manejarCambioFormulario}
            placeholder="Contraseña temporal"
            required
            minLength={6}
            className="rounded-lg border border-[--color-border-soft] px-3 py-2 text-sm focus:border-[--color-strawberry-deep] focus:outline-none sm:col-span-1"
          />
          <select
            name="rol"
            value={formulario.rol}
            onChange={manejarCambioFormulario}
            className="rounded-lg border border-[--color-border-soft] px-3 py-2 text-sm focus:border-[--color-strawberry-deep] focus:outline-none sm:col-span-1"
          >
            {ROLES.map((rol) => (
              <option key={rol} value={rol}>
                {rol}
              </option>
            ))}
          </select>

          {errorFormulario && (
            <p className="text-sm text-[--color-strawberry-deep] sm:col-span-2">
              {errorFormulario}
            </p>
          )}

          <div className="flex gap-3 pt-1 sm:col-span-2">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-gradient-to-r from-[#f43f5e] to-[#db2777] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-[#e11d48] hover:to-[#be185d] disabled:opacity-60"
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