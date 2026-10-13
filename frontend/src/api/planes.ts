import { pedir } from "./cliente";

export type Modalidad = "PRESENCIAL" | "SEMIPRESENCIAL" | "ONLINE";

export interface Plan {
  id: number;
  nombre: string;
  modalidad: Modalidad;
  precioMensual: string; // Decimal como texto, ej.: "25000"
  activo: boolean;
}

export interface DatosPlan {
  nombre: string;
  modalidad: Modalidad | "";
  precioMensual: string; // acepta "25.000" o "25.000,50"
  activo: boolean;
}

export const planesApi = {
  listar: (incluirInactivos = false) => pedir<Plan[]>(`/planes${incluirInactivos ? "?incluirInactivos=true" : ""}`),

  crear: (datos: DatosPlan) => pedir<Plan>("/planes", { metodo: "POST", datos }),

  actualizar: (id: number, datos: DatosPlan) => pedir<Plan>(`/planes/${id}`, { metodo: "PUT", datos }),
};
