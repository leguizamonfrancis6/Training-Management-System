import { Prisma, type Cuota } from "@prisma/client";
import { ErrorHttp } from "../../lib/errores";
import {
  diasEntre,
  fechaArgentina,
  fechaDesdeTexto,
  formatearFechaTexto,
  hoyComoTexto,
  sumarMeses,
  textoDesdeFecha,
} from "../../lib/fechas";
import { formatearMoneda, sumarMontos } from "../../lib/montos";
import { prisma } from "../../lib/prisma";
import { obtenerAlumno } from "../alumnos/alumnos.service";
import type { DatosPago } from "./pagos.schemas";

// Con cuántos días de anticipación una cuota figura como "por vencer".
export const DIAS_AVISO_VENCIMIENTO = 7;

// Tope de seguridad de cuotas adeudadas que se calculan (10 años).
const MAXIMO_CUOTAS_ADEUDADAS = 120;

export type EstadoCuota = "SIN_PAGOS" | "AL_DIA" | "POR_VENCER" | "VENCIDA";

type CuotaConPagos = Cuota & { pagos: { importe: Prisma.Decimal }[] };

// Datos del alumno que hacen falta para calcular la deuda.
interface ContextoAlumno {
  activo: boolean;
  reactivadoEl: string | null; // "aaaa-mm-dd" de la última reactivación, si hubo
  precioPlan: Prisma.Decimal | null; // precio actual del plan (vale cada cuota adeudada)
}

// Para traer las cuotas con lo pagado, de la más nueva a la más vieja.
const cuotasConPagos = {
  include: { pagos: { select: { importe: true } } },
  orderBy: [{ desde: "desc" }, { id: "desc" }],
} satisfies Prisma.Alumno$cuotasArgs;

// Para traer la última reactivación del alumno (queda en el historial de cambios).
const ultimaReactivacion = {
  where: { campo: "activo", valorNuevo: "true" },
  select: { fecha: true },
  orderBy: { fecha: "desc" },
  take: 1,
} satisfies Prisma.Alumno$cambiosArgs;

function armarContexto(alumno: {
  activo: boolean;
  plan: { precioMensual: Prisma.Decimal } | null;
  cambios: { fecha: Date }[];
}): ContextoAlumno {
  return {
    activo: alumno.activo,
    reactivadoEl: alumno.cambios[0] ? fechaArgentina(alumno.cambios[0].fecha) : null,
    precioPlan: alumno.plan?.precioMensual ?? null,
  };
}

function resumirCuota(cuota: CuotaConPagos) {
  const pagado = sumarMontos(cuota.pagos.map((pago) => pago.importe));
  const saldo = cuota.importe.minus(pagado);
  return {
    id: cuota.id,
    desde: textoDesdeFecha(cuota.desde),
    vence: textoDesdeFecha(cuota.vence),
    importe: cuota.importe,
    pagado,
    saldo: saldo.isNegative() ? new Prisma.Decimal(0) : saldo,
    anulada: cuota.anulada,
  };
}

// Dónde empieza la próxima cuota: donde venció la última, o en la reactivación si fue posterior.
// null = el alumno nunca pagó (o está inactivo): la cuota empieza en la fecha de pago.
function inicioProximaCuota(ultimaVence: string | null, contexto: ContextoAlumno) {
  if (!ultimaVence || !contexto.activo) return null;
  return contexto.reactivadoEl && contexto.reactivadoEl > ultimaVence ? contexto.reactivadoEl : ultimaVence;
}

// Cuotas mensuales sin pagar desde el inicio de la próxima cuota hasta hoy.
// Solo para alumnos activos: por eso Agustín tiene que dar de baja a quien deja de venir.
function calcularCuotasAdeudadas(inicio: string | null) {
  if (!inicio) return [];
  const hoy = hoyComoTexto();
  const adeudadas: { desde: string; vence: string }[] = [];
  // Cada período se calcula desde el inicio (inicio + k meses) para no "correr" los fines de mes.
  for (let k = 0; k < MAXIMO_CUOTAS_ADEUDADAS; k++) {
    const desde = sumarMeses(inicio, k);
    if (desde >= hoy) break; // el día del vencimiento todavía no se debe
    adeudadas.push({ desde, vence: sumarMeses(inicio, k + 1) });
  }
  return adeudadas;
}

