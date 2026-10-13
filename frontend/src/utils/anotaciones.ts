import type { TipoAnotacion } from "../api/anotaciones";

export const ETIQUETAS_TIPO_ANOTACION: Record<TipoAnotacion, string> = {
  OBSERVACION: "Observación",
  CORRECCION_TECNICA: "Corrección técnica",
  CAMBIO_EJERCICIO: "Cambio de ejercicio",
  CARGA: "Carga",
  MOLESTIA: "Molestia",
  OTRO: "Otro",
};
