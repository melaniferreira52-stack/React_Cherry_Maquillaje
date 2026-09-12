import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/admin/DashboardLayout";
import AdminPedidos from "./admin/AdminPedidos";
import AdminProductos from "./admin/AdminProductos";
import AdminServicios from "./admin/AdminServicios";
import AdminUsuarios from "./admin/AdminUsuarios";

const SECCIONES = [
  { id: "pedidos", etiqueta: "Pedidos", icono: "🧾" },
  { id: "productos", etiqueta: "Productos", icono: "🍦" },
  { id: "servicios", etiqueta: "Servicios", icono: "🎉" },
  { id: "usuarios", etiqueta: "Usuarios", icono: "👤" },
];

export default function EmpleadoPanel() {
  const { usuario, cerrarSesion } = useAuth();
  const [seccionActiva, setSeccionActiva] = useState("pedidos");

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
      {seccionActiva === "pedidos" && <AdminPedidos />}
      {seccionActiva === "productos" && <AdminProductos esAdmin={false} />}
      {seccionActiva === "servicios" && <AdminServicios esAdmin={false} />}
      {seccionActiva === "usuarios" && <AdminUsuarios esAdmin={false} />}
    </DashboardLayout>
  );
}
