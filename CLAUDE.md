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
- Módulo login escrito y probado el 13/10/2026 (API: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/yo`; todo `/api` salvo `salud` y `auth` exige sesión; sesión de 30 días; usuario admin con `npm run crear-admin`). Commit inicial `1f246cf` (etapa 2 + login). Git configurado en el repo como "Soft Gestión Entrenamiento" <leguizamonfrancis6@gmail.com>. Login probado por el usuario.
- Módulo alumnos escrito y probado (API) el 13/10/2026: `GET/POST /api/alumnos`, `GET/PUT /api/alumnos/:id`, `PATCH /api/alumnos/:id/estado`, `GET /api/alumnos/:id/historial`. Búsqueda sin tildes hecha en memoria (pocos cientos de alumnos). Teléfono guardado como 10 dígitos. El plan se asigna en el módulo pagos. La ficha (`AlumnoFicha.tsx`) debe ir sumando secciones de anotaciones, evaluaciones y pagos. Commit `4fb8e40`. Ajustes pedidos: campo "restricciones" eliminado, "vidaCotidiana" → `otrosDatos` ("Otros datos"), "molestias" se muestra como "Molestias/contracturas".
- Módulo anotaciones escrito y probado (API) el 13/10/2026: `GET/POST /api/alumnos/:alumnoId/anotaciones`, `PUT/DELETE /api/anotaciones/:id` (las anotaciones sí se pueden borrar). En el front es una sección de la ficha (`componentes/AnotacionesAlumno.tsx`), debajo de "Antecedentes y salud"; muestra las últimas 2 y un botón "Ver todas". Commit `2546624`.
- Módulo evaluaciones escrito y probado (API) el 13/10/2026. Catálogo: `GET/POST /api/pruebas`, `PUT /api/pruebas/:id` (sin DELETE: se desactivan; nombre único sin distinguir mayúsculas). Evaluaciones: `GET/POST /api/alumnos/:alumnoId/evaluaciones` (el GET devuelve `{ evaluaciones, proximaEvaluacion }`), `GET/PUT/DELETE /api/evaluaciones/:id` (el PUT reemplaza todos los resultados en una transacción). `calcularProximaEvaluacion()` y `MESES_REEVALUACION` en `evaluaciones.service.ts` (reutilizar en el panel). Front: sección resumen en la ficha (`EvaluacionesAlumno`), página `/alumnos/:id/evaluaciones` (tabla comparativa + detalle), formulario con filas dinámicas, página `/pruebas`. La variación se muestra con ▲▼ sin colores (subir no siempre es mejor). Pendiente: prueba del usuario y commit. Próximo: pagos.
- Errores de validación: `campos` usa la ruta completa como clave (`"resultados.0.valor"`), ver `erroresPorCampo()` en `middlewares/validar.ts`. `lib/fechas.ts` tiene `sumarMeses` (respeta fin de mes), `diasEntre`, `fechaArgentina`.
- La base tiene datos reales del usuario: al probar, crear datos temporales identificables (DNI que empiece con 99, email @test.com) y borrar solo esos.
- Al probar con curl desde Git Bash, mandar el JSON desde un archivo UTF-8 (`--data-binary @archivo`): con `-d '...'` los acentos llegan mal.
- Errores del backend: `ErrorHttp(estado, mensaje)` y `leerId()` en `lib/errores.ts`; `manejarErrores` también convierte `ZodError` en 400. Zod configurado en español (`z.config(z.locales.es())`). Fechas: `lib/fechas.ts` (back) y `utils/formato.ts` (front).
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
- Interfaz y mensajes en español (Argentina). Fechas en formato dd-mm-aaaa (con guiones; con hora: dd-mm-aaaa hh:mm); montos en pesos ($ 25.000,00).
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
