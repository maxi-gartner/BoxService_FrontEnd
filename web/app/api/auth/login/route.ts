import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE, cookieOptions } from "@/lib/auth/cookies";
import type { ApiResponse } from "@/types/api";
import type { LoginResponse, Role, User } from "@/types/auth";

function normalizeRole(role: LoginResponse["role"]): Role {
  return role === "dueno" ? "owner" : role === "empleado" ? "employee" : "superadmin";
}

export async function POST(req: NextRequest) {
  const body = await req.json();


  const upstream = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await upstream.json().catch(() => null)) as ApiResponse<LoginResponse> | null;
  if (!upstream.ok || !result?.success) {
    return NextResponse.json(
      result ?? { success: false, data: null, error: { code: upstream.status, message: "Login failed" } },
      { status: upstream.status },
    );
  }

  const { token, expiresAt, username, role } = result.data;
  const user: User = {
    id: username,
    name: username,
    email: username,
    role: normalizeRole(role),
    tenantId: null,
  };

  const response = NextResponse.json({ success: true, data: { user }, error: null });
  const maxAge = Math.max(1, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000));
  response.cookies.set(ACCESS_TOKEN_COOKIE, token, { ...cookieOptions, maxAge });
  return response;
}
