import { useEffect, useState } from "react";
import { alumnosApi } from "../api/alumnos";
import { planesApi, type Plan } from "../api/planes";
import { textoPrecioPlan } from "../utils/pagos";

interface Props {
  alumnoId: number;
  planActual: Plan | null;
  onCambio: () => void;
}

// Lista desplegable para asignar o cambiar el plan de un alumno (se guarda al elegir).
// Se usa en la sección "Cuota y pagos" (ficha del alumno y sus pagos).
export default function SelectorPlan({ alumnoId, planActual, onCambio }: Props) {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    planesApi
      .listar()
      .then(setPlanes)
      .catch((err: Error) => setError(err.message));
  }, []);

  async function cambiar(valor: string) {
    // Se pide confirmación. Si se cancela, el select vuelve solo al plan actual (su valor sale de planActual).
    const nuevo = planes.find((plan) => String(plan.id) === valor) ?? null;
    let pregunta: string;
    if (!planActual) pregunta = `¿Asignar la membresía "${nuevo?.nombre}"?`;
    else if (!nuevo) pregunta = `¿Quitar la membresía "${planActual.nombre}"?`;
    else pregunta = `¿Cambiar la membresía de "${planActual.nombre}" a "${nuevo.nombre}"?`;
    if (!window.confirm(pregunta)) return;

    setGuardando(true);
    setError("");
    try {
      await alumnosApi.cambiarPlan(alumnoId, valor ? Number(valor) : null);
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la membresía");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="pago-plan">
      <label htmlFor={`plan-alumno-${alumnoId}`}>Membresía:</label>
      <select
        id={`plan-alumno-${alumnoId}`}
        value={planActual?.id ?? ""}
        onChange={(e) => cambiar(e.target.value)}
        disabled={guardando}
      >
        <option value="">Sin membresía</option>
        {planes.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.nombre} — {textoPrecioPlan(plan.precioMensual)}
          </option>
        ))}
      </select>
      {error && <span className="error-campo">{error}</span>}
    </div>
  );
}
