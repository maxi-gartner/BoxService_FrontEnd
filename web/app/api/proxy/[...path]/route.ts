/**
 * Proxy BFF (Backend For Frontend): el navegador solo le habla a Next.js
 * (mismo origen, sin CORS). Acá se agrega el Authorization: Bearer <token>
 * leído de la cookie httpOnly y se reenvía al backend real — o, para los
 * módulos que ese backend todavía no implementa, al router mockeado en
 * lib/mock/. Qué recurso va a cuál lo decide lib/backend-mode.ts (única
 * fuente de verdad, compartida con las rutas de auth).
 *
 * El backend real (BoxService_BackEnd, ASP.NET Core) no tiene JWT todavía
 * — usa X-Api-Key, igual que el backend viejo. Por eso el reenvío "real"
 * manda X-Api-Key en vez del Bearer (que sí entiende el mock).
 */
import { NextResponse, type NextRequest } from "next/server";
import { handleMockRequest } from "@/lib/mock/router";
import { verifyMockToken } from "@/lib/mock/tokens";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";
import { isResourceReal, realBackendHeaders } from "@/lib/backend-mode";

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

  // El backend real todavía no valida sesión (no tiene JWT) — la única
  // "sesión" que existe hoy es la que emite el mock al loguearse. Se
  // valida acá para que un recurso migrado no quede accesible sin login
  // solo porque el backend de atrás no lo chequea.
  if (!accessToken || !(await verifyMockToken(accessToken).catch(() => null))) {
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
      ...realBackendHeaders(),
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
