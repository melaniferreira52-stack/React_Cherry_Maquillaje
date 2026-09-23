import { lazy, Suspense, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/Admin/DashboardLayout";

// Lazy loading: cada sección se carga solo cuando se abre por primera vez.
// Esto evita que al entrar al panel se descargue TODO (incluido recharts),
// que era la causa de la lentitud al navegar entre secciones.
const AdminDashboard = lazy(() => import("./AdminDashboard"));
const AdminUsuarios = lazy(() => import("./AdminUsuarios"));
const AdminProductos = lazy(() => import("./AdminProductos"));
const AdminServicios = lazy(() => import("./AdminServicios"));
const AdminPedidos = lazy(() => import("./AdminPedidos"));
const AdminVentas = lazy(() => import("./AdminVentas"));
const AdminFacturas = lazy(() => import("./AdminFacturas"));
const AdminReportes = lazy(() => import("./AdminReportes"));
const AdminPQR = lazy(() => import("./AdminPQR"));

const SECCIONES = [
  { id: "resumen", etiqueta: "Resumen" },
  { id: "usuarios", etiqueta: "Usuarios" },
  { id: "productos", etiqueta: "Productos"},
  { id: "servicios", etiqueta: "Servicios" },
  { id: "pedidos", etiqueta: "Pedidos" },
  { id: "ventas", etiqueta: "Ventas" },
  { id: "facturas", etiqueta: "Facturas"},
  { id: "reportes", etiqueta: "Reportes"},
  { id: "pqr", etiqueta: "PQR" },
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
      {seccionActiva === "resumen" && (
        <SuspenseSeccion>
          <AdminDashboard onAccionRapida={irACrear} />
        </SuspenseSeccion>
      )}
      {seccionActiva === "usuarios" && (
        <SuspenseSeccion>
          <AdminUsuarios
            abrirCrearInicial={crearAlEntrar === "usuarios"}
            onConsumirCrearInicial={() => setCrearAlEntrar(null)}
          />
        </SuspenseSeccion>
      )}
      {seccionActiva === "productos" && (
        <SuspenseSeccion>
          <AdminProductos
            abrirCrearInicial={crearAlEntrar === "productos"}
            onConsumirCrearInicial={() => setCrearAlEntrar(null)}
          />
        </SuspenseSeccion>
      )}
      {seccionActiva === "servicios" && (
        <SuspenseSeccion>
          <AdminServicios
            abrirCrearInicial={crearAlEntrar === "servicios"}
            onConsumirCrearInicial={() => setCrearAlEntrar(null)}
          />
        </SuspenseSeccion>
      )}
      {seccionActiva === "pedidos" && (
        <SuspenseSeccion>
          <AdminPedidos
            abrirCrearInicial={crearAlEntrar === "pedidos"}
            onConsumirCrearInicial={() => setCrearAlEntrar(null)}
          />
        </SuspenseSeccion>
      )}
      {seccionActiva === "ventas" && (
        <SuspenseSeccion>
          <AdminVentas />
        </SuspenseSeccion>
      )}
      {seccionActiva === "facturas" && (
        <SuspenseSeccion>
          <AdminFacturas />
        </SuspenseSeccion>
      )}
      {seccionActiva === "reportes" && (
        <SuspenseSeccion>
          <AdminReportes />
        </SuspenseSeccion>
      )}
      {seccionActiva === "pqr" && (
        <SuspenseSeccion>
          <AdminPQR />
        </SuspenseSeccion>
      )}
    </DashboardLayout>
  );
}