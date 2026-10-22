// Copia de seguridad de la base con pg_dump (viene con PostgreSQL, no hace falta instalar nada).
// Uso (desde la carpeta backend):
//   npm run respaldo           → guarda una copia en RESPALDOS_DIR y borra las más viejas (quedan las últimas 30)
//   npm run respaldo:probar    → restaura la copia más nueva en una base temporal, cuenta los alumnos y la borra
// Una copia que nunca se probó restaurar no es una copia segura: conviene probarla cada tanto.
import { execFile } from "node:child_process";
import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const ejecutar = promisify(execFile);

// Carpeta de las copias (relativa a la carpeta backend). Conviene que esté sincronizada con la nube
// (ej.: Google Drive para escritorio): si la notebook se rompe, la copia en el mismo disco no sirve.
const CARPETA = path.resolve(process.env.RESPALDOS_DIR ?? "../respaldos");
// Carpeta de los programas de PostgreSQL (pg_dump, pg_restore...).
const BIN_POSTGRES = process.env.PG_BIN ?? "C:/Program Files/PostgreSQL/17/bin";
const COPIAS_A_CONSERVAR = 30;
const PREFIJO = "entrenamiento-";

// Datos de conexión sacados de DATABASE_URL. La contraseña va por variable de entorno (PGPASSWORD)
// y no en la línea de comandos; los parámetros de Prisma (?schema=public) pg_dump no los entiende.
function conexion() {
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL en backend/.env");
  const url = new URL(process.env.DATABASE_URL);
  return {
    base: decodeURIComponent(url.pathname.slice(1)),
    args: ["-h", url.hostname, "-p", url.port || "5432", "-U", decodeURIComponent(url.username)],
    env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password) },
  };
}

function programa(nombre: string) {
  return path.join(BIN_POSTGRES, nombre);
}

// Las copias, de la más vieja a la más nueva (el nombre lleva fecha y hora, así que ordenar por nombre alcanza).
async function listarCopias() {
  const archivos = await readdir(CARPETA).catch(() => []);
  return archivos.filter((archivo) => archivo.startsWith(PREFIJO) && archivo.endsWith(".dump")).sort();
}

async function respaldar() {
  const { base, args, env } = conexion();
  await mkdir(CARPETA, { recursive: true });
  // "aaaa-mm-dd_hh-mm" en hora local.
  const ahora = new Date();
  const dos = (n: number) => String(n).padStart(2, "0");
  const sello = `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}_${dos(ahora.getHours())}-${dos(ahora.getMinutes())}`;
  const archivo = path.join(CARPETA, `${PREFIJO}${sello}.dump`);

  // -Fc: formato propio de PostgreSQL, comprimido; se restaura con pg_restore.
  await ejecutar(programa("pg_dump"), [...args, "-Fc", "-f", archivo, base], { env });
  console.log(`Copia guardada: ${archivo}`);

  const copias = await listarCopias();
  for (const vieja of copias.slice(0, Math.max(0, copias.length - COPIAS_A_CONSERVAR))) {
    await rm(path.join(CARPETA, vieja));
    console.log(`Copia vieja borrada: ${vieja}`);
  }
}

async function probarRestauracion() {
  const { args, env } = conexion();
  const copias = await listarCopias();
  const ultima = copias.at(-1);
  if (!ultima) throw new Error(`No hay copias en ${CARPETA}`);

  const basePrueba = "entrenamiento_prueba_restauracion";
  await ejecutar(programa("dropdb"), [...args, "--if-exists", basePrueba], { env });
  await ejecutar(programa("createdb"), [...args, basePrueba], { env });
  try {
    await ejecutar(programa("pg_restore"), [...args, "--no-owner", "-d", basePrueba, path.join(CARPETA, ultima)], { env });
    const { stdout } = await ejecutar(
      programa("psql"),
      [...args, "-d", basePrueba, "-tAc", 'SELECT (SELECT count(*) FROM "Alumno") || \' alumnos, \' || (SELECT count(*) FROM "Pago") || \' pagos\''],
      { env },
    );
    console.log(`Restauración correcta de ${ultima}: ${stdout.trim()}.`);
  } finally {
    await ejecutar(programa("dropdb"), [...args, basePrueba], { env });
  }
}

(process.argv.includes("--probar") ? probarRestauracion() : respaldar()).catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