// Situación de pagos de un alumno a partir de sus cuotas (ordenadas de la más nueva a la más vieja).
// - Estado: según la última cuota. Vencida si su vencimiento ya pasó; por vencer si faltan 7 días o menos.
// - Deuda: las cuotas mensuales sin pagar desde el vencimiento de la última cuota (solo alumnos activos),
//   cada una al precio actual del plan, más los saldos de cuotas pagadas en parte (si quedara alguno).
// La usa también el panel principal.
export function calcularSituacion(cuotas: CuotaConPagos[], contexto: ContextoAlumno) {
  const resumidas = cuotas.map(resumirCuota);
  const ultimaCuota = resumidas[0] ?? null;
  const cuotasConSaldo = resumidas.filter((cuota) => cuota.saldo.gt(0));

  let estado: EstadoCuota = "SIN_PAGOS";
  let diasRestantes: number | null = null;
  if (ultimaCuota) {
    diasRestantes = diasEntre(hoyComoTexto(), ultimaCuota.vence);
    if (diasRestantes < 0) estado = "VENCIDA";
    else if (diasRestantes <= DIAS_AVISO_VENCIMIENTO) estado = "POR_VENCER";
    else estado = "AL_DIA";
  }

  const inicio = inicioProximaCuota(ultimaCuota?.vence ?? null, contexto);
  const cuotasAdeudadas = calcularCuotasAdeudadas(inicio);
  const precio = contexto.precioPlan && contexto.precioPlan.gt(0) ? contexto.precioPlan : null;
  const deudaCuotas = precio ? precio.times(cuotasAdeudadas.length) : new Prisma.Decimal(0);

  return {
    estado,
    vence: ultimaCuota?.vence ?? null,
    diasRestantes,
    ultimaCuota,
    inicioProximaCuota: inicio,
    cuotasAdeudadas,
    precioCuotaAdeudada: precio, // null si el plan no tiene precio: se sabe cuántas cuotas debe pero no el monto
    cuotasConSaldo,
    deudaTotal: deudaCuotas.plus(sumarMontos(cuotasConSaldo.map((cuota) => cuota.saldo))),
  };
}

// Trae todo lo necesario para calcular la situación de un alumno.
async function cargarSituacion(alumnoId: number) {
  const alumno = await obtenerAlumno(alumnoId); // 404 si no existe
  const [cuotas, reactivaciones] = await Promise.all([
    prisma.cuota.findMany({ where: { alumnoId }, ...cuotasConPagos }),
    prisma.cambioAlumno.findMany({ ...ultimaReactivacion, where: { ...ultimaReactivacion.where, alumnoId } }),
  ]);
  const situacion = calcularSituacion(cuotas, armarContexto({ ...alumno, cambios: reactivaciones }));
  return { alumno, cuotas, situacion };
}

// ---------- Pagos de un alumno ----------

export async function obtenerPagosAlumno(alumnoId: number) {
  const { alumno, situacion } = await cargarSituacion(alumnoId);
  const pagos = await prisma.pago.findMany({
    where: { alumnoId },
    include: { cuota: { select: { desde: true, vence: true } } },
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
  });
  return { plan: alumno.plan, situacion, pagos };
}

