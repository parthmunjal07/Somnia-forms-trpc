import { z } from "../../schema";
import { router, protectedProcedure } from "../../../../../apps/api/src/trpc/procedures";
import { collaboratorsService } from "../../../../../apps/api/src/services/collaboratorsService";

const roleTypeEnum = z.enum(["THE_DREAMER", "THE_EXTRACTOR", "THE_ARCHITECT", "THE_FORGER", "THE_SHADE"]);

export const collaboratorsRouter = router({
  list: protectedProcedure
    .input(z.object({ formId: z.string() }))
    .query(async ({ input, ctx }) => {
      return collaboratorsService.list(input.formId, ctx.user.id);
    }),

  invite: protectedProcedure
    .input(z.object({
      formId: z.string(),
      email: z.string().email(),
      role: roleTypeEnum,
    }))
    .mutation(async ({ input, ctx }) => {
      return collaboratorsService.invite(input.formId, ctx.user.id, input.email, input.role);
    }),

  remove: protectedProcedure
    .input(z.object({
      formId: z.string(),
      collaboratorId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return collaboratorsService.remove(input.formId, ctx.user.id, input.collaboratorId);
    }),
});
