import { NextResponse, type NextRequest } from "next/server";
import { handleMockRequest } from "@/lib/mock/router";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, cookieOptions } from "@/lib/auth/cookies";
import { isResourceReal } from "@/lib/backend-mode";

// Forma propia del mock (lib/mock/router.ts → handleRefresh) — no tiene
// nada que ver con el RefreshResponse del backend real (que ni siquiera
// existe todavía, ver más abajo).
type MockRefreshResponse = { accessToken: string; refreshToken: string };

export async function POST(req: NextRequest) {
  // El backend real (Auth/AuthService.cs) todavía no tiene refresh token —
  // un solo JWT de 60 min y listo, ver docs/API_CONTRACT.md. No hay nada
  // que llamar ahí: se corta acá mismo, sin intentar un fetch a una ruta
  // que no existe, y se limpia la sesión para no dejarla en un estado raro.
  if (isResourceReal("auth")) {
    const response = NextResponse.json(
      { success: false, data: null, error: { code: 501, message: "La sesión no se puede renovar todavía — volvé a iniciar sesión." } },
      { status: 501 },
    );
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ success: false, data: null, error: { code: 401, message: "No session" } }, { status: 401 });
  }

  const result = await handleMockRequest("POST", "auth/refresh", new URLSearchParams(), { refreshToken }, null);
  const parsed = result.body as { success: boolean; data: MockRefreshResponse | null };
  if (!parsed.success || !parsed.data) {
    const response = NextResponse.json(result.body, { status: result.status });
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  const response = NextResponse.json({ success: true, data: { ok: true }, error: null });
  response.cookies.set(ACCESS_TOKEN_COOKIE, parsed.data.accessToken, { ...cookieOptions, maxAge: 60 * 15 });
  response.cookies.set(REFRESH_TOKEN_COOKIE, parsed.data.refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });
  return response;
}
