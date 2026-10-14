import { ErrorHttp } from "../../lib/errores";
import { prisma } from "../../lib/prisma";
import { obtenerAlumno } from "../alumnos/alumnos.service";
import type { DatosPrecioPlan } from "./planes.schemas";

const datosPlan = { select: { id: true, nombre: true, modalidad: true, precioMensual: true, activo: true } };

// Alumnos activos con su plan actual y desde cuándo lo tienen.
export async function listarAlumnosConPlan() {
  const alumnos = await prisma.alumno.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      plan: datosPlan,
      asignacionesPlan: { where: { hasta: null }, select: { desde: true }, take: 1 },
    },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });
  return alumnos.map(({ asignacionesPlan, ...alumno }) => ({
    ...alumno,
    desde: asignacionesPlan[0]?.desde ?? null,
  }));
}

// Historial de planes de un alumno, del más reciente al más viejo.
export async function obtenerHistorialPlanes(alumnoId: number) {
  const alumno = await obtenerAlumno(alumnoId);
  const asignaciones = await prisma.asignacionPlan.findMany({
    where: { alumnoId },
    include: { plan: datosPlan },
    orderBy: [{ desde: "desc" }, { id: "desc" }],
  });
  return {
    alumno: { id: alumno.id, nombre: alumno.nombre, apellido: alumno.apellido, activo: alumno.activo, plan: alumno.plan },
    asignaciones,
  };
}

// Los 4 planes fijos, en el orden de las modalidades (Presencial, Semi presencial, Online, Otro).
export function listarPlanes() {
  return prisma.plan.findMany({ orderBy: { modalidad: "asc" } });
}

export async function obtenerPlan(id: number) {
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
