# Training Management System

A web app I built for a physical education trainer who kept his clients' information scattered across Google Drive spreadsheets and WhatsApp chats. Currently being tested by the client before going into daily use.

Solo project: requirements gathering with the client, database design, backend and frontend.

It handles client profiles, session notes, physical assessments with progress charts, workout plans on a PDF template, memberships, monthly fees, debts and income reports.

**Tech stack:** TypeScript, Node.js, Express, PostgreSQL, Prisma, Zod, React, Vite and `node:test`.

## Features

- **Clients:** full profile (personal details, sports profile, health, recovery and medical history), accent-insensitive search, deactivation and reactivation (clients are never deleted) and a field-by-field change history.
- **Training notes:** technique corrections, exercise changes, discomfort, etc., filterable by type.
- **Assessments:** configurable catalog of tests (CMJ, IMTP, mobility), results recorded for left and right sides, progress charts and a reminder for the next reassessment based on each client's profile.
- **Workout plans:** filled in directly on the page over a PDF template with editable fields, and downloaded as a PDF.
- **Payments:** memberships with a monthly price, fees that chain month to month, automatic debt calculation, an option to cancel a debt, WhatsApp reminders with the message already written and income reports by period (cash or bank transfer, by month).
- **Dashboard:** active clients, upcoming fees, upcoming assessments and workout plans due for renewal.

## Technical decisions

- **Amounts stored as `Decimal(12,2)` instead of float**, to avoid rounding errors. Amounts can also be entered in Argentine format ("25.000,50").
- **Dates without time**, stored as `DATE` and handled as `yyyy-mm-dd` strings, so time zones never shift a date by one day. Adding months respects month ends (Jan 31 + 1 month = Feb 28).
- **Custom sessions instead of JWT:** a random token in an `httpOnly` cookie, with only its hash stored in the database. Logging out revokes the session immediately. Passwords are hashed with bcrypt, and accounts are locked for 15 minutes after 5 failed attempts.
- **Change history in a single transaction:** editing a profile saves the data and one history row per modified field. If anything fails, nothing is saved.
- **Workout plans without storing the PDF:** only the field values are saved (as JSON), and the PDF is rebuilt on the template when downloaded.
- **Automated tests** for the logic with the most edge cases (dates, amounts and debt calculation), using `node:test` with a mocked clock.

## Project structure

```
backend/
  prisma/              schema.prisma, migrations and seed data
  src/
    modulos/<modulo>/  <modulo>.routes.ts, .service.ts, .schemas.ts
    lib/               dates, amounts, errors, Prisma client
    middlewares/       session, Zod validation, error handling
    scripts/           create admin user, backups
frontend/
  src/
    api/               one file per API resource
    paginas/           one page per route
    componentes/       sections and reusable components
    hooks/             useCarga (data fetching), useListaCorta
    utils/             date and amount formatting, labels
docs/                  data model and design decisions
```

The data model is explained in [docs/propuesta-etapa1.md](docs/propuesta-etapa1.md) (in Spanish).

## Running it locally

Requirements: **Node.js 22 or later** and **PostgreSQL 17**.

```bash
# Backend
cd backend
cp .env.example .env       # set DATABASE_URL with your PostgreSQL user and password
npm install
npx prisma migrate dev     # creates the database and runs the migrations
npm run db:seed            # initial catalog of tests and memberships
npm run crear-admin        # login user (asks for email, name and password)
npm run dev                # API at http://localhost:3000

# Frontend (in another terminal)
cd frontend
npm install
npm run dev                # http://localhost:5173
```

In development, Vite proxies `/api` to the backend, so the frontend and the API share the same origin and the session cookie works without any CORS setup.

The workout plan PDF template is not included in the repository because it belongs to the client. To try that module, any PDF with text fields will work: set its path in `PLANTILLA_RUTINA` (by default, `rutina.pdf` in the project root).

## Backend commands

| Command | Purpose |
|---|---|
| `npm run dev` | API in development mode (restarts on save) |
| `npm test` | Automated tests (`*.test.ts`) |
| `npm run db:studio` | Browse the database in the browser (Prisma Studio) |
| `npm run crear-admin` | Create the admin user or change its password |
| `npm run respaldo` | Backup with `pg_dump` (keeps the last 30) |
| `npm run respaldo:probar` | Restores the latest backup into a temporary database, checks it and deletes it |
| `npm run build` / `npm start` | Build and run the production version |

The daily automatic backup and how to restore it are explained in [docs/respaldos.md](docs/respaldos.md) (in Spanish).

## Security and personal data

The database stores clients' personal and health data, so the repository contains no real data. The `.env` file, the backups and the workout plan template are listed in `.gitignore`.
