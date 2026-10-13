// Error con código HTTP: los servicios lo lanzan (ej.: 404, 409) y el middleware
// de errores lo convierte en la respuesta correspondiente.
export class ErrorHttp extends Error {
  estado: number;

  constructor(estado: number, mensaje: string) {
    super(mensaje);
    this.estado = estado;
  }
}

// Convierte el parámetro :id de la URL en número; si no es válido, responde 404.
export function leerId(valor: unknown) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorHttp(404, "No encontrado");
  }
  return id;
}
