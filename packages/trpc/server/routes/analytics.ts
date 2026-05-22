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
    .input(z.object({
      formId: z.string(),
      filters: analyticsFilterSchema,
    }))
    .query(async ({ input, ctx }) => {
      return analyticsService.getSummary(input.formId, ctx.user.id, input.filters);
    }),

  getFieldDropoffs: protectedProcedure
    .input(z.object({
      formId: z.string(),
      filters: analyticsFilterSchema,
    }))
    .query(async ({ input, ctx }) => {
      return analyticsService.getFieldDropoffs(input.formId, ctx.user.id, input.filters);
    }),

  getDailyStats: protectedProcedure
    .input(z.object({
      formId: z.string(),
      filters: analyticsFilterSchema,
    }))
    .query(async ({ input, ctx }) => {
      return analyticsService.getDailyStats(input.formId, ctx.user.id, input.filters);
    }),

  getFieldDistributions: protectedProcedure
    .input(z.object({
      formId: z.string(),
      filters: analyticsFilterSchema,
    }))
    .query(async ({ input, ctx }) => {
      return analyticsService.getFieldDistributions(input.formId, ctx.user.id, input.filters);
    }),

  incrementViews: publicProcedure
    .input(z.object({ formId: z.string() }))
    .mutation(async ({ input }) => {
      await analyticsService.incrementViews(input.formId);
      return { success: true };
    }),
});
