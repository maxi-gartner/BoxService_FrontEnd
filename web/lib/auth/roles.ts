/**
 * Sin dependencias ni "server-only" a propósito: lo importan tanto
 * lib/auth/session.ts (Server Components, runtime Node) como proxy.ts
 * (middleware, runtime Edge) — no puede arrastrar next/headers ni nada
 * que no exista en Edge.
 *
 * El backend real hoy emite el rol en español (dueno/empleado/superadmin
 * — ver Auth/AuthService.cs); el mock y el resto del front usan los
 * nombres en inglés. Esto normaliza los dos.
 */
import type { Role } from "@/types/auth";

export function normalizeRole(value: unknown): Role | null {
  if (value === "owner" || value === "dueno") return "owner";
  if (value === "employee" || value === "empleado") return "employee";
  if (value === "superadmin") return "superadmin";
  return null;
}

export function isRole(value: unknown): value is Role {
  return normalizeRole(value) !== null;
}
