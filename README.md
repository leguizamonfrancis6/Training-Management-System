# Sistema de gestión de entrenamiento

Aplicación web para un centro de entrenamiento: fichas de alumnos, anotaciones de cada sesión, evaluaciones físicas con gráficos de evolución, rutinas sobre planilla PDF, membresías, cuotas, deudas y reporte de ingresos.

La desarrollé para un profesor de Educación Física que tenía toda esta información repartida entre planillas de Google Drive y chats de WhatsApp. Hoy la usa una sola persona (el profesor, como administrador), desde una notebook.

**Stack:** TypeScript de punta a punta · Node.js + Express · PostgreSQL + Prisma · Zod · React + Vite · `node:test`

## Funcionalidades

- **Alumnos:** ficha completa (datos personales, perfil deportivo / salud / recuperación, antecedentes), búsqueda sin tildes, bajas y reactivaciones (los alumnos nunca se borran) e **historial de cambios** campo por campo.
- **Anotaciones de entrenamiento:** correcciones técnicas, cambios de ejercicio, molestias, etc., filtrables por tipo.
- **Evaluaciones:** catálogo configurable de pruebas (CMJ, IMTP, movilidad…), carga de resultados por lado izquierdo / derecho, **gráficos de evolución** y aviso de la próxima reevaluación según el perfil del alumno.
- **Rutinas:** se completan dentro de la página sobre una planilla PDF con campos editables (pdf.js) y se descargan como PDF.
- **Pagos:** membresías con precio mensual, cuotas que se encadenan mes a mes, cálculo automático de la deuda, opción "anular deuda", recordatorio por **WhatsApp** con el mensaje ya armado y reporte de ingresos por período (efectivo / transferencia, por mes).
- **Panel de inicio:** alumnos activos, cuotas por vencer, próximas evaluaciones y rutinas por renovar.

## Decisiones técnicas

- **Montos con `Decimal(12,2)`**, nunca `float`, y aceptando el formato argentino ("25.000,50").
- **Fechas de calendario como `DATE` sin hora**, manejadas como texto `aaaa-mm-dd`, para que la zona horaria no corra un día. `sumarMeses` respeta los fines de mes (31/01 + 1 mes = 28/02).
- **Lo que se puede calcular no se guarda:** la deuda y la próxima evaluación se calculan en cada consulta a partir de la última cuota o evaluación, así nunca quedan desactualizadas.
- **Sesiones propias en lugar de JWT:** token aleatorio en una cookie `httpOnly` + `SameSite`; en la base se guarda solo su hash SHA-256, y cerrar sesión la revoca al instante. Contraseñas con bcrypt y bloqueo de 15 minutos tras 5 intentos fallidos.
- **Validación con Zod en cada endpoint** y errores con un formato único (`{ error, campos }`) que el frontend muestra junto a cada campo, incluso en listas anidadas (`resultados.0.valor`).
- **Cambios con historial en una sola transacción:** al editar una ficha se guardan los datos y una fila de historial por campo modificado, o no se guarda nada.
- **Rutinas en PDF sin guardar el PDF:** se guardan solo los valores de los campos (JSON) y el PDF se rearma con pdf-lib sobre la plantilla al descargarlo. La plantilla nunca se modifica.
- **Gráficos en SVG propio**, sin librerías de gráficos; pdf.js se carga recién al abrir el editor de rutinas (*lazy loading*).
- **Pocas dependencias:** en el frontend solo React, react-router y pdf.js; el CSS es plano.
- **Pruebas automáticas** de la lógica con más casos borde (fechas, importes, cálculo de deuda) con `node:test` y el reloj simulado.
- **Copias de seguridad** con `pg_dump` y un comando que comprueba que la última copia se puede restaurar.

## Estructura

```
backend/
  prisma/              schema.prisma, migraciones y datos iniciales (seed)
  src/
    modulos/<modulo>/  <modulo>.routes.ts · .service.ts · .schemas.ts
    lib/               fechas, montos, errores, cliente de Prisma
    middlewares/       sesión, validación con Zod, manejo de errores
    scripts/           crear usuario administrador, copias de seguridad
frontend/
  src/
    api/               un archivo por recurso de la API
    paginas/           una pantalla por ruta
    componentes/       secciones y piezas reutilizables
    hooks/             useCarga (pedir datos), useListaCorta
    utils/             formato de fechas y montos, etiquetas
docs/                  modelo de datos y decisiones de diseño
```

El modelo de datos está explicado en [docs/propuesta-etapa1.md](docs/propuesta-etapa1.md).

## Cómo correrlo

Requisitos: **Node.js 22+** y **PostgreSQL 17**.

```bash
# Backend
cd backend
cp .env.example .env       # completar DATABASE_URL con el usuario y la contraseña de PostgreSQL
npm install
npx prisma migrate dev     # crea la base y aplica las migraciones
npm run db:seed            # catálogo inicial de pruebas y membresías
npm run crear-admin        # usuario para ingresar (pide email, nombre y contraseña)
npm run dev                # API en http://localhost:3000

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev                # http://localhost:5173
```

En desarrollo, Vite reenvía `/api` al backend: frontend y API comparten origen y la cookie de sesión funciona sin configurar CORS.

La plantilla PDF de rutinas no está en el repositorio (es material del cliente). Para probar ese módulo sirve cualquier PDF con campos de texto: se indica su ruta en `PLANTILLA_RUTINA` (por defecto, `rutina.pdf` en la raíz del proyecto).

## Comandos del backend

| Comando | Para qué |
|---|---|
| `npm run dev` | API en modo desarrollo (se reinicia al guardar) |
| `npm test` | Pruebas automáticas (`*.test.ts`) |
| `npm run db:studio` | Ver la base desde el navegador (Prisma Studio) |
| `npm run crear-admin` | Crear el administrador o cambiarle la contraseña |
| `npm run respaldo` | Copia de seguridad con `pg_dump` (conserva las últimas 30) |
| `npm run respaldo:probar` | Restaura la última copia en una base temporal, la revisa y la borra |
| `npm run build` / `npm start` | Compilar y ejecutar la versión de producción |

Copia automática diaria y cómo restaurar: [docs/respaldos.md](docs/respaldos.md).

## Seguridad y datos personales

La base guarda datos personales y de salud de los alumnos. Por eso el repositorio no incluye datos reales: el archivo `.env`, las copias de seguridad y la plantilla de rutinas están en `.gitignore`.
