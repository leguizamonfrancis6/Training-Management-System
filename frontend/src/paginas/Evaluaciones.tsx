import { useEffect, useState } from "react";
import { Link } from "react-router";
import { evaluacionesApi, type ResumenEvaluacionAlumno } from "../api/evaluaciones";
import { ETIQUETAS_PERFIL } from "../utils/alumnos";
import { claseProximaEvaluacion, textoDiasRestantes } from "../utils/evaluaciones";
import { coincideBusqueda, formatearFecha } from "../utils/formato";

// Lista de alumnos activos con el estado de sus evaluaciones.
export default function Evaluaciones() {
  const [alumnos, setAlumnos] = useState<ResumenEvaluacionAlumno[] | null>(null);
  const [buscar, setBuscar] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    evaluacionesApi
      .resumenAlumnos()
      .then(setAlumnos)
      .catch((err: Error) => setError(err.message));
  }, []);

  const visibles = alumnos?.filter((a) => coincideBusqueda(`${a.nombre} ${a.apellido}`, buscar)) ?? [];

  return (
    <section>
      <div className="pagina-encabezado">
        <h1>Evaluaciones</h1>
        <Link to="/evaluaciones/configuracion" className="boton-secundario">
          Configurar evaluaciones
        </Link>
      </div>
      <p className="texto-suave">Entrá a un alumno para ver la evolución de sus evaluaciones.</p>

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
                  <th>Perfil</th>
                  <th className="numero">Evaluaciones</th>
                  <th>Última</th>
                  <th>Próxima</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((alumno) => (
                  <tr key={alumno.id}>
                    <td>
                      <Link to={`/alumnos/${alumno.id}/evaluaciones`}>
                        {alumno.apellido}, {alumno.nombre}
                      </Link>
                    </td>
                    <td>{ETIQUETAS_PERFIL[alumno.perfil]}</td>
                    <td className="numero">{alumno.cantidad}</td>
                    <td className="sin-salto">
                      {alumno.ultimaEvaluacion ? formatearFecha(alumno.ultimaEvaluacion) : <span className="texto-suave">—</span>}
                    </td>
                    <td className="sin-salto">
                      {formatearFecha(alumno.proximaEvaluacion.fecha)}{" "}
                      <span className={claseProximaEvaluacion(alumno.proximaEvaluacion)}>
                        {textoDiasRestantes(alumno.proximaEvaluacion)}
                      </span>
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
