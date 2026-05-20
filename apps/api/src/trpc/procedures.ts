import { initTRPC, TRPCError } from "@trpc/server";
import type { createContext } from "@repo/trpc/server";
import { can } from "../rbac";

const t = initTRPC.context<typeof createContext>().create();

export const router = t.router;

/** No authentication required */
export const publicProcedure = t.procedure;

/** Any authenticated user */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/** THE_ARCHITECT or THE_EXTRACTOR */
export const architectProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!can(ctx.user.role, "publishForm")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
  }
  return next({ ctx });
});

/** THE_EXTRACTOR only */
export const extractorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!can(ctx.user.role, "manageUsers")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
  }
  return next({ ctx });
});

// @future: dreamerProcedure — reserved for THE_DREAMER only access
