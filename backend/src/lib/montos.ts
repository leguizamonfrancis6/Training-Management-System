// Montos en pesos. Se calculan con Prisma.Decimal (decimal exacto), nunca con float:
// en float 0.1 + 0.2 = 0.30000000000000004, y con plata eso no puede pasar.
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Para mensajes de error: "$ 25.000,00".
export function formatearMoneda(monto: Prisma.Decimal) {
  return Number(monto).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

// Convierte un importe escrito como en Argentina a número:
// "25.000" → 25000 | "25.000,50" → 25000.5 | "25000,5" → 25000.5 | "25000.50" → 25000.5
function textoAImporte(texto: string) {
  const limpio = texto.replace(/[\s$]/g, "");
  if (limpio === "") return Number.NaN;
  if (limpio.includes(",")) {
    // Con coma decimal: los puntos son separadores de miles.
    return Number(limpio.replace(/\./g, "").replace(",", "."));
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) {
    // Solo puntos en grupos de 3 ("25.000", "1.500.000"): son separadores de miles.
    return Number(limpio.replace(/\./g, ""));
  }
  return Number(limpio);
}

// Importe positivo con hasta 2 decimales. Acepta número o texto.
export const esquemaImporte = z
  .union([z.number(), z.string().transform(textoAImporte)], { error: "Ingresá un importe" })
  .pipe(
    z
      .number({ error: "Ingresá un importe válido (ej.: 25.000)" })
      .positive("El importe debe ser mayor a cero")
      .max(9_999_999_999.99, "Importe demasiado grande"),
  )
  .transform((importe) => new Prisma.Decimal(importe.toFixed(2)));
