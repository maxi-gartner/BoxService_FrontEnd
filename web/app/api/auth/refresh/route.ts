import { NextResponse, type NextRequest } from "next/server";
import { handleMockRequest } from "@/lib/mock/router";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, cookieOptions } from "@/lib/auth/cookies";
import type { RefreshResponse } from "@/types/auth";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ success: false, data: null, error: { code: 401, message: "No session" } }, { status: 401 });
  }

  const useMock = process.env.BACKEND_MODE !== "real";
  let tokens: RefreshResponse;

  if (useMock) {
    const result = await handleMockRequest("POST", "auth/refresh", new URLSearchParams(), { refreshToken }, null);
    const parsed = result.body as { success: boolean; data: RefreshResponse | null };
    if (!parsed.success || !parsed.data) {
      const response = NextResponse.json(result.body, { status: result.status });
      response.cookies.delete(ACCESS_TOKEN_COOKIE);
      response.cookies.delete(REFRESH_TOKEN_COOKIE);
      return response;
    }
    tokens = parsed.data;
  } else {
    const backendUrl = process.env.BACKEND_URL;
    const upstream = await fetch(`${backendUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!upstream.ok) {
      const response = NextResponse.json(
        { success: false, data: null, error: { code: 401, message: "Session expired" } },
        { status: 401 },
      );
      response.cookies.delete(ACCESS_TOKEN_COOKIE);
      response.cookies.delete(REFRESH_TOKEN_COOKIE);
      return response;
    }
    tokens = (await upstream.json()) as RefreshResponse;
  }

  const response = NextResponse.json({ success: true, data: { ok: true }, error: null });
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, { ...cookieOptions, maxAge: 60 * 15 });
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });
  return response;
}
