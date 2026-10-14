import type { TipoBloque } from "../api/rutinas";

export const ETIQUETAS_TIPO_BLOQUE: Record<TipoBloque, string> = {
  MICROCICLOS_2_SEMANAS: "Bloque de 4 microciclos de 2 semanas",
  MICROCICLOS_1_SEMANA: "Bloque de 4 microciclos de 1 semana",
};

// Versión corta para tablas.
export const ETIQUETAS_TIPO_BLOQUE_CORTAS: Record<TipoBloque, string> = {
  MICROCICLOS_2_SEMANAS: "4 × 2 semanas",
  MICROCICLOS_1_SEMANA: "4 × 1 semana",
};
