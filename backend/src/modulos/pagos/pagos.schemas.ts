import { MedioPago } from "@prisma/client";
import { z } from "zod";
import { hoyComoTexto } from "../../lib/fechas";
import { esquemaImporte } from "../../lib/montos";

const fechaPago = z.iso
  .date("Fecha inválida")
  .refine((fecha) => fecha <= hoyComoTexto(), "La fecha no puede ser futura");

const medio = z.enum(MedioPago, { error: "Elegí el medio de pago" });

// Hay tres tipos de pago; el campo "tipo" indica cuál es y qué otros campos lleva
// (en Zod esto se llama "unión discriminada").
export const esquemaPago = z.discriminatedUnion(
  "tipo",
  [
    // Nueva cuota mensual: genera una cuota desde la fecha de pago hasta un mes después.
    z.object({
      tipo: z.literal("CUOTA"),
      fecha: fechaPago,
      importeCuota: esquemaImporte, // lo que vale la cuota (por defecto, el precio del plan)
      importe: esquemaImporte, // lo que paga ahora (si es menos, queda saldo)
      medio,
    }),
    // Pago a cuenta del saldo pendiente de una cuota anterior.
    z.object({
      tipo: z.literal("SALDO"),
      cuotaId: z.number({ error: "Elegí la cuota" }).int().positive(),
      fecha: fechaPago,
      importe: esquemaImporte,
      medio,
    }),
    // Otro concepto (no es cuota mensual).
    z.object({
      tipo: z.literal("OTRO"),
      fecha: fechaPago,
      importe: esquemaImporte,
      concepto: z
        .string({ error: "Indicá el concepto" })
        .trim()
        .min(1, "Indicá el concepto")
        .max(200, "Máximo 200 caracteres"),
      medio,
    }),
  ],
  { error: "Elegí el tipo de pago" },
);

export type DatosPago = z.infer<typeof esquemaPago>;

// GET /api/pagos/ultimos?cantidad=20
export const esquemaUltimosPagos = z.object({
  cantidad: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/pagos/ingresos?desde=aaaa-mm-dd&hasta=aaaa-mm-dd
export const esquemaRangoIngresos = z
  .object({
    desde: z.iso.date("Fecha inválida"),
    hasta: z.iso.date("Fecha inválida"),
  })
  .refine((rango) => rango.desde <= rango.hasta, {
    message: "La fecha inicial no puede ser posterior a la final",
    path: ["hasta"],
  });
