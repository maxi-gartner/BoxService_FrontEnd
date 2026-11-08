import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt } from "jose";
import { handleMockRequest } from "@/lib/mock/router";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, cookieOptions } from "@/lib/auth/cookies";
import { normalizeRole } from "@/lib/auth/roles";
import { isResourceReal } from "@/lib/backend-mode";
import type { ApiResponse } from "@/types/api";
import type { AccessTokenClaims, LoginResponse, User } from "@/types/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!isResourceReal("auth")) {
    const mockResult = await handleMockRequest("POST", "auth/login", new URLSearchParams(), body, null);
    const result = mockResult.body as ApiResponse<{ accessToken: string; refreshToken: string; user: User }>;
    if (!result.success) {
      return NextResponse.json(result, { status: mockResult.status });
    }

    const { accessToken, refreshToken, user } = result.data;
    const response = NextResponse.json({ success: true, data: { user }, error: null });
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, { ...cookieOptions, maxAge: 60 * 15 });
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });
    return response;
  }

  // Backend real (Auth/AuthService.cs): un solo token, sin refresh, y sin
  // tabla de usuarios todavía — ver docs/API_CONTRACT.md. Si el backend
  // está caído o BACKEND_URL apunta a cualquier cosa, que el fetch tire
  // no debe volar la ruta entera con un 500 genérico.
  let upstream: Response;
  try {
    upstream = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: { code: 503, message: "No se pudo conectar con el servidor." } },
      { status: 503 },
    );
  }

  const result = (await upstream.json().catch(() => null)) as ApiResponse<LoginResponse> | null;
  if (!upstream.ok || !result?.success) {
    return NextResponse.json(
      result ?? { success: false, data: null, error: { code: upstream.status, message: "Login failed" } },
      { status: upstream.status },
    );
  }

  const { token, expiresAt, username, role } = result.data;
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) {
    return NextResponse.json(
      { success: false, data: null, error: { code: 500, message: `Rol desconocido: ${role}` } },
      { status: 500 },
    );
  }

  // El login no devuelve tenantId en el body — ya viene en el JWT (claim
  // "tenantId", ausente para superadmin). Se decodifica acá mismo así el
  // User que vuelve al cliente ya tiene el tenant correcto sin esperar al
  // próximo getCurrentUser() (que sí hace el round-trip a /auth/me para
  // el nombre del tenant, no solo el id).
  const claims = decodeJwt<AccessTokenClaims>(token);
  const user: User = {
    id: username,
    name: username,
    email: username,
    role: normalizedRole,
    tenantId: claims.tenantId ?? null,
    tenantName: null,
  };

  const response = NextResponse.json({ success: true, data: { user }, error: null });
  const maxAge = Math.max(1, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000));
  response.cookies.set(ACCESS_TOKEN_COOKIE, token, { ...cookieOptions, maxAge });
  // Sin refresh token real todavía (ver refresh/route.ts) — no seteamos
  // REFRESH_TOKEN_COOKIE, así no queda una cookie que nadie usa.
  return response;
}
