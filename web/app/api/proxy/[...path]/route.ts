/**
 * Proxy BFF (Backend For Frontend): el navegador solo le habla a Next.js
 * (mismo origen, sin CORS). Acá se agrega el Authorization: Bearer <token>
 * leído de la cookie httpOnly y se reenvía al backend real — o, para los
 * módulos que ese backend todavía no implementa, al router mockeado en
 * lib/mock/. Qué recurso va a cuál lo decide lib/backend-mode.ts (única
 * fuente de verdad, compartida con las rutas de auth).
 *
 * El backend real (BoxService_BackEnd) ya tiene JWT propio
 * (Auth/AuthService.cs) — el Bearer que se reenvía es el token real del
 * usuario logueado, y es el backend quien lo valida (401 si falta/venció,
 * 403 si el rol no alcanza). Acá solo se corta antes si ni siquiera hay
 * cookie, para no hacer un round-trip de más.
 */
import { NextResponse, type NextRequest } from "next/server";
import { handleMockRequest } from "@/lib/mock/router";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";
import { isResourceReal } from "@/lib/backend-mode";

async function handle(req: NextRequest, path: string[]) {
  const pathname = path.join("/");
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const authHeader = accessToken ? `Bearer ${accessToken}` : null;

  let body: unknown = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const text = await req.text();
    body = text ? JSON.parse(text) : undefined;
  }

  const resource = pathname.split("/")[0];

  if (!isResourceReal(resource)) {
    const result = await handleMockRequest(req.method, pathname, req.nextUrl.searchParams, body, authHeader);
    return NextResponse.json(result.body, { status: result.status });
  }

  if (!authHeader) {
    return NextResponse.json(
      { success: false, data: null, error: { code: 401, message: "Missing or invalid token" } },
      { status: 401 },
    );
  }

  const upstreamUrl = `${process.env.BACKEND_URL}/${pathname}${req.nextUrl.search}`;
  const upstreamResponse = await fetch(upstreamUrl, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const responseBody = await upstreamResponse.text();
  return new NextResponse(responseBody, {
    status: upstreamResponse.status,
    headers: { "Content-Type": "application/json" },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
