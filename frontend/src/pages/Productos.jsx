import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { productos as catalogoLocal } from "../data/productos";
import { useAuth } from "../context/AuthContext";
import {
  obtenerProductos,
  obtenerCarrito,
  agregarAlCarrito as agregarAlCarritoApi,
  actualizarCantidadCarrito,
  eliminarDelCarrito as eliminarDelCarritoApi,
  urlImagenCompleta,
} from "../lib/api";

function numeroAPrecio(numero) {
  return "$" + Number(numero).toLocaleString("es-CO");
}

function conImagenLocal(productoApi) {
  // Prioridad: la imagen que se haya guardado en la base de datos
  // (campo imagen_url, el que se llena desde el panel de administrador,
  // ya sea subiendo un archivo o pegando una ruta/URL a mano).
  // Si el producto no tiene imagen_url, se usa la imagen del catálogo
  // local (data/productos.js) como respaldo, buscando por "slug".
  if (productoApi.imagen_url) {
    return { ...productoApi, imagen: urlImagenCompleta(productoApi.imagen_url) };
  }
  const local = catalogoLocal.find((p) => p.id === productoApi.slug);
  return { ...productoApi, imagen: local?.imagen ?? null };
}

function Productos() {
  const { estaLogueado, token } = useAuth();
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState("");

  const [itemsCarrito, setItemsCarrito] = useState([]);
  const [totalCarrito, setTotalCarrito] = useState(0);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [ultimoAgregado, setUltimoAgregado] = useState(null);

  // ---- Cargar catálogo desde el backend ----
  useEffect(() => {
    obtenerProductos()
      .then((datos) => {
        setProductos(datos.productos.map(conImagenLocal));
      })
      .catch((error) => {
        setErrorProductos(error.message);
      })
      .finally(() => setCargandoProductos(false));
  }, []);

  // ---- Cargar carrito real (solo si hay sesión) ----
  const refrescarCarrito = useCallback(() => {
    if (!estaLogueado) {
      setItemsCarrito([]);
      setTotalCarrito(0);
      return;
    }

    obtenerCarrito(token)
      .then((datos) => {
        setItemsCarrito(datos.items);
        setTotalCarrito(datos.total);
      })
      .catch((error) => console.error(error.message));
  }, [estaLogueado, token]);

  useEffect(() => {
    refrescarCarrito();
  }, [refrescarCarrito]);

  // ---- Acciones del carrito ----
  const agregarAlCarrito = async (producto) => {
    if (!estaLogueado) {
      navigate("/login");
      return;
    }

    try {
      await agregarAlCarritoApi(token, producto.id, 1);
      setUltimoAgregado(producto.id);
      setTimeout(() => setUltimoAgregado(null), 1200);
      refrescarCarrito();
    } catch (error) {
      console.error(error.message);
    }
  };

  const cambiarCantidad = async (itemId, delta) => {
    const item = itemsCarrito.find((i) => i.item_id === itemId);
    if (!item) return;

    const nuevaCantidad = item.cantidad + delta;

    try {
      if (nuevaCantidad <= 0) {
        await eliminarDelCarritoApi(token, itemId);
      } else {
        await actualizarCantidadCarrito(token, itemId, nuevaCantidad);
      }
      refrescarCarrito();
    } catch (error) {
      console.error(error.message);
    }
  };

  const quitarDelCarrito = async (itemId) => {
    try {
      await eliminarDelCarritoApi(token, itemId);
      refrescarCarrito();
    } catch (error) {
      console.error(error.message);
    }
  };

  const totalItems = itemsCarrito.reduce((sum, item) => sum + item.cantidad, 0);

  // FIXED: Completed the function and added missing closing brace
  const enlaceWhatsApp = () => {
    const lineas = itemsCarrito.map(
      (item) =>
        `- ${item.cantidad}x ${item.nombre} (${numeroAPrecio(
          item.precio * item.cantidad
        )})`
    );
    return lineas.join("\n");
  };

  return (
    <div>
      <Header />

      <main className="bg-cream">
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 pb-10 pt-24 text-center sm:px-10">
          <span className="rounded-full bg-strawberry-soft px-4 py-1 text-xs font-extrabold tracking-[0.2em] text-strawberry-deep">
            NUESTROS PRODUCTOS
          </span>
          <h1 className="text-4xl font-semibold">Descubre nuestro maquillaje</h1>
          <p className="text-lg text-choco-soft">
            Tenemos productos para cada estilo y ocasión.
          </p>

          {!estaLogueado && (
            <p className="rounded-2xl border border-caramel-soft bg-caramel-soft/40 px-4 py-2 text-sm font-semibold text-caramel-deep">
              Inicia sesión para agregar productos a tu carrito 💄
            </p>
          )}
        </section>

        {cargandoProductos && (
          <p className="pb-16 text-center text-choco-soft">Cargando catálogo…</p>
        )}

        {errorProductos && (
          <p className="mx-auto max-w-md pb-16 text-center text-sm font-semibold text-strawberry-deep">
            {errorProductos}
          </p>
        )}

        {!cargandoProductos && !errorProductos && (
          <section className="mx-auto grid max-w-[1600px] grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-2 sm:px-10 sm:gap-8 md:grid-cols-3 lg:px-16 lg:gap-10 xl:grid-cols-4 xl:px-24 2xl:px-32">
            {productos.map((producto) => (
              <article
                key={producto.id}
                className="flex flex-col overflow-hidden rounded-3xl border border-border-soft bg-white shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift"
              >
                {producto.imagen && (
                  <div className="h-56 w-full overflow-hidden">
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col items-center gap-2 px-7 py-8 text-center">
                  <h2 className="text-xl font-semibold">{producto.nombre}</h2>
                  <p className="min-h-11 text-sm leading-relaxed text-choco-soft">
                    {producto.descripcion}
                  </p>
                  <strong className="my-1.5 block text-xl text-strawberry-deep">
                    {numeroAPrecio(producto.precio)}
                  </strong>

                  <button
                    onClick={() => agregarAlCarrito(producto)}
                    className={`w-full rounded-full py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 ${
                      ultimoAgregado === producto.id
                        ? "bg-pistachio-deep"
                        : "bg-caramel hover:bg-caramel-deep"
                    }`}
                  >
                    {ultimoAgregado === producto.id ? "✓ Agregado" : "Ordenar"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {/* Carrito flotante */}
      <button
        onClick={() => setCarritoAbierto(true)}
        aria-label="Ver pedido"
        className="fixed bottom-48 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-caramel text-2xl text-white shadow-lift transition-all hover:-translate-y-1 hover:bg-caramel-deep"   
         >
        🛒
        {totalItems > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-strawberry px-1.5 text-xs font-extrabold text-white ring-2 ring-white">
            {totalItems}
          </span>
        )}
      </button>

      {carritoAbierto && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-choco/45 animate-[fadeIn_0.2s_ease]"
          onClick={() => setCarritoAbierto(false)}
        >
          <aside
            className="flex h-full w-full max-w-sm flex-col overflow-y-auto bg-cream p-7 shadow-lift animate-[popIn_0.25s_ease]"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Tu pedido</h2>
              <button
                onClick={() => setCarritoAbierto(false)}
                aria-label="Cerrar pedido"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-caramel-deep shadow-soft"
              >
                ✕
              </button>
            </div>

            {!estaLogueado ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-choco-soft">
                  Inicia sesión para ver y guardar tu carrito.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="rounded-full bg-caramel px-6 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-caramel-deep"
                >
                  Iniciar sesión
                </button>
              </div>
            ) : itemsCarrito.length === 0 ? (
              <p className="py-10 text-center text-choco-soft">
                Todavía no has agregado ningún producto 💋
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-3.5">
                  {itemsCarrito.map((item) => (
                    <li
                      key={item.item_id}
                      className="flex items-center gap-2.5 rounded-2xl border border-border-soft bg-white px-3.5 py-3"
                    >
                      <div className="flex flex-1 flex-col gap-0.5">
                        <strong>{item.nombre}</strong>
                        <span className="text-xs text-choco-soft">
                          {numeroAPrecio(item.precio)} c/u
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => cambiarCantidad(item.item_id, -1)}
                          aria-label={`Quitar una unidad de ${item.nombre}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-border-soft bg-cream-soft text-caramel-deep"
                        >
                          −
                        </button>
                        <span className="min-w-4 text-center">{item.cantidad}</span>
                        <button
                          onClick={() => cambiarCantidad(item.item_id, 1)}
                          aria-label={`Agregar una unidad de ${item.nombre}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-border-soft bg-cream-soft text-caramel-deep"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => quitarDelCarrito(item.item_id)}
                        aria-label={`Quitar ${item.nombre} del pedido`}
                        className="text-choco-soft opacity-70 hover:opacity-100"
                      >
                        🗑
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center justify-between border-t border-border-soft pt-4 text-lg">
                  <span>Total</span>
                  <strong className="text-2xl text-strawberry-deep">
                    {numeroAPrecio(totalCarrito)}
                  </strong>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      <Footer />
    </div>
  );
} 

export default Productos;