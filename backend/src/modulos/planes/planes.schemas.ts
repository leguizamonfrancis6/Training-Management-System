import { Modalidad } from "@prisma/client";
import { z } from "zod";
import { esquemaImporte } from "../../lib/montos";

export const esquemaPlan = z.object({
  nombre: z
    .string({ error: "El nombre es obligatorio" })
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "Máximo 100 caracteres"),
  modalidad: z.enum(Modalidad, { error: "Elegí una modalidad" }),
  precioMensual: esquemaImporte,
  activo: z.boolean().default(true),
});

export type DatosPlan = z.infer<typeof esquemaPlan>;

// GET /api/planes?incluirInactivos=true
export const esquemaFiltrosPlanes = z.object({
  incluirInactivos: z.stringbool().default(false),
});
