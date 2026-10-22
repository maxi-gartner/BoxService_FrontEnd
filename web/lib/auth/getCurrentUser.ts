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
import { isResourceReal } from "@/lib/backend-mode";
import type { User } from "@/types/auth";

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  // El mock firma sus JWT con su propio secreto (lib/mock/tokens.ts) y el
  // backend real con el suyo (Auth/AuthService.cs) — no son intercambiables.
  // Antes esto siempre pasaba por handleMockRequest("users/me", ...), que
  // internamente vuelve a verificar la firma con el secreto del mock: un
  // token real pasa el chequeo optimista de getSession() (no verifica
  // firma) pero falla ACÁ, esto devuelve null, y el layout redirige a
  // /login — que a su vez rebota de nuevo a /dashboard porque proxy.ts
  // también es optimista. Login loop. Por eso el modo real no debe tocar
  // el mock para nada.
  if (!isResourceReal("auth")) {
    const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
    const authHeader = token ? `Bearer ${token}` : null;
    const result = await handleMockRequest("GET", "users/me", new URLSearchParams(), undefined, authHeader);
    const body = result.body as { success: boolean; data: User | null };
    return body.success ? body.data : null;
  }

  // Backend real: GET /auth/me devuelve el tenant real (nombre incluido)
  // — antes esto armaba un User sintético solo con lo que ya estaba en el
  // JWT porque no había tabla de usuarios/tenants que consultar.
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const body = (await res.json()) as {
      success: boolean;
      data: { username: string; role: string; tenantId: number | null; tenantName: string | null } | null;
    };
    if (!body.success || !body.data) return null;

    return {
      id: session.userId,
      name: body.data.username,
      email: body.data.username,
      role: session.role,
      tenantId: body.data.tenantId === null ? null : String(body.data.tenantId),
      tenantName: body.data.tenantName,
    };
  } catch {
    return null;
  }
}
