import { z } from "../schema";
import { paginationInput } from "../../pagination";
// FIX: Use internal relative paths inside the package
import { router, publicProcedure, protectedProcedure } from "../../../../apps/api/src/trpc/procedures";
import { formsService } from "../../../../apps/api/src/services/formsService";

export const formsRouter = router({
  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/forms",
        tags: ["Forms"],
        protect: true,
        summary: "Create a new form",
        description: "// NOTE: keep this RBAC table in sync with apps/api/src/rbac.ts\n\n" +
          "| Role | Can access |\n" +
          "|---|---|\n" +
          "| THE_ARCHITECT | ✓ |\n" +
          "| THE_EXTRACTOR | ✗ |\n" +
          "| THE_FORGER | ✓ |\n" +
          "| THE_SHADE | ✗ |\n\n" +
          "Requires Bearer token authentication.",
      },
    })
    .input(z.object({
      title: z.string().min(1).max(100),
      slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
      visibility: z.enum(["public", "unlisted"]).default("unlisted"),
    }))
    .output(z.any())
    .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
      return formsService.create(ctx.user.id, input.title, input.slug, input.visibility);
    }),

  list: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/forms",
        tags: ["Forms"],
        protect: true,
        summary: "List user's forms",
        description: "// NOTE: keep this RBAC table in sync with apps/api/src/rbac.ts\n\n" +
          "| Role | Can access |\n" +
          "|---|---|\n" +
          "| THE_ARCHITECT | ✓ |\n" +
          "| THE_EXTRACTOR | ✓ |\n" +
          "| THE_FORGER | ✓ |\n" +
          "| THE_SHADE | ✓ |\n\n" +
          "Lists forms the authenticated user owns or collaborates on.",
      },
    })
    .input(paginationInput)
    .output(z.any())
    .query(async ({ input, ctx }: { input: any, ctx: any }) => {
      return formsService.list(ctx.user.id, input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }: { input: any, ctx: any }) => {
      return formsService.getById(input.id, ctx.user.id);
    }),

  getPublic: publicProcedure
    .input(z.object({
      slug: z.string(),
      password: z.string().optional(),
    }))
    .query(async ({ input }: { input: any }) => {
      return formsService.getPublicForm(input.slug, input.password);
    }),

  getBySlug: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/forms/by-slug/{slug}",
        tags: ["Forms"],
        summary: "Get a form by its public slug",
        description: "Returns a published form structure.\n\n" +
          "### Rate Limiting\n" +
          "Rate limited to 60 requests per minute per IP.\n\n" +
          "### Example (cURL)\n" +
          "```bash\n" +
          "curl -X GET https://api.somnia.io/api/forms/by-slug/my-slug\n" +
          "```",
      },
    })
    .input(z.object({
      slug: z.string(),
      password: z.string().optional(),
    }))
    .output(z.any())
    .query(async ({ input }: { input: any }) => {
      return formsService.getPublicForm(input.slug, input.password);
    }),

  verifyPasswordGate: publicProcedure
    .input(z.object({
      slug: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input }: { input: any }) => {
      return formsService.verifyPassword(input.slug, input.password);
    }),

  update: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/forms/{id}",
        tags: ["Forms"],
        protect: true,
        summary: "Update a form",
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
      title: z.string().min(1).max(100).optional(),
      slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
      visibility: z.enum(["public", "unlisted"]).optional(),
      theme: z.string().optional(),
      responseLimit: z.number().nullable().optional(),
      expiresAt: z.string().nullable().optional(),
      password: z.string().nullable().optional(),
      thankYouMessage: z.string().nullable().optional(),
      redirectUrl: z.string().url().nullable().optional(),
    }))
    .output(z.any())
    .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
      const { id, ...data } = input;
      return formsService.update(id, data, ctx.user.id);
    }),

  delete: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/forms/{id}",
        tags: ["Forms"],
        protect: true,
        summary: "Delete a form",
        description: "// NOTE: keep this RBAC table in sync with apps/api/src/rbac.ts\n\n" +
          "| Role | Can access |\n" +
          "|---|---|\n" +
          "| THE_ARCHITECT | ✓ |\n" +
          "| THE_EXTRACTOR | ✗ |\n" +
          "| THE_FORGER | ✗ |\n" +
          "| THE_SHADE | ✗ |",
      },
    })
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
      return formsService.delete(input.id, ctx.user.id);
    }),

  clone: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
      return formsService.clone(input.id, ctx.user.id);
    }),
});