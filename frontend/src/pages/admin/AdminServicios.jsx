import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import PanelToolbar from "../../components/admin/PanelToolbar";
import PanelModal from "../../components/admin/PanelModal";
import {
  obtenerServiciosAdmin,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
} from "../../lib/api";

const FORMULARIO_VACIO = { nombre: "", descripcion: "", precio: "" };

const OPCIONES_ESTADO = [
  { value: "todos", etiqueta: "Todos los estados" },
  { value: "disponible", etiqueta: "Disponibles" },
  { value: "no_disponible", etiqueta: "No disponibles" },
];

export default function AdminServicios({
  esAdmin = true,
  abrirCrearInicial = false,
  onConsumirCrearInicial,
}) {
  const { token } = useAuth();

  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function cargarServicios() {
    setCargando(true);
    try {
      const datos = await obtenerServiciosAdmin(token);
      setServicios(datos.servicios);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarServicios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function abrirCrear() {
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
    setErrorFormulario("");
    setMostrarFormulario(true);
  }

  useEffect(() => {
    if (esAdmin && abrirCrearInicial) {
      abrirCrear();
      onConsumirCrearInicial?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirCrearInicial]);

  const serviciosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return servicios.filter((servicio) => {
      const coincideTexto =
        !texto || servicio.nombre.toLowerCase().includes(texto);
      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "disponible" && servicio.disponible) ||
        (filtroEstado === "no_disponible" && !servicio.disponible);
      return coincideTexto && coincideEstado;
    });
  }, [servicios, busqueda, filtroEstado]);

  function manejarCambio(e) {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  }

  function iniciarEdicion(servicio) {
    setEditandoId(servicio.id);
    setFormulario({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precio: servicio.precio,
    });
    setMensaje("");
    setErrorFormulario("");
    setMostrarFormulario(true);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
    setErrorFormulario("");
    setMostrarFormulario(false);
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setMensaje("");
    setErrorFormulario("");
    setEnviando(true);

    try {
      if (editandoId) {
        await actualizarServicio(token, editandoId, formulario);
        setMensaje("Servicio actualizado correctamente");
      } else {
        await crearServicio(token, formulario);
        setMensaje("Servicio creado correctamente");
      }

      cancelarEdicion();
      cargarServicios();
    } catch (err) {
      setErrorFormulario(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function alternarDisponibilidad(servicio) {
    try {
      await actualizarServicio(token, servicio.id, {
        disponible: servicio.disponible ? 0 : 1,
      });
      cargarServicios();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarEliminar(id) {
    if (!window.confirm("¿Eliminar este servicio?")) return;

    try {
      await eliminarServicio(token, id);
      setMensaje("Servicio eliminado");
      cargarServicios();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PanelToolbar
        busqueda={busqueda}
        onCambiarBusqueda={setBusqueda}
        placeholderBusqueda="Buscar servicio por nombre..."
        filtro={filtroEstado}
        onCambiarFiltro={setFiltroEstado}
        opcionesFiltro={OPCIONES_ESTADO}
        textoAccion={esAdmin ? "Agregar servicio" : undefined}
        onAccion={abrirCrear}
      />

      {mensaje && <p className="mb-4 text-sm text-[#047857]">{mensaje}</p>}
      {error && <p className="mb-4 text-sm text-[--color-strawberry-deep]">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-[--color-border-soft] bg-white shadow-[--shadow-soft]">
        {cargando ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">Cargando servicios...</p>
        ) : serviciosFiltrados.length === 0 ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">
            No se encontraron servicios con esos filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#fef3c7] bg-[#fffbeb] text-left text-xs uppercase tracking-wide text-[#92400e]/70">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {serviciosFiltrados.map((servicio) => (
                  <tr
                    key={servicio.id}
                    className="border-b border-[--color-border-soft] last:border-0 hover:bg-[--color-cream]/40"
                  >
                    <td className="px-4 py-3 font-medium text-[--color-choco]">
                      {servicio.nombre}
                    </td>
                    <td className="px-4 py-3 text-[--color-choco-soft]">
                      {Number(servicio.precio) > 0
                        ? `$${Number(servicio.precio).toLocaleString("es-CO")}`
                        : "Sin costo"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          servicio.disponible
                            ? "bg-[#d1fae5] text-[#047857]"
                            : "bg-[--color-cream] text-[--color-choco-soft]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            servicio.disponible ? "bg-[#22c55e]" : "bg-[#9ca3af]"
                          }`}
                        />
                        {servicio.disponible ? "Disponible" : "No disponible"}
                      </span>
                    </td>
                    <td className="space-x-3 px-4 py-3">
                      <button
                        onClick={() => iniciarEdicion(servicio)}
                        className="text-[#0369a1] hover:underline"
                      >
                        Editar
                      </button>
                      {esAdmin && (
                        <>
                          <button
                            onClick={() => alternarDisponibilidad(servicio)}
                            className="text-[#b45309] hover:underline"
                          >
                            {servicio.disponible ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            onClick={() => manejarEliminar(servicio.id)}
                            className="text-[--color-strawberry-deep] hover:underline"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PanelModal
        abierto={esAdmin && mostrarFormulario}
        titulo={editandoId ? "Editar servicio" : "Agregar servicio"}
        subtitulo={
          editandoId
            ? "Actualiza la información del servicio."
            : "Complétalo para ofrecerlo a tus clientes."
        }
        onCerrar={cancelarEdicion}
      >
        <form onSubmit={manejarEnvio} className="grid gap-3 sm:grid-cols-2">
          <input
            name="nombre"
            value={formulario.nombre}
            onChange={manejarCambio}
            placeholder="Nombre"
            required
            className="rounded-lg border border-[--color-border-soft] px-3 py-2 text-sm focus:border-[--color-strawberry-deep] focus:outline-none"
          />
          <input
            name="precio"
            type="number"
            min="0"
            value={formulario.precio}
            onChange={manejarCambio}
            placeholder="Precio (0 si no tiene costo adicional)"
            className="rounded-lg border border-[--color-border-soft] px-3 py-2 text-sm focus:border-[--color-strawberry-deep] focus:outline-none"
          />
          <textarea
            name="descripcion"
            value={formulario.descripcion}
            onChange={manejarCambio}
            placeholder="Descripción"
            required
            rows={3}
            className="rounded-lg border border-[--color-border-soft] px-3 py-2 text-sm focus:border-[--color-strawberry-deep] focus:outline-none sm:col-span-2"
          />

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
              {enviando
                ? "Guardando..."
                : editandoId
                ? "Guardar cambios"
                : "Agregar servicio"}
            </button>
            <button
              type="button"
              onClick={cancelarEdicion}
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