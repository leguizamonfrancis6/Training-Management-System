import { useEffect, useState } from "react";
import { Link } from "react-router";
import { planesApi, type AlumnoConPlan } from "../api/planes";
import { coincideBusqueda, formatearFecha } from "../utils/formato";
import { textoPrecioPlan } from "../utils/pagos";

// Lista de alumnos activos con su membresía (plan) actual. Desde acá se entra al historial de cada uno.
export default function Planes() {
  const [alumnos, setAlumnos] = useState<AlumnoConPlan[] | null>(null);
  const [buscar, setBuscar] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    planesApi
      .alumnos()
      .then(setAlumnos)
      .catch((err: Error) => setError(err.message));
  }, []);

  const visibles = alumnos?.filter((a) => coincideBusqueda(`${a.nombre} ${a.apellido}`, buscar)) ?? [];

  return (
    <section>
      <Link to="/pagos" className="volver">
        ← Pagos
      </Link>
      <div className="pagina-encabezado">
        <h1>Membresías</h1>
        <Link to="/pagos/configuracion" className="boton-secundario">
          Configurar precios
        </Link>
      </div>
      <p className="texto-suave">Membresía actual de cada alumno. Entrá a un alumno para ver su historial de membresías o cambiarla.</p>

      <div className="filtros filtros-simple">
        <input
          type="search"
          placeholder="Buscar alumno"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          aria-label="Buscar alumno"
        />
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      {alumnos &&
        (visibles.length === 0 ? (
          <p className="texto-suave">No hay alumnos que coincidan.</p>
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Membresía actual</th>
                  <th className="numero">Precio mensual</th>
                  <th>Desde</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((alumno) => (
                  <tr key={alumno.id}>
                    <td>
                      <Link to={`/pagos/membresias/${alumno.id}`}>
                        {alumno.apellido}, {alumno.nombre}
                      </Link>
                    </td>
                    {alumno.plan ? (
                      <>
                        <td>{alumno.plan.nombre}</td>
                        <td className="numero sin-salto">{textoPrecioPlan(alumno.plan.precioMensual)}</td>
                        <td className="sin-salto">{alumno.desde ? formatearFecha(alumno.desde) : "—"}</td>
                      </>
                    ) : (
                      <td colSpan={3} className="texto-suave">
                        Sin membresía asignada
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </section>
  );
}
