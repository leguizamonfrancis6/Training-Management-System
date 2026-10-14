import { z } from "zod";
import { esquemaImporte } from "../../lib/montos";

// Los planes son fijos (uno por modalidad): solo se puede cambiar el precio.
export const esquemaPrecioPlan = z.object({
  precioMensual: esquemaImporte,
});

export type DatosPrecioPlan = z.infer<typeof esquemaPrecioPlan>;
