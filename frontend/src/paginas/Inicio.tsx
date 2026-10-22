import type { ReactNode } from "react";
import { panelApi } from "../api/panel";
import Cargando from "../componentes/Cargando";
import { useSesion } from "../componentes/Sesion";
import { useCarga } from "../hooks/useCarga";

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
  const { datos: panel, error } = useCarga(() => panelApi.obtener(), []);

  const hoy = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section>
      <h1>Hola, {usuario?.nombre}</h1>
      <p className="texto-suave primera-mayuscula">{hoy}</p>

      {!panel ? (
        <Cargando error={error} />
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
