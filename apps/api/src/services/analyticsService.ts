import { db } from "@repo/database";
import { analyticsTable, responsesTable, formViewsTable, fieldsTable } from "@repo/database/models/form";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getUserFormRole } from "./formsService";
import { can } from "../rbac";

export interface AnalyticsFilter {
  startDate?: string;
  endDate?: string;
  completed?: boolean;
}

export class AnalyticsService {
  async getSummary(formId: string, userId: string, filters?: AnalyticsFilter) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || role === "THE_SHADE" || !can(role, "viewResponses")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access Revoked: Insufficient permissions to view analytics" });
    }

    // Build conditions for form_views (completion filter does not apply to raw views)
    const viewConditions = [eq(formViewsTable.formId, formId)];
    if (filters?.startDate) {
      viewConditions.push(sql`${formViewsTable.viewedAt} >= ${new Date(filters.startDate)}`);
    }
    if (filters?.endDate) {
      viewConditions.push(sql`${formViewsTable.viewedAt} <= ${new Date(filters.endDate)}`);
    }

    // Build conditions for responses
    const responseConditions = [eq(responsesTable.formId, formId)];
    if (filters?.startDate) {
      responseConditions.push(sql`${responsesTable.submittedAt} >= ${new Date(filters.startDate)}`);
    }
    if (filters?.endDate) {
      responseConditions.push(sql`${responsesTable.submittedAt} <= ${new Date(filters.endDate)}`);
    }
    if (filters?.completed !== undefined) {
      responseConditions.push(eq(responsesTable.isComplete, filters.completed));
    }

    const [viewsCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(formViewsTable)
      .where(and(...viewConditions));

    const [responsesResult] = await db
      .select({
        submissionsCount: sql<number>`count(*)::int`,
        avgTimeToComplete: sql<number | null>`avg(${responsesTable.timeToComplete})::float`,
      })
      .from(responsesTable)
      .where(and(...responseConditions));

    return {
      viewsCount: viewsCountResult?.count ?? 0,
      submissionsCount: responsesResult?.submissionsCount ?? 0,
      avgTimeToComplete: responsesResult?.avgTimeToComplete ? Math.round(responsesResult.avgTimeToComplete) : null,
    };
  }

  async getFieldDropoffs(formId: string, userId: string, filters?: AnalyticsFilter) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || role === "THE_SHADE" || !can(role, "viewResponses")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access Revoked: Insufficient permissions to view analytics" });
    }

    // Fetch fields of the form in their correct order
    const fields = await db
      .select({
        id: fieldsTable.id,
        label: fieldsTable.label,
        type: fieldsTable.type,
        required: fieldsTable.required,
        order: fieldsTable.order,
      })
      .from(fieldsTable)
      .where(eq(fieldsTable.formId, formId))
      .orderBy(fieldsTable.order);

    if (fields.length === 0) {
      return [];
    }

    // Build conditions for responses
    const responseConditions = [eq(responsesTable.formId, formId)];
    if (filters?.startDate) {
      responseConditions.push(sql`${responsesTable.submittedAt} >= ${new Date(filters.startDate)}`);
    }
    if (filters?.endDate) {
      responseConditions.push(sql`${responsesTable.submittedAt} <= ${new Date(filters.endDate)}`);
    }
    if (filters?.completed !== undefined) {
      responseConditions.push(eq(responsesTable.isComplete, filters.completed));
    }

    // Build dynamic COUNT(CASE WHEN...) select mapping in a single query
    const selectFields: Record<string, any> = {
      total: sql<number>`count(*)::int`,
    };
    fields.forEach((field) => {
      selectFields[field.id] = sql<number>`
        COUNT(
          CASE WHEN (${responsesTable.responseValues}->>${field.id}) IS NOT NULL 
                AND (${responsesTable.responseValues}->>${field.id}) != '' 
          THEN 1 END
        )::int
      `;
    });

    const [counts] = await db
      .select(selectFields)
      .from(responsesTable)
      .where(and(...responseConditions));

    const total = counts?.total ?? 0;

    return fields.map((field) => {
      const filled = counts ? (counts[field.id] as number) || 0 : 0;
      return {
        fieldId: field.id,
        label: field.label,
        type: field.type,
        required: field.required,
        order: field.order,
        filled,
        total,
      };
    });
  }

  async getDailyStats(formId: string, userId: string, filters?: AnalyticsFilter) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || role === "THE_SHADE" || !can(role, "viewResponses")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access Revoked: Insufficient permissions to view analytics" });
    }

    const now = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(now.getDate() - 29); // Default to last 30 days

    const start = filters?.startDate ? new Date(filters.startDate) : defaultStart;
    const end = filters?.endDate ? new Date(filters.endDate) : now;

    // Normalizing time zones/dates for SQL comparisons
    const viewConditions = [
      eq(formViewsTable.formId, formId),
      sql`date_trunc('day', ${formViewsTable.viewedAt}) >= ${start}`,
      sql`date_trunc('day', ${formViewsTable.viewedAt}) <= ${end}`,
    ];

    const viewsByDay = await db
      .select({
        day: sql<string>`to_char(${formViewsTable.viewedAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(formViewsTable)
      .where(and(...viewConditions))
      .groupBy(sql`to_char(${formViewsTable.viewedAt}, 'YYYY-MM-DD')`);

    const responseConditions = [
      eq(responsesTable.formId, formId),
      sql`date_trunc('day', ${responsesTable.submittedAt}) >= ${start}`,
      sql`date_trunc('day', ${responsesTable.submittedAt}) <= ${end}`,
    ];
    if (filters?.completed !== undefined) {
      responseConditions.push(eq(responsesTable.isComplete, filters.completed));
    }

    const submissionsByDay = await db
      .select({
        day: sql<string>`to_char(${responsesTable.submittedAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(responsesTable)
      .where(and(...responseConditions))
      .groupBy(sql`to_char(${responsesTable.submittedAt}, 'YYYY-MM-DD')`);

    const viewsMap: Record<string, number> = {};
    viewsByDay.forEach((row) => {
      viewsMap[row.day] = row.count;
    });

    const submissionsMap: Record<string, number> = {};
    submissionsByDay.forEach((row) => {
      submissionsMap[row.day] = row.count;
    });

    const stats: Array<{ date: string; views: number; submissions: number }> = [];
    const current = new Date(start);
    
    // Safety break to prevent infinite loops in while loop
    let loopGuard = 0;
    while (current <= end && loopGuard < 1000) {
      loopGuard++;
      const dateStr = current.toISOString().split("T")[0]!;
      stats.push({
        date: dateStr,
        views: viewsMap[dateStr] ?? 0,
        submissions: submissionsMap[dateStr] ?? 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return stats;
  }

  async getFieldDistributions(formId: string, userId: string, filters?: AnalyticsFilter) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || role === "THE_SHADE" || !can(role, "viewResponses")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access Revoked: Insufficient permissions to view analytics" });
    }

    // Retrieve select and rating fields
    const fields = await db
      .select({
        id: fieldsTable.id,
        label: fieldsTable.label,
        type: fieldsTable.type,
        options: fieldsTable.options,
      })
      .from(fieldsTable)
      .where(
        and(
          eq(fieldsTable.formId, formId),
          sql`${fieldsTable.type} IN ('single_select', 'multi_select', 'rating')`
        )
      );

    if (fields.length === 0) {
      return {};
    }

    // Fetch response values
    const responseConditions = [eq(responsesTable.formId, formId)];
    if (filters?.startDate) {
      responseConditions.push(sql`${responsesTable.submittedAt} >= ${new Date(filters.startDate)}`);
    }
    if (filters?.endDate) {
      responseConditions.push(sql`${responsesTable.submittedAt} <= ${new Date(filters.endDate)}`);
    }
    if (filters?.completed !== undefined) {
      responseConditions.push(eq(responsesTable.isComplete, filters.completed));
    }

    const responses = await db
      .select({
        responseValues: responsesTable.responseValues,
      })
      .from(responsesTable)
      .where(and(...responseConditions));

    const distributions: Record<string, Array<{ value: string; count: number }>> = {};

    fields.forEach((field) => {
      const counts: Record<string, number> = {};

      // Initialize keys with 0 for predefined options or ratings
      if (field.type === "rating") {
        for (let r = 1; r <= 5; r++) {
          counts[String(r)] = 0;
        }
      } else if (Array.isArray(field.options)) {
        field.options.forEach((opt: any) => {
          counts[String(opt)] = 0;
        });
      }

      responses.forEach((resp) => {
        const val = (resp.responseValues as Record<string, any>)[field.id];
        if (val !== undefined && val !== null && val !== "") {
          if (field.type === "multi_select" && Array.isArray(val)) {
            val.forEach((item) => {
              const key = String(item);
              counts[key] = (counts[key] ?? 0) + 1;
            });
          } else {
            const key = String(val);
            counts[key] = (counts[key] ?? 0) + 1;
          }
        }
      });

      distributions[field.id] = Object.entries(counts).map(([value, count]) => ({
        value,
        count,
      }));
    });

    return distributions;
  }

  async incrementViews(formId: string) {
    // Single insert to decouple from transaction lock contention
    await db.insert(formViewsTable).values({ formId });
  }
}

export const analyticsService = new AnalyticsService();
