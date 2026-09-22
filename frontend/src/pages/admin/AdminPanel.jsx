import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/Admin/DashboardLayout";
import AdminResumen from "./AdminResumen";
import AdminPedidos from "./AdminPedidos";
import AdminProductos from "./AdminProductos";
import AdminServicios from "./AdminServicios";
import AdminUsuarios from "./AdminUsuarios";
import AdminVentas from "./AdminVentas";
import AdminFacturas from "./AdminFacturas";
import AdminReportes from "./AdminReportes";
import AdminPQR from "./AdminPQR";
import AdminDashboard from "./AdminDashboard";

const SECCIONES = [
  { id: "resumen", etiqueta: "Resumen", icono: "🏠" },
  { id: "usuarios", etiqueta: "Usuarios", icono: "👤" },
  { id: "productos", etiqueta: "Productos", icono: "🍦" },
  { id: "servicios", etiqueta: "Servicios", icono: "🎉" },
  { id: "pedidos", etiqueta: "Pedidos", icono: "🧾" },
  { id: "ventas", etiqueta: "Ventas", icono: "💰" },
  { id: "facturas", etiqueta: "Facturas", icono: "📄" },
  { id: "reportes", etiqueta: "Reportes", icono: "📊" },
  { id: "pqr", etiqueta: "PQR", icono: "📥" },
];

export default function AdminPanel() {
  const { usuario, cerrarSesion } = useAuth();
  const [seccionActiva, setSeccionActiva] = useState("resumen");
  const [crearAlEntrar, setCrearAlEntrar] = useState(null);

  function irACrear(seccionId) {
    setSeccionActiva(seccionId);
    setCrearAlEntrar(seccionId);
  }

  return (
    <DashboardLayout
      rolEtiqueta="Administrador"
      nombreUsuario={usuario?.nombre || usuario?.correo}
      secciones={SECCIONES}
      seccionActiva={seccionActiva}
      onCambiarSeccion={setSeccionActiva}
      breadcrumb="Cherry Beauty"
      tituloPagina={SECCIONES.find((s) => s.id === seccionActiva)?.etiqueta}
      onCerrarSesion={cerrarSesion}
    >
      {seccionActiva === "resumen" && <AdminDashboard onAccionRapida={irACrear} />}
      {seccionActiva === "usuarios" && (
        <AdminUsuarios
          abrirCrearInicial={crearAlEntrar === "usuarios"}
          onConsumirCrearInicial={() => setCrearAlEntrar(null)}
        />
      )}
      {seccionActiva === "productos" && (
        <AdminProductos
          abrirCrearInicial={crearAlEntrar === "productos"}
          onConsumirCrearInicial={() => setCrearAlEntrar(null)}
        />
      )}
      {seccionActiva === "servicios" && (
        <AdminServicios
          abrirCrearInicial={crearAlEntrar === "servicios"}
          onConsumirCrearInicial={() => setCrearAlEntrar(null)}
        />
      )}
      {seccionActiva === "pedidos" && (
        <AdminPedidos
          abrirCrearInicial={crearAlEntrar === "pedidos"}
          onConsumirCrearInicial={() => setCrearAlEntrar(null)}
        />
      )}
      {seccionActiva === "ventas" && <AdminVentas />}
      {seccionActiva === "facturas" && <AdminFacturas />}
      {seccionActiva === "reportes" && <AdminReportes />}
      {seccionActiva === "pqr" && <AdminPQR />}
    </DashboardLayout>
  );
}