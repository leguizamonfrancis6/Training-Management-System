import { pedir } from "./cliente";

export type Modalidad = "PRESENCIAL" | "SEMIPRESENCIAL" | "ONLINE" | "OTRO";

// Hay un plan fijo por modalidad (Presencial, Semi presencial, Online, Otro); solo cambia su precio.
export interface Plan {
  id: number;
  nombre: string;
  modalidad: Modalidad;
  precioMensual: string; // Decimal como texto, ej.: "25000"; "0" = precio sin definir
  activo: boolean;
}

// Alumno activo con su plan actual (pantalla Planes).
export interface AlumnoConPlan {
  id: number;
  nombre: string;
  apellido: string;
  plan: Plan | null;
  desde: string | null; // ISO: desde cuándo tiene el plan actual
}

export interface AsignacionPlan {
  id: number;
  planId: number;
  desde: string; // ISO
  hasta: string | null; // null = plan actual
  plan: Plan;
}

export interface HistorialPlanes {
  alumno: { id: number; nombre: string; apellido: string; activo: boolean; plan: Plan | null };
  asignaciones: AsignacionPlan[]; // de la más reciente a la más vieja
}

export const planesApi = {
  alumnos: () => pedir<AlumnoConPlan[]>("/planes/alumnos"),

  historialAlumno: (alumnoId: number) => pedir<HistorialPlanes>(`/planes/alumnos/${alumnoId}`),

  listar: () => pedir<Plan[]>("/planes"),

  // precioMensual acepta "25.000" o "25.000,50"
  actualizarPrecio: (id: number, precioMensual: string) =>
    pedir<Plan>(`/planes/${id}`, { metodo: "PUT", datos: { precioMensual } }),
};
