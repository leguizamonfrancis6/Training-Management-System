import { useEffect, useState } from "react";
import { Link } from "react-router";
import { evaluacionesApi, type ListadoEvaluaciones } from "../api/evaluaciones";
import { armarSeries, formatearNumero, textoVariacion } from "../utils/evaluaciones";
import { formatearFecha } from "../utils/formato";
import ProximaEvaluacion from "./ProximaEvaluacion";

// Resumen de evaluaciones dentro de la ficha: próxima evaluación y último valor de cada prueba
// comparado con la medición anterior. El historial completo está en /alumnos/:id/evaluaciones.
export default function EvaluacionesAlumno({ alumnoId }: { alumnoId: number }) {
  const [datos, setDatos] = useState<ListadoEvaluaciones | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    evaluacionesApi
      .listar(alumnoId)
      .then(setDatos)
      .catch((err: Error) => setError(err.message));
  }, [alumnoId]);

  const series = datos ? armarSeries(datos.evaluaciones) : [];
  const cantidad = datos?.evaluaciones.length ?? 0;

  return (
    <div className="tarjeta seccion">
      <div className="pagina-encabezado">
        <h2>Evaluaciones</h2>
        <div className="acciones">
          <Link to={`/alumnos/${alumnoId}/evaluaciones/nueva`} className="boton">
            Nueva evaluación
          </Link>
          {cantidad > 0 && (
            <Link to={`/alumnos/${alumnoId}/evaluaciones`} className="boton-secundario">
              Historial y comparación ({cantidad})
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
                  {series.map((serie) => {
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
                          {anterior ? textoVariacion(anterior.valor, ultimo.valor, serie.unidad) : <span className="texto-suave">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
