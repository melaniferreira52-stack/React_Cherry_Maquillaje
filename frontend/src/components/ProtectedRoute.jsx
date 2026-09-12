import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Envuelve una página para exigir sesión iniciada y, opcionalmente,
 * un rol específico.
 *
 * Uso:
 *   <Route path="/admin" element={
 *     <ProtectedRoute rolesPermitidos={["administrador"]}>
 *       <AdminPanel />
 *     </ProtectedRoute>
 *   } />
 */
export default function ProtectedRoute({ rolesPermitidos, children }) {
  const { estaLogueado, usuario } = useAuth();

  if (!estaLogueado) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario?.rol)) {
    // Usuario logueado pero sin permiso para ver esta página
    return <Navigate to="/" replace />;
  }

  return children;
}