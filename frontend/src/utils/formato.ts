// Funciones de presentación: fechas en dd-mm-aaaa.
// Las fechas de calendario llegan como ISO ("2001-05-10T00:00:00.000Z"): se usan solo los
// primeros 10 caracteres, sin convertir a hora local (si no, podría mostrarse el día anterior).

const dosDigitos = (numero: number) => String(numero).padStart(2, "0");

export function formatearFecha(iso: string | null | undefined) {
  if (!iso) return "";
  const [anio, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}-${mes}-${anio}`;
}

// Para momentos con hora (ej.: cuándo se hizo un cambio): sí se muestran en hora local.
// Resultado: "dd-mm-aaaa hh:mm".
export function formatearFechaHora(iso: string) {
  const fecha = new Date(iso);
  const dia = `${dosDigitos(fecha.getDate())}-${dosDigitos(fecha.getMonth() + 1)}-${fecha.getFullYear()}`;
  return `${dia} ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

export function calcularEdad(fechaNacimiento: string) {
  const [anio, mes, dia] = fechaNacimiento.slice(0, 10).split("-").map(Number);
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const yaCumplio = mesActual > mes || (mesActual === mes && hoy.getDate() >= dia);
  return hoy.getFullYear() - anio - (yaCumplio ? 0 : 1);
}

// Hoy como "aaaa-mm-dd" (para el atributo max de los <input type="date">).
export function hoyComoTexto() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${dosDigitos(hoy.getMonth() + 1)}-${dosDigitos(hoy.getDate())}`;
}
