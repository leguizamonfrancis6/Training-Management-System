import { useEffect, useState } from "react";
import { Link } from "react-router";
import { rutinasApi, type Rutina } from "../api/rutinas";
import Desplegable from "./Desplegable";
import ListaRutinas from "./ListaRutinas";

// Cantidad de rutinas que se ven en la ficha (el resto, en la pantalla de Rutinas).
const CANTIDAD_EN_FICHA = 4;

// Sección "Rutinas" de la ficha del alumno: sus últimas rutinas guardadas.
export default function RutinasFicha({ alumnoId }: { alumnoId: number }) {
  const [rutinas, setRutinas] = useState<Rutina[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    rutinasApi
      .listar(alumnoId)
      .then(setRutinas)
      .catch((err: Error) => setError(err.message));
  }, [alumnoId]);

  return (
    <Desplegable titulo="Rutinas">
      <div className="fila-plan">
        <Link to={`/rutinas/${alumnoId}`} className="boton">
          Nueva rutina
        </Link>
        {rutinas && rutinas.length > CANTIDAD_EN_FICHA && (
          <Link to={`/rutinas/${alumnoId}`} className="link-discreto">
            Ver las {rutinas.length} rutinas →
          </Link>
        )}
      </div>
      {error && <p className="mensaje-error">{error}</p>}
      {rutinas &&
        (rutinas.length === 0 ? (
          <p className="texto-suave">Todavía no tiene rutinas.</p>
        ) : (
          <ListaRutinas rutinas={rutinas.slice(0, CANTIDAD_EN_FICHA)} />
        ))}
    </Desplegable>
  );
}
