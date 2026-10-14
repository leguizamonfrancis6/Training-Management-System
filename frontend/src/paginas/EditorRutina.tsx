import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { alumnosApi } from "../api/alumnos";
import { rutinasApi, type TipoBloque } from "../api/rutinas";
import VisorPdfEditable, { type ControlVisor } from "../componentes/VisorPdfEditable";
import { ETIQUETAS_TIPO_BLOQUE } from "../utils/rutinas";

interface Datos {
  alumno: { id: number; nombre: string; apellido: string };
  tipo: TipoBloque;
  pdf: Uint8Array;
}

// Completar una rutina sobre la planilla PDF.
// - Nueva (/rutinas/:alumnoId/nueva?tipo=…): parte de la plantilla, que nunca se modifica.
// - Existente (/rutinas/editar/:rutinaId): parte de la rutina guardada.
// Al guardar, lo escrito queda en el perfil del alumno.
export default function EditorRutina() {
  const parametros = useParams();
  const [busqueda] = useSearchParams();
  const navigate = useNavigate();
  const rutinaId = parametros.rutinaId ? Number(parametros.rutinaId) : null;
  const visor = useRef<ControlVisor>(null);

  const [datos, setDatos] = useState<Datos | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      if (rutinaId) {
        const [rutina, pdf] = await Promise.all([rutinasApi.obtener(rutinaId), rutinasApi.pdf(rutinaId)]);
        setDatos({ alumno: rutina.alumno, tipo: rutina.tipo, pdf });
      } else {
        const tipo = busqueda.get("tipo") as TipoBloque | null;
        if (!tipo || !(tipo in ETIQUETAS_TIPO_BLOQUE)) throw new Error("Falta elegir el tipo de bloque");
        const [alumno, pdf] = await Promise.all([alumnosApi.obtener(Number(parametros.alumnoId)), rutinasApi.plantilla()]);
        setDatos({ alumno, tipo, pdf });
      }
    })().catch((err: Error) => setError(err.message));
  }, [rutinaId, parametros.alumnoId, busqueda]);

  async function guardar() {
    if (!datos || !visor.current) return;
    setError("");
    setGuardando(true);
    try {
      const pdf = await visor.current.obtenerPdf();
      if (rutinaId) await rutinasApi.actualizar(rutinaId, pdf);
      else await rutinasApi.crear(datos.alumno.id, datos.tipo, pdf);
      navigate(`/rutinas/${datos.alumno.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la rutina");
    } finally {
      setGuardando(false);
    }
  }

  function cancelar() {
    if (!datos) return;
    if (window.confirm("¿Salir sin guardar? Se pierde lo que escribiste en la planilla.")) {
      navigate(`/rutinas/${datos.alumno.id}`);
    }
  }

  if (!datos) {
    return error ? (
      <>
        <p className="mensaje-error">{error}</p>
        <Link to="/rutinas">← Rutinas</Link>
      </>
    ) : (
      <p className="texto-suave">Cargando…</p>
    );
  }

  return (
    <section>
      <Link to={`/rutinas/${datos.alumno.id}`} className="volver">
        ← Rutinas de {datos.alumno.apellido}, {datos.alumno.nombre}
      </Link>

      <div className="pagina-encabezado">
        <div>
          <h1>{rutinaId ? "Rutina" : "Nueva rutina"}</h1>
          <p className="texto-suave subtitulo">
            {datos.alumno.apellido}, {datos.alumno.nombre} · {ETIQUETAS_TIPO_BLOQUE[datos.tipo]}
          </p>
        </div>
        <div className="acciones">
          <button type="button" className="boton" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : rutinaId ? "Guardar cambios" : "Guardar rutina"}
          </button>
          <button type="button" className="boton-secundario" onClick={cancelar} disabled={guardando}>
            Cancelar
          </button>
        </div>
      </div>

      {error && <p className="mensaje-error">{error}</p>}
      <p className="texto-suave">Completá los campos de la planilla haciendo clic sobre ellos.</p>

      <VisorPdfEditable ref={visor} datos={datos.pdf} />
    </section>
  );
}
