import { z } from "../../schema";
import { router, publicProcedure, protectedProcedure } from "../../../../../apps/api/src/trpc/procedures";
import { analyticsService } from "../../../../../apps/api/src/services/analyticsService";

export const analyticsRouter = router({
  getSummary: protectedProcedure
    .input(z.object({ formId: z.string() }))
    .query(async ({ input, ctx }) => {
      return analyticsService.getSummary(input.formId, ctx.user.id);
    }),

  getFieldDropoffs: protectedProcedure
    .input(z.object({ formId: z.string(), fieldId: z.string() }))
    .query(async ({ input, ctx }) => {
      return analyticsService.getFieldDropoffs(input.formId, ctx.user.id, input.fieldId);
    }),

  incrementViews: publicProcedure
    .input(z.object({ formId: z.string() }))
    .mutation(async ({ input }) => {
      await analyticsService.incrementViews(input.formId);
      return { success: true };
    }),
});
