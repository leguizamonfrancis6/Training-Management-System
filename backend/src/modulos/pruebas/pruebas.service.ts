import { ErrorHttp } from "../../lib/errores";
import { prisma } from "../../lib/prisma";
import type { DatosPrueba } from "./pruebas.schemas";

export function listarPruebas(incluirInactivas: boolean) {
  return prisma.prueba.findMany({
    where: incluirInactivas ? undefined : { activa: true },
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
  });
}

async function obtenerPrueba(id: number) {
  const prueba = await prisma.prueba.findUnique({ where: { id } });
  if (!prueba) {
    throw new ErrorHttp(404, "Prueba no encontrada");
  }
  return prueba;
}

// El nombre identifica la prueba en las comparaciones: no puede repetirse
// (sin distinguir mayúsculas, para evitar "CMJ" y "cmj" como pruebas distintas).
async function verificarNombreLibre(nombre: string, idActual?: number) {
  const otra = await prisma.prueba.findFirst({ where: { nombre: { equals: nombre, mode: "insensitive" } } });
  if (otra && otra.id !== idActual) {
    throw new ErrorHttp(409, `Ya existe una prueba llamada "${otra.nombre}"`);
  }
}

export async function crearPrueba(datos: DatosPrueba) {
  await verificarNombreLibre(datos.nombre);
  return prisma.prueba.create({ data: datos });
}

// Cambiar la unidad de una prueba no modifica los resultados ya cargados: cada resultado
// guarda la unidad con la que se midió.
export async function actualizarPrueba(id: number, datos: DatosPrueba) {
  await obtenerPrueba(id);
  await verificarNombreLibre(datos.nombre, id);
  return prisma.prueba.update({ where: { id }, data: datos });
}
