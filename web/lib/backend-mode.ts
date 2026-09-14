/**
 * Única fuente de verdad sobre qué recursos ya hablan con el backend real
 * (BoxService_BackEnd, ASP.NET Core) y cuáles siguen en el mock (lib/mock/).
 *
 * Usado tanto por el proxy genérico (app/api/proxy/[...path]/route.ts) como
 * por las rutas de auth (login/refresh) — antes cada una tenía su propio
 * chequeo de BACKEND_MODE, lo que hacía que activarlo rompiera el login
 * entero (el backend real no tenía JWT). Ahora sí lo tiene (Auth/AuthService.cs),
 * así que "auth" entra en la lista como cualquier otro recurso migrado.
 *
 * Agregar un módulo acá cuando se lo migre en el backend es el único
 * cambio necesario para que el frontend deje de usar el mock en ese
 * recurso — las rutas coinciden 1 a 1 con las del backend real (sin
 * prefijo /api, ver docs/API_CONTRACT.md), no hace falta reescribirlas acá.
 */
const REAL_BACKEND_RESOURCES = new Set([
  "auth",
  "clients",
  "vehicles",
  "budgets",
  "services",
  "invoices",
  "catalog",
]);

// Para mostrar en UI (ej. el badge "Modo backend" del dashboard) — no usar
// para decidir ruteo, para eso está isResourceReal.
export const REAL_BACKEND_RESOURCE_NAMES = [...REAL_BACKEND_RESOURCES];

export function isResourceReal(resource: string): boolean {
  return process.env.BACKEND_MODE === "real" && !!process.env.BACKEND_URL && REAL_BACKEND_RESOURCES.has(resource);
}
