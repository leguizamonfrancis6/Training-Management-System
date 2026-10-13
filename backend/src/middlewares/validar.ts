import type { RequestHandler } from "express";
import { z } from "zod";

// Valida req.body con un esquema de Zod. Si es válido, lo reemplaza por los datos
// ya limpios (por ejemplo, el email en minúsculas); si no, responde 400 con los errores por campo.
export function validar(esquema: z.ZodType): RequestHandler {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req.body);
    if (!resultado.success) {
      res.status(400).json({
        error: "Datos inválidos",
        campos: z.flattenError(resultado.error).fieldErrors,
      });
      return;
    }
    req.body = resultado.data;
    next();
  };
}
