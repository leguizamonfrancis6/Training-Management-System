import { Router } from "express";
import { env } from "../../config/env";
import { requiereSesion } from "../../middlewares/requiereSesion";
import { validar } from "../../middlewares/validar";
import { esquemaLogin, type DatosLogin } from "./auth.schemas";
import { cerrarSesion, iniciarSesion, NOMBRE_COOKIE } from "./auth.service";

export const authRouter = Router();

// POST /api/auth/login  { email, password }
authRouter.post("/login", validar(esquemaLogin), async (req, res) => {
  const { email, password } = req.body as DatosLogin;
  const resultado = await iniciarSesion(email, password);

  if (!resultado) {
    // Mismo mensaje si falla el email o la contraseña: no se revela qué emails existen.
    res.status(401).json({ error: "Email o contraseña incorrectos" });
    return;
  }

  res.cookie(NOMBRE_COOKIE, resultado.token, {
    httpOnly: true, // JavaScript del navegador no puede leerla
    sameSite: "lax", // no se envía desde formularios de otros sitios
    secure: env.NODE_ENV === "production", // solo por HTTPS en producción
    expires: resultado.expiraEn,
    path: "/",
  });
  res.json({ usuario: resultado.usuario });
});

// POST /api/auth/logout
authRouter.post("/logout", async (req, res) => {
  const token = req.cookies?.[NOMBRE_COOKIE];
  if (token) {
    await cerrarSesion(token);
  }
  res.clearCookie(NOMBRE_COOKIE, { path: "/" });
  res.status(204).end();
});

// GET /api/auth/yo  → usuario de la sesión actual (el frontend lo usa al cargar)
authRouter.get("/yo", requiereSesion, (req, res) => {
  res.json({ usuario: req.usuario });
});
