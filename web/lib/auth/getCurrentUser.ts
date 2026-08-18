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
import type { User } from "@/types/auth";

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  const authHeader = token ? `Bearer ${token}` : null;
  const useMock = process.env.BACKEND_MODE !== "real";

  if (useMock) {
    const result = await handleMockRequest("GET", "users/me", new URLSearchParams(), undefined, authHeader);
    const body = result.body as { success: boolean; data: User | null };
    return body.success ? body.data : null;
  }

  const backendUrl = process.env.BACKEND_URL;
  const res = await fetch(`${backendUrl}/users/me`, {
    headers: authHeader ? { Authorization: authHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { success: boolean; data: User | null };
  return json.success ? json.data : null;
}
