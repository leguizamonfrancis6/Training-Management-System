// Valida las variables de entorno al arrancar: si falta algo, el servidor no inicia
// y muestra qué está mal, en lugar de fallar más tarde con un error confuso.
import { z } from "zod";

const esquemaEnv = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "Falta DATABASE_URL"),
});

const resultado = esquemaEnv.safeParse(process.env);

if (!resultado.success) {
  console.error("Variables de entorno inválidas (revisar backend/.env):");
  console.error(z.prettifyError(resultado.error));
  process.exit(1);
}

export const env = resultado.data;
