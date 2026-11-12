"use client";

import type { ApiResponse } from "@/types/api";
import { apiErrorMessage } from "./error-messages";

/**
 * Cliente HTTP para el browser. Le habla siempre a /api/proxy/* (mismo
 * origen, sin CORS) — nunca al backend real directamente. Si el backend
 * responde 401, intenta refrescar la sesión una vez; si eso también
 * falla, manda a /login.
 */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const isFormData = body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(`/api/proxy/${path}`, {
      method,
      headers: body !== undefined && !isFormData ? { "Content-Type": "application/json" } : undefined,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError(apiErrorMessage(503), 503);
  }

  if (res.status === 401) {
    await fetch("/api/auth/logout", { method: "POST" });
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiClientError("Sesión expirada", 401);
  }

  let json: ApiResponse<T>;
  try { json = await res.json(); }
  catch { throw new ApiClientError(apiErrorMessage(res.ok ? 502 : res.status), res.ok ? 502 : res.status); }

  if (!json || typeof json !== "object" || !res.ok || json.success !== true) {
    const code = !res.ok ? res.status : (json?.error?.code ?? 502);
    throw new ApiClientError(apiErrorMessage(code, json?.error?.message), code, json?.data);
  }
  return json.data;
}

export class ApiClientError extends Error {
  code: number;
  // Payload extra que algunos errores traen además del mensaje (ej: el
  // 409 de patente duplicada trae el vehículo/cliente existente para que
  // el caller pueda ofrecer una transferencia en vez de solo mostrar el
  // mensaje). La mayoría de los callers lo ignoran.
  data?: unknown;
  constructor(message: string, code: number, data?: unknown) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

// Query string para los listados paginados (page/pageSize/search/status/
// vehicleId) — omite claves undefined/null/"" en vez de mandarlas vacías.
export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  postForm: <T>(path: string, body: FormData) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
