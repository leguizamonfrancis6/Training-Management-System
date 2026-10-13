import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { alumnosApi, type Alumno, type CambioAlumno } from "../api/alumnos";
import AnotacionesAlumno from "../componentes/AnotacionesAlumno";
import EvaluacionesAlumno from "../componentes/EvaluacionesAlumno";
import { ETIQUETAS_CAMPO, ETIQUETAS_PERFIL, formatearValorCambio } from "../utils/alumnos";
import { calcularEdad, formatearFecha, formatearFechaHora } from "../utils/formato";

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="dato">
      <dt>{etiqueta}</dt>
      <dd>{children || <span className="texto-suave">—</span>}</dd>
    </div>
  );
}

export default function AlumnoFicha() {
  const idAlumno = Number(useParams().id);
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [historial, setHistorial] = useState<CambioAlumno[]>([]);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [datos, cambios] = await Promise.all([alumnosApi.obtener(idAlumno), alumnosApi.historial(idAlumno)]);
      setAlumno(datos);
      setHistorial(cambios);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el alumno");
    }
  }, [idAlumno]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function alternarEstado() {
    if (!alumno) return;
    const nombre = `${alumno.nombre} ${alumno.apellido}`;
    const pregunta = alumno.activo
      ? `¿Dar de baja a ${nombre}? Sus datos se conservan y se puede reactivar cuando quieras.`
      : `¿Reactivar a ${nombre}?`;
    if (!window.confirm(pregunta)) return;

    setProcesando(true);
    try {
      await alumnosApi.cambiarEstado(alumno.id, !alumno.activo);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado");
    } finally {
      setProcesando(false);
    }
  }

  if (!alumno) {
    return error ? (
      <>
        <p className="mensaje-error">{error}</p>
        <Link to="/alumnos">← Volver a alumnos</Link>
      </>
    ) : (
      <p className="texto-suave">Cargando…</p>
    );
  }

  return (
    <section>
      <Link to="/alumnos" className="volver">
        ← Alumnos
      </Link>

      <div className="pagina-encabezado">
        <div>
          <h1>
            {alumno.apellido}, {alumno.nombre}
          </h1>
          <div className="insignias">
            <span className="insignia">{ETIQUETAS_PERFIL[alumno.perfil]}</span>
            <span className={alumno.activo ? "insignia insignia-ok" : "insignia"}>
              {alumno.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
        <div className="acciones">
          <Link to={`/alumnos/${alumno.id}/editar`} className="boton">
            Editar
          </Link>
          <button type="button" className="boton-secundario" onClick={alternarEstado} disabled={procesando}>
            {alumno.activo ? "Dar de baja" : "Reactivar"}
          </button>
        </div>
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      <div className="tarjeta seccion">
        <h2>Datos personales</h2>
        <dl className="datos">
          <Dato etiqueta="DNI">{alumno.dni}</Dato>
          <Dato etiqueta="Fecha de nacimiento">
            {formatearFecha(alumno.fechaNacimiento)} ({calcularEdad(alumno.fechaNacimiento)} años)
          </Dato>
          <Dato etiqueta="Teléfono">{alumno.telefono}</Dato>
          <Dato etiqueta="Email">{alumno.email}</Dato>
          <Dato etiqueta="Profesión">{alumno.profesion}</Dato>
          <Dato etiqueta="Plan">{alumno.plan?.nombre ?? "Sin plan asignado"}</Dato>
          <Dato etiqueta="Alta en el sistema">{formatearFecha(alumno.creadoEn)}</Dato>
        </dl>
      </div>

      <div className="tarjeta seccion">
        <h2>Perfil</h2>
        <dl className="datos">
          <Dato etiqueta="Perfil">{ETIQUETAS_PERFIL[alumno.perfil]}</Dato>
          <Dato etiqueta="Detalle del perfil">{alumno.detallePerfil}</Dato>
        </dl>
      </div>

      <div className="tarjeta seccion">
        <h2>Antecedentes y salud</h2>
        <dl className="datos datos-texto">
          <Dato etiqueta="Antecedentes deportivos">{alumno.antecedentesDeportivos}</Dato>
          <Dato etiqueta="Lesiones">{alumno.lesiones}</Dato>
          <Dato etiqueta="Molestias/contracturas">{alumno.molestias}</Dato>
          <Dato etiqueta="Actividad laboral">{alumno.actividadLaboral}</Dato>
          <Dato etiqueta="Otros datos">{alumno.otrosDatos}</Dato>
        </dl>
      </div>

      <AnotacionesAlumno alumnoId={alumno.id} />

      <EvaluacionesAlumno alumnoId={alumno.id} />

      <div className="tarjeta seccion">
        <h2>Historial de cambios</h2>
        {historial.length === 0 ? (
          <p className="texto-suave">Sin cambios registrados desde el alta.</p>
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Campo</th>
                  <th>Antes</th>
                  <th>Después</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((cambio) => (
                  <tr key={cambio.id}>
                    <td className="sin-salto">{formatearFechaHora(cambio.fecha)}</td>
                    <td>{ETIQUETAS_CAMPO[cambio.campo] ?? cambio.campo}</td>
                    <td className="texto-largo">{formatearValorCambio(cambio.campo, cambio.valorAnterior)}</td>
                    <td className="texto-largo">{formatearValorCambio(cambio.campo, cambio.valorNuevo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
