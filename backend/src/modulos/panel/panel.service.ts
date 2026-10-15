import { diasEntre, hoyComoTexto, textoDesdeFecha } from "../../lib/fechas";
import { prisma } from "../../lib/prisma";
import { resumenAlumnos } from "../evaluaciones/evaluaciones.service";
import { obtenerEstadoCuotas } from "../pagos/pagos.service";

// Con cuántos días de anticipación se avisa en el panel.
const DIAS_PROXIMAS_EVALUACIONES = 7;
const DIAS_AVISO_RUTINA = 7;

// Cantidad de alumnos activos cuya última rutina ya terminó o termina en los próximos días.
async function contarRutinasPorCambiar(hoy: string) {
  const alumnos = await prisma.alumno.findMany({
    where: { activo: true, rutinas: { some: {} } },
    select: { rutinas: { select: { hasta: true }, orderBy: [{ hasta: "desc" }, { id: "desc" }], take: 1 } },
  });
  return alumnos.filter((alumno) => diasEntre(hoy, textoDesdeFecha(alumno.rutinas[0].hasta)) <= DIAS_AVISO_RUTINA).length;
}

// Los números que muestra la pantalla de Inicio. Reutiliza los cálculos de cada módulo:
// estado de cuotas (pagos) y próxima evaluación (evaluaciones).
// No se envían montos (ingresos, deudas): son confidenciales y se consultan en Pagos.
export async function obtenerPanel() {
  const hoy = hoyComoTexto();
  const [cuotas, evaluaciones, rutinasPorCambiar] = await Promise.all([
    obtenerEstadoCuotas(), // alumnos activos con el estado de su cuota
    resumenAlumnos(),
    contarRutinasPorCambiar(hoy),
  ]);

  return {
    alumnosActivos: cuotas.length,
    cuotasPorVencer: cuotas.filter((fila) => fila.estado === "POR_VENCER").length,
    // Evaluaciones que vencen entre hoy y los próximos 7 días (las ya vencidas no cuentan acá).
    evaluacionesProximas: evaluaciones.filter(
      (alumno) => alumno.proximaEvaluacion.diasRestantes >= 0 && alumno.proximaEvaluacion.diasRestantes <= DIAS_PROXIMAS_EVALUACIONES,
    ).length,
    rutinasPorCambiar,
  };
}
