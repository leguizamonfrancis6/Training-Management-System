import { ErrorHttp } from "../../lib/errores";
import { prisma } from "../../lib/prisma";
import type { DatosPrecioPlan } from "./planes.schemas";

// Los 4 planes fijos, en el orden de las modalidades (Presencial, Semi presencial, Online, Otro).
export function listarPlanes() {
  return prisma.plan.findMany({ orderBy: { modalidad: "asc" } });
}

async function obtenerPlan(id: number) {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) {
    throw new ErrorHttp(404, "Membresía no encontrada");
  }
  return plan;
}

// Cambiar el precio no modifica las cuotas ya generadas: cada cuota guarda su propio importe.
export async function actualizarPrecioPlan(id: number, datos: DatosPrecioPlan) {
  await obtenerPlan(id);
  return prisma.plan.update({ where: { id }, data: { precioMensual: datos.precioMensual } });
}
