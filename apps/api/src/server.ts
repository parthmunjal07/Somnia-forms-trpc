import { env } from "./env";

import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";
import helmet, { contentSecurityPolicy } from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { randomBytes } from "node:crypto";
import passport from "./auth/passport";
import { generateTokens, setTokenCookies } from "@repo/trpc/server/lib/tokens";
import type { SelectUser } from "@repo/database/schema";
import * as trpcExpress from "@trpc/server/adapters/express";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";

// Adapter: bridges the full Express context options to our minimal structural context types.
// This keeps @types/express out of the shared @repo/trpc package.
// env is imported at the top of this file — JWT_SECRET is always defined before use.
function adaptContext(opts: CreateExpressContextOptions) {
  return createContext({ req: opts.req, res: opts.res, jwtSecret: env.JWT_SECRET });
}

export const app = express();

// Railway (and most PaaS) run behind a reverse proxy / load balancer.
// Express must trust the proxy so req.protocol reflects the original HTTPS request.
app.set("trust proxy", 1);

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // Fallback to allow same-origin resources (like favicon.ico) by default
        defaultSrc: ["'none'"], 
        
        // ALLOWS your network requests, API calls, and CSRF validations
        connectSrc: [
          "'self'",
          "http://localhost:8000"       // Your local development API URL
        ],
        
        // Allows scripts, styles, and assets for Scalar API reference (including CDNs & inline code)
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com", "unpkg.com"],
        fontSrc: ["'self'", "fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "cdn.jsdelivr.net"],
      },
    },
  })
);


