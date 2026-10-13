// Función común para llamar a la API. Las cookies de sesión se envían solas
// porque el frontend y la API comparten origen (proxy de Vite).

export class ErrorApi extends Error {
  estado: number;

  constructor(mensaje: string, estado: number) {
    super(mensaje);
    this.estado = estado;
  }
}

interface Opciones {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  datos?: unknown;
}

// Rutas donde un 401 es una respuesta esperada y no significa "sesión vencida".
const RUTAS_SIN_REDIRECCION = ["/auth/login", "/auth/yo"];

export async function pedir<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: opciones.metodo ?? "GET",
      headers: opciones.datos !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: opciones.datos !== undefined ? JSON.stringify(opciones.datos) : undefined,
    });
  } catch {
    throw new ErrorApi("No se pudo conectar con el servidor", 0);
  }

  // Si la sesión venció mientras se usaba el sistema, se vuelve al login.
  if (respuesta.status === 401 && !RUTAS_SIN_REDIRECCION.includes(ruta)) {
    window.location.assign("/login");
  }

  if (respuesta.status === 204) {
    return undefined as T;
  }

  const cuerpo = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ErrorApi(cuerpo?.error ?? "No se pudo conectar con el servidor", respuesta.status);
  }
  return cuerpo as T;
}
