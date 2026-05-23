import { z } from "../schema";
import { router, publicProcedure, protectedProcedure } from "../../../../apps/api/src/trpc/procedures";
import { analyticsService } from "../../../../apps/api/src/services/analyticsService";

const analyticsFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  completed: z.boolean().optional(),
}).optional();

export const analyticsRouter = router({
  getSummary: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/analytics/{formId}/summary",
        tags: ["Analytics"],
        protect: true,
        summary: "Get form analytics summary",
        description: "// NOTE: keep this RBAC table in sync with apps/api/src/rbac.ts\n\n" +
          "| Role | Can access |\n" +
          "|---|---|\n" +
          "| THE_ARCHITECT | ✓ |\n" +
          "| THE_EXTRACTOR | ✓ |\n" +
          "| THE_FORGER | ✗ |\n" +
          "| THE_SHADE | ✗ |",
      },
    })
    .input(z.object({
      formId: z.string(),
      filters: analyticsFilterSchema,
    }))
    .query(async ({ input, ctx }) => {
      return analyticsService.getSummary(input.formId, ctx.user.id, input.filters);
    }),

  getFieldDropoffs: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/analytics/{formId}/dropoffs",
        tags: ["Analytics"],
        protect: true,
        summary: "Get form analytics summary",
        description: "// NOTE: keep this RBAC table in sync with apps/api/src/rbac.ts\n\n" +
          "| Role | Can access |\n" +
          "|---|---|\n" +
          "| THE_ARCHITECT | ✓ |\n" +
          "| THE_EXTRACTOR | ✓ |\n" +
          "| THE_FORGER | ✗ |\n" +
          "| THE_SHADE | ✗ |",
      },
    })
    .input(z.object({
      formId: z.string(),
      filters: analyticsFilterSchema,
    }))
    .query(async ({ input, ctx }) => {
      return analyticsService.getFieldDropoffs(input.formId, ctx.user.id, input.filters);
    }),

  getDailyStats: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/analytics/{formId}/daily",
        tags: ["Analytics"],
        protect: true,
        summary: "Get daily submission stats",
        description: "// NOTE: keep this RBAC table in sync with apps/api/src/rbac.ts\n\n" +
          "| Role | Can access |\n" +
          "|---|---|\n" +
          "| THE_ARCHITECT | ✓ |\n" +
          "| THE_EXTRACTOR | ✓ |\n" +
          "| THE_FORGER | ✗ |\n" +
          "| THE_SHADE | ✗ |",
      },
    })
    .input(z.object({
      formId: z.string(),
      filters: analyticsFilterSchema,
    }))
    .query(async ({ input, ctx }) => {
      return analyticsService.getDailyStats(input.formId, ctx.user.id, input.filters);
    }),

  getFieldDistributions: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/analytics/{formId}/distributions",
        tags: ["Analytics"],
        protect: true,
        summary: "Get field distributions",
        description: "// NOTE: keep this RBAC table in sync with apps/api/src/rbac.ts\n\n" +
          "| Role | Can access |\n" +
          "|---|---|\n" +
          "| THE_ARCHITECT | ✓ |\n" +
          "| THE_EXTRACTOR | ✓ |\n" +
          "| THE_FORGER | ✗ |\n" +
          "| THE_SHADE | ✗ |",
      },
    })
    .input(z.object({
      formId: z.string(),
      filters: analyticsFilterSchema,
    }))
    .query(async ({ input, ctx }) => {
      return analyticsService.getFieldDistributions(input.formId, ctx.user.id, input.filters);
    }),

  incrementViews: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/analytics/{formId}/views",
        tags: ["Analytics"],
        summary: "Increment form views",
      },
    })
    .input(z.object({ formId: z.string() }))
    .mutation(async ({ input }) => {
      await analyticsService.incrementViews(input.formId);
      return { success: true };
    }),
});
