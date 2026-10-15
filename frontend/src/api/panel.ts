import { pedir } from "./cliente";

// Números que muestra la pantalla de Inicio (sin montos: son confidenciales).
export interface Panel {
  alumnosActivos: number;
  cuotasPorVencer: number; // vencen en los próximos 7 días
  evaluacionesProximas: number; // vencen entre hoy y los próximos 7 días
  rutinasPorCambiar: number; // ya terminaron o terminan en los próximos 7 días
}

export const panelApi = {
  obtener: () => pedir<Panel>("/panel"),
};
