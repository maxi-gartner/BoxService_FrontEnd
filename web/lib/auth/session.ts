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
import { ROLE_LABELS, type AccessTokenClaims, type Role } from "@/types/auth";

export type Session = {
  userId: string;
  role: Role;
  tenantId: string | null;
};

export function isRole(value: unknown): value is Role {
  return normalizeRole(value) !== null;
}

export function normalizeRole(value: unknown): Role | null {
  if (value === "owner" || value === "dueno") return "owner";
  if (value === "employee" || value === "empleado") return "employee";
  if (value === "superadmin") return "superadmin";
  return null;
}

export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const claims = decodeJwt<AccessTokenClaims>(token);
    const role = normalizeRole(claims.role);
    if (!claims.sub || !claims.exp || claims.exp * 1000 < Date.now() || !role) return null;
    return { userId: claims.sub, role, tenantId: claims.tenantId ?? null };
  } catch {
    return null;
  }
});

export function hasRole(session: Session | null, ...roles: Role[]) {
  return session !== null && roles.includes(session.role);
}
