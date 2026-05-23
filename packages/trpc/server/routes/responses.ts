import { z } from "../schema";
import { router, publicProcedure, protectedProcedure } from "../../../../apps/api/src/trpc/procedures";
import { responsesService } from "../../../../apps/api/src/services/responsesService";
import { paginationInput } from "../../pagination";

const responseFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  completed: z.boolean().optional(),
}).optional();

export const responsesRouter = router({
  submit: publicProcedure
    .input(z.object({
      formId: z.string(),
      data: z.any(),
      password: z.string().optional(),
      timeToComplete: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
      const ip = ctx.req?.ip ?? "127.0.0.1";
      return responsesService.submit(
        input.formId,
        input.data,
        ip,
        input.password,
        input.timeToComplete
      );
    }),

  list: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        completed: z.boolean().optional(),
      }).merge(paginationInput)
    )
    .query(async ({ input, ctx }: { input: any, ctx: any }) => {
      const { formId, ...opts } = input;
      return responsesService.list(formId, ctx.user.id, opts);
    }),

  exportCSV: protectedProcedure
    .input(z.object({
      formId: z.string(),
      filters: responseFilterSchema,
    }))
    .query(async ({ input, ctx }) => {
      return responsesService.exportCSV(input.formId, ctx.user.id, input.filters);
    }),
});

