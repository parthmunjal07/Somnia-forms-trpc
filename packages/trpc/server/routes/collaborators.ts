import { z } from "../schema";
import { router, protectedProcedure } from "../../../../apps/api/src/trpc/procedures";
import { collaboratorsService } from "../../../../apps/api/src/services/collaboratorsService";

const roleTypeEnum = z.enum(["THE_DREAMER", "THE_EXTRACTOR", "THE_ARCHITECT", "THE_FORGER", "THE_SHADE"]);

export const collaboratorsRouter = router({
  list: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/collaborators",
        tags: ["Collaborators"],
        protect: true,
        summary: "List form collaborators",
        description: "// NOTE: keep this RBAC table in sync with apps/api/src/rbac.ts\n\n" +
          "| Role | Can access |\n" +
          "|---|---|\n" +
          "| THE_ARCHITECT | ✓ |\n" +
          "| THE_EXTRACTOR | ✗ |\n" +
          "| THE_FORGER | ✗ |\n" +
          "| THE_SHADE | ✗ |",
      },
    })
    .input(z.object({ formId: z.string() }))
    .output(z.any())
    .query(async ({ input, ctx }: { input: any, ctx: any }) => {
      return collaboratorsService.list(input.formId, ctx.user.id);
    }),

  invite: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/collaborators/invite",
        tags: ["Collaborators"],
        protect: true,
        summary: "Invite a collaborator",
        description: "// NOTE: keep this RBAC table in sync with apps/api/src/rbac.ts\n\n" +
          "| Role | Can access |\n" +
          "|---|---|\n" +
          "| THE_ARCHITECT | ✓ |\n" +
          "| THE_EXTRACTOR | ✗ |\n" +
          "| THE_FORGER | ✗ |\n" +
          "| THE_SHADE | ✗ |",
      },
    })
    .input(z.object({
      formId: z.string(),
      email: z.string().email(),
      role: roleTypeEnum,
    }))
    .output(z.any())
    .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
      return collaboratorsService.invite(input.formId, ctx.user.id, input.email, input.role);
    }),

  remove: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/collaborators/remove",
        tags: ["Collaborators"],
        protect: true,
        summary: "Remove a collaborator",
        description: "// NOTE: keep this RBAC table in sync with apps/api/src/rbac.ts\n\n" +
          "| Role | Can access |\n" +
          "|---|---|\n" +
          "| THE_ARCHITECT | ✓ |\n" +
          "| THE_EXTRACTOR | ✗ |\n" +
          "| THE_FORGER | ✗ |\n" +
          "| THE_SHADE | ✗ |",
      },
    })
    .input(z.object({
      formId: z.string(),
      collaboratorId: z.string(),
    }))
    .output(z.any())
    .mutation(async ({ input, ctx }: { input: any, ctx: any }) => {
      return collaboratorsService.remove(input.formId, ctx.user.id, input.collaboratorId);
    }),
});
