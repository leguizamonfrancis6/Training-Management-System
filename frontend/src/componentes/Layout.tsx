import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useSesion } from "./Sesion";

// Estructura común de las pantallas internas: encabezado con menú + contenido.
export default function Layout() {
  const { usuario, cerrarSesion } = useSesion();
  const { pathname } = useLocation();

  return (
    <>
      <header className="encabezado">
        <div className="encabezado-contenido">
          <Link to="/" className="marca">
            Gestión de entrenamiento
          </Link>
          <nav className="menu">
            <NavLink to="/" end>
              Inicio
            </NavLink>
            <NavLink to="/alumnos">Alumnos</NavLink>
            {/* Ingresos no está en el menú: se abre desde Pagos, que queda resaltado */}
            <NavLink to="/pagos" className={() => (/^\/(pagos|ingresos)/.test(pathname) ? "active" : "")}>
              Pagos
            </NavLink>
            <NavLink to="/rutinas">Rutinas</NavLink>
            <NavLink to="/evaluaciones">Evaluaciones</NavLink>
          </nav>
          <div className="encabezado-usuario">
            <Link to="/cuenta/password" className="link-discreto" title="Cambiar contraseña">
              {usuario?.nombre}
            </Link>
            <button type="button" className="boton-secundario" onClick={() => cerrarSesion()}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main className="contenedor">
        <Outlet />
      </main>
    </>
  );
}
