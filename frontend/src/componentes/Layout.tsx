import { Link, Outlet } from "react-router";
import { useSesion } from "./Sesion";

// Estructura común de las pantallas internas: encabezado + contenido.
export default function Layout() {
  const { usuario, cerrarSesion } = useSesion();

  return (
    <>
      <header className="encabezado">
        <div className="encabezado-contenido">
          <Link to="/" className="marca">
            Gestión de entrenamiento
          </Link>
          <div className="encabezado-usuario">
            <span>{usuario?.nombre}</span>
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
