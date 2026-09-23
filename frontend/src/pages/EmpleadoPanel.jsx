import { lazy, Suspense, useState } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/admin/DashboardLayout";

// Lazy loading: cada sección se carga solo al abrirse.
const AdminDashboard = lazy(() => import("./admin/AdminDashboard"));
const AdminPedidos = lazy(() => import("./admin/AdminPedidos"));
const AdminVentas = lazy(() => import("./admin/AdminVentas"));
const AdminFacturas = lazy(() => import("./admin/AdminFacturas"));
const AdminReportes = lazy(() => import("./admin/AdminReportes"));
const AdminProductos = lazy(() => import("./admin/AdminProductos"));
const AdminServicios = lazy(() => import("./admin/AdminServicios"));
const AdminPQR = lazy(() => import("./admin/AdminPQR"));
const AdminUsuarios = lazy(() => import("./admin/AdminUsuarios"));

const SECCIONES = [
  { id: "resumen", etiqueta: "Resumen" },
  { id: "pedidos", etiqueta: "Pedidos" },
  { id: "ventas", etiqueta: "Ventas" },
  { id: "facturas", etiqueta: "Facturas"},
  { id: "reportes", etiqueta: "Reportes" },
  { id: "productos", etiqueta: "Productos"},
  { id: "servicios", etiqueta: "Servicios" },
  { id: "pqr", etiqueta: "PQR" },
  { id: "usuarios", etiqueta: "Usuarios" },
];

function SuspenseSeccion({ children }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <p className="text-sm text-[--color-choco-soft]">Cargando sección...</p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

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
      {seccionActiva === "resumen" && (
        <SuspenseSeccion>
          <AdminDashboard esAdmin={false} />
        </SuspenseSeccion>
      )}
      {seccionActiva === "pedidos" && (
        <SuspenseSeccion>
          <AdminPedidos />
        </SuspenseSeccion>
      )}
      {seccionActiva === "ventas" && (
        <SuspenseSeccion>
          <AdminVentas esAdmin={false} />
        </SuspenseSeccion>
      )}
      {seccionActiva === "facturas" && (
        <SuspenseSeccion>
          <AdminFacturas esAdmin={false} />
        </SuspenseSeccion>
      )}
      {seccionActiva === "reportes" && (
        <SuspenseSeccion>
          <AdminReportes esAdmin={false} />
        </SuspenseSeccion>
      )}
      {seccionActiva === "productos" && (
        <SuspenseSeccion>
          <AdminProductos esAdmin={false} />
        </SuspenseSeccion>
      )}
      {seccionActiva === "servicios" && (
        <SuspenseSeccion>
          <AdminServicios esAdmin={false} />
        </SuspenseSeccion>
      )}
      {seccionActiva === "pqr" && (
        <SuspenseSeccion>
          <AdminPQR esAdmin={false} />
        </SuspenseSeccion>
      )}
      {seccionActiva === "usuarios" && (
        <SuspenseSeccion>
          <AdminUsuarios esAdmin={false} />
        </SuspenseSeccion>
      )}
    </DashboardLayout>
  );
}