import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { alumnosApi, type Alumno } from "../api/alumnos";
import { rutinasApi, type Rutina, type TipoBloque } from "../api/rutinas";
import ListaRutinas from "../componentes/ListaRutinas";
import { formatearFechaHora } from "../utils/formato";
import { ETIQUETAS_TIPO_BLOQUE } from "../utils/rutinas";

// Rutinas de un alumno: todas las guardadas y el botón para armar una nueva.
export default function RutinasAlumno() {
  const alumnoId = Number(useParams().alumnoId);
  const navigate = useNavigate();
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [rutinas, setRutinas] = useState<Rutina[] | null>(null);
  const [eligiendoTipo, setEligiendoTipo] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      const [datosAlumno, lista] = await Promise.all([alumnosApi.obtener(alumnoId), rutinasApi.listar(alumnoId)]);
      setAlumno(datosAlumno);
      setRutinas(lista);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las rutinas");
    }
  }, [alumnoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function eliminar(rutina: Rutina) {
    const fecha = formatearFechaHora(rutina.creadoEn).slice(0, 10);
    if (!window.confirm(`¿Eliminar la rutina creada el ${fecha}? No se puede deshacer.`)) return;
    try {
      await rutinasApi.eliminar(rutina.id);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la rutina");
    }
  }

  if (!alumno || !rutinas) {
    return error ? <p className="mensaje-error">{error}</p> : <p className="texto-suave">Cargando…</p>;
  }

  return (
    <section>
      <Link to="/rutinas" className="volver">
        ← Rutinas
      </Link>

      <div className="pagina-encabezado">
        <div>
          <h1>
            {alumno.apellido}, {alumno.nombre}
          </h1>
          <Link to={`/alumnos/${alumno.id}`}>Ver ficha del alumno</Link>
        </div>
        {!eligiendoTipo && (
          <button type="button" className="boton" onClick={() => setEligiendoTipo(true)}>
            Nueva rutina
          </button>
        )}
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      {/* Al crear una rutina se elige el tipo de bloque y se abre la planilla */}
      {eligiendoTipo && (
        <div className="tarjeta seccion">
          <h2>Elegí el tipo de rutina</h2>
          <div className="opciones-bloque">
            {(Object.keys(ETIQUETAS_TIPO_BLOQUE) as TipoBloque[]).map((tipo) => (
              <button
                key={tipo}
                type="button"
                className="opcion-bloque"
                onClick={() => navigate(`/rutinas/${alumno.id}/nueva?tipo=${tipo}`)}
              >
                {ETIQUETAS_TIPO_BLOQUE[tipo]}
              </button>
            ))}
          </div>
          <button type="button" className="boton-secundario" onClick={() => setEligiendoTipo(false)}>
            Cancelar
          </button>
        </div>
      )}

      <div className="tarjeta seccion">
        <h2>Rutinas</h2>
        {rutinas.length === 0 ? (
          <p className="texto-suave">Todavía no tiene rutinas.</p>
        ) : (
          <ListaRutinas rutinas={rutinas} onEliminar={eliminar} />
        )}
      </div>
    </section>
  );
}
