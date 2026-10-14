import { useEffect, useState } from "react";
import { Link } from "react-router";
import { rutinasApi, type AlumnoConRutinas } from "../api/rutinas";
import { coincideBusqueda, formatearFecha } from "../utils/formato";

// Lista de alumnos activos: al entrar a uno se ven sus rutinas y se crea una nueva.
export default function Rutinas() {
  const [alumnos, setAlumnos] = useState<AlumnoConRutinas[] | null>(null);
  const [buscar, setBuscar] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    rutinasApi
      .alumnos()
      .then(setAlumnos)
      .catch((err: Error) => setError(err.message));
  }, []);

  const visibles = alumnos?.filter((a) => coincideBusqueda(`${a.nombre} ${a.apellido}`, buscar)) ?? [];

  return (
    <section>
      <h1>Rutinas</h1>
      <p className="texto-suave">Entrá a un alumno para ver sus rutinas o armarle una nueva.</p>

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
                  <th className="numero">Rutinas</th>
                  <th>Última rutina</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((alumno) => (
                  <tr key={alumno.id}>
                    <td>
                      <Link to={`/rutinas/${alumno.id}`}>
                        {alumno.apellido}, {alumno.nombre}
                      </Link>
                    </td>
                    <td className="numero">{alumno.cantidad}</td>
                    <td className="sin-salto">
                      {alumno.ultimaRutina ? formatearFecha(alumno.ultimaRutina) : <span className="texto-suave">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </section>
  );
}
