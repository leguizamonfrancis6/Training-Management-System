// Crea el usuario administrador, o cambia su nombre y contraseña si el email ya existe.
// Uso (desde la carpeta backend):  npm run crear-admin
// También sirve si Agustín se olvida la contraseña: se vuelve a ejecutar con el mismo email.
import readline from "node:readline";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashearPassword } from "../modulos/auth/auth.service";

const esquema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Email inválido")),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const lineas = rl[Symbol.asyncIterator]();

async function preguntar(texto: string) {
  process.stdout.write(texto);
  const { value } = await lineas.next();
  return value ?? "";
}

async function main() {
  console.log("Crear o actualizar el usuario administrador");
  console.log("(la contraseña se ve mientras se escribe: hacerlo sin nadie mirando)\n");

  const email = await preguntar("Email: ");
  const nombre = await preguntar("Nombre: ");
  const password = await preguntar("Contraseña (mínimo 8 caracteres): ");
  const repeticion = await preguntar("Repetir contraseña: ");

  if (password !== repeticion) {
    throw new Error("Las contraseñas no coinciden.");
  }

  const resultado = esquema.safeParse({ email, nombre, password });
  if (!resultado.success) {
    throw new Error(z.prettifyError(resultado.error));
  }
  const datos = resultado.data;
  const passwordHash = await hashearPassword(datos.password);

  const existente = await prisma.usuario.findUnique({ where: { email: datos.email } });
  if (existente) {
    await prisma.$transaction([
      prisma.usuario.update({ where: { id: existente.id }, data: { nombre: datos.nombre, passwordHash } }),
      // Al cambiar la contraseña se cierran todas las sesiones abiertas.
      prisma.sesion.deleteMany({ where: { usuarioId: existente.id } }),
    ]);
    console.log(`\nUsuario ${datos.email} actualizado.`);
  } else {
    await prisma.usuario.create({ data: { email: datos.email, nombre: datos.nombre, passwordHash } });
    console.log(`\nUsuario ${datos.email} creado.`);
  }
}

main()
  .catch((error) => {
    console.error(`\nError: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
