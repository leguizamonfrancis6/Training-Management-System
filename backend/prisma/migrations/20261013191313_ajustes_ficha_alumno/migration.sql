-- Ajustes de la ficha del alumno pedidos por el usuario (13-10-2026):
-- se elimina "restricciones" y "vidaCotidiana" pasa a llamarse "otrosDatos".
-- Se usa RENAME (y no DROP + ADD como generó Prisma) para conservar los datos de la columna.

ALTER TABLE "Alumno" DROP COLUMN "restricciones";

ALTER TABLE "Alumno" RENAME COLUMN "vidaCotidiana" TO "otrosDatos";
