-- Pruebas que se miden por lado (izquierdo / derecho). Por defecto, ninguna.
ALTER TABLE "Prueba" ADD COLUMN "porLado" BOOLEAN NOT NULL DEFAULT false;

-- Decisión del usuario (14-10-2026): solo la movilidad de tobillo se carga por lado.
UPDATE "Prueba" SET "porLado" = true WHERE "nombre" = 'Movilidad de tobillo (rodilla a la pared)';
