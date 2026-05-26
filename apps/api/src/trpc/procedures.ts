import { TRPCError } from "@trpc/server";
import { t } from "@repo/trpc/server/trpc";
import { can } from "../rbac";

import { db } from "@repo/database";
import { usersTable } from "@repo/database/schema";
import { eq } from "drizzle-orm";

export const router = t.router;

/** No authentication required */
export const publicProcedure = t.procedure;

/** Any authenticated user */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }

  const [dbUser] = await db
    .select({ isSuspended: usersTable.isSuspended })
    .from(usersTable)
    .where(eq(usersTable.id, ctx.user.id))
    .limit(1);

  if (dbUser?.isSuspended) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your account has been suspended by an Extractor.",
    });
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
