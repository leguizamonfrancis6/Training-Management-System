import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Usuario } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export const NOMBRE_COOKIE = "sesion";

// Notebook de uso personal: la sesión dura 30 días para no pedir el login a cada rato.
const DURACION_SESION_MS = 30 * 24 * 60 * 60 * 1000;

// Costo de bcrypt: más alto = más lento de adivinar por fuerza bruta (12 tarda ~0,2 s).
const COSTO_BCRYPT = 12;

export function hashearPassword(password: string) {
  return bcrypt.hash(password, COSTO_BCRYPT);
}

// El token es aleatorio y largo, así que alcanza con SHA-256 (no hace falta bcrypt).
// Si alguien lee la base, no puede usar los hashes para entrar.
function hashearToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Datos del usuario que se pueden enviar al frontend (nunca el passwordHash).
function datosPublicos(usuario: Usuario) {
  return { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol };
}

export type UsuarioSesion = ReturnType<typeof datosPublicos>;

export async function iniciarSesion(email: string, password: string) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !(await bcrypt.compare(password, usuario.passwordHash))) {
    return null;
  }

  // Limpieza: borra las sesiones vencidas de este usuario.
  await prisma.sesion.deleteMany({ where: { usuarioId: usuario.id, expiraEn: { lt: new Date() } } });

  const token = crypto.randomBytes(32).toString("base64url");
  const expiraEn = new Date(Date.now() + DURACION_SESION_MS);
  await prisma.sesion.create({
    data: { usuarioId: usuario.id, tokenHash: hashearToken(token), expiraEn },
  });

  return { token, expiraEn, usuario: datosPublicos(usuario) };
}

export async function buscarUsuarioPorToken(token: string) {
  const sesion = await prisma.sesion.findUnique({
    where: { tokenHash: hashearToken(token) },
    include: { usuario: true },
  });
  if (!sesion || sesion.expiraEn < new Date()) {
    return null;
  }
  return datosPublicos(sesion.usuario);
}

export async function cerrarSesion(token: string) {
  await prisma.sesion.deleteMany({ where: { tokenHash: hashearToken(token) } });
}
