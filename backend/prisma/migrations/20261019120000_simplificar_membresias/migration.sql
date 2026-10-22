-- Historial de membresías: ya queda en CambioAlumno (campo "plan"). Los planes son fijos: no se desactivan.
-- DropForeignKey
ALTER TABLE "AsignacionPlan" DROP CONSTRAINT "AsignacionPlan_alumnoId_fkey";

-- DropForeignKey
ALTER TABLE "AsignacionPlan" DROP CONSTRAINT "AsignacionPlan_planId_fkey";

-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "activo";

-- DropTable
DROP TABLE "AsignacionPlan";

