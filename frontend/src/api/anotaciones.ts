import { pedir } from "./cliente";

export type TipoAnotacion =
  | "OBSERVACION"
  | "CORRECCION_TECNICA"
  | "CAMBIO_EJERCICIO"
  | "CARGA"
  | "MOLESTIA"
  | "OTRO";

export interface Anotacion {
  id: number;
  alumnoId: number;
  fecha: string; // ISO; la fecha son los primeros 10 caracteres
  tipo: TipoAnotacion;
  detalle: string;
  motivo: string | null;
}

// Datos del formulario (todo como texto; el backend valida y convierte).
export interface DatosAnotacion {
  fecha: string; // "aaaa-mm-dd"
  tipo: TipoAnotacion | "";
  detalle: string;
  motivo: string;
}

export const anotacionesApi = {
  listar: (alumnoId: number) => pedir<Anotacion[]>(`/alumnos/${alumnoId}/anotaciones`),

  crear: (alumnoId: number, datos: DatosAnotacion) =>
    pedir<Anotacion>(`/alumnos/${alumnoId}/anotaciones`, { metodo: "POST", datos }),

  actualizar: (id: number, datos: DatosAnotacion) =>
    pedir<Anotacion>(`/anotaciones/${id}`, { metodo: "PUT", datos }),

  eliminar: (id: number) => pedir<void>(`/anotaciones/${id}`, { metodo: "DELETE" }),
};
