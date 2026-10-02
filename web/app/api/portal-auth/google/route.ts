import { NextResponse, type NextRequest } from "next/server";
import { PORTAL_TOKEN_COOKIE, portalCookieOptions } from "@/lib/auth/portalCookies";
import type { ApiResponse } from "@/types/api";

type PortalLoginResponse = { token: string; expiresAt: string; clientId: number; name: string };

// Mismo patrón BFF que app/api/auth/login/route.ts: el ID token de Google
// y el JWT que devuelve el backend nunca llegan al browser — esta ruta es
// la única que los toca, y el JWT termina en una cookie httpOnly propia
// del portal (lib/auth/portalCookies.ts).
export async function POST(req: NextRequest) {
  const body = await req.json();

  let upstream: Response;
  try {
    upstream = await fetch(`${process.env.BACKEND_URL}/portal/auth/google`, {
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

  const result = (await upstream.json().catch(() => null)) as ApiResponse<PortalLoginResponse> | null;
  if (!upstream.ok || !result?.success) {
    return NextResponse.json(
      result ?? { success: false, data: null, error: { code: upstream.status, message: "No se pudo iniciar sesión." } },
      { status: upstream.status },
    );
  }

  const { token, expiresAt, clientId, name } = result.data;
  const response = NextResponse.json({ success: true, data: { clientId, name }, error: null });
  const maxAge = Math.max(1, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000));
  response.cookies.set(PORTAL_TOKEN_COOKIE, token, { ...portalCookieOptions, maxAge });
  return response;
}