// ─── CORS ─────────────────────────────────────────────────────────────────────
// Clean up origins: remove accidental quotes and trailing slashes
const allowedOrigins = env.ALLOWED_ORIGINS.split(",")
  .map((o) => o.trim().replace(/^["']|["']$/g, "").replace(/\/$/, ""));

logger.info(`CORS allowed origins: ${allowedOrigins.join(", ")}`);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server calls with no origin header
      if (!origin) {
        return callback(null, true);
      }
      
      const cleanOrigin = origin.trim().replace(/\/$/, "");
      if (allowedOrigins.includes(cleanOrigin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS rejected origin: ${origin} (clean: ${cleanOrigin})`);
        // Standard CORS rejection: pass false instead of throwing an Error.
        // Throwing an Error triggers the global 500 handler, masking the CORS issue.
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// ─── Cookie Parser ────────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Passport Auth ────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ─── Body Size Limits ─────────────────────────────────────────────────────────
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  message: { error: "Too many registration attempts" },
});
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { error: "Too many login attempts. Please wait." },
});
const refreshLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  message: { error: "Too many refresh attempts" },
});
const responseSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 30, // 30 requests per minute
  message: { error: "Too many response submissions. Please wait a minute." },
  standardHeaders: true, // Return standard rate limit info headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
});

// Apply rate limiters to specific tRPC auth paths
app.use("/trpc/auth.register", registerLimiter);
app.use("/trpc/auth.login", loginLimiter);
app.use("/trpc/auth.me", refreshLimiter);

// Apply rate limiters to public response submission endpoints
app.use("/trpc/responses.submit", responseSubmissionLimiter);
app.use("/api/responses/submit", responseSubmissionLimiter);

// ─── CSRF Endpoint ────────────────────────────────────────────────────────────
app.get("/api/csrf", (_req, res) => {
  const csrfToken = randomBytes(32).toString("hex");
  res.cookie("csrf_token", csrfToken, {
    // NOT httpOnly — client JS must read this and send it back via X-CSRF-Token header
    secure: env.NODE_ENV === "production" || env.BASE_URL.startsWith("https"),
    // "lax" — all production traffic now goes through the Vercel same-origin proxy,
    // so cross-site "none" is no longer needed and causes cookie rejection in some browsers.
    sameSite: "lax" as const,
    path: "/",
  });
  return res.json({ csrfToken });
});

// ─── CSRF Middleware (Double-Submit Cookie Pattern) ────────────────────────────
app.use((req, res, next) => {
  const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

  // Safe HTTP methods never mutate state — skip CSRF check
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  // Exempt REST API endpoints under /api/ (e.g. /api/auth/register, /api/forms, etc.)
  // These are typically accessed via Bearer tokens (programmatically or via Scalar UI docs)
  if (req.path.startsWith("/api/")) {
    return next();
  }

  // For tRPC batch requests the path is: /trpc/proc1,proc2,proc3
  // Split by comma and check if all procedures in the batch are exempt.
  // Unauthenticated/public mutations do not need CSRF validation.
  if (req.path.startsWith("/trpc/")) {
    const procedures = req.path
      .replace("/trpc/", "")
      .split(",")
      .map((p) => p.trim());
    const exemptProcedures = [
      "responses.submit",
      "auth.register",
      "auth.login",
      "auth.me",
      "auth.sendVerification",
      "auth.verifyEmail",
      "auth.logout",
      "analytics.incrementViews",
      "forms.verifyPasswordGate",
    ];
    if (procedures.every((p) => exemptProcedures.includes(p))) {
      return next();
    }
  }

  const cookieToken = req.cookies?.csrf_token as string | undefined;
  const headerToken = req.headers["x-csrf-token"] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ error: "Invalid CSRF token" });
    return;
  }

  return next();
});

// ─── Graceful Shutdown Flag ───────────────────────────────────────────────────
// Set by index.ts on SIGTERM/SIGINT before closing the HTTP server.
// Rejects new incoming requests with 503 during drain period.
app.use((req, res, next) => {
  if (req.app.locals.isShuttingDown) {
    res.set("Connection", "close");
    res.status(503).json({ error: "Server is shutting down" });
    return;
  }
  return next();
});

// ─── Google OAuth Routes ──────────────────────────────────────────────────────
app.get("/api/auth/google", (req, res, next) => {
  if (!env.GOOGLE_OAUTH_CLIENT_ID) {
    return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_not_configured`);
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

app.get("/api/auth/google/callback", (req, res, next) => {
  if (!env.GOOGLE_OAUTH_CLIENT_ID) {
    return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_not_configured`);
  }

  passport.authenticate("google", { session: false }, (err: Error | null, user: SelectUser | false, info: unknown) => {
    try {
      if (err) {
        logger.error("Google OAuth strategy error", err);
        return res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(err.message || "oauth_strategy_error")}`);
      }

      if (!user) {
        logger.warn("Google OAuth: no user returned", { info });
        return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      const tokens = generateTokens(user);
      setTokenCookies(res as any, tokens);

      // IMPORTANT: Do NOT use res.redirect() here.
      // Vercel's rewrite proxy silently strips Set-Cookie headers from 302 redirect
      // responses. By returning a 200 HTML page with a <meta> redirect, the browser
      // receives and stores the cookies BEFORE navigating to the dashboard.
      const redirectUrl = `${env.FRONTEND_URL}/dashboard`;
      res.status(200).send(`<!DOCTYPE html>
<html><head><meta http-equiv="refresh" content="0;url=${redirectUrl}"><script>window.location.href="${redirectUrl}";</script></head>
<body>Redirecting...</body></html>`);
    } catch (error) {
      logger.error("Google OAuth callback error", error);
      res.redirect(`${env.FRONTEND_URL}/login?error=oauth_server_error`);
    }
  })(req, res, next);
});

// ─── OpenAPI Document ─────────────────────────────────────────────────────────
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "Somnia OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

app.get("/", (_req, res) => {
  return res.json({ message: "Somnia API is up and running" });
});

app.get("/health", (_req, res) => {
  return res.json({ message: "Somnia server is healthy", healthy: true });
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (_req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

// ─── tRPC & OpenAPI Routers ───────────────────────────────────────────────────
app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext: adaptContext,
  })
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext: adaptContext,
  })
);

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be the last middleware — catches any unhandled errors from route handlers
import type { Request, Response, NextFunction } from "express";
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error("Unhandled server error", err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;