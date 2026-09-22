// Cliente centralizado para hablar con el backend de Cherry Beauty.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Petición genérica con manejo de token JSON y captura de errores.
 */
async function peticion(ruta, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error(
      "No se pudo conectar con el servidor. ¿Está corriendo el backend (npm start)?"
    );
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    let mensaje = datos.mensaje;

    // FastAPI no manda "mensaje": manda "detail", como string o como lista
    // de errores de validación (cada uno con su "msg" y su "loc").
    if (!mensaje && datos.detail) {
      if (typeof datos.detail === "string") {
        mensaje = datos.detail;
      } else if (Array.isArray(datos.detail)) {
        mensaje = datos.detail
          .map((d) => {
            const campo = Array.isArray(d.loc) ? d.loc.at(-1) : null;
            return campo ? `${campo}: ${d.msg}` : d.msg;
          })
          .join(" | ");
      }
    }

    throw new Error(mensaje || "Ocurrió un error inesperado");
  }

  return datos;
}

// ===================== Autenticación / Perfil =====================

export function registrarUsuario(datos) {
  return peticion("/registro", {
    method: "POST",
    body: datos,
  });
}

export function iniciarSesion(datos) {
  return peticion("/login", {
    method: "POST",
    body: datos,
  });
}

export function obtenerPerfil(token) {
  return peticion("/perfil", { token });
}

export function obtenerPerfilUsuario(token) {
  return obtenerPerfil(token);
}

// ===================== Recuperación de contraseña =====================

// 1. Solicitar código de recuperación
export function solicitarRecuperacion(correo) {
  return peticion("/recuperar-password", {
    method: "POST",
    body: { correo },
  });
}

// 2. Verificar código de 6 dígitos
export function verificarCodigoRecuperacion({ correo, codigo }) {
  return peticion("/verificar-codigo", {
    method: "POST",
    body: { correo, codigo },
  });
}

// 3. Cambiar contraseña usando el código
export function cambiarPasswordRecuperacion({
  correo,
  codigo,
  nuevaPassword,
}) {
  return peticion("/cambiar-password", {
    method: "POST",
    body: {
      correo,
      codigo,
      nuevaPassword,
    },
  });
}

// Alias de compatibilidad
export function restablecerPassword(datos) {
  return cambiarPasswordRecuperacion(datos);
}

// ===================== Productos (público) =====================

export function obtenerProductos() {
  return peticion("/productos");
}

export function obtenerProductoPorId(id) {
  return peticion(`/productos/${id}`);
}

// ===================== Productos (administrador) =====================

export function obtenerProductosAdmin(token) {
  return peticion("/productos/admin/todos", { token });
}

export function crearProducto(token, datos) {
  return peticion("/productos", { method: "POST", token, body: datos });
}

export function actualizarProducto(token, id, datos) {
  return peticion(`/productos/${id}`, { method: "PUT", token, body: datos });
}

export function eliminarProducto(token, id) {
  return peticion(`/productos/${id}`, { method: "DELETE", token });
}

