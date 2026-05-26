import { z } from "../schema";
import { router, publicProcedure, protectedProcedure } from "../../../../apps/api/src/trpc/procedures";
import { fieldsService } from "../../../../apps/api/src/services/fieldsService";

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
  "layer_break",
]);

export const fieldsRouter = router({
  list: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/fields",
        tags: ["Fields"],
        protect: true,
        summary: "List fields for a form",
        description: "// NOTE: keep this RBAC table in sync with apps/api/src/rbac.ts\n\n" +
          "| Role | Can access |\n" +
          "|---|---|\n" +
          "| THE_ARCHITECT | ✓ |\n" +
          "| THE_EXTRACTOR | ✗ |\n" +
          "| THE_FORGER | ✓ |\n" +
          "| THE_SHADE | ✗ |",
      },
    })
    .input(z.object({ formId: z.string() }))
    .output(z.any())
    .query(async ({ input, ctx }: { input: any, ctx: any }) => {
      return fieldsService.list(input.formId, ctx.user.id);
    }),

  getPublic: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/fields/public/{formId}",
        tags: ["Fields"],
        summary: "Get public fields for a form",
      },
    })
    .input(z.object({ formId: z.string() }))
    .output(z.any())
    .query(async ({ input }: { input: any }) => {
      return fieldsService.getPublicFields(input.formId);
    }),

  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/fields",
        tags: ["Fields"],
        protect: true,
        summary: "Create a field",
        description: "// NOTE: keep this RBAC table in sync with apps/api/src/rbac.ts\n\n" +
          "| Role | Can access |\n" +
          "|---|---|\n" +
          "| THE_ARCHITECT | ✓ |\n" +
          "| THE_EXTRACTOR | ✗ |\n" +
          "| THE_FORGER | ✓ |\n" +
          "| THE_SHADE | ✗ |",
      },
    })
    .input(z.object({
      formId: z.string(),
      label: z.string().min(1),
      type: fieldTypeEnum,
      required: z.boolean().default(false),
      options: z.any().optional(),
      validationRules: z.any().optional(),
      pageIndex: z.number().int().min(0).optional(),
      conditionalLogic: z.any().optional(),
      order: z.number().int().min(0),
    }))
    .output(z.any())
    .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
      const { formId, ...fieldData } = input;
      return fieldsService.create(formId, ctx.user.id, fieldData);
    }),

  update: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/fields/{id}",
        tags: ["Fields"],
        protect: true,
        summary: "Update a field",
        description: "// NOTE: keep this RBAC table in sync with apps/api/src/rbac.ts\n\n" +
          "| Role | Can access |\n" +
          "|---|---|\n" +
          "| THE_ARCHITECT | ✓ |\n" +
          "| THE_EXTRACTOR | ✗ |\n" +
          "| THE_FORGER | ✓ |\n" +
          "| THE_SHADE | ✗ |",
      },
    })
    .input(z.object({
      id: z.string(),
      formId: z.string(),
      label: z.string().min(1).optional(),
      type: fieldTypeEnum.optional(),
      required: z.boolean().optional(),
      options: z.any().optional(),
      validationRules: z.any().optional(),
      pageIndex: z.number().int().min(0).optional(),
      conditionalLogic: z.any().optional(),
      order: z.number().int().min(0).optional(),
    }))
    .output(z.any())
    .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
      const { id, formId, ...data } = input;
      return fieldsService.update(id, formId, ctx.user.id, data);
    }),

  delete: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/fields/{id}",
        tags: ["Fields"],
        protect: true,
        summary: "Delete a field",
        description: "// NOTE: keep this RBAC table in sync with apps/api/src/rbac.ts\n\n" +
          "| Role | Can access |\n" +
          "|---|---|\n" +
          "| THE_ARCHITECT | ✓ |\n" +
          "| THE_EXTRACTOR | ✗ |\n" +
          "| THE_FORGER | ✓ |\n" +
          "| THE_SHADE | ✗ |",
      },
    })
    .input(z.object({ id: z.string(), formId: z.string() }))
    .output(z.any())
    .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
      return fieldsService.delete(input.id, input.formId, ctx.user.id);
    }),

  reorder: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/fields/reorder",
        tags: ["Fields"],
        protect: true,
        summary: "Reorder fields",
        description: "// NOTE: keep this RBAC table in sync with apps/api/src/rbac.ts\n\n" +
          "| Role | Can access |\n" +
          "|---|---|\n" +
          "| THE_ARCHITECT | ✓ |\n" +
          "| THE_EXTRACTOR | ✗ |\n" +
          "| THE_FORGER | ✓ |\n" +
          "| THE_SHADE | ✗ |",
      },
    })
    .input(z.object({
      formId: z.string(),
      fieldIds: z.array(z.string()),
    }))
    .output(z.any())
    .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
      return fieldsService.reorder(input.formId, ctx.user.id, input.fieldIds);
    }),
});
