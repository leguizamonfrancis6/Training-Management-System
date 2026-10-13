# Sistema de gestión de entrenamiento

Sistema web para Agustín, profesor de Educación Física con centro de entrenamiento propio. Centraliza la información de alumnos que hoy está en planillas de Google Drive y WhatsApp. Un único usuario administrador (Agustín), desde notebook, siempre con internet. Los alumnos NO acceden al sistema en esta versión.

El desarrollador es estudiante de la Tecnicatura en TI (UTN): explicar brevemente las decisiones importantes.

## Forma de trabajo
- Por etapas. No generar todo de una vez: esperar confirmación antes de pasar a la siguiente.
- Etapas: (1) modelo de datos y estructura → (2) monorepo, Git + .gitignore (sin .env), PostgreSQL nativo, schema Prisma + primera migración, README → (3) módulos de a uno: login → alumnos → anotaciones → evaluaciones → pagos → panel. Cada módulo con API REST validada con Zod + pantallas, y al terminar explicar cómo probarlo.
- Código simple y legible. No agregar librerías innecesarias.

## Estado actual
- Etapa 1 confirmada el 13/10/2026 (ver [docs/propuesta-etapa1.md](docs/propuesta-etapa1.md), sección "Decisiones tomadas").
- Etapa 2 terminada y probada el 13/10/2026: monorepo, `.gitignore`, `git init`, schema Prisma, migración `inicial` aplicada, seed del catálogo de pruebas, esqueleto de API (`/api/salud`) y de frontend, README. 
- Módulo login escrito y probado el 13/10/2026 (API: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/yo`; todo `/api` salvo `salud` y `auth` exige sesión; sesión de 30 días; usuario admin con `npm run crear-admin`). Pendiente: que el usuario cree su admin y lo pruebe en el navegador, y los commits (Git sin user.name/user.email configurados). Próximo módulo: alumnos (esperar confirmación).
- Entorno: Node 24 LTS, PostgreSQL 17 nativo (servicio `postgresql-x64-17`, base `entrenamiento`), Git. Sin Docker. En PowerShell usar `npm.cmd`/`npx.cmd` (`npm.ps1` puede estar bloqueado por la política de ejecución). npm 11.19 bloquea scripts de instalación no aprobados (Prisma, esbuild); hasta ahora no causó problemas.
- Prisma fijado en la versión 6 (`url` en el schema, `prisma-client-js`); la 7 exige adaptadores y `prisma.config.ts`, más complejo para este proyecto.
- `bcryptjs` (bcrypt en JS puro, sin compilación nativa en Windows). `react-router` fijado en v7 (la v8 es nueva y no se conoce bien su API).
- Frontend: `api/cliente.ts` (`pedir<T>()`, `ErrorApi`, redirige a /login ante un 401), contexto de sesión en `componentes/Sesion.tsx` (`useSesion`), rutas protegidas con `RutaProtegida` + `Layout`. Validación del backend: middleware `validar(esquema)`, responde 400 `{ error, campos }`.
- El proyecto ya está fuera de OneDrive, en `C:\Proyectos\Sistema de gestion de entrenamiento`.
- Referencia: `Guia_Entrevista_Sistema_Entrenamiento.docx` (entrevista de requisitos con Agustín).
- Si el usuario pide "repetime lo que dijiste" (o algo similar), leer `docs/propuesta-etapa1.md` y volver a presentarle la propuesta completa, con las decisiones tomadas al final.

## Stack
- Backend: Node.js + TypeScript + Express, Prisma (ORM y migraciones) sobre PostgreSQL, Zod para validación.
- Frontend: React + TypeScript con Vite, react-router, CSS plano.
- Monorepo con carpetas `/backend` y `/frontend`. PostgreSQL nativo instalado en Windows (sin Docker).

## Convenciones
- Interfaz y mensajes en español (Argentina). Fechas en formato dd/mm/aaaa; montos en pesos ($ 25.000,00).
- Nombres de dominio en español (`Alumno`, `Pago`, `fechaNacimiento`).
- Montos en `Decimal(12,2)`, nunca float. Fechas de calendario como `@db.Date` (sin hora).
- Los alumnos nunca se borran: se marcan inactivos.
- Backend organizado por módulo: `src/modulos/<modulo>/<modulo>.routes.ts | .service.ts | .schemas.ts`.
- Sesión: token aleatorio en cookie httpOnly + tabla `Sesion` con el hash del token. Contraseña con bcrypt (paquete `bcryptjs`).
- En desarrollo el frontend reenvía `/api` al backend con el proxy de Vite (mismo origen, sin CORS).
- Datos personales y de pagos son confidenciales. Nunca subir `.env` (sí `.env.example`).

## Alcance MVP
Alumnos (ficha + historial de cambios), anotaciones de entrenamiento, evaluaciones (resultados cargados a mano, comparables en el tiempo; reevaluación cada 2 meses deportivo y recuperación / 4 meses salud; se puede evaluar en cualquier momento), planes y pagos (cuota mensual, vence un mes después de la fecha de pago, efectivo/transferencia, deudas, reporte de ingresos, botón "Avisar por WhatsApp" con link wa.me), panel principal y login.

FUERA de esta versión (diseñar pensando en ellas, no implementar): editor de rutinas y biblioteca de ejercicios, acceso de alumnos, turnos y asistencia, módulo equipo de hockey, integración con dispositivos.
