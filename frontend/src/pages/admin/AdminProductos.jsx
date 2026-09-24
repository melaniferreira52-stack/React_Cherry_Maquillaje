import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import PanelToolbar from "../../components/Admin/PanelToolbar";
import PanelModal from "../../components/Admin/PanelModal";
import {
  obtenerProductosAdmin,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  subirImagenProducto,
  urlImagenCompleta,
} from "../../lib/api";

const FORMULARIO_VACIO = {
  slug: "",
  nombre: "",
  descripcion: "",
  precio: "",
  imagen_url: "",
};

const OPCIONES_ESTADO = [
  { value: "todos", etiqueta: "Todos los estados" },
  { value: "disponible", etiqueta: "Disponibles" },
  { value: "no_disponible", etiqueta: "No disponibles" },
];

export default function AdminProductos({
  esAdmin = true,
  abrirCrearInicial = false,
  onConsumirCrearInicial,
}) {
  const { token } = useAuth();

  const [productos, setProductos] = useState([]);
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
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [previewImagen, setPreviewImagen] = useState("");

  async function cargarProductos() {
    setCargando(true);
    try {
      const datos = await obtenerProductosAdmin(token);
      setProductos(datos.productos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function abrirCrear() {
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
    setPreviewImagen("");
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

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter((producto) => {
      const coincideTexto =
        !texto || producto.nombre.toLowerCase().includes(texto);
      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "disponible" && producto.disponible) ||
        (filtroEstado === "no_disponible" && !producto.disponible);
      return coincideTexto && coincideEstado;
    });
  }, [productos, busqueda, filtroEstado]);

  function manejarCambio(e) {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  }

  function iniciarEdicion(producto) {
    setEditandoId(producto.id);
    setFormulario({
      slug: producto.slug,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagen_url: producto.imagen_url || "",
    });
    setPreviewImagen(urlImagenCompleta(producto.imagen_url) || "");
    setMensaje("");
    setErrorFormulario("");
    setMostrarFormulario(true);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
    setPreviewImagen("");
    setErrorFormulario("");
    setMostrarFormulario(false);
  }

  async function manejarArchivoImagen(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setSubiendoImagen(true);
    setErrorFormulario("");

    try {
      const resultado = await subirImagenProducto(token, archivo);
      setFormulario((actual) => ({ ...actual, imagen_url: resultado.imagen_url }));
      setPreviewImagen(urlImagenCompleta(resultado.imagen_url));
    } catch (err) {
      setErrorFormulario(err.message);
    } finally {
      setSubiendoImagen(false);
    }
  }

  function quitarImagen() {
    setFormulario((actual) => ({ ...actual, imagen_url: "" }));
    setPreviewImagen("");
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setMensaje("");
    setErrorFormulario("");

    if (subiendoImagen) {
      setErrorFormulario("Espera a que la imagen termine de subir.");
      return;
    }

    setEnviando(true);

    const datosAEnviar = {
      ...formulario,
      precio: Number(formulario.precio),
      imagen_url: formulario.imagen_url.trim() ? formulario.imagen_url.trim() : null,
    };

    try {
      if (editandoId) {
        await actualizarProducto(token, editandoId, datosAEnviar);
        setMensaje("Producto actualizado correctamente");
      } else {
        await crearProducto(token, datosAEnviar);
        setMensaje("Producto creado correctamente");
      }

      cancelarEdicion();
      cargarProductos();
    } catch (err) {
      setErrorFormulario(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function alternarDisponibilidad(producto) {
    try {
      await actualizarProducto(token, producto.id, {
        disponible: producto.disponible ? 0 : 1,
      });
      cargarProductos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarEliminar(id) {
    if (!window.confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await eliminarProducto(token, id);
      setMensaje("Producto eliminado");
      cargarProductos();
    } catch (err) {
      // Si ya tiene pedidos asociados, el backend devuelve un mensaje claro
      setError(err.message);
    }
  }

  return (
    <div>
      <PanelToolbar
        busqueda={busqueda}
        onCambiarBusqueda={setBusqueda}
        placeholderBusqueda="Buscar producto por nombre..."
        filtro={filtroEstado}
        onCambiarFiltro={setFiltroEstado}
        opcionesFiltro={OPCIONES_ESTADO}
        textoAccion={esAdmin ? "Agregar producto" : undefined}
        onAccion={abrirCrear}
      />

      {mensaje && <p className="mb-4 text-sm text-[#047857]">{mensaje}</p>}
      {error && <p className="mb-4 text-sm text-[--color-strawberry-deep]">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-[--color-border-soft] bg-white shadow-[--shadow-soft]">
        {cargando ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">Cargando productos...</p>
        ) : productosFiltrados.length === 0 ? (
          <p className="p-6 text-sm text-[--color-choco-soft]">
            No se encontraron productos con esos filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#ffe4e6] bg-[#fff1f2] text-left text-xs uppercase tracking-wide text-[#9f1239]/70">
                  <th className="px-4 py-3">Foto</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((producto) => (
                  <tr
                    key={producto.id}
                    className="border-b border-[--color-border-soft] last:border-0 hover:bg-[--color-cream]/40"
                  >
                    <td className="px-4 py-3">
                      {producto.imagen_url ? (
                        <img
                          src={urlImagenCompleta(producto.imagen_url)}
                          alt={producto.nombre}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-[--color-cream]" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-[--color-choco]">
                      {producto.nombre}
                    </td>
                    <td className="px-4 py-3 text-[--color-choco-soft]">
                      ${Number(producto.precio).toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          producto.disponible
                            ? "bg-[#d1fae5] text-[#047857]"
                            : "bg-[--color-cream] text-[--color-choco-soft]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            producto.disponible ? "bg-[#22c55e]" : "bg-[#9ca3af]"
                          }`}
                        />
                        {producto.disponible ? "Disponible" : "No disponible"}
                      </span>
                    </td>
                    <td className="space-x-3 px-4 py-3">
                      <button
                        onClick={() => iniciarEdicion(producto)}
                        className="text-[#0369a1] hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => alternarDisponibilidad(producto)}
                        className="text-[#b45309] hover:underline"
                      >
                        {producto.disponible ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => manejarEliminar(producto.id)}
                        className="text-[--color-strawberry-deep] hover:underline"
                      >
                        Eliminar
                      </button>
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
        titulo={editandoId ? "Editar producto" : "Agregar producto"}
        subtitulo={
          editandoId
            ? "Actualiza la información del producto."
            : "Complétalo para publicarlo en la tienda."
        }
        onCerrar={cancelarEdicion}
      >
        <form onSubmit={manejarEnvio} className="grid gap-3 sm:grid-cols-2">
          <input
            name="slug"
            value={formulario.slug}
            onChange={manejarCambio}
            placeholder="slug (ej: chocolate)"
            required
            disabled={Boolean(editandoId)}
            className="rounded-lg border border-[--color-border-soft] px-3 py-2 text-sm focus:border-[--color-strawberry-deep] focus:outline-none disabled:bg-[--color-cream]"
          />
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
            placeholder="Precio"
            required
            className="rounded-lg border border-[--color-border-soft] px-3 py-2 text-sm focus:border-[--color-strawberry-deep] focus:outline-none"
          />
          <input
            name="imagen_url"
            value={formulario.imagen_url}
            readOnly
            hidden
          />

          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="text-xs font-semibold text-[--color-choco-soft]">
              Imagen del producto
            </label>

            <div className="flex items-center gap-4">
              {previewImagen ? (
                <img
                  src={previewImagen}
                  alt="Vista previa"
                  className="h-20 w-20 rounded-lg border border-[--color-border-soft] object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-[--color-border-soft] text-xs text-[--color-choco-soft]">
                  Sin foto
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="w-fit cursor-pointer rounded-lg border border-[--color-border-soft] px-3 py-2 text-sm hover:bg-[--color-cream]">
                  {subiendoImagen ? "Subiendo..." : "Choose file"}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={manejarArchivoImagen}
                    disabled={subiendoImagen}
                    className="hidden"
                  />
                </label>

                {previewImagen && !subiendoImagen && (
                  <button
                    type="button"
                    onClick={quitarImagen}
                    className="text-left text-xs text-[--color-strawberry-deep] hover:underline"
                  >
                    Quitar imagen
                  </button>
                )}
              </div>
            </div>
          </div>

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
              disabled={enviando || subiendoImagen}
              className="rounded-lg bg-gradient-to-r from-[#f43f5e] to-[#db2777] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-[#e11d48] hover:to-[#be185d] disabled:opacity-60"
            >
              {enviando
                ? "Guardando..."
                : editandoId
                ? "Guardar cambios"
                : "Agregar producto"}
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