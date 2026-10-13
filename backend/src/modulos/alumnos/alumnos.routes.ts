import { Router } from "express";
import { leerId } from "../../lib/errores";
import { validar } from "../../middlewares/validar";
import { esquemaAlumno, esquemaEstado, esquemaFiltros, type DatosAlumno } from "./alumnos.schemas";
import {
  actualizarAlumno,
  cambiarEstado,
  crearAlumno,
  listarAlumnos,
  obtenerAlumno,
  obtenerHistorial,
} from "./alumnos.service";

export const alumnosRouter = Router();

// GET /api/alumnos?buscar=&estado=activos|inactivos|todos&perfil=
alumnosRouter.get("/", async (req, res) => {
  const filtros = esquemaFiltros.parse(req.query);
  res.json(await listarAlumnos(filtros));
});

// POST /api/alumnos
alumnosRouter.post("/", validar(esquemaAlumno), async (req, res) => {
  res.status(201).json(await crearAlumno(req.body as DatosAlumno));
});

// GET /api/alumnos/:id
alumnosRouter.get("/:id", async (req, res) => {
  res.json(await obtenerAlumno(leerId(req.params.id)));
});

// PUT /api/alumnos/:id  (se envía la ficha completa)
alumnosRouter.put("/:id", validar(esquemaAlumno), async (req, res) => {
  res.json(await actualizarAlumno(leerId(req.params.id), req.body as DatosAlumno));
});

// PATCH /api/alumnos/:id/estado  { activo: true | false }
alumnosRouter.patch("/:id/estado", validar(esquemaEstado), async (req, res) => {
  res.json(await cambiarEstado(leerId(req.params.id), req.body.activo));
});

// GET /api/alumnos/:id/historial
alumnosRouter.get("/:id/historial", async (req, res) => {
  res.json(await obtenerHistorial(leerId(req.params.id)));
});
