import jwt from "jsonwebtoken";
import type { SelectUser } from "@repo/database/schema";

// Minimal structural interface — avoids importing @types/express into this shared package
// which would cause TS2742 "cannot be named" errors on all tRPC exports.
export interface CookieResponse {
  cookie(name: string, value: string, options?: Record<string, unknown>): unknown;
  clearCookie(name: string, options?: Record<string, unknown>): unknown;
}

export interface TokenPayload {
  sub: string; // user id
  email: string;
  role: SelectUser["role"];
  emailVerifiedAt: string | null;
}

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

function getJwtSecret() {
  return process.env.JWT_SECRET ?? "super-secret-key-change-in-production";
}

function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.NODE_ENV === ("prod" as string);
}

const COOKIE_OPTS_BASE = {
  httpOnly: true,
  secure: isProduction(),
  // In production: API (Railway) and frontend (Vercel) are on different domains.
  // "none" allows cookies to be sent on cross-origin requests (e.g. tRPC POST mutations).
  // "none" requires secure:true (HTTPS), so we fall back to "lax" in development.
  sameSite: isProduction() ? ("none" as const) : ("lax" as const),
  path: "/",
};

export function generateTokens(
  user: Pick<SelectUser, "id" | "email" | "role" | "emailVerifiedAt">
) {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
  };

  const accessToken = jwt.sign(payload, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign({ sub: user.id }, getJwtSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
}

export function setTokenCookies(
  res: CookieResponse,
  tokens: ReturnType<typeof generateTokens>
) {
  res.cookie("access_token", tokens.accessToken, {
    ...COOKIE_OPTS_BASE,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie("refresh_token", tokens.refreshToken, {
    ...COOKIE_OPTS_BASE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export function clearTokenCookies(res: CookieResponse) {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, getJwtSecret()) as { sub: string };
}