export async function registrarPago(alumnoId: number, datos: DatosPago) {
  const { alumno, situacion } = await cargarSituacion(alumnoId);
  const fecha = fechaDesdeTexto(datos.fecha);

  if (datos.tipo === "CUOTA") {
    const planId = alumno.planId;
    if (!planId) {
      throw new ErrorHttp(400, "El alumno no tiene una membresía asignada. Asignale una antes de registrar la cuota.");
    }
    if (datos.importe.gt(datos.importeCuota)) {
      throw new ErrorHttp(400, "Lo que paga no puede superar el importe de la cuota");
    }
    // La cuota cubre el período más viejo que debe (o el siguiente, si está al día).
    // Si nunca pagó, empieza en la fecha de pago.
    const desde = situacion.inicioProximaCuota ?? datos.fecha;
    // Cuota y pago se crean juntos: o se guardan los dos, o ninguno.
    return prisma.$transaction(async (tx) => {
      const cuota = await tx.cuota.create({
        data: {
          alumnoId,
          planId,
          desde: fechaDesdeTexto(desde),
          vence: fechaDesdeTexto(sumarMeses(desde, 1)),
          importe: datos.importeCuota,
        },
      });
      return tx.pago.create({
        data: { alumnoId, cuotaId: cuota.id, fecha, importe: datos.importe, medio: datos.medio, concepto: "Cuota mensual" },
      });
    });
  }

  if (datos.tipo === "SALDO") {
    const cuota = await prisma.cuota.findFirst({
      where: { id: datos.cuotaId, alumnoId },
      include: { pagos: { select: { importe: true } } },
    });
    if (!cuota) {
      throw new ErrorHttp(404, "Cuota no encontrada");
    }
    const { saldo } = resumirCuota(cuota);
    if (!saldo.gt(0)) {
      throw new ErrorHttp(400, "Esa cuota no tiene saldo pendiente");
    }
    if (datos.importe.gt(saldo)) {
      throw new ErrorHttp(400, `El pago supera el saldo pendiente (${formatearMoneda(saldo)})`);
    }
    return prisma.pago.create({
      data: { alumnoId, cuotaId: cuota.id, fecha, importe: datos.importe, medio: datos.medio, concepto: "Saldo de cuota" },
    });
  }

  // Otro concepto: pago sin cuota.
  return prisma.pago.create({
    data: { alumnoId, fecha, importe: datos.importe, medio: datos.medio, concepto: datos.concepto },
  });
}

// "Anular deuda": el alumno avisa (con la cuota ya vencida) que no va a seguir entrenando.
// Las cuotas adeudadas se registran como anuladas (importe 0), así dejan de figurar como deuda,
// y queda constancia en el historial de cambios. Dar de baja al alumno es un paso aparte.
export async function anularDeuda(alumnoId: number) {
  const { alumno, situacion } = await cargarSituacion(alumnoId);
  const { cuotasAdeudadas, ultimaCuota, deudaTotal } = situacion;
  if (cuotasAdeudadas.length === 0) {
    throw new ErrorHttp(400, "El alumno no tiene cuotas adeudadas");
  }
  const planId = alumno.planId ?? (await prisma.cuota.findUnique({ where: { id: ultimaCuota!.id } }))!.planId;
  const primera = cuotasAdeudadas[0];
  const ultima = cuotasAdeudadas[cuotasAdeudadas.length - 1];
  const descripcion =
    `${cuotasAdeudadas.length} ${cuotasAdeudadas.length === 1 ? "cuota" : "cuotas"} ` +
    `(del ${formatearFechaTexto(primera.desde)} al ${formatearFechaTexto(ultima.vence)})` +
    (deudaTotal.gt(0) ? `: ${formatearMoneda(deudaTotal)}` : "");

  await prisma.$transaction(async (tx) => {
    await tx.cuota.createMany({
      data: cuotasAdeudadas.map((periodo) => ({
        alumnoId,
        planId,
        desde: fechaDesdeTexto(periodo.desde),
        vence: fechaDesdeTexto(periodo.vence),
        importe: 0,
        anulada: true,
      })),
    });
    await tx.cambioAlumno.create({
      data: { alumnoId, campo: "deuda", valorAnterior: descripcion, valorNuevo: "Anulada" },
    });
  });
}

// Para corregir un pago cargado por error. Si era el único pago de su cuota, la cuota también se borra
// (la cuota nace con el pago: sin pagos no tiene sentido).
export async function eliminarPago(id: number) {
  const pago = await prisma.pago.findUnique({ where: { id } });
  if (!pago) {
    throw new ErrorHttp(404, "Pago no encontrado");
  }
  await prisma.$transaction(async (tx) => {
    await tx.pago.delete({ where: { id } });
    if (pago.cuotaId) {
      const restantes = await tx.pago.count({ where: { cuotaId: pago.cuotaId } });
      if (restantes === 0) {
        await tx.cuota.delete({ where: { id: pago.cuotaId } });
      }
    }
  });
}

