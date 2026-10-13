import { Prisma, type Cuota } from "@prisma/client";
import { ErrorHttp } from "../../lib/errores";
import { diasEntre, fechaDesdeTexto, hoyComoTexto, sumarMeses, textoDesdeFecha } from "../../lib/fechas";
import { formatearMoneda, sumarMontos } from "../../lib/montos";
import { prisma } from "../../lib/prisma";
import { obtenerAlumno } from "../alumnos/alumnos.service";
import type { DatosPago } from "./pagos.schemas";

// Con cuántos días de anticipación una cuota figura como "por vencer".
export const DIAS_AVISO_VENCIMIENTO = 7;

export type EstadoCuota = "SIN_PAGOS" | "AL_DIA" | "POR_VENCER" | "VENCIDA";

type CuotaConPagos = Cuota & { pagos: { importe: Prisma.Decimal }[] };

// Para traer las cuotas con lo pagado, de la más nueva a la más vieja.
const cuotasConPagos = {
  include: { pagos: { select: { importe: true } } },
  orderBy: [{ desde: "desc" }, { id: "desc" }],
} satisfies Prisma.Alumno$cuotasArgs;

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
  };
}

// Situación de pagos de un alumno a partir de sus cuotas (ordenadas de la más nueva a la más vieja).
// - Estado: según la última cuota. Vencida si su vencimiento ya pasó; por vencer si faltan 7 días o menos.
// - Deuda: solo la generan los pagos parciales (los meses sin pagar no acumulan cuotas).
// La usa también el panel principal.
export function calcularSituacion(cuotas: CuotaConPagos[]) {
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

  return {
    estado,
    vence: ultimaCuota?.vence ?? null,
    diasRestantes,
    ultimaCuota,
    cuotasConSaldo,
    deudaTotal: sumarMontos(cuotasConSaldo.map((cuota) => cuota.saldo)),
  };
}

// ---------- Pagos de un alumno ----------

export async function obtenerPagosAlumno(alumnoId: number) {
  const alumno = await obtenerAlumno(alumnoId);
  const [cuotas, pagos] = await Promise.all([
    prisma.cuota.findMany({ where: { alumnoId }, ...cuotasConPagos }),
    prisma.pago.findMany({
      where: { alumnoId },
      include: { cuota: { select: { desde: true, vence: true } } },
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
    }),
  ]);
  return { plan: alumno.plan, situacion: calcularSituacion(cuotas), pagos };
}

export async function registrarPago(alumnoId: number, datos: DatosPago) {
  const alumno = await obtenerAlumno(alumnoId);
  const fecha = fechaDesdeTexto(datos.fecha);

  if (datos.tipo === "CUOTA") {
    const planId = alumno.planId;
    if (!planId) {
      throw new ErrorHttp(400, "El alumno no tiene un plan asignado. Asignale uno antes de registrar la cuota.");
    }
    if (datos.importe.gt(datos.importeCuota)) {
      throw new ErrorHttp(400, "Lo que paga no puede superar el importe de la cuota");
    }
    // Cuota y pago se crean juntos: o se guardan los dos, o ninguno.
    return prisma.$transaction(async (tx) => {
      const cuota = await tx.cuota.create({
        data: {
          alumnoId,
          planId,
          desde: fecha,
          vence: fechaDesdeTexto(sumarMeses(datos.fecha, 1)),
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

// Agustín decide no cobrar el saldo pendiente: el importe de la cuota pasa a ser lo efectivamente pagado.
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
      plan: { select: { nombre: true } },
      cuotas: cuotasConPagos,
    },
  });

  const filas = alumnos.map((alumno) => {
    const situacion = calcularSituacion(alumno.cuotas);
    return {
      id: alumno.id,
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      telefono: alumno.telefono,
      plan: alumno.plan?.nombre ?? null,
      estado: situacion.estado,
      vence: situacion.vence,
      diasRestantes: situacion.diasRestantes,
      deudaTotal: situacion.deudaTotal,
    };
  });

  // Dentro del mismo estado: los que tienen deuda primero, después por días (la más vencida primero).
  return filas.sort(
    (a, b) =>
      PRIORIDAD[a.estado] - PRIORIDAD[b.estado] ||
      Number(b.deudaTotal.gt(0)) - Number(a.deudaTotal.gt(0)) ||
      (a.diasRestantes ?? 0) - (b.diasRestantes ?? 0) ||
      a.apellido.localeCompare(b.apellido),
  );
}

// ---------- Reporte de ingresos ----------

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
