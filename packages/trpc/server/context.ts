import jwt from "jsonwebtoken";
import type { SelectUser } from "@repo/database/models/user";
import type { CookieResponse } from "./lib/tokens";

export interface AuthUser {
  id: string;
  email: string;
  role: SelectUser["role"];
  emailVerifiedAt: string | null;
}

// Minimal structural interface — avoids importing @types/express into the shared package.
// The actual Express Request/Response types satisfy this structurally at call sites in apps/api.
export interface ContextRequest {
  cookies?: Record<string, string | undefined>;
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}

// jwtSecret is injected by the caller (apps/api/src/server.ts via adaptContext).
// This keeps packages/trpc free of any dependency on apps/api's env or config.
export async function createContext({
  req,
  res,
  jwtSecret,
}: {
  req: ContextRequest;
  res: CookieResponse;
  jwtSecret: string;
}) {
  let user: AuthUser | null = null;

  let token = req.cookies?.access_token;

  if (!token && req.headers?.authorization) {
    const authHeader = req.headers.authorization;
    const parts = typeof authHeader === "string" ? authHeader.split(" ") : [];
    if (parts.length === 2 && parts[0]?.toLowerCase() === "bearer") {
      token = parts[1];
    }
  }

  if (token) {
    try {
      const payload = jwt.verify(token, jwtSecret) as {
        sub: string;
        email: string;
        role: SelectUser["role"];
        emailVerifiedAt: string | null;
      };
      user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        emailVerifiedAt: payload.emailVerifiedAt,
      };
    } catch {
      // Invalid or expired token — user stays null.
      // auth.me will attempt refresh token fallback if needed.
    }
  }

  return { user, req, res };
}

export type Context = Awaited<ReturnType<typeof createContext>>;