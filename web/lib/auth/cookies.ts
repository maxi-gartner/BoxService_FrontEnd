export const ACCESS_TOKEN_COOKIE = "bs_access_token";
export const REFRESH_TOKEN_COOKIE = "bs_refresh_token";

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
