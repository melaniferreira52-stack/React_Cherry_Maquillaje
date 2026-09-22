import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/admin/DashboardLayout";
import AdminPedidos from "./admin/AdminPedidos";
import AdminProductos from "./admin/AdminProductos";
import AdminServicios from "./admin/AdminServicios";
import AdminUsuarios from "./admin/AdminUsuarios";
import AdminVentas from "./admin/AdminVentas";
import AdminFacturas from "./admin/AdminFacturas";
import AdminReportes from "./admin/AdminReportes";
import AdminPQR from "./admin/AdminPQR";
import AdminDashboard from "./admin/AdminDashboard";

const SECCIONES = [
  { id: "resumen", etiqueta: "Resumen", icono: "📊" },
  { id: "pedidos", etiqueta: "Pedidos", icono: "🧾" },
  { id: "ventas", etiqueta: "Ventas", icono: "💰" },
  { id: "facturas", etiqueta: "Facturas", icono: "📄" },
  { id: "reportes", etiqueta: "Reportes", icono: "📊" },
  { id: "productos", etiqueta: "Productos", icono: "🍦" },
  { id: "servicios", etiqueta: "Servicios", icono: "🎉" },
  { id: "pqr", etiqueta: "PQR", icono: "📥" },
  { id: "usuarios", etiqueta: "Usuarios", icono: "👤" },
];

export default function EmpleadoPanel() {
  const { usuario, cerrarSesion } = useAuth();
  const [seccionActiva, setSeccionActiva] = useState("resumen");

  return (
    <DashboardLayout
      rolEtiqueta="Empleado"
      nombreUsuario={usuario?.nombre || usuario?.correo}
      secciones={SECCIONES}
      seccionActiva={seccionActiva}
      onCambiarSeccion={setSeccionActiva}
      breadcrumb="Cherry Beauty"
      tituloPagina={SECCIONES.find((s) => s.id === seccionActiva)?.etiqueta}
      onCerrarSesion={cerrarSesion}
    >
      {seccionActiva === "resumen" && <AdminDashboard esAdmin={false} />}
      {seccionActiva === "pedidos" && <AdminPedidos />}
      {seccionActiva === "ventas" && <AdminVentas esAdmin={false} />}
      {seccionActiva === "facturas" && <AdminFacturas esAdmin={false} />}
      {seccionActiva === "reportes" && <AdminReportes esAdmin={false} />}
      {seccionActiva === "productos" && <AdminProductos esAdmin={false} />}
      {seccionActiva === "servicios" && <AdminServicios esAdmin={false} />}
      {seccionActiva === "pqr" && <AdminPQR esAdmin={false} />}
      {seccionActiva === "usuarios" && <AdminUsuarios esAdmin={false} />}
    </DashboardLayout>
  );
}
