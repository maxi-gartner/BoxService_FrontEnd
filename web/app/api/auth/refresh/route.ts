import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookies";

export async function POST() {
  const response = NextResponse.json(
    { success: false, data: null, error: { code: 501, message: "Refresh de sesión no está disponible." } },
    { status: 501 },
  );
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}
