import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { alumnosApi, type Alumno } from "../api/alumnos";
import PagosAlumno from "../componentes/PagosAlumno";

// Pagos de un alumno, desde la pantalla Pagos: lo mismo que "Cuota y pagos" de la ficha, abierto.
export default function PagosDeAlumno() {
  const alumnoId = Number(useParams().id);
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [error, setError] = useState("");

  // Se vuelve a pedir el alumno después de cambios que lo afectan (ej.: "Anular deuda" con baja).
  const cargar = useCallback(async () => {
    try {
      setAlumno(await alumnosApi.obtener(alumnoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el alumno");
    }
  }, [alumnoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!alumno) {
    return error ? <p className="mensaje-error">{error}</p> : <p className="texto-suave">Cargando…</p>;
  }

  return (
    <section>
      <Link to="/pagos" className="volver">
        ← Pagos
      </Link>
      <div className="pagina-encabezado">
        <div>
          <h1>
            {alumno.apellido}, {alumno.nombre}
          </h1>
          {!alumno.activo && <span className="insignia">Inactivo</span>}
        </div>
        <Link to={`/alumnos/${alumno.id}`} className="link-discreto">
          Ver ficha del alumno →
        </Link>
      </div>

      <PagosAlumno alumno={alumno} onCambio={cargar} enFicha={false} />
    </section>
  );
}
