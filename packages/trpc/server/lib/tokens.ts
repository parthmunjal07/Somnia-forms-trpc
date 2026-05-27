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

/** Cookies must be Secure on HTTPS. Detect this from NODE_ENV or BASE_URL. */
function shouldBeSecure() {
  if (isProduction()) return true;
  if ((process.env.BASE_URL ?? "").startsWith("https")) return true;
  return false;
}

const COOKIE_OPTS_BASE = {
  httpOnly: true,
  secure: shouldBeSecure(),
  // All production traffic goes through the Vercel same-origin proxy (/trpc, /api),
  // so cookies are first-party. "lax" is correct and widely compatible.
  // "none" was causing cookie rejection in many browsers.
  sameSite: "lax" as const,
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
