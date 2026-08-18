import { SignJWT } from "jose";
import type { MockUser } from "./db";

// Secreto de desarrollo únicamente — el backend real va a tener el suyo.
const MOCK_SECRET = new TextEncoder().encode("boxservice-mock-dev-secret-do-not-use-in-prod");

export async function signAccessToken(user: MockUser) {
  return new SignJWT({ role: user.role, tenantId: user.tenantId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(MOCK_SECRET);
}

export async function signRefreshToken(user: MockUser) {
  return new SignJWT({ type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(MOCK_SECRET);
}

export async function verifyMockToken(token: string) {
  const { jwtVerify } = await import("jose");
  const { payload } = await jwtVerify(token, MOCK_SECRET);
  return payload;
}