// Sube el archivo de imagen elegido en el input "Choose file" del panel
// de administrador. A diferencia del resto de funciones, esta manda
// FormData (multipart), no JSON, así que no usa el helper "peticion".
export async function subirImagenProducto(token, archivo) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}/productos/subir-imagen`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch (error) {
    throw new Error(
      "No se pudo conectar con el servidor. ¿Está corriendo el backend?"
    );
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.detail || "No se pudo subir la imagen");
  }

  return datos; // { imagen_url: "/uploads/productos/xxxx.jpg" }
}

// La URL que guarda la base de datos para una imagen subida desde el panel
// es relativa al backend (/uploads/...), así que hay que anteponerle la URL
// del backend para poder usarla en un <img src>. Las rutas que empiecen con
// /productos/ (imágenes que tú mismo pongas en frontend/public/productos/)
// o las URLs externas (http...) se dejan tal cual.
export function urlImagenCompleta(imagenUrl) {
  if (!imagenUrl) return null;
  if (imagenUrl.startsWith("http")) return imagenUrl;
  if (!imagenUrl.startsWith("/uploads/")) return imagenUrl;
  const baseBackend = API_URL.replace(/\/api\/?$/, "");
  return `${baseBackend}${imagenUrl}`;
}

// ===================== Servicios (público) =====================

export function obtenerServicios() {
  return peticion("/servicios");
}

// ===================== Servicios (administrador) =====================

export function obtenerServiciosAdmin(token) {
  return peticion("/servicios/admin/todos", { token });
}

export function crearServicio(token, datos) {
  return peticion("/servicios", { method: "POST", token, body: datos });
}

export function actualizarServicio(token, id, datos) {
  return peticion(`/servicios/${id}`, { method: "PUT", token, body: datos });
}

export function eliminarServicio(token, id) {
  return peticion(`/servicios/${id}`, { method: "DELETE", token });
}

// ===================== Usuarios (administrador) =====================

export function obtenerUsuarios(token) {
  return peticion("/usuarios", { token });
}

export function crearUsuario(token, datos) {
  return peticion("/usuarios", { method: "POST", token, body: datos });
}

export function obtenerUsuarioPorId(token, id) {
  return peticion(`/usuarios/${id}`, { token });
}

export function actualizarUsuario(token, id, datos) {
  return peticion(`/usuarios/${id}`, { method: "PUT", token, body: datos });
}

export function cambiarEstadoUsuario(token, id, estado) {
  return peticion(`/usuarios/${id}/estado`, {
    method: "PATCH",
    token,
    body: { estado },
  });
}

export function eliminarUsuario(token, id) {
  return peticion(`/usuarios/${id}`, { method: "DELETE", token });
}

// ===================== Carrito =====================

export function obtenerCarrito(token) {
  return peticion("/carrito", { token });
}

export function agregarAlCarrito(token, productoId, cantidad = 1) {
  return peticion("/carrito", {
    method: "POST",
    token,
    body: { productoId, cantidad },
  });
}

export function actualizarCantidadCarrito(token, itemId, cantidad) {
  return peticion(`/carrito/${itemId}`, {
    method: "PUT",
    token,
    body: { cantidad },
  });
}

export function eliminarDelCarrito(token, itemId) {
  return peticion(`/carrito/${itemId}`, { method: "DELETE", token });
}

export function vaciarCarrito(token) {
  return peticion("/carrito", { method: "DELETE", token });
}

// ===================== Pedidos =====================

export function crearPedidoDesdeCarrito(token, metodoPago = "efectivo", servicioIds = []) {
  return peticion("/pedidos", {
    method: "POST",
    token,
    body: { metodo_pago: metodoPago, servicios: servicioIds },
  });
}

export function crearPedidoManual(token, datos) {
  return peticion("/pedidos/manual", { method: "POST", token, body: datos });
}

export function misPedidos(token) {
  return peticion("/pedidos/mios", { token });
}

export function listarTodosLosPedidos(token) {
  return peticion("/pedidos", { token });
}

export function obtenerDetallePedido(token, id) {
  return peticion(`/pedidos/${id}`, { token });
}

export function actualizarEstadoPedido(token, id, estado) {
  return peticion(`/pedidos/${id}/estado`, {
    method: "PATCH",
    token,
    body: { estado },
  });
}

// ===================== Ventas (Quinto Avance) =====================

export function registrarVenta(token, datos) {
  return peticion("/ventas", { method: "POST", token, body: datos });
}

export function listarVentas(token, filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.fecha_desde) params.set("fecha_desde", filtros.fecha_desde);
  if (filtros.fecha_hasta) params.set("fecha_hasta", filtros.fecha_hasta);
  if (filtros.cliente) params.set("cliente", filtros.cliente);
  if (filtros.producto) params.set("producto", filtros.producto);
  if (filtros.servicio) params.set("servicio", filtros.servicio);
  if (filtros.estado) params.set("estado", filtros.estado);
  if (filtros.valor_min) params.set("valor_min", filtros.valor_min);
  if (filtros.valor_max) params.set("valor_max", filtros.valor_max);
  const qs = params.toString();
  return peticion(`/ventas${qs ? `?${qs}` : ""}`, { token });
}

export function misVentas(token) {
  return peticion("/ventas/mias", { token });
}

export function obtenerVenta(token, id) {
  return peticion(`/ventas/${id}`, { token });
}

export function cambiarEstadoVenta(token, id, estado) {
  return peticion(`/ventas/${id}/estado`, {
    method: "PATCH",
    token,
    body: { estado },
  });
}

// ===================== Facturas (Quinto Avance) =====================

export function emitirFactura(token, ventaId) {
  return peticion(`/facturas/emitir?venta_id=${ventaId}`, {
    method: "POST",
    token,
  });
}

export function listarFacturas(token, filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.numero) params.set("numero", filtros.numero);
  if (filtros.cliente) params.set("cliente", filtros.cliente);
  if (filtros.fecha_desde) params.set("fecha_desde", filtros.fecha_desde);
  if (filtros.fecha_hasta) params.set("fecha_hasta", filtros.fecha_hasta);
  const qs = params.toString();
  return peticion(`/facturas${qs ? `?${qs}` : ""}`, { token });
}

export function misFacturas(token) {
  return peticion("/facturas/mias", { token });
}

export function obtenerFactura(token, id) {
  return peticion(`/facturas/${id}`, { token });
}

export function descargarFacturaPDF(token, id) {
  return fetch(`${API_URL}/facturas/${id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function anularFactura(token, id) {
  return peticion(`/facturas/${id}/estado?estado=anulada`, {
    method: "PATCH",
    token,
  });
}

// ===================== Reportes (Quinto Avance) =====================

export function reporteVentasDiarias(token, fecha) {
  return peticion(`/reportes/ventas-diarias?fecha=${fecha}`, { token });
}

export function descargarReportePDF(token, fecha) {
  return fetch(`${API_URL}/reportes/ventas-diarias/pdf?fecha=${fecha}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function descargarReporteExcel(token, fecha) {
  return fetch(`${API_URL}/reportes/ventas-diarias/excel?fecha=${fecha}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ===================== PQR (Quinto Avance) =====================

export function crearPQR(token, datos) {
  return peticion("/pqr", { method: "POST", token, body: datos });
}

export function misPQR(token) {
  return peticion("/pqr/mias", { token });
}

export function listarPQR(token, filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.estado) params.set("estado", filtros.estado);
  if (filtros.tipo) params.set("tipo", filtros.tipo);
  const qs = params.toString();
  return peticion(`/pqr${qs ? `?${qs}` : ""}`, { token });
}

export function obtenerPQR(token, id) {
  return peticion(`/pqr/${id}`, { token });
}

export function cambiarEstadoPQR(token, id, estado) {
  return peticion(`/pqr/${id}/estado`, {
    method: "PATCH",
    token,
    body: { estado },
  });
}

export function responderPQR(token, id, respuesta, estado = "respondida") {
  return peticion(`/pqr/${id}/responder`, {
    method: "PATCH",
    token,
    body: { respuesta, estado },
  });
}

// ===================== Chatbot (Quinto Avance) =====================

export function enviarMensajeChatbot(mensaje, conversacionId = null) {
  return peticion("/chatbot/mensaje", {
    method: "POST",
    body: { mensaje, conversacion_id: conversacionId },
  });
}

// ===================== Estadísticas (Quinto Avance) =====================

export function estadisticasAdmin(token, filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.fecha_desde) params.set("fecha_desde", filtros.fecha_desde);
  if (filtros.fecha_hasta) params.set("fecha_hasta", filtros.fecha_hasta);
  if (filtros.agrupacion) params.set("agrupacion", filtros.agrupacion);
  const qs = params.toString();
  return peticion(`/estadisticas/admin${qs ? `?${qs}` : ""}`, { token });
}

export function estadisticasEmpleado(token, filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.fecha_desde) params.set("fecha_desde", filtros.fecha_desde);
  if (filtros.fecha_hasta) params.set("fecha_hasta", filtros.fecha_hasta);
  if (filtros.agrupacion) params.set("agrupacion", filtros.agrupacion);
  const qs = params.toString();
  return peticion(`/estadisticas/empleado${qs ? `?${qs}` : ""}`, { token });
}

export function estadisticasCliente(token) {
  return peticion("/estadisticas/cliente", { token });
}

// Utilidad para descargar un blob (PDF/Excel) desde el navegador
export async function descargarBlob(respuesta, nombreArchivo) {
  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}));
    throw new Error(datos.detail || "No se pudo descargar el archivo");
  }
  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}