import type { RequestHandler } from "express";
import { buscarUsuarioPorToken, NOMBRE_COOKIE } from "../modulos/auth/auth.service";

// Deja pasar solo si la cookie trae un token de sesión válido.
// Si es así, el usuario queda disponible en req.usuario.
export const requiereSesion: RequestHandler = async (req, res, next) => {
  const token = req.cookies?.[NOMBRE_COOKIE];
  const usuario = token ? await buscarUsuarioPorToken(token) : null;

  if (!usuario) {
    res.status(401).json({ error: "Sesión no iniciada o vencida" });
    return;
  }

  req.usuario = usuario;
  next();
};
