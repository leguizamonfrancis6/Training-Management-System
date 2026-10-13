import { Lado, OrigenResultado } from "@prisma/client";
import { z } from "zod";
import { hoyComoTexto } from "../../lib/fechas";

// Acepta número o texto, y en el texto también la coma decimal ("32,5").
const valorNumerico = z
  .union([z.number(), z.string().trim().transform((texto) => (texto === "" ? Number.NaN : Number(texto.replace(",", "."))))])
  .pipe(
    z
      .number({ error: "Ingresá un número" })
      .min(-99_999_999.99, "Valor fuera de rango")
      .max(99_999_999.99, "Valor fuera de rango"),
  );

const textoOpcional = (maximo: number) =>
  z
    .string()
    .trim()
    .max(maximo, `Máximo ${maximo} caracteres`)
    .nullish()
    .transform((valor) => valor || null);

const esquemaResultado = z.object({
  pruebaId: z.number({ error: "Elegí una prueba" }).int().positive("Elegí una prueba"),
  valor: valorNumerico,
  // Si no se indica, se usa la unidad de la prueba.
  unidad: textoOpcional(20),
  lado: z
    .enum(Lado)
    .nullish()
    .transform((valor) => valor ?? null),
  origen: z.enum(OrigenResultado).default("MANUAL"),
  observacion: textoOpcional(500),
});

export const esquemaEvaluacion = z
  .object({
    fecha: z.iso
      .date("Fecha inválida")
      .refine((fecha) => fecha <= hoyComoTexto(), "La fecha no puede ser futura"),
    observaciones: textoOpcional(2000),
    resultados: z.array(esquemaResultado).min(1, "Cargá al menos un resultado"),
  })
  // La misma prueba (con el mismo lado) no puede cargarse dos veces en una evaluación.
  .superRefine((datos, ctx) => {
    const vistas = new Set<string>();
    datos.resultados.forEach((resultado, indice) => {
      const clave = `${resultado.pruebaId}-${resultado.lado ?? ""}`;
      if (vistas.has(clave)) {
        ctx.addIssue({
          code: "custom",
          path: ["resultados", indice, "pruebaId"],
          message: "Esta prueba ya está cargada (con el mismo lado)",
        });
      }
      vistas.add(clave);
    });
  });

export type DatosEvaluacion = z.infer<typeof esquemaEvaluacion>;
