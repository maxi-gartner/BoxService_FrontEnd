/**
 * Proxy BFF (Backend For Frontend): el navegador solo le habla a Next.js
 * (mismo origen, sin CORS). Acá se agrega el Authorization: Bearer <token>
 * leído de la cookie httpOnly y se reenvía al backend real — o, mientras
 * ese backend no exista, al router mockeado en lib/mock/.
 *
 * El día que el backend real esté listo: BACKEND_MODE=real + BACKEND_URL
 * en .env, y listo — ningún otro archivo del frontend cambia.
 */
import { NextResponse, type NextRequest } from "next/server";
import { handleMockRequest } from "@/lib/mock/router";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";

async function handle(req: NextRequest, path: string[]) {
  const pathname = path.join("/");
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const authHeader = accessToken ? `Bearer ${accessToken}` : null;

  let body: unknown = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const text = await req.text();
    body = text ? JSON.parse(text) : undefined;
  }

  const useMock = process.env.BACKEND_MODE !== "real";

  if (useMock) {
    const result = await handleMockRequest(req.method, pathname, req.nextUrl.searchParams, body, authHeader);
    return NextResponse.json(result.body, { status: result.status });
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { success: false, data: null, error: { code: 500, message: "BACKEND_URL is not configured" } },
      { status: 500 },
    );
  }

  const upstreamUrl = `${backendUrl}/${pathname}${req.nextUrl.search}`;
  const upstreamResponse = await fetch(upstreamUrl, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
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
