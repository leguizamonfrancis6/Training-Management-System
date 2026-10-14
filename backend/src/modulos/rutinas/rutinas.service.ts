import { readFile } from "node:fs/promises";
import path from "node:path";
import type { TipoBloque } from "@prisma/client";
import { PDFDocument, PDFTextField } from "pdf-lib";
import { env } from "../../config/env";
import { ErrorHttp } from "../../lib/errores";
import { fechaArgentina, fechaDesdeTexto, hoyComoTexto, sumarMeses } from "../../lib/fechas";
import { prisma } from "../../lib/prisma";
import { obtenerAlumno } from "../alumnos/alumnos.service";

// Campo de la plantilla actual que se muestra en las listas. Los nombres los puso el programa que armó
// el PDF ("untitled…"); se identificó por su posición en la hoja. Si se cambia la plantilla, revisarlo.
const CAMPO_OBJETIVO = "untitled2";

// Duración de cada tipo de bloque (decisión del usuario, 14-10-2026).
export const MESES_POR_BLOQUE: Record<TipoBloque, number> = {
  MICROCICLOS_2_SEMANAS: 2, // 4 microciclos de 2 semanas
  MICROCICLOS_1_SEMANA: 1, // 4 microciclos de 1 semana
};

type Valores = Record<string, string>;

// La plantilla se lee del disco cada vez: si Agustín la reemplaza, se usa la nueva sin reiniciar nada.
// Nunca se escribe sobre ella.
export async function leerPlantilla() {
  const ruta = path.resolve(process.cwd(), env.PLANTILLA_RUTINA);
  try {
    return await readFile(ruta);
  } catch {
    throw new ErrorHttp(500, `No se encontró la plantilla de rutinas (${env.PLANTILLA_RUTINA})`);
  }
}

// Lee lo escrito en cada campo del PDF completado.
async function extraerValores(bytes: Uint8Array) {
  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(bytes);
  } catch {
    throw new ErrorHttp(400, "El archivo recibido no es un PDF válido");
  }
  const valores: Valores = {};
  for (const campo of pdf.getForm().getFields()) {
    if (campo instanceof PDFTextField) valores[campo.getName()] = campo.getText() ?? "";
  }
  if (Object.keys(valores).length === 0) {
    throw new ErrorHttp(400, "El PDF no tiene los campos de la plantilla de rutinas");
  }
  return valores;
}

function resumen(valores: Valores) {
  return { objetivo: valores[CAMPO_OBJETIVO]?.trim() || null };
}

// La fuente de los campos del PDF (Helvetica) no tiene todos los caracteres: se reemplazan los más comunes
// y se quitan los que no puede dibujar (las tildes y la ñ sí las tiene). Lo guardado en la base no cambia.
function textoDibujable(texto: string) {
  return texto
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\n\r\t\x20-\x7E\xA0-\xFF]/g, "");
}

// Arma el PDF de una rutina: la plantilla con los valores guardados. Los campos siguen siendo editables.
async function generarPdf(valores: Valores) {
  const pdf = await PDFDocument.load(await leerPlantilla());
  for (const campo of pdf.getForm().getFields()) {
    if (campo instanceof PDFTextField) campo.setText(textoDibujable(valores[campo.getName()] ?? ""));
  }
  return pdf.save();
}

// ---------- Consultas ----------

// Alumnos activos con cuántas rutinas tienen y cuándo se creó la última.
export async function listarAlumnosConRutinas() {
  const alumnos = await prisma.alumno.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      rutinas: { select: { creadoEn: true }, orderBy: { creadoEn: "desc" }, take: 1 },
      _count: { select: { rutinas: true } },
    },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });
  return alumnos.map((alumno) => ({
    id: alumno.id,
    nombre: alumno.nombre,
    apellido: alumno.apellido,
    cantidad: alumno._count.rutinas,
    ultimaRutina: alumno.rutinas[0] ? fechaArgentina(alumno.rutinas[0].creadoEn) : null,
  }));
}

// Datos de cada rutina, sin los valores de los campos (para las listas).
const datosRutina = {
  id: true,
  alumnoId: true,
  tipo: true,
  objetivo: true,
  desde: true,
  hasta: true,
  creadoEn: true,
  actualizadoEn: true,
} as const;

export async function listarRutinas(alumnoId: number) {
  await obtenerAlumno(alumnoId); // 404 si no existe
  return prisma.rutina.findMany({ where: { alumnoId }, select: datosRutina, orderBy: [{ creadoEn: "desc" }, { id: "desc" }] });
}

export async function obtenerRutina(id: number) {
  const rutina = await prisma.rutina.findUnique({
    where: { id },
    select: { ...datosRutina, alumno: { select: { id: true, nombre: true, apellido: true } } },
  });
  if (!rutina) {
    throw new ErrorHttp(404, "Rutina no encontrada");
  }
  return rutina;
}

// PDF de una rutina guardada, con un nombre de archivo para descargarlo.
export async function pdfDeRutina(id: number) {
  const rutina = await prisma.rutina.findUnique({
    where: { id },
    include: { alumno: { select: { nombre: true, apellido: true } } },
  });
  if (!rutina) {
    throw new ErrorHttp(404, "Rutina no encontrada");
  }
  const fecha = fechaArgentina(rutina.creadoEn).split("-").reverse().join("-"); // dd-mm-aaaa
  return {
    bytes: await generarPdf(rutina.valores as Valores),
    nombreArchivo: `Rutina ${rutina.alumno.apellido} ${rutina.alumno.nombre} ${fecha}.pdf`,
  };
}

// ---------- Altas y cambios ----------

export async function crearRutina(alumnoId: number, tipo: TipoBloque, pdf: Uint8Array) {
  await obtenerAlumno(alumnoId);
  const valores = await extraerValores(pdf);
  // La rutina empieza el día que se crea y dura lo que indica su tipo de bloque.
  const desde = hoyComoTexto();
  const hasta = sumarMeses(desde, MESES_POR_BLOQUE[tipo]);
  return prisma.rutina.create({
    data: { alumnoId, tipo, valores, ...resumen(valores), desde: fechaDesdeTexto(desde), hasta: fechaDesdeTexto(hasta) },
    select: datosRutina,
  });
}

export async function actualizarRutina(id: number, pdf: Uint8Array) {
  await obtenerRutina(id);
  const valores = await extraerValores(pdf);
  return prisma.rutina.update({ where: { id }, data: { valores, ...resumen(valores) }, select: datosRutina });
}

export async function eliminarRutina(id: number) {
  await obtenerRutina(id);
  await prisma.rutina.delete({ where: { id } });
}
