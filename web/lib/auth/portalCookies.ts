// Cookie separada de la de staff (lib/auth/cookies.ts) — un mismo
// navegador puede tener sesión de staff y de portal al mismo tiempo sin
// pisarse (por ejemplo, alguien del taller probando el portal).
export const PORTAL_TOKEN_COOKIE = "bs_portal_token";

export { cookieOptions as portalCookieOptions } from "./cookies";
