import { ErrorHttp } from "../../lib/errores";
import { prisma } from "../../lib/prisma";
import type { DatosPlan } from "./planes.schemas";

export function listarPlanes(incluirInactivos: boolean) {
  return prisma.plan.findMany({
    where: incluirInactivos ? undefined : { activo: true },
    orderBy: { nombre: "asc" },
  });
}

export async function obtenerPlan(id: number) {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) {
    throw new ErrorHttp(404, "Plan no encontrado");
  }
  return plan;
}

async function verificarNombreLibre(nombre: string, idActual?: number) {
  const otro = await prisma.plan.findFirst({ where: { nombre: { equals: nombre, mode: "insensitive" } } });
  if (otro && otro.id !== idActual) {
    throw new ErrorHttp(409, `Ya existe un plan llamado "${otro.nombre}"`);
  }
}

export async function crearPlan(datos: DatosPlan) {
  await verificarNombreLibre(datos.nombre);
  return prisma.plan.create({ data: datos });
}

// Cambiar el precio no modifica las cuotas ya generadas: cada cuota guarda su propio importe.
export async function actualizarPlan(id: number, datos: DatosPlan) {
  await obtenerPlan(id);
  await verificarNombreLibre(datos.nombre, id);
  return prisma.plan.update({ where: { id }, data: datos });
}
