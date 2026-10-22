import { pedir } from "./cliente";

export type Modalidad = "PRESENCIAL" | "SEMIPRESENCIAL" | "ONLINE" | "OTRO";

// Hay un plan fijo por modalidad (Presencial, Semi presencial, Online, Otro); solo cambia su precio.
export interface Plan {
  id: number;
  nombre: string;
  modalidad: Modalidad;
  precioMensual: string; // Decimal como texto, ej.: "25000"; "0" = precio sin definir
}

export const planesApi = {
  listar: () => pedir<Plan[]>("/planes"),

  // precioMensual acepta "25.000" o "25.000,50"
  actualizarPrecio: (id: number, precioMensual: string) =>
    pedir<Plan>(`/planes/${id}`, { metodo: "PUT", datos: { precioMensual } }),
};
