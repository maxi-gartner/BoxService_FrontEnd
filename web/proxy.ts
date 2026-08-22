/**
 * Proxy (reemplazo de middleware.ts en Next.js 16 — ver
 * node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md).
 *
 * Chequeo OPTIMISTA nada más: redirige si no hay token o si el rol no
 * alcanza para /admin. La verificación real vuelve a pasar siempre en el
 * backend en cada request de datos — esto es solo para no mostrar ni un
 * parpadeo de UI protegida a alguien sin sesión.
 */
import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt } from "jose";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";
import type { AccessTokenClaims } from "@/types/auth";

const PUBLIC_ROUTES = ["/login"];
const SUPERADMIN_ONLY_PREFIX = "/admin";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  let claims: AccessTokenClaims | null = null;
  if (token) {
    try {
      claims = decodeJwt<AccessTokenClaims>(token);
      if (claims.exp * 1000 < Date.now()) claims = null;
    } catch {
      claims = null;
    }
  }

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  if (!isPublicRoute && !claims) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicRoute && claims) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith(SUPERADMIN_ONLY_PREFIX) && claims?.role !== "superadmin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
