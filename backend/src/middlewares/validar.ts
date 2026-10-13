import type { RequestHandler } from "express";
import type { z } from "zod";

// Agrupa los errores de Zod por campo. Los campos anidados quedan con su ruta completa,
// ej.: { "nombre": [...], "resultados.0.valor": [...] }, para mostrar cada error en su lugar.
export function erroresPorCampo(error: z.ZodError) {
  const campos: Record<string, string[]> = {};
  for (const problema of error.issues) {
    const clave = problema.path.join(".");
    (campos[clave] ??= []).push(problema.message);
  }
  return campos;
}

// Valida req.body con un esquema de Zod. Si es válido, lo reemplaza por los datos
// ya limpios (por ejemplo, el email en minúsculas); si no, responde 400 con los errores por campo.
export function validar(esquema: z.ZodType): RequestHandler {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req.body);
    if (!resultado.success) {
      res.status(400).json({ error: "Datos inválidos", campos: erroresPorCampo(resultado.error) });
      return;
    }
    req.body = resultado.data;
    next();
  };
}
