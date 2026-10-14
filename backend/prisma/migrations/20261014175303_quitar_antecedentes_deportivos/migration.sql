-- Se elimina "Antecedentes deportivos" (pedido del usuario, 14-10-2026).
-- Su contenido pasa a "Lesiones" con el prefijo "Antecedentes deportivos:" para no perder información.

-- 1) Historial: queda registrado el cambio de "Lesiones" de cada alumno afectado.
INSERT INTO "CambioAlumno" ("alumnoId", "campo", "valorAnterior", "valorNuevo", "fecha")
SELECT
  "id",
  'lesiones',
  "lesiones",
  CASE
    WHEN "lesiones" IS NULL OR "lesiones" = '' THEN 'Antecedentes deportivos: ' || "antecedentesDeportivos"
    ELSE "lesiones" || E'\n\n' || 'Antecedentes deportivos: ' || "antecedentesDeportivos"
  END,
  CURRENT_TIMESTAMP
FROM "Alumno"
WHERE "antecedentesDeportivos" IS NOT NULL AND "antecedentesDeportivos" <> '';

-- 2) Se agrega el texto a "Lesiones".
UPDATE "Alumno"
SET "lesiones" = CASE
  WHEN "lesiones" IS NULL OR "lesiones" = '' THEN 'Antecedentes deportivos: ' || "antecedentesDeportivos"
  ELSE "lesiones" || E'\n\n' || 'Antecedentes deportivos: ' || "antecedentesDeportivos"
END
WHERE "antecedentesDeportivos" IS NOT NULL AND "antecedentesDeportivos" <> '';

-- 3) Se elimina la columna.
ALTER TABLE "Alumno" DROP COLUMN "antecedentesDeportivos";
