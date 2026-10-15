import { useEffect, useState } from "react";
import { Link } from "react-router";
import { pagosApi, type PagoConAlumno } from "../api/pagos";
import { formatearFecha, formatearMoneda } from "../utils/formato";
import { ETIQUETAS_MEDIO } from "../utils/pagos";

// Cuántos ingresos se ven sin desplegar, y cuántos se traen como máximo (el resto, en Historial de Ingresos).
const CANTIDAD_INICIAL = 3;
const CANTIDAD_MAXIMA = 20;

// Lista "Últimos ingresos" de la pantalla Pagos: los pagos más recientes de todos los alumnos.
export default function UltimosIngresos() {
  const [pagos, setPagos] = useState<PagoConAlumno[] | null>(null);
  const [verTodos, setVerTodos] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    pagosApi
      .ultimos(CANTIDAD_MAXIMA)
      .then(setPagos)
      .catch((err: Error) => setError(err.message));
  }, []);

  const visibles = verTodos ? pagos ?? [] : (pagos ?? []).slice(0, CANTIDAD_INICIAL);
  const ocultos = (pagos?.length ?? 0) - CANTIDAD_INICIAL;

  return (
    <div className="tarjeta seccion ultimos-ingresos">
      <h2>Últimos ingresos</h2>
      {error && <p className="mensaje-error">{error}</p>}
      {pagos &&
        (pagos.length === 0 ? (
          <p className="texto-suave">Todavía no hay pagos registrados.</p>
        ) : (
          <>
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Alumno</th>
                    <th>Concepto</th>
                    <th>Medio</th>
                    <th className="numero">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((pago) => (
                    <tr key={pago.id}>
                      <td className="sin-salto">{formatearFecha(pago.fecha)}</td>
                      <td>
                        <Link to={`/pagos/alumnos/${pago.alumno.id}`}>
                          {pago.alumno.apellido}, {pago.alumno.nombre}
                        </Link>
                      </td>
                      <td>{pago.concepto}</td>
                      <td>{ETIQUETAS_MEDIO[pago.medio]}</td>
                      <td className="numero sin-salto">{formatearMoneda(pago.importe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ocultos > 0 && (
              <button type="button" className="boton-secundario boton-desplegar" onClick={() => setVerTodos(!verTodos)}>
                {verTodos ? "Ver solo los últimos" : `Ver más (${ocultos})`}
              </button>
            )}
            {verTodos && (
              <p className="nota">
                <Link to="/ingresos" className="link-discreto">
                  Ver el historial completo en Historial de Ingresos →
                </Link>
              </p>
            )}
          </>
        ))}
    </div>
  );
}
