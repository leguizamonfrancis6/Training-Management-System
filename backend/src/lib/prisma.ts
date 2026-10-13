// Un único cliente de Prisma para toda la aplicación (maneja un pool de conexiones).
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
