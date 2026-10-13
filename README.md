# Sistema de gestión de entrenamiento

Sistema web para administrar los alumnos de un centro de entrenamiento: fichas, anotaciones, evaluaciones, planes y pagos.

- **Backend:** Node.js + TypeScript + Express, Prisma sobre PostgreSQL, Zod para validar.
- **Frontend:** React + TypeScript con Vite.
- El modelo de datos y las decisiones de diseño están en [docs/propuesta-etapa1.md](docs/propuesta-etapa1.md).

```
backend/    API REST (puerto 3000)
frontend/   Interfaz web (puerto 5173)
docs/       Documentación del proyecto
```

## Requisitos

1. **Node.js 22 LTS**: instalador `.msi` de <https://nodejs.org>. Para comprobarlo, en una terminal nueva: `node -v`.
2. **PostgreSQL 17**: instalador de EDB (<https://www.postgresql.org/download/windows/>).
   - Anotar la contraseña que se le pone al usuario `postgres`.
   - Dejar el puerto por defecto, **5432**.
   - Stack Builder no hace falta (se puede cancelar al final).
   - Para comprobarlo, buscar "Servicios" en Windows: el servicio `postgresql-x64-17` tiene que figurar "En ejecución".

## Puesta en marcha (la primera vez)

### 1. Backend

```powershell
cd backend
copy .env.example .env
```

Editar `backend/.env` y reemplazar `CAMBIAR_CONTRASEÑA` por la contraseña del usuario `postgres`.

```powershell
npm install
npx prisma migrate dev     # crea la base "entrenamiento" y aplica las migraciones
npm run db:seed            # carga el catálogo inicial de pruebas
npm run crear-admin        # crea el usuario para ingresar (pide email, nombre y contraseña)
npm run dev                # levanta la API en http://localhost:3000
```

Para comprobar que funciona, abrir <http://localhost:3000/api/salud>. Tiene que responder `{"estado":"ok","baseDeDatos":"conectada"}`.

### 2. Frontend (en otra terminal)

```powershell
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Al abrir <http://localhost:5173> aparece la pantalla de ingreso: usar el email y la contraseña creados con `npm run crear-admin`.

## Uso diario

Abrir dos terminales: `cd backend` + `npm run dev` en una, y `cd frontend` + `npm run dev` en la otra.

## Comandos útiles (backend)

| Comando | Para qué |
|---|---|
| `npm run dev` | API en modo desarrollo (se reinicia al guardar cambios) |
| `npx prisma migrate dev --name <nombre>` | Crear y aplicar una migración después de modificar `schema.prisma` |
| `npm run db:seed` | Cargar los datos iniciales (se puede repetir sin duplicar) |
| `npm run db:studio` | Ver y editar la base desde el navegador (Prisma Studio) |
| `npm run crear-admin` | Crear el usuario administrador, o cambiarle la contraseña si ya existe (cierra sus sesiones abiertas) |
| `npm run build` / `npm start` | Compilar y ejecutar la versión de producción |

## Seguridad

- El archivo `backend/.env` contiene contraseñas y **nunca se sube** al repositorio (está en `.gitignore`). Se sube solo `.env.example`, sin datos reales.
- La base contiene datos personales y de pagos de los alumnos: no compartir copias de la base ni exportaciones.
