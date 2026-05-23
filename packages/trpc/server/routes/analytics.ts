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
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      completed: z.boolean().optional(),
    }))
    .output(z.any())
    .query(async ({ input, ctx }) => {
      const { formId, ...filters } = input;
      return analyticsService.getSummary(formId, ctx.user.id, filters);
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
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      completed: z.boolean().optional(),
    }))
    .output(z.any())
    .query(async ({ input, ctx }) => {
      const { formId, ...filters } = input;
      return analyticsService.getFieldDropoffs(formId, ctx.user.id, filters);
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
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      completed: z.boolean().optional(),
    }))
    .output(z.any())
    .query(async ({ input, ctx }) => {
      const { formId, ...filters } = input;
      return analyticsService.getDailyStats(formId, ctx.user.id, filters);
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
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      completed: z.boolean().optional(),
    }))
    .output(z.any())
    .query(async ({ input, ctx }) => {
      const { formId, ...filters } = input;
      return analyticsService.getFieldDistributions(formId, ctx.user.id, filters);
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
    .output(z.any())
    .mutation(async ({ input }) => {
      await analyticsService.incrementViews(input.formId);
      return { success: true };
    }),
});
