import { Link } from "react-router";
import { rutinasApi, type Rutina } from "../api/rutinas";
import { formatearFecha, formatearFechaHora } from "../utils/formato";
import { ETIQUETAS_TIPO_BLOQUE_CORTAS } from "../utils/rutinas";

interface Props {
  rutinas: Rutina[];
  onEliminar?: (rutina: Rutina) => void; // si no se pasa, no se muestra "Eliminar"
}

// Tabla de rutinas de un alumno (la usan la pantalla de Rutinas y la ficha del alumno).
export default function ListaRutinas({ rutinas, onEliminar }: Props) {
  return (
    <div className="tabla-contenedor">
      <table className="tabla">
        <thead>
          <tr>
            <th>Creada</th>
            <th>Bloque</th>
            <th>Objetivo</th>
            <th>Desde</th>
            <th>Hasta</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rutinas.map((rutina) => (
            <tr key={rutina.id}>
              <td className="sin-salto">{formatearFechaHora(rutina.creadoEn).slice(0, 10)}</td>
              <td className="sin-salto">{ETIQUETAS_TIPO_BLOQUE_CORTAS[rutina.tipo]}</td>
              <td>{rutina.objetivo ?? <span className="texto-suave">—</span>}</td>
              <td className="sin-salto">{formatearFecha(rutina.desde)}</td>
              <td className="sin-salto">{formatearFecha(rutina.hasta)}</td>
              <td className="sin-salto">
                <Link to={`/rutinas/editar/${rutina.id}`} className="boton-link">
                  Abrir
                </Link>
                <a href={rutinasApi.urlDescarga(rutina.id)} className="boton-link">
                  Descargar
                </a>
                {onEliminar && (
                  <button type="button" className="boton-link peligro" onClick={() => onEliminar(rutina)}>
                    Eliminar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
