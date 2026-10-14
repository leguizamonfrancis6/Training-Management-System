import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { planesApi, type HistorialPlanes } from "../api/planes";
import SelectorPlan from "../componentes/SelectorPlan";
import { formatearFecha } from "../utils/formato";
import { textoPrecioPlan } from "../utils/pagos";

// Cantidad de planes que se ven sin desplegar la lista.
const CANTIDAD_INICIAL = 2;

// Planes de un alumno: plan actual (se puede cambiar) e historial de planes.
export default function PlanesAlumno() {
  const alumnoId = Number(useParams().id);
  const [datos, setDatos] = useState<HistorialPlanes | null>(null);
  const [verTodos, setVerTodos] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      setDatos(await planesApi.historialAlumno(alumnoId));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el historial");
    }
  }, [alumnoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!datos) {
    return error ? <p className="mensaje-error">{error}</p> : <p className="texto-suave">Cargando…</p>;
  }

  const { alumno, asignaciones } = datos;
  const visibles = verTodos ? asignaciones : asignaciones.slice(0, CANTIDAD_INICIAL);

  return (
    <section>
      <Link to="/pagos/membresias" className="volver">
        ← Membresías
      </Link>
      <h1>
        {alumno.apellido}, {alumno.nombre}
      </h1>
      <p>
        <Link to={`/alumnos/${alumno.id}`}>Ver ficha del alumno</Link>
      </p>

      {error && <p className="mensaje-error">{error}</p>}

      <div className="tarjeta seccion">
        <h2>Membresía actual</h2>
        <SelectorPlan alumnoId={alumno.id} planActual={alumno.plan} onCambio={cargar} />
      </div>

      <div className="tarjeta seccion">
        <h2>Historial de membresías</h2>
        {asignaciones.length === 0 ? (
          <p className="texto-suave">Todavía no tuvo ninguna membresía asignada.</p>
        ) : (
          <>
            <ul className="lista-planes">
              {visibles.map((asignacion) => (
                <li key={asignacion.id} className="plan-historial">
                  <div className="anotacion-cabecera">
                    <strong>{asignacion.plan.nombre}</strong>
                    {asignacion.hasta === null && <span className="insignia insignia-ok">Actual</span>}
                  </div>
                  <p>
                    {textoPrecioPlan(asignacion.plan.precioMensual)} por mes
                  </p>
                  <p className="texto-suave">
                    Desde el {formatearFecha(asignacion.desde)}
                    {asignacion.hasta ? ` hasta el ${formatearFecha(asignacion.hasta)}` : " hasta hoy"}
                  </p>
                </li>
              ))}
            </ul>
            {asignaciones.length > CANTIDAD_INICIAL && (
              <button type="button" className="boton-secundario boton-desplegar" onClick={() => setVerTodos(!verTodos)}>
                {verTodos ? "Ver solo los últimos" : `Ver todos (${asignaciones.length - CANTIDAD_INICIAL} más)`}
              </button>
            )}
          </>
        )}
        <p className="texto-suave nota">El precio que se muestra es el precio actual de cada membresía.</p>
      </div>
    </section>
  );
}
