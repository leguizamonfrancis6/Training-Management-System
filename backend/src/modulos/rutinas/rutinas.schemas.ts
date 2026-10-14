import { TipoBloque } from "@prisma/client";
import { z } from "zod";

// POST /api/alumnos/:alumnoId/rutinas?tipo=MICROCICLOS_2_SEMANAS  (el cuerpo es el PDF completado)
export const esquemaTipoBloque = z.object({
  tipo: z.enum(TipoBloque, { error: "Elegí el tipo de bloque" }),
});

// GET /api/rutinas/:id/pdf?descargar=true
export const esquemaDescarga = z.object({
  descargar: z.stringbool().default(false),
});
