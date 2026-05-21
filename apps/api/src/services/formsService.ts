import { db } from "@repo/database";
import { formsTable, formCollaboratorsTable, analyticsTable } from "@repo/database/models/form";
import { usersTable } from "@repo/database/models/user";
import { eq, and, isNotNull, or, lt, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { can } from "../rbac";
import { paginationInput } from "@repo/trpc/pagination";
import { z } from "zod";

export async function getUserFormRole(formId: string, userId: string) {
  const [form] = await db 
    .select({ userId: formsTable.userId })
    .from(formsTable)
    .where(eq(formsTable.id, formId))
    .limit(1);

  if (!form) return null;

  if (form.userId === userId) {
    const [user] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    return user?.role ?? null;
  }

  const [collaborator] = await db
    .select({ role: formCollaboratorsTable.role, acceptedAt: formCollaboratorsTable.acceptedAt })
    .from(formCollaboratorsTable)
    .where(
      and(
        eq(formCollaboratorsTable.formId, formId),
        eq(formCollaboratorsTable.userId, userId),
        isNotNull(formCollaboratorsTable.acceptedAt)
      )
    )
    .limit(1);

  if (collaborator) {
    return collaborator.role;
  }

  return null;
}

export class FormsService {
  async create(userId: string, title: string, slug: string, visibility: "public" | "unlisted") {
    const [user] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user || !can(user.role, "createForm")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to create form" });
    }

    const [form] = await db
      .insert(formsTable)
      .values({
        userId,
        title,
        slug,
        visibility,
        status: "draft",
      })
      .returning();

    if (!form) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    await db.insert(analyticsTable).values({
      formId: form.id,
      viewsCount: 0,
      submissionsCount: 0,
    });

    return form;
  }

  async list(userId: string, opts: z.infer<typeof paginationInput>) {
    const limit = opts.limit + 1;
    let cursorDate: Date | null = null;
    
    if (opts.cursor) {
      cursorDate = new Date(opts.cursor);
    }

    const forms = await db
      .select({ form: formsTable })
      .from(formsTable)
      .leftJoin(
        formCollaboratorsTable,
        and(
          eq(formCollaboratorsTable.formId, formsTable.id),
          eq(formCollaboratorsTable.userId, userId),
          isNotNull(formCollaboratorsTable.acceptedAt)
        )
      )
      .where(
        and(
          or(
            eq(formsTable.userId, userId),
            isNotNull(formCollaboratorsTable.userId)
          ),
          cursorDate ? lt(formsTable.createdAt, cursorDate) : undefined
        )
      )
      .orderBy(desc(formsTable.createdAt))
      .limit(limit);

    let nextCursor: string | undefined = undefined;
    
    if (forms.length > opts.limit) {
      const nextItem = forms.pop();
      nextCursor = nextItem?.form.createdAt?.toISOString();
    }

    return {
      items: forms.map((f) => f.form),
      nextCursor,
    };
  }

  async getById(formId: string, userId: string) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || !can(role, "viewForm")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to view form" });
    }

    const [form] = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.id, formId))
      .limit(1);

    return form;
  }

  async getPublicForm(slug: string) {
    const [form] = await db
      .select()
      .from(formsTable)
      .where(and(eq(formsTable.slug, slug), eq(formsTable.status, "published")))
      .limit(1);

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found or not published" });
    }

    return form;
  }

  async update(formId: string, data: Partial<{ title: string; slug: string; status: "draft" | "published" | "archived"; visibility: "public" | "unlisted" }>, userId: string) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || !can(role, "editForm")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to edit form" });
    }

    if (data.status === "published" && role === "THE_FORGER") {
      throw new TRPCError({ code: "FORBIDDEN", message: "THE_FORGER cannot publish forms" });
    }

    const [form] = await db
      .update(formsTable)
      .set(data)
      .where(eq(formsTable.id, formId))
      .returning();

    return form;
  }

  async delete(formId: string, userId: string) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || !can(role, "deleteForm")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to delete form" });
    }

    await db.delete(formsTable).where(eq(formsTable.id, formId));
    return { success: true };
  }
}

export const formsService = new FormsService();
