-- Planes fijos: uno por modalidad (Presencial, Semi presencial, Online, Otro).
-- Los 4 planes los crea el seed (prisma/seed.ts) con precio 0.

-- Nueva modalidad "Otro".
ALTER TYPE "Modalidad" ADD VALUE 'OTRO';

-- No puede haber dos planes con la misma modalidad.
CREATE UNIQUE INDEX "Plan_modalidad_key" ON "Plan"("modalidad");
