import { Navigate, Outlet } from "react-router";
import { useSesion } from "./Sesion";

// Envuelve las pantallas que requieren sesión: si no hay usuario, manda al login.
export default function RutaProtegida() {
  const { usuario, cargando } = useSesion();

  if (cargando) {
    return <p className="contenedor">Cargando…</p>;
  }
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
