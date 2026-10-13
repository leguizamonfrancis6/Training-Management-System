import type { ProximaEvaluacion as DatosProximaEvaluacion } from "../api/evaluaciones";
import { claseProximaEvaluacion, textoDiasRestantes } from "../utils/evaluaciones";
import { formatearFecha } from "../utils/formato";

// Línea con la fecha de la próxima reevaluación y cuánto falta (o cuánto hace que venció).
export default function ProximaEvaluacion({ datos }: { datos: DatosProximaEvaluacion }) {
  return (
    <p className="proxima-evaluacion">
      <span>
        Próxima evaluación: <strong>{formatearFecha(datos.fecha)}</strong>
      </span>
      <span className={claseProximaEvaluacion(datos)}>{textoDiasRestantes(datos)}</span>
      <span className="texto-suave">
        (calculada desde {datos.desde === "alta" ? "la fecha de alta" : "la última evaluación"})
      </span>
    </p>
  );
}
