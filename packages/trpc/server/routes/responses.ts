import { z } from "../schema";
import { router, publicProcedure, protectedProcedure } from "../../../../apps/api/src/trpc/procedures";
import { responsesService }from  "../../../../apps/api/src/services/responsesService";
import { paginationInput } from "../../pagination";

export const responsesRouter = router({
  submit: publicProcedure
    .input(z.object({
      formId: z.string(),
      data: z.any(),
      password: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
      const ip = ctx.req?.ip ?? "127.0.0.1";
      return responsesService.submit(input.formId, input.data, ip, input.password);
    }),

  list: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
      }).merge(paginationInput)
    )
    .query(async ({ input, ctx }: { input: any, ctx: any }) => {
      const { formId, ...opts } = input;
      return responsesService.list(formId, ctx.user.id, opts);
    }),
});
