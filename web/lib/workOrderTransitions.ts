import type { WorkOrderStatus } from "@/types/entities";

// Única fuente de verdad del flujo en_espera -> en_proceso -> terminado ->
// entregado — la usan tanto el tablero (app/(dashboard)/ordenes-trabajo)
// como el header del Taller (VehicleWorkspaceHeader), para que no se
// desincronicen los labels/pasos entre los dos lugares que los muestran.
export type OpenWorkOrderStatus = "en_espera" | "en_proceso" | "terminado";

export const NEXT_STATUS: Record<OpenWorkOrderStatus, WorkOrderStatus> = {
  en_espera: "en_proceso",
  en_proceso: "terminado",
  terminado: "entregado",
};

export const NEXT_LABEL: Record<OpenWorkOrderStatus, string> = {
  en_espera: "Pasar a en proceso",
  en_proceso: "Marcar terminado",
  terminado: "Entregar al cliente",
};
