-- Desde/Hasta de las rutinas: dejan de copiarse de la planilla (texto) y pasan a ser fechas calculadas
-- por el sistema según el tipo de bloque (pedido del usuario, 14-10-2026).

-- 1) Columnas nuevas de tipo fecha.
ALTER TABLE "Rutina" ADD COLUMN "desdeFecha" DATE;
ALTER TABLE "Rutina" ADD COLUMN "hastaFecha" DATE;

-- 2) Rutinas existentes: desde = día de creación (en Argentina); hasta = + 2 meses o + 1 mes según el bloque.
UPDATE "Rutina"
SET "desdeFecha" = ("creadoEn" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;

UPDATE "Rutina"
SET "hastaFecha" = ("desdeFecha" + CASE "tipo"
  WHEN 'MICROCICLOS_2_SEMANAS' THEN INTERVAL '2 months'
  ELSE INTERVAL '1 month'
END)::date;

-- 3) Se reemplazan las columnas de texto por las de fecha.
ALTER TABLE "Rutina" DROP COLUMN "desde";
ALTER TABLE "Rutina" DROP COLUMN "hasta";
ALTER TABLE "Rutina" RENAME COLUMN "desdeFecha" TO "desde";
ALTER TABLE "Rutina" RENAME COLUMN "hastaFecha" TO "hasta";
ALTER TABLE "Rutina" ALTER COLUMN "desde" SET NOT NULL;
ALTER TABLE "Rutina" ALTER COLUMN "hasta" SET NOT NULL;
