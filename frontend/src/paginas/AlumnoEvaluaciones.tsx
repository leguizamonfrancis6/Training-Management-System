import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { alumnosApi, type Alumno } from "../api/alumnos";
import { evaluacionesApi, type ListadoEvaluaciones } from "../api/evaluaciones";
import GraficoEvolucion from "../componentes/GraficoEvolucion";
import ProximaEvaluacion from "../componentes/ProximaEvaluacion";
import { armarGraficos } from "../utils/evaluaciones";
import { formatearFecha } from "../utils/formato";

// Cantidad de evaluaciones que se ven en la lista sin desplegarla.
const CANTIDAD_INICIAL = 4;

// Evaluaciones de un alumno: gráficos de evolución por prueba y lista de evaluaciones realizadas.
export default function AlumnoEvaluaciones() {
  const alumnoId = Number(useParams().id);
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [datos, setDatos] = useState<ListadoEvaluaciones | null>(null);
  const [verTodas, setVerTodas] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([alumnosApi.obtener(alumnoId), evaluacionesApi.listar(alumnoId)])
      .then(([datosAlumno, listado]) => {
        setAlumno(datosAlumno);
        setDatos(listado);
      })
      .catch((err: Error) => setError(err.message));
  }, [alumnoId]);

  if (!alumno || !datos) {
    return error ? <p className="mensaje-error">{error}</p> : <p className="texto-suave">Cargando…</p>;
  }

  const graficos = armarGraficos(datos.evaluaciones);
  // La lista viene de la más reciente a la más vieja: se muestran las últimas y el resto se despliega.
  const visibles = verTodas ? datos.evaluaciones : datos.evaluaciones.slice(0, CANTIDAD_INICIAL);
  const ocultas = datos.evaluaciones.length - CANTIDAD_INICIAL;

  return (
    <section>
      <Link to="/evaluaciones" className="volver">
        ← Evaluaciones
      </Link>

      <div className="pagina-encabezado">
        <div>
          <h1>
            {alumno.apellido}, {alumno.nombre}
          </h1>
          <Link to={`/alumnos/${alumnoId}`}>Ver ficha del alumno</Link>
        </div>
        <Link to={`/alumnos/${alumnoId}/evaluaciones/nueva`} className="boton">
          Nueva evaluación
        </Link>
      </div>

      <ProximaEvaluacion datos={datos.proximaEvaluacion} />

      {datos.evaluaciones.length === 0 ? (
        <p className="texto-suave">Todavía no tiene evaluaciones.</p>
      ) : (
        <>
          <h2>Evolución</h2>
          <p className="texto-suave">Pasá el mouse sobre un punto para ver su fecha y valor.</p>
          <div className="graficos">
            {graficos.map((grafico) => (
              <GraficoEvolucion key={grafico.pruebaId} datos={grafico} />
            ))}
          </div>

          <div className="tarjeta seccion">
            <h2>Evaluaciones realizadas</h2>
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Fecha</th>
                    <th className="numero">Resultados</th>
                    <th>Observaciones</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((evaluacion) => (
                    <tr key={evaluacion.id}>
                      <td className="sin-salto">
                        <Link to={`/evaluaciones/${evaluacion.id}`}>{evaluacion.idEvaluacion}</Link>
                      </td>
                      <td className="sin-salto">{formatearFecha(evaluacion.fecha)}</td>
                      <td className="numero">{evaluacion.resultados.length}</td>
                      <td className="texto-recortado">{evaluacion.observaciones ?? <span className="texto-suave">—</span>}</td>
                      <td className="sin-salto">
                        <Link to={`/evaluaciones/${evaluacion.id}`}>Ver detalle</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ocultas > 0 && (
              <button type="button" className="boton-secundario boton-desplegar" onClick={() => setVerTodas(!verTodas)}>
                {verTodas ? "Ver solo las últimas" : `Ver todas (${ocultas} más)`}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
