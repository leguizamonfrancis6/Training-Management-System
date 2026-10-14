-- CreateEnum
CREATE TYPE "TipoBloque" AS ENUM ('MICROCICLOS_2_SEMANAS', 'MICROCICLOS_1_SEMANA');

-- CreateTable
CREATE TABLE "Rutina" (
    "id" SERIAL NOT NULL,
    "alumnoId" INTEGER NOT NULL,
    "tipo" "TipoBloque" NOT NULL,
    "valores" JSONB NOT NULL,
    "objetivo" TEXT,
    "desde" TEXT,
    "hasta" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rutina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rutina_alumnoId_creadoEn_idx" ON "Rutina"("alumnoId", "creadoEn");

-- AddForeignKey
ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
