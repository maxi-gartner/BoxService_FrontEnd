import { NextResponse, type NextRequest } from "next/server";
import { handleMockRequest } from "@/lib/mock/router";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, cookieOptions } from "@/lib/auth/cookies";
import { isResourceReal, realBackendHeaders } from "@/lib/backend-mode";
import type { ApiResponse } from "@/types/api";
import type { LoginResponse } from "@/types/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();

  let result: ApiResponse<LoginResponse>;

  // "auth" no está migrado al backend real (no tiene JWT todavía) — esto
  // siempre da false hoy, pero queda armado igual que el resto para el
  // día que exista login real, sin duplicar el criterio en otro lado.
  if (!isResourceReal("auth")) {
    const mockResult = await handleMockRequest("POST", "auth/login", new URLSearchParams(), body, null);
    result = mockResult.body as ApiResponse<LoginResponse>;
    if (!result.success) {
      return NextResponse.json(result, { status: mockResult.status });
    }
  } else {
    const upstream = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...realBackendHeaders() },
      body: JSON.stringify(body),
    });
    if (!upstream.ok) {
      const errorBody = await upstream.json().catch(() => null);
      return NextResponse.json(
        errorBody ?? { success: false, data: null, error: { code: upstream.status, message: "Login failed" } },
        { status: upstream.status },
      );
    }
    result = { success: true, data: (await upstream.json()) as LoginResponse, error: null };
  }

  const { accessToken, refreshToken, user } = result.data;

  const response = NextResponse.json({ success: true, data: { user }, error: null });
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, { ...cookieOptions, maxAge: 60 * 15 });
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });
  return response;
}
