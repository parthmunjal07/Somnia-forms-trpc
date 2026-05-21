import { env } from "./env";

import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { randomBytes } from "node:crypto";

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

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server calls with no origin header
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);

// ─── Cookie Parser ────────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Body Size Limits ─────────────────────────────────────────────────────────
app.use(express.json({ limit: "50kb" }));
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

// Apply rate limiters to specific tRPC auth paths
app.use("/trpc/auth.register", registerLimiter);
app.use("/trpc/auth.login", loginLimiter);
app.use("/trpc/auth.me", refreshLimiter);

// ─── CSRF Endpoint ────────────────────────────────────────────────────────────
app.get("/api/csrf", (_req, res) => {
  const csrfToken = randomBytes(32).toString("hex");
  res.cookie("csrf_token", csrfToken, {
    // NOT httpOnly — client JS must read this and send it back via X-CSRF-Token header
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
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

  // CSRF init endpoint is exempt by definition
  if (req.path === "/api/csrf") {
    return next();
  }

  // For tRPC batch requests the path is: /trpc/proc1,proc2,proc3
  // Split by comma and check if any procedure in the batch is exempt.
  // responses.submit is public and unauthenticated — CSRF doesn't apply.
  if (req.path.startsWith("/trpc/")) {
    const procedures = req.path.replace("/trpc/", "").split(",").map((p) => p.trim());
    if (procedures.includes("responses.submit")) {
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

export default app;