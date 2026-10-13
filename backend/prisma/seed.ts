// Datos iniciales. Se puede ejecutar varias veces sin duplicar (usa upsert).
import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Catálogo inicial de pruebas (Agustín podrá agregar o desactivar pruebas desde el sistema).
const pruebas: Prisma.PruebaCreateInput[] = [
  { nombre: "IMTP (tirón isométrico a mitad de muslo)", categoria: "FUERZA", unidad: "N" },
  { nombre: "CMJ (salto con contramovimiento)", categoria: "POTENCIA", unidad: "cm" },
  { nombre: "DJ (salto en caída)", categoria: "POTENCIA", unidad: "cm" },
  { nombre: "Movilidad de tobillo (rodilla a la pared)", categoria: "MOVILIDAD", unidad: "cm" },
  { nombre: "Rango de movimiento de cadera", categoria: "MOVILIDAD", unidad: "°" },
];

async function main() {
  for (const prueba of pruebas) {
    await prisma.prueba.upsert({
      where: { nombre: prueba.nombre },
      update: {},
      create: prueba,
    });
  }
  console.log(`Catálogo de pruebas cargado (${pruebas.length} pruebas).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
