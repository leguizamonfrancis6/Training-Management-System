import express from "express";
import cookieParser from "cookie-parser";
import { prisma } from "./lib/prisma";
import { manejarErrores, rutaNoEncontrada } from "./middlewares/errores";
import { requiereSesion } from "./middlewares/requiereSesion";
import { authRouter } from "./modulos/auth/auth.routes";

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

// (acá se van a montar los módulos: alumnos, anotaciones, evaluaciones, pagos, panel)

app.use("/api", rutaNoEncontrada);
app.use(manejarErrores);
