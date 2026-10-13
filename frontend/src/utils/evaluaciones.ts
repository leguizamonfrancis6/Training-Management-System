import type { Evaluacion, Lado, OrigenResultado, ProximaEvaluacion } from "../api/evaluaciones";
import type { CategoriaPrueba } from "../api/pruebas";

export const ETIQUETAS_CATEGORIA: Record<CategoriaPrueba, string> = {
  FUERZA: "Fuerza",
  POTENCIA: "Potencia",
  VELOCIDAD: "Velocidad",
  MOVILIDAD: "Movilidad",
  RESISTENCIA: "Resistencia",
};

export const ETIQUETAS_LADO: Record<Lado, string> = {
  IZQ: "Izquierdo",
  DER: "Derecho",
};

export const ETIQUETAS_ORIGEN: Record<OrigenResultado, string> = {
  PLATAFORMA_FUERZA: "Plataforma de fuerza",
  MYJUMP: "MyJump",
  MANUAL: "Manual",
};

// Número con coma decimal y hasta 2 decimales: 1234.5 → "1.234,5".
export function formatearNumero(valor: number | string) {
  return Number(valor).toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

export function nombreConLado(nombre: string, lado: Lado | null) {
  return lado ? `${nombre} (${ETIQUETAS_LADO[lado].toLowerCase()})` : nombre;
}

// ---------- Comparación en el tiempo ----------

// Una "serie" es la evolución de una prueba (y lado) a lo largo de las evaluaciones.
export interface Serie {
  clave: string;
  nombre: string; // nombre de la prueba con el lado, ej.: "CMJ (izquierdo)"
  unidad: string;
  valores: { evaluacionId: number; fecha: string; valor: number }[]; // de la más vieja a la más nueva
}

export function armarSeries(evaluaciones: Evaluacion[]): Serie[] {
  const series = new Map<string, Serie>();
  const cronologicas = [...evaluaciones].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id);

  for (const evaluacion of cronologicas) {
    for (const resultado of evaluacion.resultados) {
      const clave = `${resultado.prueba.id}-${resultado.lado ?? ""}`;
      let serie = series.get(clave);
      if (!serie) {
        serie = { clave, nombre: nombreConLado(resultado.prueba.nombre, resultado.lado), unidad: resultado.unidad, valores: [] };
        series.set(clave, serie);
      }
      serie.unidad = resultado.unidad; // se muestra la unidad de la medición más reciente
      serie.valores.push({ evaluacionId: evaluacion.id, fecha: evaluacion.fecha, valor: Number(resultado.valor) });
    }
  }

  return [...series.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

// Diferencia entre dos mediciones, ej.: "▲ +2,5 cm (+8,3 %)".
// No se colorea como "mejor" o "peor": según la prueba, subir puede ser bueno (salto) o malo (tiempo de sprint).
export function textoVariacion(anterior: number, actual: number, unidad: string) {
  const diferencia = actual - anterior;
  if (diferencia === 0) return "= sin cambios";
  const signo = diferencia > 0 ? "+" : "";
  const porcentaje =
    anterior !== 0 ? ` (${signo}${formatearNumero((diferencia / Math.abs(anterior)) * 100)} %)` : "";
  return `${diferencia > 0 ? "▲" : "▼"} ${signo}${formatearNumero(diferencia)} ${unidad}${porcentaje}`;
}

// ---------- Próxima evaluación ----------

export function textoDiasRestantes({ diasRestantes }: ProximaEvaluacion) {
  if (diasRestantes < 0) return `Vencida hace ${-diasRestantes} ${-diasRestantes === 1 ? "día" : "días"}`;
  if (diasRestantes === 0) return "Es hoy";
  return `En ${diasRestantes} ${diasRestantes === 1 ? "día" : "días"}`;
}

// Clase de la insignia: roja si está vencida, amarilla si faltan 14 días o menos.
export function claseProximaEvaluacion({ diasRestantes }: ProximaEvaluacion) {
  if (diasRestantes < 0) return "insignia insignia-alerta";
  if (diasRestantes <= 14) return "insignia insignia-aviso";
  return "insignia";
}
