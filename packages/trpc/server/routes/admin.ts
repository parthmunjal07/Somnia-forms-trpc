import { z } from "../schema";
import { router, extractorProcedure } from "../../../../apps/api/src/trpc/procedures";
import { db } from "@repo/database";
import { usersTable } from "@repo/database/models/user";
import { formsTable, responsesTable } from "@repo/database/models/form";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const adminRouter = router({
  listUsers: extractorProcedure.query(async () => {
    const users = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        email: usersTable.email,
        role: usersTable.role,
        subscriptionTier: usersTable.subscriptionTier,
        isSuspended: usersTable.isSuspended,
        profileImageUrl: usersTable.profileImageUrl,
      })
      .from(usersTable);

    const result = [];
    for (const u of users) {
      // Form count
      const [formCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(formsTable)
        .where(eq(formsTable.userId, u.id));

      // Signal count
      const [signalCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(responsesTable)
        .innerJoin(formsTable, eq(responsesTable.formId, formsTable.id))
        .where(eq(formsTable.userId, u.id));

      result.push({
        ...u,
        formCount: formCountResult?.count ?? 0,
        signalCount: signalCountResult?.count ?? 0,
      });
    }

    return result;
  }),

  changeRole: extractorProcedure
    .input(z.object({
      userId: z.string().uuid(),
      role: z.enum(["THE_DREAMER", "THE_EXTRACTOR", "THE_ARCHITECT", "THE_FORGER", "THE_SHADE"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, input.userId)).limit(1);
      if (user?.email === "demo@somnia.io") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot modify demo account role" });
      }
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot modify your own admin role" });
      }

      await db
        .update(usersTable)
        .set({ role: input.role })
        .where(eq(usersTable.id, input.userId));

      return { success: true };
    }),

  toggleSuspend: extractorProcedure
    .input(z.object({
      userId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, input.userId)).limit(1);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      if (user.email === "demo@somnia.io") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot suspend demo account" });
      }
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot suspend yourself" });
      }

      await db
        .update(usersTable)
        .set({ isSuspended: !user.isSuspended })
        .where(eq(usersTable.id, input.userId));

      return { success: true };
    }),

  listAllForms: extractorProcedure.query(async () => {
    const forms = await db
      .select({
        id: formsTable.id,
        title: formsTable.title,
        slug: formsTable.slug,
        status: formsTable.status,
        createdAt: formsTable.createdAt,
        ownerEmail: usersTable.email,
        ownerName: usersTable.fullName,
      })
      .from(formsTable)
      .innerJoin(usersTable, eq(formsTable.userId, usersTable.id));

    const result = [];
    for (const f of forms) {
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(responsesTable)
        .where(eq(responsesTable.formId, f.id));

      result.push({
        ...f,
        submissionsCount: countResult?.count ?? 0,
      });
    }

    return result;
  }),

  deleteForm: extractorProcedure
    .input(z.object({
      formId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      await db.delete(formsTable).where(eq(formsTable.id, input.formId));
      return { success: true };
    }),
});
