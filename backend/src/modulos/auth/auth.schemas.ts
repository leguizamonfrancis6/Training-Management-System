import { z } from "zod";

export const esquemaLogin = z.object({
  // Se normaliza el email (sin espacios, en minúsculas) antes de validarlo.
  email: z.string().trim().toLowerCase().pipe(z.email("Email inválido")),
  password: z.string().min(1, "Ingresá la contraseña"),
});

export type DatosLogin = z.infer<typeof esquemaLogin>;
