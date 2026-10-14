-- "Evaluación n°": numeración de las evaluaciones propia de cada alumno.

-- 1) Columna nueva (al principio admite vacíos para poder completar las existentes).
ALTER TABLE "Evaluacion" ADD COLUMN "idEvaluacion" INTEGER;

-- 2) Las evaluaciones que ya existen se numeran por alumno, en orden de fecha.
UPDATE "Evaluacion" e
SET "idEvaluacion" = n.numero
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "alumnoId" ORDER BY "fecha", "id") AS numero
  FROM "Evaluacion"
) n
WHERE e."id" = n."id";

-- 3) Ya completa: pasa a ser obligatoria y no se puede repetir dentro del mismo alumno.
ALTER TABLE "Evaluacion" ALTER COLUMN "idEvaluacion" SET NOT NULL;
CREATE UNIQUE INDEX "Evaluacion_alumnoId_idEvaluacion_key" ON "Evaluacion"("alumnoId", "idEvaluacion");
