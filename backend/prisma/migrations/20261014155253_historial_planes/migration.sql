-- CreateTable
CREATE TABLE "AsignacionPlan" (
    "id" SERIAL NOT NULL,
    "alumnoId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "desde" DATE NOT NULL,
    "hasta" DATE,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsignacionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AsignacionPlan_alumnoId_desde_idx" ON "AsignacionPlan"("alumnoId", "desde");

-- AddForeignKey
ALTER TABLE "AsignacionPlan" ADD CONSTRAINT "AsignacionPlan_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionPlan" ADD CONSTRAINT "AsignacionPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Datos iniciales: cada alumno que ya tiene un plan arranca su historial con esa asignación.
-- "desde" = día (en Argentina) de la última vez que se le cambió el plan según el historial
-- de cambios; si no hay registro, la fecha de hoy.
INSERT INTO "AsignacionPlan" ("alumnoId", "planId", "desde", "actualizadoEn")
SELECT
  a."id",
  a."planId",
  COALESCE(
    (SELECT MAX(c."fecha" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
       FROM "CambioAlumno" c
      WHERE c."alumnoId" = a."id" AND c."campo" = 'plan'),
    (CURRENT_TIMESTAMP AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
  ),
  CURRENT_TIMESTAMP
FROM "Alumno" a
WHERE a."planId" IS NOT NULL;
