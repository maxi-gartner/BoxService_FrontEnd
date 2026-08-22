"use client";

import type { ApiResponse } from "@/types/api";

/**
 * Cliente HTTP para el browser. Le habla siempre a /api/proxy/* (mismo
 * origen, sin CORS) — nunca al backend real directamente. Si el backend
 * responde 401, intenta refrescar la sesión una vez; si eso también
 * falla, manda a /login.
 */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/proxy/${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
    if (refreshed.ok) {
      return request<T>(method, path, body);
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiClientError("Sesión expirada", 401);
  }

  const json = (await res.json()) as ApiResponse<T>;

  if (!json.success) {
    throw new ApiClientError(json.error.message, json.error.code);
  }

  return json.data;
}

export class ApiClientError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
