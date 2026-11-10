import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookies";
import { isResourceReal } from "@/lib/backend-mode";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken && isResourceReal("auth")) {
    try {
      const upstream = await fetch(`${process.env.BACKEND_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (!upstream.ok) console.error(`El backend no pudo registrar el cierre de sesión (${upstream.status}).`);
    } catch (error) {
      console.error("No se pudo registrar el cierre de sesión en el backend.", error);
    }
  }

  const response = NextResponse.json({ success: true, data: { message: "logged out" }, error: null });
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}