// Saldo de una cuota pagada en parte (caso que ya no se genera desde la pantalla, se conserva por si existe):
// el importe de la cuota pasa a ser lo efectivamente pagado.
export async function anularSaldo(cuotaId: number) {
  const cuota = await prisma.cuota.findUnique({ where: { id: cuotaId }, include: { pagos: { select: { importe: true } } } });
  if (!cuota) {
    throw new ErrorHttp(404, "Cuota no encontrada");
  }
  const { pagado, saldo } = resumirCuota(cuota);
  if (!saldo.gt(0)) {
    throw new ErrorHttp(400, "Esa cuota no tiene saldo pendiente");
  }
  return prisma.cuota.update({ where: { id: cuotaId }, data: { importe: pagado } });
}

// ---------- Estado de cuotas de todos los alumnos activos ----------

// Orden: lo que requiere atención primero.
const PRIORIDAD: Record<EstadoCuota, number> = { VENCIDA: 0, POR_VENCER: 1, SIN_PAGOS: 2, AL_DIA: 3 };

export async function obtenerEstadoCuotas() {
  const alumnos = await prisma.alumno.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      telefono: true,
      activo: true,
      plan: { select: { nombre: true, precioMensual: true } },
      cuotas: cuotasConPagos,
      cambios: ultimaReactivacion,
    },
  });

  const filas = alumnos.map((alumno) => {
    const situacion = calcularSituacion(alumno.cuotas, armarContexto(alumno));
    return {
      id: alumno.id,
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      telefono: alumno.telefono,
      plan: alumno.plan?.nombre ?? null,
      estado: situacion.estado,
      vence: situacion.vence,
      diasRestantes: situacion.diasRestantes,
      cantidadAdeudadas: situacion.cuotasAdeudadas.length,
      deudaTotal: situacion.deudaTotal,
    };
  });

  // Dentro del mismo estado: los que deben más cuotas primero, después por días y apellido.
  return filas.sort(
    (a, b) =>
      PRIORIDAD[a.estado] - PRIORIDAD[b.estado] ||
      b.cantidadAdeudadas - a.cantidadAdeudadas ||
      Number(b.deudaTotal.gt(0)) - Number(a.deudaTotal.gt(0)) ||
      (a.diasRestantes ?? 0) - (b.diasRestantes ?? 0) ||
      a.apellido.localeCompare(b.apellido),
  );
}

// ---------- Reporte de ingresos ----------

// Los pagos más recientes (de todos los alumnos), para la lista "Últimos ingresos" de Pagos.
export function obtenerUltimosPagos(cantidad: number) {
  return prisma.pago.findMany({
    include: { alumno: { select: { id: true, nombre: true, apellido: true } } },
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
    take: cantidad,
  });
}

export async function obtenerIngresos(desde: string, hasta: string) {
  const pagos = await prisma.pago.findMany({
    where: { fecha: { gte: fechaDesdeTexto(desde), lte: fechaDesdeTexto(hasta) } },
    include: { alumno: { select: { id: true, nombre: true, apellido: true } } },
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
  });

  const cero = () => new Prisma.Decimal(0);
  const totales = { total: cero(), efectivo: cero(), transferencia: cero(), cuotas: cero(), otros: cero() };
  const porMes = new Map<string, { mes: string; total: Prisma.Decimal; efectivo: Prisma.Decimal; transferencia: Prisma.Decimal }>();

  for (const pago of pagos) {
    const esEfectivo = pago.medio === "EFECTIVO";
    totales.total = totales.total.plus(pago.importe);
    if (esEfectivo) totales.efectivo = totales.efectivo.plus(pago.importe);
    else totales.transferencia = totales.transferencia.plus(pago.importe);
    if (pago.cuotaId) totales.cuotas = totales.cuotas.plus(pago.importe);
    else totales.otros = totales.otros.plus(pago.importe);

    const mes = textoDesdeFecha(pago.fecha).slice(0, 7); // "aaaa-mm"
    const fila = porMes.get(mes) ?? { mes, total: cero(), efectivo: cero(), transferencia: cero() };
    fila.total = fila.total.plus(pago.importe);
    if (esEfectivo) fila.efectivo = fila.efectivo.plus(pago.importe);
    else fila.transferencia = fila.transferencia.plus(pago.importe);
    porMes.set(mes, fila);
  }

  return {
    desde,
    hasta,
    cantidad: pagos.length,
    totales,
    porMes: [...porMes.values()].sort((a, b) => a.mes.localeCompare(b.mes)),
    pagos,
  };
}
