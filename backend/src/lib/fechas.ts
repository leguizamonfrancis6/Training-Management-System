// Las fechas de calendario viajan como texto "aaaa-mm-dd" y se guardan como DATE (sin hora).
// Se usan siempre a las 00:00 UTC para que la zona horaria no corra el día.

export function fechaDesdeTexto(texto: string) {
  return new Date(`${texto}T00:00:00.000Z`);
}

export function textoDesdeFecha(fecha: Date) {
  return fecha.toISOString().slice(0, 10);
}

// Fecha de hoy en Argentina, como "aaaa-mm-dd" (el formato en-CA es justamente ese).
export function hoyComoTexto() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}
