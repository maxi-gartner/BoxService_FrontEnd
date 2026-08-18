/**
 * Data Access Layer de sesión — patrón recomendado por Next.js
 * (docs/authentication.md → "Creating a Data Access Layer (DAL)").
 *
 * Esto hace una lectura OPTIMISTA del access token (decodifica sin
 * verificar firma — no tenemos el secreto del backend real acá, ni hace
 * falta): sirve para mostrar/ocultar UI según rol y para redirigir rápido
 * si no hay sesión. La verificación DE VERDAD pasa siempre en el backend
 * real, en cada request que hace el proxy — si el token es inválido o
 * venció, el backend responde 401 y el cliente de API fuerza logout.
 */
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { ACCESS_TOKEN_COOKIE } from "./cookies";
import type { AccessTokenClaims, Role } from "@/types/auth";

export type Session = {
  userId: string;
  role: Role;
  tenantId: string | null;
};

export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const claims = decodeJwt<AccessTokenClaims>(token);
    if (claims.exp * 1000 < Date.now()) return null;
    return { userId: claims.sub, role: claims.role, tenantId: claims.tenantId };
  } catch {
    return null;
  }
});

export function hasRole(session: Session | null, ...roles: Role[]) {
  return session !== null && roles.includes(session.role);
}
