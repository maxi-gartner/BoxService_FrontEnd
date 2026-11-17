/**
 * BFF del portal (ver app/api/portal-auth/google/route.ts): el JWT del
 * portal vive en una cookie httpOnly propia y nunca llega al browser —
 * esta ruta es la que lo lee y lo reenvía al backend real.
 */
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { PORTAL_TOKEN_COOKIE } from "@/lib/auth/portalCookies";
import type { ApiResponse } from "@/types/api";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const token = (await cookies()).get(PORTAL_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, data: null, error: { code: 401, message: "Sesión vencida." } },
      { status: 401 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${process.env.BACKEND_URL}/portal/vehicles/${id}/status-inquiry`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: { code: 503, message: "No se pudo conectar con el servidor." } },
      { status: 503 },
    );
  }

  const result = (await upstream.json().catch(() => null)) as ApiResponse<unknown> | null;
  return NextResponse.json(
    result ?? { success: false, data: null, error: { code: upstream.status, message: "No se pudo consultar el estado." } },
    { status: upstream.status },
  );
}
