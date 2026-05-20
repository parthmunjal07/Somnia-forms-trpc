// packages/trpc/server/trpc.ts
import { OpenApiMeta } from "trpc-to-openapi";
import type { Context } from "./context";

// Type-only exports — no initTRPC call here.
// The single tRPC instance lives in apps/api/src/trpc/procedures.ts
export type { Context };
export type { OpenApiMeta };