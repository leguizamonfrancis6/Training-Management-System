import type { ErrorRequestHandler, RequestHandler } from "express";

export const rutaNoEncontrada: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
};

// Express 5 envía acá también los errores de las rutas async.
// Al cliente no se le muestra el detalle del error (puede contener datos internos).
export const manejarErrores: ErrorRequestHandler = (error, _req, res, _next) => {
  // JSON mal formado en el cuerpo del pedido: es un error del cliente, no del servidor.
  if (error?.type === "entity.parse.failed") {
    res.status(400).json({ error: "El cuerpo del pedido no es un JSON válido" });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Error interno del servidor" });
};
