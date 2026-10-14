import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { alumnosApi, type Alumno } from "../api/alumnos";
import { evaluacionesApi, type Evaluacion } from "../api/evaluaciones";
import { ETIQUETAS_LADO, ETIQUETAS_ORIGEN, formatearNumero } from "../utils/evaluaciones";
import { formatearFecha } from "../utils/formato";

// Detalle de una evaluación: resultados, observaciones y acciones (editar / eliminar).
export default function EvaluacionDetalle() {
  const evaluacionId = Number(useParams().evaluacionId);
  const navigate = useNavigate();
  const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(null);
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    evaluacionesApi
      .obtener(evaluacionId)
      .then(async (datos) => {
        setEvaluacion(datos);
        setAlumno(await alumnosApi.obtener(datos.alumnoId));
      })
      .catch((err: Error) => setError(err.message));
  }, [evaluacionId]);

  async function eliminar() {
    if (!evaluacion) return;
    const pregunta = `¿Eliminar la evaluación n° ${evaluacion.idEvaluacion} (${formatearFecha(evaluacion.fecha)}) con todos sus resultados? No se puede deshacer.`;
    if (!window.confirm(pregunta)) return;
    try {
      await evaluacionesApi.eliminar(evaluacion.id);
      navigate(`/alumnos/${evaluacion.alumnoId}/evaluaciones`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  }

  if (!evaluacion || !alumno) {
    return error ? <p className="mensaje-error">{error}</p> : <p className="texto-suave">Cargando…</p>;
  }

  return (
    <section>
      <Link to={`/alumnos/${alumno.id}/evaluaciones`} className="volver">
        ← Evaluaciones de {alumno.apellido}, {alumno.nombre}
      </Link>

      <div className="pagina-encabezado">
        <div>
          <h1>Evaluación n° {evaluacion.idEvaluacion}</h1>
          <p className="texto-suave subtitulo">Fecha: {formatearFecha(evaluacion.fecha)}</p>
        </div>
        <div className="acciones">
          <Link to={`/evaluaciones/${evaluacion.id}/editar`} className="boton">
            Editar
          </Link>
          <button type="button" className="boton-secundario boton-peligro" onClick={eliminar}>
            Eliminar
          </button>
        </div>
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      {evaluacion.observaciones && (
        <div className="tarjeta seccion">
          <h2>Observaciones</h2>
          <p className="texto-largo">{evaluacion.observaciones}</p>
        </div>
      )}

      <div className="tarjeta seccion">
        <h2>Resultados</h2>
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Prueba</th>
                <th>Lado</th>
                <th className="numero">Valor</th>
                <th>Origen</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {evaluacion.resultados.map((resultado) => (
                <tr key={resultado.id}>
                  <td>{resultado.prueba.nombre}</td>
                  <td>{resultado.lado ? ETIQUETAS_LADO[resultado.lado] : "—"}</td>
                  <td className="numero sin-salto">
                    {formatearNumero(resultado.valor)} {resultado.unidad}
                  </td>
                  <td>{ETIQUETAS_ORIGEN[resultado.origen]}</td>
                  <td className="texto-largo">{resultado.observacion ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
