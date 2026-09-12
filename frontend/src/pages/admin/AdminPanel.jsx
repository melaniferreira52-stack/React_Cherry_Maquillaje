import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/Admin/DashboardLayout";
import AdminResumen from "./AdminResumen";
import AdminPedidos from "./AdminPedidos";
import AdminProductos from "./AdminProductos";
import AdminServicios from "./AdminServicios";
import AdminUsuarios from "./AdminUsuarios";

const SECCIONES = [
  { id: "resumen", etiqueta: "Resumen", icono: "🏠" },
  { id: "usuarios", etiqueta: "Usuarios", icono: "👤" },
  { id: "productos", etiqueta: "Productos", icono: "🍦" },
  { id: "servicios", etiqueta: "Servicios", icono: "🎉" },
  { id: "pedidos", etiqueta: "Pedidos", icono: "🧾" },
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
      {seccionActiva === "resumen" && <AdminResumen onAccionRapida={irACrear} />}
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
    </DashboardLayout>
  );
}