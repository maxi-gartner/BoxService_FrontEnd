export const ACCESS_TOKEN_COOKIE = "bs_access_token";
export const REFRESH_TOKEN_COOKIE = "bs_refresh_token";

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ?? false,
  sameSite: "lax" as const,
  path: "/",
};
