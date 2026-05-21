import { z } from "../../schema";
import { router, publicProcedure, protectedProcedure } from "../../../../../apps/api/src/trpc/procedures";
import { formsService } from "../../../../../apps/api/src/services/formsService";
import { paginationInput } from "../../pagination";

export const formsRouter = router({
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(100),
      slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
      visibility: z.enum(["public", "unlisted"]).default("unlisted"),
    }))
    .mutation(async ({ input, ctx }) => {
      return formsService.create(ctx.user.id, input.title, input.slug, input.visibility);
    }),

  list: protectedProcedure
    .input(paginationInput)
    .query(async ({ input, ctx }) => {
      return formsService.list(ctx.user.id, input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return formsService.getById(input.id, ctx.user.id);
    }),

  getPublic: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return formsService.getPublicForm(input.slug);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).max(100).optional(),
      slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
      visibility: z.enum(["public", "unlisted"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return formsService.update(id, data, ctx.user.id);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return formsService.delete(input.id, ctx.user.id);
    }),
});
