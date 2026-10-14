import { useEffect, useState } from "react";
import { Link } from "react-router";
import { evaluacionesApi, type ListadoEvaluaciones } from "../api/evaluaciones";
import { armarSeries, formatearNumero, textoVariacion } from "../utils/evaluaciones";
import { formatearFecha } from "../utils/formato";
import ProximaEvaluacion from "./ProximaEvaluacion";
import Desplegable from "./Desplegable";

// Cantidad de pruebas que se ven en la tabla sin desplegarla.
const CANTIDAD_INICIAL = 4;

// Resumen de evaluaciones dentro de la ficha: próxima evaluación y último valor de cada prueba
// comparado con la medición anterior. El historial completo está en /alumnos/:id/evaluaciones.
export default function EvaluacionesAlumno({ alumnoId }: { alumnoId: number }) {
  const [datos, setDatos] = useState<ListadoEvaluaciones | null>(null);
  const [verTodas, setVerTodas] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    evaluacionesApi
      .listar(alumnoId)
      .then(setDatos)
      .catch((err: Error) => setError(err.message));
  }, [alumnoId]);

  // Las pruebas medidas más recientemente primero (por la fecha de su último valor).
  const series = (datos ? armarSeries(datos.evaluaciones) : []).sort((a, b) => {
    const ultimaA = a.valores[a.valores.length - 1];
    const ultimaB = b.valores[b.valores.length - 1];
    return ultimaB.fecha.localeCompare(ultimaA.fecha) || ultimaB.evaluacionId - ultimaA.evaluacionId;
  });
  const visibles = verTodas ? series : series.slice(0, CANTIDAD_INICIAL);
  const ocultas = series.length - CANTIDAD_INICIAL;
  const cantidad = datos?.evaluaciones.length ?? 0;

  return (
    <Desplegable titulo="Evaluaciones">
      <div className="pagina-encabezado">
        <div className="acciones">
          <Link to={`/alumnos/${alumnoId}/evaluaciones/nueva`} className="boton">
            Nueva evaluación
          </Link>
          {cantidad > 0 && (
            <Link to={`/alumnos/${alumnoId}/evaluaciones`} className="boton-secundario">
              Historial y Métricas ({cantidad})
            </Link>
          )}
        </div>
      </div>

      {error && <p className="mensaje-error">{error}</p>}
      {!datos ? (
        !error && <p className="texto-suave">Cargando…</p>
      ) : (
        <>
          <ProximaEvaluacion datos={datos.proximaEvaluacion} />

          {cantidad === 0 ? (
            <p className="texto-suave">Todavía no tiene evaluaciones.</p>
          ) : (
            <>
              <div className="tabla-contenedor">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Prueba</th>
                      <th>Último valor</th>
                      <th>Anterior</th>
                      <th>Variación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((serie) => {
                      const ultimo = serie.valores[serie.valores.length - 1];
                      const anterior = serie.valores[serie.valores.length - 2];
                      return (
                        <tr key={serie.clave}>
                          <td>{serie.nombre}</td>
                          <td className="sin-salto">
                            <strong>
                              {formatearNumero(ultimo.valor)} {serie.unidad}
                            </strong>{" "}
                            <span className="texto-suave">{formatearFecha(ultimo.fecha)}</span>
                          </td>
                          <td className="sin-salto">
                            {anterior ? (
                              <>
                                {formatearNumero(anterior.valor)}{" "}
                                <span className="texto-suave">{formatearFecha(anterior.fecha)}</span>
                              </>
                            ) : (
                              <span className="texto-suave">—</span>
                            )}
                          </td>
                          <td className="sin-salto">
                            {anterior ? (
                              textoVariacion(anterior.valor, ultimo.valor, serie.unidad)
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
              {ocultas > 0 && (
                <button type="button" className="boton-secundario boton-desplegar" onClick={() => setVerTodas(!verTodas)}>
                  {verTodas ? "Ver solo las últimas" : `Ver todas (${ocultas} más)`}
                </button>
              )}
            </>
          )}
        </>
      )}
    </Desplegable>
  );
}
