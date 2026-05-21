import { db } from "@repo/database";
import { responsesTable, formsTable, analyticsTable } from "@repo/database/models/form";
import { usersTable } from "@repo/database/models/user";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getUserFormRole } from "./formsService";
import { can } from "../rbac";
import { compileFormSchema } from "../lib/compileFormSchema";
import { paginationInput } from "@repo/trpc/pagination";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "../env";
import bcrypt from "bcryptjs";

let ratelimit: Ratelimit | null = null;
if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 submissions per minute per IP
  });
}

export class ResponsesService {
  async getTierLimit(tier: string) {
    switch (tier) {
      case "free":
        return 100;
      case "pro":
      case "team":
      default:
        return Infinity;
    }
  }

  async submit(formId: string, data: any, ip: string, password?: string) {
    if (ratelimit) {
      const { success } = await ratelimit.limit(`submit_${formId}_${ip}`);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Rate limit exceeded" });
      }
    }

    const [form] = await db
      .select({
        userId: formsTable.userId,
        status: formsTable.status,
        expiresAt: formsTable.expiresAt,
        responseLimit: formsTable.responseLimit,
        passwordHash: formsTable.passwordHash,
      })
      .from(formsTable)
      .where(eq(formsTable.id, formId))
      .limit(1);

    if (!form || form.status !== "published") {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not published or not found" });
    }

    // Expiry check
    if (form.expiresAt && form.expiresAt < new Date()) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Form has expired" });
    }

    // Password protection check
    if (form.passwordHash) {
      if (!password) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Password required" });
      }
      const match = await bcrypt.compare(password, form.passwordHash);
      if (!match) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect password" });
      }
    }

    const [owner] = await db
      .select({ subscriptionTier: usersTable.subscriptionTier })
      .from(usersTable)
      .where(eq(usersTable.id, form.userId))
      .limit(1);

    if (!owner) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Enforce tier limit AND custom response limit if defined
    const tierLimit = await this.getTierLimit(owner.subscriptionTier);
    const limitToEnforce = form.responseLimit !== null && form.responseLimit !== undefined
      ? Math.min(tierLimit, form.responseLimit)
      : tierLimit;

    const [analytics] = await db
      .select({ submissionsCount: analyticsTable.submissionsCount })
      .from(analyticsTable)
      .where(eq(analyticsTable.formId, formId))
      .limit(1);

    if (analytics && analytics.submissionsCount >= limitToEnforce) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: form.responseLimit && analytics.submissionsCount >= form.responseLimit
          ? "Form response limit reached"
          : "Submission limit reached for form owner's tier",
      });
    }

    const schema = await compileFormSchema(formId);
    
    const parsedData = schema.safeParse(data);
    if (!parsedData.success) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid form data",
        cause: parsedData.error,
      });
    }

    return await db.transaction(async (tx) => {
      const [response] = await tx
        .insert(responsesTable)
        .values({
          formId,
          responseValues: parsedData.data,
        })
        .returning();

      await tx
        .update(analyticsTable)
        .set({
          submissionsCount: sql`${analyticsTable.submissionsCount} + 1`,
        })
        .where(eq(analyticsTable.formId, formId));
        
      // Future Email Sending Logic - handled safely
      // try {
      //   await emailService.sendNotification(...);
      // } catch (e) {
      //   console.error("Failed to send notification email", e);
      // }

      return response;
    });
  }

  async list(formId: string, userId: string, opts: z.infer<typeof paginationInput>) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || !can(role, "viewResponses")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }

    const limit = opts.limit + 1;
    let offset = 0; // Simple offset pagination if cursor is numeric
    if (opts.cursor) {
      offset = parseInt(opts.cursor, 10);
    }

    const responses = await db
      .select()
      .from(responsesTable)
      .where(eq(responsesTable.formId, formId))
      .orderBy(desc(responsesTable.submittedAt))
      .limit(limit)
      .offset(offset);

    let nextCursor: string | undefined = undefined;
    
    if (responses.length > opts.limit) {
      responses.pop();
      nextCursor = (offset + opts.limit).toString();
    }

    return {
      items: responses,
      nextCursor,
    };
  }
}

export const responsesService = new ResponsesService();
