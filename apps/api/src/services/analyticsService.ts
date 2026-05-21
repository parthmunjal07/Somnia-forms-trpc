import { db } from "@repo/database";
import { analyticsTable, responsesTable } from "@repo/database/models/form";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getUserFormRole } from "./formsService";
import { can } from "../rbac";

export class AnalyticsService {
  async getSummary(formId: string, userId: string) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || !can(role, "viewResponses")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }

    const [analytics] = await db
      .select()
      .from(analyticsTable)
      .where(eq(analyticsTable.formId, formId))
      .limit(1);

    if (!analytics) throw new TRPCError({ code: "NOT_FOUND", message: "Analytics not found" });

    return analytics;
  }

  async getFieldDropoffs(formId: string, userId: string, fieldId: string) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || !can(role, "viewResponses")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }

    const result = await db.execute<{ filled: number; total: number }>(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(data->>${fieldId}) as filled
      FROM ${responsesTable}
      WHERE form_id = ${formId}
    `);

    const data = result.rows[0] as unknown as { filled: string; total: string };

    return {
      total: Number(data.total) || 0,
      filled: Number(data.filled) || 0,
    };
  }

  async incrementViews(formId: string) {
    await db
      .update(analyticsTable)
      .set({ viewsCount: sql`${analyticsTable.viewsCount} + 1` })
      .where(eq(analyticsTable.formId, formId));
  }
}

export const analyticsService = new AnalyticsService();
