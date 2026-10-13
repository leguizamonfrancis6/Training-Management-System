import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { alumnosApi, type Alumno } from "../api/alumnos";
import { evaluacionesApi, type Evaluacion, type ListadoEvaluaciones } from "../api/evaluaciones";
import ProximaEvaluacion from "../componentes/ProximaEvaluacion";
import {
  armarSeries,
  ETIQUETAS_LADO,
  ETIQUETAS_ORIGEN,
  formatearNumero,
  textoVariacion,
} from "../utils/evaluaciones";
import { formatearFecha } from "../utils/formato";

// Historial completo de evaluaciones de un alumno: tabla comparativa + detalle de cada evaluación.
export default function AlumnoEvaluaciones() {
  const alumnoId = Number(useParams().id);
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [datos, setDatos] = useState<ListadoEvaluaciones | null>(null);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      const [datosAlumno, listado] = await Promise.all([alumnosApi.obtener(alumnoId), evaluacionesApi.listar(alumnoId)]);
      setAlumno(datosAlumno);
      setDatos(listado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las evaluaciones");
    }
  }, [alumnoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function eliminar(evaluacion: Evaluacion) {
    const pregunta = `¿Eliminar la evaluación del ${formatearFecha(evaluacion.fecha)} con todos sus resultados? No se puede deshacer.`;
    if (!window.confirm(pregunta)) return;
    try {
      await evaluacionesApi.eliminar(evaluacion.id);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  }

  if (!alumno || !datos) {
    return error ? <p className="mensaje-error">{error}</p> : <p className="texto-suave">Cargando…</p>;
  }

  // Para la tabla comparativa, las evaluaciones van de la más vieja (izquierda) a la más nueva (derecha).
  const cronologicas = [...datos.evaluaciones].reverse();
  const series = armarSeries(datos.evaluaciones);

  return (
    <section>
      <Link to={`/alumnos/${alumnoId}`} className="volver">
        ← {alumno.apellido}, {alumno.nombre}
      </Link>

      <div className="pagina-encabezado">
        <h1>Evaluaciones</h1>
        <Link to={`/alumnos/${alumnoId}/evaluaciones/nueva`} className="boton">
          Nueva evaluación
        </Link>
      </div>

      {error && <p className="mensaje-error">{error}</p>}
      <ProximaEvaluacion datos={datos.proximaEvaluacion} />

      {datos.evaluaciones.length === 0 ? (
        <p className="texto-suave">Todavía no tiene evaluaciones.</p>
      ) : (
        <>
          <div className="tarjeta seccion">
            <h2>Comparación en el tiempo</h2>
            <div className="tabla-contenedor">
              <table className="tabla tabla-comparacion">
                <thead>
                  <tr>
                    <th>Prueba</th>
                    {cronologicas.map((evaluacion) => (
                      <th key={evaluacion.id} className="sin-salto">
                        {formatearFecha(evaluacion.fecha)}
                      </th>
                    ))}
                    <th>Variación total</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((serie) => {
                    const porEvaluacion = new Map(serie.valores.map((v) => [v.evaluacionId, v.valor]));
                    const primero = serie.valores[0];
                    const ultimo = serie.valores[serie.valores.length - 1];
                    return (
                      <tr key={serie.clave}>
                        <td>
                          {serie.nombre} <span className="texto-suave">({serie.unidad})</span>
                        </td>
                        {cronologicas.map((evaluacion) => {
                          const valor = porEvaluacion.get(evaluacion.id);
                          return (
                            <td key={evaluacion.id} className="sin-salto">
                              {valor === undefined ? <span className="texto-suave">—</span> : formatearNumero(valor)}
                            </td>
                          );
                        })}
                        <td className="sin-salto">
                          {serie.valores.length > 1 ? (
                            textoVariacion(primero.valor, ultimo.valor, serie.unidad)
                          ) : (
                            <span className="texto-suave">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="texto-suave">
              La variación total compara la primera y la última medición de cada prueba.
            </p>
          </div>

          <h2>Detalle de cada evaluación</h2>
          {datos.evaluaciones.map((evaluacion) => (
            <div key={evaluacion.id} className="tarjeta seccion">
              <div className="pagina-encabezado">
                <h2>{formatearFecha(evaluacion.fecha)}</h2>
                <div className="acciones">
                  <Link to={`/evaluaciones/${evaluacion.id}/editar`} className="boton-secundario">
                    Editar
                  </Link>
                  <button type="button" className="boton-link peligro" onClick={() => eliminar(evaluacion)}>
                    Eliminar
                  </button>
                </div>
              </div>
              {evaluacion.observaciones && <p className="texto-largo">{evaluacion.observaciones}</p>}
              <div className="tabla-contenedor">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Prueba</th>
                      <th>Lado</th>
                      <th>Valor</th>
                      <th>Origen</th>
                      <th>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluacion.resultados.map((resultado) => (
                      <tr key={resultado.id}>
                        <td>{resultado.prueba.nombre}</td>
                        <td>{resultado.lado ? ETIQUETAS_LADO[resultado.lado] : "—"}</td>
                        <td className="sin-salto">
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
          ))}
        </>
      )}
    </section>
  );
}
