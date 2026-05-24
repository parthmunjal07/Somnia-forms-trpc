import { db } from "@repo/database";
import { responsesTable, formsTable, analyticsTable, fieldsTable } from "@repo/database/models/form";
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
import {
  sendSignalNotification,
  sendSurfacingConfirmation,
  sendExpiryWarning,
} from "@repo/email";

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

export interface ListResponsesFilter {
  startDate?: string;
  endDate?: string;
  completed?: boolean;
}

export class ResponsesService {
  async getTierLimit(tier: string) {
    switch (tier) {
      case "free":
        return 100;
      case "pro":
        return 1000;
      case "team":
        return 5000;
      default:
        return Infinity;
    }
  }

  async submit(formId: string, data: any, ip: string, password?: string, timeToComplete?: number) {
    if (ratelimit) {
      const { success } = await ratelimit.limit(`submit_${formId}_${ip}`);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Rate limit exceeded" });
      }
    }

    const [form] = await db
      .select({
        title: formsTable.title,
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
      .select({ subscriptionTier: usersTable.subscriptionTier, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, form.userId))
      .limit(1);

    if (!owner) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Enforce tier limit AND custom response limit if defined
    const tierLimit = await this.getTierLimit(owner.subscriptionTier);
    const limitToEnforce = form.responseLimit !== null && form.responseLimit !== undefined
      ? Math.min(tierLimit, form.responseLimit)
      : tierLimit;

    // Use responses count from responsesTable directly or from analyticsTable
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

    // Determine completion state
    const fields = await db
      .select({
        id: fieldsTable.id,
        label: fieldsTable.label,
        type: fieldsTable.type,
        required: fieldsTable.required,
      })
      .from(fieldsTable)
      .where(eq(fieldsTable.formId, formId));

    let isComplete = true;
    for (const field of fields) {
      if (field.required) {
        const val = parsedData.data?.[field.id];
        if (val === undefined || val === null || val === "") {
          isComplete = false;
          break;
        }
      }
    }

    const result = await db.transaction(async (tx) => {
      const [response] = await tx
        .insert(responsesTable)
        .values({
          formId,
          responseValues: parsedData.data,
          timeToComplete: timeToComplete ?? null,
          isComplete,
        })
        .returning();

      await tx
        .update(analyticsTable)
        .set({
          submissionsCount: sql`${analyticsTable.submissionsCount} + 1`,
        })
        .where(eq(analyticsTable.formId, formId));

      return response;
    });

    // ─── Trigger Async Emails ────────────────────────────────────────────────
    const dashboardUrl = env.FRONTEND_URL ? `${env.FRONTEND_URL}/dashboard/forms/${formId}` : `http://localhost:3000/dashboard/forms/${formId}`;
    
    // 1. Signal Notification to Creator
    const fieldPreviews = fields
      .slice(0, 3)
      .map((f) => ({
        label: f.label,
        value: String(parsedData.data?.[f.id] || "—"),
      }));

    sendSignalNotification({
      to: owner.email,
      formTitle: form.title,
      timestamp: new Date().toISOString(),
      fieldPreviews,
      dashboardUrl,
    }).catch(console.error);

    // 2. Surfacing Confirmation to Respondent (if email field exists)
    const emailField = fields.find((f) => f.type === "email");
    if (emailField) {
      const respondentEmail = parsedData.data?.[emailField.id];
      if (respondentEmail && typeof respondentEmail === "string") {
        sendSurfacingConfirmation({
          to: respondentEmail,
          formTitle: form.title,
          submissionTime: new Date().toISOString(),
        }).catch(console.error);
      }
    }

    // 3. Expiry / Cap Warning Check
    const newCount = (analytics?.submissionsCount || 0) + 1;
    if (limitToEnforce < Infinity && newCount >= limitToEnforce * 0.9 && newCount < limitToEnforce) {
      sendExpiryWarning({
        to: owner.email,
        formTitle: form.title,
        reason: "cap",
        dashboardUrl,
      }).catch(console.error);
    }
    
    return result;
  }

  async list(
    formId: string, 
    userId: string, 
    opts: z.infer<typeof paginationInput> & ListResponsesFilter
  ) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || role === "THE_SHADE" || !can(role, "viewResponses")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access Revoked: Insufficient permissions to view responses" });
    }

    const limit = opts.limit + 1;
    let offset = 0; // Simple offset pagination if cursor is numeric
    if (opts.cursor) {
      offset = parseInt(opts.cursor, 10);
    }

    // Build conditions for query filters
    const conditions = [eq(responsesTable.formId, formId)];
    if (opts.startDate) {
      conditions.push(sql`${responsesTable.submittedAt} >= ${new Date(opts.startDate)}`);
    }
    if (opts.endDate) {
      conditions.push(sql`${responsesTable.submittedAt} <= ${new Date(opts.endDate)}`);
    }
    if (opts.completed !== undefined) {
      conditions.push(eq(responsesTable.isComplete, opts.completed));
    }

    const responses = await db
      .select()
      .from(responsesTable)
      .where(and(...conditions))
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

  async exportCSV(formId: string, userId: string, filters?: ListResponsesFilter) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || role === "THE_SHADE" || !can(role, "viewResponses")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access Revoked: Insufficient permissions to export responses" });
    }

    const fields = await db
      .select({
        id: fieldsTable.id,
        label: fieldsTable.label,
      })
      .from(fieldsTable)
      .where(eq(fieldsTable.formId, formId))
      .orderBy(fieldsTable.order);

    const conditions = [eq(responsesTable.formId, formId)];
    if (filters?.startDate) {
      conditions.push(sql`${responsesTable.submittedAt} >= ${new Date(filters.startDate)}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${responsesTable.submittedAt} <= ${new Date(filters.endDate)}`);
    }
    if (filters?.completed !== undefined) {
      conditions.push(eq(responsesTable.isComplete, filters.completed));
    }

    const responses = await db
      .select()
      .from(responsesTable)
      .where(and(...conditions))
      .orderBy(desc(responsesTable.submittedAt));

    const escapeCSV = (val: any): string => {
      if (val === null || val === undefined) return '""';
      let stringVal = "";
      if (typeof val === "object") {
        stringVal = JSON.stringify(val);
      } else {
        stringVal = String(val);
      }
      return `"${stringVal.replace(/"/g, '""')}"`;
    };

    const headers = ["Submission ID", "Submitted At", "Completion Time (sec)", "Is Complete"];
    fields.forEach((f) => {
      headers.push(f.label);
    });

    const csvLines = [headers.map(escapeCSV).join(",")];

    responses.forEach((resp) => {
      const line = [
        resp.id,
        resp.submittedAt.toISOString(),
        resp.timeToComplete !== null ? String(resp.timeToComplete) : "",
        resp.isComplete ? "TRUE" : "FALSE",
      ];
      fields.forEach((f) => {
        const val = (resp.responseValues as Record<string, any>)[f.id];
        line.push(val);
      });
      csvLines.push(line.map(escapeCSV).join(","));
    });

    return csvLines.join("\n");
  }
}

export const responsesService = new ResponsesService();
