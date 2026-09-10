/**
 * Única fuente de verdad sobre qué recursos ya hablan con el backend real
 * (BoxService_BackEnd, ASP.NET Core) y cuáles siguen en el mock (lib/mock/).
 *
 * Usado tanto por el proxy genérico (app/api/proxy/[...path]/route.ts) como
 * por las rutas de auth (login/refresh), que antes tenían cada una su
 * propio chequeo de BACKEND_MODE — eso hacía que activar BACKEND_MODE=real
 * rompiera el login entero, porque el backend real todavía no tiene
 * auth/JWT (fuera de alcance explícito de esa migración).
 *
 * Agregar un módulo acá cuando se lo migre en el backend es el único
 * cambio necesario para que el frontend deje de usar el mock en ese
 * recurso. "auth" y "users" no están ni van a estar en esta lista hasta
 * que el backend real tenga login propio — hasta entonces van siempre al
 * mock, sin importar BACKEND_MODE.
 */
const REAL_BACKEND_RESOURCES = new Set([
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

export function realBackendHeaders(): Record<string, string> {
  const apiKey = process.env.BACKEND_API_KEY;
  return apiKey ? { "X-Api-Key": apiKey } : {};
}
