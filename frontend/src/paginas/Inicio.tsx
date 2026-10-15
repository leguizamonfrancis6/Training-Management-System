import { useEffect, useState, type ReactNode } from "react";
import { panelApi, type Panel } from "../api/panel";
import { useSesion } from "../componentes/Sesion";

function Indicador({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="tarjeta indicador">
      <span className="indicador-etiqueta">{etiqueta}</span>
      <strong className="indicador-valor">{valor}</strong>
    </div>
  );
}

// Pantalla de Inicio: los números importantes del día de un vistazo.
export default function Inicio() {
  const { usuario } = useSesion();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    panelApi
      .obtener()
      .then(setPanel)
      .catch((err: Error) => setError(err.message));
  }, []);

  const hoy = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section>
      <h1>Hola, {usuario?.nombre}</h1>
      <p className="texto-suave primera-mayuscula">{hoy}</p>

      {error && <p className="mensaje-error">{error}</p>}
      {!panel ? (
        !error && <p className="texto-suave">Cargando…</p>
      ) : (
        <div className="indicadores">
          <Indicador etiqueta="Alumnos activos" valor={panel.alumnosActivos} />
          <Indicador etiqueta="Cuotas por vencer (7 días)" valor={panel.cuotasPorVencer} />
          <Indicador etiqueta="Próximas evaluaciones (7 días)" valor={panel.evaluacionesProximas} />
          <Indicador etiqueta="Rutinas por cambiar" valor={panel.rutinasPorCambiar} />
        </div>
      )}
    </section>
  );
}
