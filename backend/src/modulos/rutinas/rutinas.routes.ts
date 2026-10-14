import express, { Router, type Request, type Response } from "express";
import { ErrorHttp, leerId } from "../../lib/errores";
import { esquemaDescarga, esquemaTipoBloque } from "./rutinas.schemas";
import {
  actualizarRutina,
  crearRutina,
  eliminarRutina,
  leerPlantilla,
  listarAlumnosConRutinas,
  listarRutinas,
  obtenerRutina,
  pdfDeRutina,
} from "./rutinas.service";

// Se monta en /api.
export const rutinasRouter = Router();

// El PDF completado llega como cuerpo binario (Content-Type: application/pdf), no como JSON.
const recibirPdf = express.raw({ type: "application/pdf", limit: "20mb" });

function pdfRecibido(req: Request) {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new ErrorHttp(400, "Falta el PDF de la rutina");
  }
  return new Uint8Array(req.body);
}

function enviarPdf(res: Response, bytes: Uint8Array, nombreArchivo?: string) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Cache-Control", "no-store"); // contiene datos personales
  if (nombreArchivo) {
    // filename* admite tildes; filename es el respaldo sin caracteres especiales.
    const simple = nombreArchivo.normalize("NFD").replace(/[^\x20-\x7E]/g, "");
    res.setHeader("Content-Disposition", `attachment; filename="${simple}"; filename*=UTF-8''${encodeURIComponent(nombreArchivo)}`);
  }
  res.send(Buffer.from(bytes));
}

// GET /api/rutinas/alumnos  → alumnos activos con la cantidad de rutinas
rutinasRouter.get("/rutinas/alumnos", async (_req, res) => {
  res.json(await listarAlumnosConRutinas());
});

// GET /api/rutinas/plantilla  → la plantilla PDF, para empezar una rutina nueva
rutinasRouter.get("/rutinas/plantilla", async (_req, res) => {
  enviarPdf(res, await leerPlantilla());
});

// GET /api/alumnos/:alumnoId/rutinas
rutinasRouter.get("/alumnos/:alumnoId/rutinas", async (req, res) => {
  res.json(await listarRutinas(leerId(req.params.alumnoId)));
});

// POST /api/alumnos/:alumnoId/rutinas?tipo=…  (cuerpo: el PDF completado)
rutinasRouter.post("/alumnos/:alumnoId/rutinas", recibirPdf, async (req, res) => {
  const { tipo } = esquemaTipoBloque.parse(req.query);
  res.status(201).json(await crearRutina(leerId(req.params.alumnoId), tipo, pdfRecibido(req)));
});

// GET /api/rutinas/:id
rutinasRouter.get("/rutinas/:id", async (req, res) => {
  res.json(await obtenerRutina(leerId(req.params.id)));
});

// GET /api/rutinas/:id/pdf?descargar=true  → el PDF de la rutina (para ver, editar o descargar)
rutinasRouter.get("/rutinas/:id/pdf", async (req, res) => {
  const { descargar } = esquemaDescarga.parse(req.query);
  const { bytes, nombreArchivo } = await pdfDeRutina(leerId(req.params.id));
  enviarPdf(res, bytes, descargar ? nombreArchivo : undefined);
});

// PUT /api/rutinas/:id  (cuerpo: el PDF con los cambios)
rutinasRouter.put("/rutinas/:id", recibirPdf, async (req, res) => {
  res.json(await actualizarRutina(leerId(req.params.id), pdfRecibido(req)));
});

// DELETE /api/rutinas/:id
rutinasRouter.delete("/rutinas/:id", async (req, res) => {
  await eliminarRutina(leerId(req.params.id));
  res.status(204).end();
});
