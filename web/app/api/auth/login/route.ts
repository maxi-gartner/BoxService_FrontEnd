import { NextResponse, type NextRequest } from "next/server";
import { handleMockRequest } from "@/lib/mock/router";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, cookieOptions } from "@/lib/auth/cookies";
import type { ApiResponse } from "@/types/api";
import type { LoginResponse } from "@/types/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const useMock = process.env.BACKEND_MODE !== "real";

  let result: ApiResponse<LoginResponse>;

  if (useMock) {
    const mockResult = await handleMockRequest("POST", "auth/login", new URLSearchParams(), body, null);
    result = mockResult.body as ApiResponse<LoginResponse>;
    if (!result.success) {
      return NextResponse.json(result, { status: mockResult.status });
    }
  } else {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 500, message: "BACKEND_URL is not configured" } },
        { status: 500 },
      );
    }
    const upstream = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
