/**
 * Trae el usuario actual DIRECTO desde la fuente (mock o backend real) —
 * no pasa por app/api/proxy porque esto corre en un Server Component,
 * y Next.js recomienda no hacer ese salto de más ahí (ver
 * node_modules/next/dist/docs/.../backend-for-frontend.md, "Caveats").
 */
import "server-only";
import { cookies } from "next/headers";
import { getSession } from "./session";
import { ACCESS_TOKEN_COOKIE } from "./cookies";
import { handleMockRequest } from "@/lib/mock/router";
import { isResourceReal, realBackendHeaders } from "@/lib/backend-mode";
import type { User } from "@/types/auth";

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  const authHeader = token ? `Bearer ${token}` : null;

  // "users" no está migrado al backend real — ver login/route.ts. Si esto
  // se manda al backend real por error, users/me da 401 (falta X-Api-Key
  // y ahí no existe ese endpoint) y el layout entero rebota a /login en
  // loop, porque getSession() sí ve la cookie pero esto igual devuelve
  // null. Por eso pasa por el mismo criterio que el resto, no uno propio.
  if (!isResourceReal("users")) {
    const result = await handleMockRequest("GET", "users/me", new URLSearchParams(), undefined, authHeader);
    const body = result.body as { success: boolean; data: User | null };
    return body.success ? body.data : null;
  }

  const res = await fetch(`${process.env.BACKEND_URL}/users/me`, {
    headers: { ...(authHeader ? { Authorization: authHeader } : {}), ...realBackendHeaders() },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { success: boolean; data: User | null };
  return json.success ? json.data : null;
}
