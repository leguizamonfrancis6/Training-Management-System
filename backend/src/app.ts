import express from "express";
import cookieParser from "cookie-parser";
import { prisma } from "./lib/prisma";
import { manejarErrores, rutaNoEncontrada } from "./middlewares/errores";
import { requiereSesion } from "./middlewares/requiereSesion";
import { z } from "zod";
import { alumnosRouter } from "./modulos/alumnos/alumnos.routes";
import { anotacionesRouter } from "./modulos/anotaciones/anotaciones.routes";
import { authRouter } from "./modulos/auth/auth.routes";
import { evaluacionesRouter } from "./modulos/evaluaciones/evaluaciones.routes";
import { pagosRouter } from "./modulos/pagos/pagos.routes";
import { planesRouter } from "./modulos/planes/planes.routes";
import { pruebasRouter } from "./modulos/pruebas/pruebas.routes";

// Mensajes de error de Zod en español para los casos sin mensaje propio.
z.config(z.locales.es());

export const app = express();

app.use(express.json());
app.use(cookieParser());

// ---------- Rutas públicas ----------

// Permite comprobar que la API está levantada y conectada a la base.
app.get("/api/salud", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ estado: "ok", baseDeDatos: "conectada" });
});

app.use("/api/auth", authRouter);

// ---------- Rutas protegidas: de acá para abajo hace falta sesión ----------
app.use("/api", requiereSesion);

app.use("/api/alumnos", alumnosRouter);
app.use("/api", anotacionesRouter);
app.use("/api/pruebas", pruebasRouter);
app.use("/api", evaluacionesRouter);
app.use("/api/planes", planesRouter);
app.use("/api", pagosRouter);
// (próximo módulo: panel)

app.use("/api", rutaNoEncontrada);
app.use(manejarErrores);
