import type { Prisma } from "@prisma/client";
import { ErrorHttp } from "../../lib/errores";
import { fechaDesdeTexto, textoDesdeFecha } from "../../lib/fechas";
import { prisma } from "../../lib/prisma";
import { esquemaAlumno, type DatosAlumno, type FiltrosAlumnos } from "./alumnos.schemas";

// Campos que se comparan al editar para registrar el historial (los mismos del formulario).
const CAMPOS_FICHA = Object.keys(esquemaAlumno.shape) as (keyof DatosAlumno)[];

function datosParaPrisma(datos: DatosAlumno) {
  return { ...datos, fechaNacimiento: fechaDesdeTexto(datos.fechaNacimiento) };
}

// El historial guarda los valores como texto (las fechas como "aaaa-mm-dd").
function valorComoTexto(valor: unknown) {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return textoDesdeFecha(valor);
  return String(valor);
}

// Minúsculas y sin tildes, para que "perez" encuentre a "Pérez".
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export async function listarAlumnos(filtros: FiltrosAlumnos) {
  const where: Prisma.AlumnoWhereInput = {
    activo: filtros.estado === "todos" ? undefined : filtros.estado === "activos",
    perfil: filtros.perfil,
  };

  const alumnos = await prisma.alumno.findMany({
    where,
    select: {
      id: true,
      nombre: true,
      apellido: true,
      dni: true,
      fechaNacimiento: true,
      telefono: true,
      perfil: true,
      activo: true,
    },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });

  // La búsqueda por texto se hace acá y no en la base: con unos cientos de alumnos es
  // instantánea y permite ignorar tildes sin instalar extensiones de PostgreSQL.
  // Cada palabra tiene que aparecer en el nombre, el apellido o el DNI:
  // así "juan perez" encuentra a "Pérez, Juan Carlos".
  const palabras = normalizar(filtros.buscar ?? "").split(/\s+/).filter(Boolean);
  if (palabras.length === 0) {
    return alumnos;
  }
  return alumnos.filter((alumno) => {
    const texto = normalizar(`${alumno.nombre} ${alumno.apellido} ${alumno.dni}`);
    return palabras.every((palabra) => texto.includes(palabra));
  });
}

export async function obtenerAlumno(id: number) {
  const alumno = await prisma.alumno.findUnique({
    where: { id },
    include: { plan: { select: { id: true, nombre: true, modalidad: true, precioMensual: true, activo: true } } },
  });
  if (!alumno) {
    throw new ErrorHttp(404, "Alumno no encontrado");
  }
  return alumno;
}

export async function obtenerHistorial(id: number) {
  await obtenerAlumno(id); // 404 si no existe
  return prisma.cambioAlumno.findMany({
    where: { alumnoId: id },
    orderBy: { fecha: "desc" },
  });
}

async function verificarDniLibre(dni: string, idActual?: number) {
  const otro = await prisma.alumno.findUnique({ where: { dni } });
  if (otro && otro.id !== idActual) {
    throw new ErrorHttp(409, `Ya existe un alumno con el DNI ${dni} (${otro.apellido}, ${otro.nombre})`);
  }
}

export async function crearAlumno(datos: DatosAlumno) {
  await verificarDniLibre(datos.dni);
  return prisma.alumno.create({ data: datosParaPrisma(datos) });
}

// Actualiza la ficha y, en la misma transacción, registra una fila de historial
// por cada campo que cambió: o se guarda todo, o no se guarda nada.
export async function actualizarAlumno(id: number, datos: DatosAlumno) {
  const actual = await obtenerAlumno(id);
  await verificarDniLibre(datos.dni, id);

  const nuevos = datosParaPrisma(datos);
  const cambios = CAMPOS_FICHA.map((campo) => ({
    alumnoId: id,
    campo,
    valorAnterior: valorComoTexto(actual[campo]),
    valorNuevo: valorComoTexto(nuevos[campo]),
  })).filter((cambio) => cambio.valorAnterior !== cambio.valorNuevo);

  return prisma.$transaction(async (tx) => {
    const alumno = await tx.alumno.update({ where: { id }, data: nuevos });
    if (cambios.length > 0) {
      await tx.cambioAlumno.createMany({ data: cambios });
    }
    return alumno;
  });
}

// Asigna (o quita, con null) el plan del alumno. Queda en el historial con el nombre del plan.
export async function cambiarPlan(id: number, planId: number | null) {
  const actual = await obtenerAlumno(id);
  if (actual.planId === planId) {
    return actual;
  }

  const plan = planId ? await prisma.plan.findUnique({ where: { id: planId } }) : null;
  if (planId && (!plan || !plan.activo)) {
    throw new ErrorHttp(400, "Ese plan no existe o fue eliminado");
  }

  return prisma.$transaction(async (tx) => {
    const alumno = await tx.alumno.update({ where: { id }, data: { planId } });
    await tx.cambioAlumno.create({
      data: { alumnoId: id, campo: "plan", valorAnterior: actual.plan?.nombre ?? null, valorNuevo: plan?.nombre ?? null },
    });
    return alumno;
  });
}

// Baja o reactivación. Los alumnos nunca se borran: solo cambia "activo" (y queda en el historial).
export async function cambiarEstado(id: number, activo: boolean) {
  const actual = await obtenerAlumno(id);
  if (actual.activo === activo) {
    return actual;
  }

  return prisma.$transaction(async (tx) => {
    const alumno = await tx.alumno.update({ where: { id }, data: { activo } });
    await tx.cambioAlumno.create({
      data: { alumnoId: id, campo: "activo", valorAnterior: String(actual.activo), valorNuevo: String(activo) },
    });
    return alumno;
  });
}
