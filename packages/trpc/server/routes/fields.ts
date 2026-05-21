import { z } from "../../schema";
import { router, publicProcedure, protectedProcedure } from "../../../../../apps/api/src/trpc/procedures";
import { fieldsService } from "../../../../../apps/api/src/services/fieldsService";

const fieldTypeEnum = z.enum([
  "short_text",
  "long_text",
  "email",
  "number",
  "single_select",
  "multi_select",
  "date",
  "rating",
  "checkbox",
]);

export const fieldsRouter = router({
  list: protectedProcedure
    .input(z.object({ formId: z.string() }))
    .query(async ({ input, ctx }) => {
      return fieldsService.list(input.formId, ctx.user.id);
    }),

  getPublic: publicProcedure
    .input(z.object({ formId: z.string() }))
    .query(async ({ input }) => {
      return fieldsService.getPublicFields(input.formId);
    }),

  create: protectedProcedure
    .input(z.object({
      formId: z.string(),
      label: z.string().min(1),
      type: fieldTypeEnum,
      required: z.boolean().default(false),
      options: z.any().optional(),
      order: z.number().int().min(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const { formId, ...fieldData } = input;
      return fieldsService.create(formId, ctx.user.id, fieldData);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      formId: z.string(),
      label: z.string().min(1).optional(),
      type: fieldTypeEnum.optional(),
      required: z.boolean().optional(),
      options: z.any().optional(),
      order: z.number().int().min(0).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, formId, ...data } = input;
      return fieldsService.update(id, formId, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), formId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return fieldsService.delete(input.id, input.formId, ctx.user.id);
    }),
});
