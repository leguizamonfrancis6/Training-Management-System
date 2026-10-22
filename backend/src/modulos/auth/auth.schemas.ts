import { z } from "zod";

export const esquemaLogin = z.object({
  // Se normaliza el email (sin espacios, en minúsculas) antes de validarlo.
  email: z.string().trim().toLowerCase().pipe(z.email("Email inválido")),
  password: z.string().min(1, "Ingresá la contraseña"),
});

export type DatosLogin = z.infer<typeof esquemaLogin>;

export const esquemaCambioPassword = z.object({
  actual: z.string().min(1, "Ingresá la contraseña actual"),
  // bcrypt solo usa los primeros 72 bytes: más larga no agrega seguridad.
  nueva: z.string().min(8, "La contraseña nueva debe tener al menos 8 caracteres").max(72, "Máximo 72 caracteres"),
});

export type DatosCambioPassword = z.infer<typeof esquemaCambioPassword>;
