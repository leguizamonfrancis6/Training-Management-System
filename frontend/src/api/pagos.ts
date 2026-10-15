import { pedir } from "./cliente";
import type { Plan } from "./planes";

export type MedioPago = "EFECTIVO" | "TRANSFERENCIA";
export type EstadoCuota = "SIN_PAGOS" | "AL_DIA" | "POR_VENCER" | "VENCIDA";

// Los montos llegan como texto ("25000.5") para no perder precisión.
export interface CuotaResumen {
  id: number;
  desde: string; // "aaaa-mm-dd"
  vence: string; // "aaaa-mm-dd"
  importe: string;
  pagado: string;
  saldo: string;
  anulada: boolean;
}

// Mes sin pagar (desde → vence).
export interface PeriodoAdeudado {
  desde: string; // "aaaa-mm-dd"
  vence: string; // "aaaa-mm-dd"
}

export interface Situacion {
  estado: EstadoCuota;
  vence: string | null;
  diasRestantes: number | null; // negativo = vencida
  ultimaCuota: CuotaResumen | null;
  inicioProximaCuota: string | null; // dónde empieza la próxima cuota; null = en la fecha de pago
  cuotasAdeudadas: PeriodoAdeudado[]; // meses sin pagar desde el último vencimiento (solo alumnos activos)
  precioCuotaAdeudada: string | null; // precio de cada cuota adeudada; null si el plan no tiene precio
  cuotasConSaldo: CuotaResumen[]; // cuotas pagadas en parte (ya no se generan, se conservan por si existen)
  deudaTotal: string;
}

export interface Pago {
  id: number;
  alumnoId: number;
  cuotaId: number | null; // null = otro concepto
  fecha: string; // ISO
  importe: string;
  concepto: string;
  medio: MedioPago;
  cuota: { desde: string; vence: string } | null;
}

export interface PagosAlumno {
  plan: Plan | null;
  situacion: Situacion;
  pagos: Pago[]; // del más reciente al más viejo
}

export interface EstadoCuotaAlumno {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  plan: string | null;
  estado: EstadoCuota;
  vence: string | null;
  diasRestantes: number | null;
  cantidadAdeudadas: number;
  deudaTotal: string;
}

// Pago con los datos del alumno (listas de ingresos).
export type PagoConAlumno = Pago & { alumno: { id: number; nombre: string; apellido: string } };

export interface ReporteIngresos {
  desde: string;
  hasta: string;
  cantidad: number;
  totales: { total: string; efectivo: string; transferencia: string; cuotas: string; otros: string };
  porMes: { mes: string; total: string; efectivo: string; transferencia: string }[]; // mes = "aaaa-mm"
  pagos: PagoConAlumno[];
}

// Tres tipos de pago; "tipo" indica cuáles son los demás campos.
export type DatosPago =
  | { tipo: "CUOTA"; fecha: string; importeCuota: string; importe: string; medio: MedioPago }
  | { tipo: "SALDO"; cuotaId: number; fecha: string; importe: string; medio: MedioPago }
  | { tipo: "OTRO"; fecha: string; importe: string; concepto: string; medio: MedioPago };

export const pagosApi = {
  obtener: (alumnoId: number) => pedir<PagosAlumno>(`/alumnos/${alumnoId}/pagos`),

  registrar: (alumnoId: number, datos: DatosPago) =>
    pedir<Pago>(`/alumnos/${alumnoId}/pagos`, { metodo: "POST", datos }),

  eliminar: (id: number) => pedir<void>(`/pagos/${id}`, { metodo: "DELETE" }),

  anularDeuda: (alumnoId: number) => pedir<void>(`/alumnos/${alumnoId}/anular-deuda`, { metodo: "POST" }),

  anularSaldo: (cuotaId: number) => pedir<unknown>(`/cuotas/${cuotaId}/anular-saldo`, { metodo: "POST" }),

  estadoCuotas: () => pedir<EstadoCuotaAlumno[]>("/pagos/estado-cuotas"),

  ultimos: (cantidad: number) => pedir<PagoConAlumno[]>(`/pagos/ultimos?cantidad=${cantidad}`),

  ingresos: (desde: string, hasta: string) =>
    pedir<ReporteIngresos>(`/pagos/ingresos?desde=${desde}&hasta=${hasta}`),
};
