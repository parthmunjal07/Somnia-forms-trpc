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
    .meta({
      openapi: {
        method: "POST",
        path: "/responses/submit",
        tags: ["Responses"],
        summary: "Submit form response",
        description: "Submit a response to a published form.\n\n" +
          "### Rate Limiting\n" +
          "This endpoint is rate limited to 30 requests per minute per IP.\n" +
          "Headers `X-RateLimit-Remaining` and `Retry-After` are returned if exceeded.\n\n" +
          "### Validation Errors\n" +
          "If submission data is invalid, returns a `400 Bad Request` with a Zod error shape detailing specific field errors.\n\n" +
          "### Example (cURL)\n" +
          "```bash\n" +
          "curl -X POST https://api.somnia.io/api/responses/submit \\\n" +
          "  -H 'Content-Type: application/json' \\\n" +
          "  -d '{\"formId\": \"uuid-here\", \"data\": {\"field_1\": \"answer\"}}'\n" +
          "```",
      },
    })
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

