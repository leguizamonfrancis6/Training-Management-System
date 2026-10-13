import type { EstadoCuota, MedioPago } from "../api/pagos";
import type { Modalidad } from "../api/planes";
import { formatearFecha, formatearMoneda } from "./formato";

export const ETIQUETAS_MODALIDAD: Record<Modalidad, string> = {
  PRESENCIAL: "Presencial",
  SEMIPRESENCIAL: "Semipresencial",
  ONLINE: "Online",
};

export const ETIQUETAS_MEDIO: Record<MedioPago, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
};

export const ETIQUETAS_ESTADO_CUOTA: Record<EstadoCuota, string> = {
  VENCIDA: "Vencida",
  POR_VENCER: "Por vencer",
  AL_DIA: "Al día",
  SIN_PAGOS: "Sin pagos",
};

export function claseEstadoCuota(estado: EstadoCuota) {
  if (estado === "VENCIDA") return "insignia insignia-alerta";
  if (estado === "POR_VENCER") return "insignia insignia-aviso";
  if (estado === "AL_DIA") return "insignia insignia-ok";
  return "insignia";
}

// Texto del vencimiento, ej.: "Venció el 30-09-2026 (hace 13 días)".
export function textoVencimiento(estado: EstadoCuota, vence: string | null, diasRestantes: number | null) {
  if (!vence || diasRestantes === null) return "Sin pagos registrados";
  const fecha = formatearFecha(vence);
  if (diasRestantes < 0) {
    const dias = -diasRestantes;
    return `Venció el ${fecha} (hace ${dias} ${dias === 1 ? "día" : "días"})`;
  }
  if (diasRestantes === 0) return `Vence hoy (${fecha})`;
  if (estado === "POR_VENCER") return `Vence el ${fecha} (en ${diasRestantes} ${diasRestantes === 1 ? "día" : "días"})`;
  return `Al día hasta el ${fecha}`;
}

// Lee un importe escrito como en Argentina ("25.000,50"). Devuelve null si no es válido.
// Es la misma regla que aplica el backend; acá se usa solo para mostrar avisos mientras se escribe.
export function leerImporte(texto: string) {
  const limpio = texto.replace(/[\s$]/g, "");
  if (limpio === "") return null;
  let numero: number;
  if (limpio.includes(",")) numero = Number(limpio.replace(/\./g, "").replace(",", "."));
  else if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) numero = Number(limpio.replace(/\./g, ""));
  else numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
}

// Importe listo para editar en un campo de texto: "25000.5" → "25.000,50".
export function importeParaEditar(importe: string | number) {
  return Number(importe).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------- WhatsApp ----------

interface DatosAviso {
  nombre: string;
  telefono: string; // 10 dígitos: código de área + número
  estado: EstadoCuota;
  vence: string | null;
  diasRestantes: number | null;
  deudaTotal: string;
}

// Hace falta avisar si la cuota está vencida o por vencer, si nunca pagó o si tiene saldo pendiente.
export function requiereAviso({ estado, deudaTotal }: DatosAviso) {
  return estado !== "AL_DIA" || Number(deudaTotal) > 0;
}

export function mensajeWhatsApp({ nombre, estado, vence, diasRestantes, deudaTotal }: DatosAviso) {
  const partes = [`Hola ${nombre}, ¿cómo estás?`];
  if (estado === "VENCIDA" && vence) partes.push(`Te recuerdo que tu cuota venció el ${formatearFecha(vence)}.`);
  if (estado === "POR_VENCER" && vence) {
    partes.push(diasRestantes === 0 ? "Te recuerdo que tu cuota vence hoy." : `Te recuerdo que tu cuota vence el ${formatearFecha(vence)}.`);
  }
  if (estado === "SIN_PAGOS") partes.push("Te escribo por el pago de la cuota.");
  if (Number(deudaTotal) > 0) partes.push(`Te quedó un saldo pendiente de ${formatearMoneda(deudaTotal)}.`);
  partes.push("¡Gracias!");
  return partes.join(" ");
}

// Link wa.me: abre WhatsApp con el mensaje escrito; Agustín lo revisa y lo envía.
// 549 = código de Argentina (54) + 9 (celulares).
export function linkWhatsApp(datos: DatosAviso) {
  return `https://wa.me/549${datos.telefono}?text=${encodeURIComponent(mensajeWhatsApp(datos))}`;
}
