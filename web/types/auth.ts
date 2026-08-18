/**
 * Roles del sistema. Nombres en inglés, consistente con como el backend
 * actual ya nombra estados (approved/rejected/completed).
 *
 * - owner: dueño de un taller. Ve y gestiona solo SU tenant.
 * - employee: empleado de un taller. Igual que owner pero sin acceso a
 *   pantallas de administración del tenant (gestión de empleados, etc.)
 * - superadmin: nosotros. Puede operar sobre cualquier tenant, gestiona
 *   el alta de talleres nuevos.
 */
export type Role = "owner" | "employee" | "superadmin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** null solo para superadmin operando sin tenant seleccionado. */
  tenantId: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

/**
 * Lo que devuelve el backend real en POST /auth/login. Los tokens NUNCA
 * llegan más allá del Route Handler de Next.js que los recibe — ver
 * docs/API_CONTRACT.md, sección Autenticación.
 */
export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

/** Claims mínimos que el access token trae codificados (ver contrato). */
export type AccessTokenClaims = {
  sub: string; // userId
  role: Role;
  tenantId: string | null;
  exp: number;
};
