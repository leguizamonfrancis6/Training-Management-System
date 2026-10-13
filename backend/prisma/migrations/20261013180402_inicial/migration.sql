-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('DEPORTIVO', 'SALUD', 'RECUPERACION');

-- CreateEnum
CREATE TYPE "TipoAnotacion" AS ENUM ('OBSERVACION', 'CORRECCION_TECNICA', 'CAMBIO_EJERCICIO', 'CARGA', 'MOLESTIA', 'OTRO');

-- CreateEnum
CREATE TYPE "CategoriaPrueba" AS ENUM ('FUERZA', 'POTENCIA', 'VELOCIDAD', 'MOVILIDAD', 'RESISTENCIA');

-- CreateEnum
CREATE TYPE "Lado" AS ENUM ('IZQ', 'DER');

-- CreateEnum
CREATE TYPE "OrigenResultado" AS ENUM ('PLATAFORMA_FUERZA', 'MYJUMP', 'MANUAL');

-- CreateEnum
CREATE TYPE "Modalidad" AS ENUM ('PRESENCIAL', 'SEMIPRESENCIAL', 'ONLINE');

-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ADMIN',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sesion" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alumno" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "fechaNacimiento" DATE NOT NULL,
    "profesion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "perfil" "Perfil" NOT NULL,
    "detallePerfil" TEXT,
    "antecedentesDeportivos" TEXT,
    "lesiones" TEXT,
    "molestias" TEXT,
    "restricciones" TEXT,
    "actividadLaboral" TEXT,
    "vidaCotidiana" TEXT,
    "planId" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CambioAlumno" (
    "id" SERIAL NOT NULL,
    "alumnoId" INTEGER NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CambioAlumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anotacion" (
    "id" SERIAL NOT NULL,
    "alumnoId" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" "TipoAnotacion" NOT NULL,
    "detalle" TEXT NOT NULL,
    "motivo" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anotacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prueba" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "CategoriaPrueba" NOT NULL,
    "unidad" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prueba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluacion" (
    "id" SERIAL NOT NULL,
    "alumnoId" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoEvaluacion" (
    "id" SERIAL NOT NULL,
    "evaluacionId" INTEGER NOT NULL,
    "pruebaId" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "unidad" TEXT NOT NULL,
    "lado" "Lado",
    "origen" "OrigenResultado" NOT NULL DEFAULT 'MANUAL',
    "observacion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultadoEvaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "modalidad" "Modalidad" NOT NULL,
    "precioMensual" DECIMAL(12,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuota" (
    "id" SERIAL NOT NULL,
    "alumnoId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "desde" DATE NOT NULL,
    "vence" DATE NOT NULL,
    "importe" DECIMAL(12,2) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "alumnoId" INTEGER NOT NULL,
    "cuotaId" INTEGER,
    "fecha" DATE NOT NULL,
    "importe" DECIMAL(12,2) NOT NULL,
    "concepto" TEXT NOT NULL,
    "medio" "MedioPago" NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sesion_tokenHash_key" ON "Sesion"("tokenHash");

-- CreateIndex
CREATE INDEX "Sesion_usuarioId_idx" ON "Sesion"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Alumno_dni_key" ON "Alumno"("dni");

-- CreateIndex
CREATE INDEX "Alumno_apellido_nombre_idx" ON "Alumno"("apellido", "nombre");

-- CreateIndex
CREATE INDEX "CambioAlumno_alumnoId_fecha_idx" ON "CambioAlumno"("alumnoId", "fecha");

-- CreateIndex
CREATE INDEX "Anotacion_alumnoId_fecha_idx" ON "Anotacion"("alumnoId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Prueba_nombre_key" ON "Prueba"("nombre");

-- CreateIndex
CREATE INDEX "Evaluacion_alumnoId_fecha_idx" ON "Evaluacion"("alumnoId", "fecha");

-- CreateIndex
CREATE INDEX "ResultadoEvaluacion_evaluacionId_idx" ON "ResultadoEvaluacion"("evaluacionId");

-- CreateIndex
CREATE INDEX "ResultadoEvaluacion_pruebaId_idx" ON "ResultadoEvaluacion"("pruebaId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_nombre_key" ON "Plan"("nombre");

-- CreateIndex
CREATE INDEX "Cuota_alumnoId_vence_idx" ON "Cuota"("alumnoId", "vence");

-- CreateIndex
CREATE INDEX "Pago_alumnoId_idx" ON "Pago"("alumnoId");

-- CreateIndex
CREATE INDEX "Pago_cuotaId_idx" ON "Pago"("cuotaId");

-- CreateIndex
CREATE INDEX "Pago_fecha_idx" ON "Pago"("fecha");

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alumno" ADD CONSTRAINT "Alumno_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CambioAlumno" ADD CONSTRAINT "CambioAlumno_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anotacion" ADD CONSTRAINT "Anotacion_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoEvaluacion" ADD CONSTRAINT "ResultadoEvaluacion_evaluacionId_fkey" FOREIGN KEY ("evaluacionId") REFERENCES "Evaluacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoEvaluacion" ADD CONSTRAINT "ResultadoEvaluacion_pruebaId_fkey" FOREIGN KEY ("pruebaId") REFERENCES "Prueba"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuota" ADD CONSTRAINT "Cuota_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cuota" ADD CONSTRAINT "Cuota_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "Cuota"("id") ON DELETE SET NULL ON UPDATE CASCADE;
