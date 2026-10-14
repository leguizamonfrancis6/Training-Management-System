import { Router } from "express";
import { leerId } from "../../lib/errores";
import { validar } from "../../middlewares/validar";
import { esquemaPrecioPlan, type DatosPrecioPlan } from "./planes.schemas";
import { actualizarPrecioPlan, listarAlumnosConPlan, listarPlanes, obtenerHistorialPlanes } from "./planes.service";

// Planes fijos (uno por modalidad, creados por el seed): no se crean ni se borran, solo cambia el precio.
export const planesRouter = Router();

// GET /api/planes
planesRouter.get("/", async (_req, res) => {
  res.json(await listarPlanes());
});

// GET /api/planes/alumnos  → alumnos activos con su plan actual
planesRouter.get("/alumnos", async (_req, res) => {
  res.json(await listarAlumnosConPlan());
});

// GET /api/planes/alumnos/:alumnoId  → historial de planes del alumno
planesRouter.get("/alumnos/:alumnoId", async (req, res) => {
  res.json(await obtenerHistorialPlanes(leerId(req.params.alumnoId)));
});

// PUT /api/planes/:id  { precioMensual }
planesRouter.put("/:id", validar(esquemaPrecioPlan), async (req, res) => {
  res.json(await actualizarPrecioPlan(leerId(req.params.id), req.body as DatosPrecioPlan));
});
