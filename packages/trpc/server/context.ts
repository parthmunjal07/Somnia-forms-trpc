import jwt from "jsonwebtoken";
import type { SelectUser } from "@repo/database/schema";
import type { CookieResponse } from "./lib/tokens";


export interface AuthUser {
  id: string;
  email: string;
  role: SelectUser["role"];
  emailVerifiedAt: string | null;
}

// Minimal structural interface — avoids importing @types/express into the shared package.
// The actual express Request/Response types satisfy this structurally at call sites in apps/api.
export interface ContextRequest {
  cookies?: Record<string, string | undefined>;
}

export async function createContext({
  req,
  res,
}: {
  req: ContextRequest;
  res: CookieResponse;
}) {
  let user: AuthUser | null = null;

  const token = req.cookies?.access_token;

  if (token) {
    try {
      const secret = process.env.JWT_SECRET ?? "super-secret-key-change-in-production";
      const payload = jwt.verify(token, secret) as {
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
      // invalid or expired token — user stays null
    }
  }

  return { user, req, res };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
