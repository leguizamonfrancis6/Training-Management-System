import { Router } from "express";
import { leerId } from "../../lib/errores";
import { validar } from "../../middlewares/validar";
import { esquemaFiltrosPlanes, esquemaPlan, type DatosPlan } from "./planes.schemas";
import { actualizarPlan, crearPlan, listarPlanes } from "./planes.service";

// Sin DELETE: un plan con cuotas no se puede borrar; se desactiva ("Eliminar" en pantalla).
export const planesRouter = Router();

// GET /api/planes?incluirInactivos=true
planesRouter.get("/", async (req, res) => {
  const { incluirInactivos } = esquemaFiltrosPlanes.parse(req.query);
  res.json(await listarPlanes(incluirInactivos));
});

// POST /api/planes
planesRouter.post("/", validar(esquemaPlan), async (req, res) => {
  res.status(201).json(await crearPlan(req.body as DatosPlan));
});

// PUT /api/planes/:id  (incluye "activo" para eliminar/restaurar)
planesRouter.put("/:id", validar(esquemaPlan), async (req, res) => {
  res.json(await actualizarPlan(leerId(req.params.id), req.body as DatosPlan));
});
