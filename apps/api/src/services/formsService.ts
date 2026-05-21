import { db } from "@repo/database";
import { formsTable, formCollaboratorsTable, analyticsTable, fieldsTable } from "@repo/database/models/form";
import { usersTable } from "@repo/database/models/user";
import { eq, and, isNotNull, or, lt, desc, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { can } from "../rbac";
import { paginationInput } from "@repo/trpc/pagination";
import { z } from "zod";
import bcrypt from "bcryptjs";

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
      .select({
        form: formsTable,
        viewsCount: analyticsTable.viewsCount,
        submissionsCount: analyticsTable.submissionsCount,
        collaboratorRole: formCollaboratorsTable.role,
      })
      .from(formsTable)
      .leftJoin(
        formCollaboratorsTable,
        and(
          eq(formCollaboratorsTable.formId, formsTable.id),
          eq(formCollaboratorsTable.userId, userId),
          isNotNull(formCollaboratorsTable.acceptedAt)
        )
      )
      .leftJoin(
        analyticsTable,
        eq(analyticsTable.formId, formsTable.id)
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
      items: forms.map((f) => ({
        ...f.form,
        viewsCount: f.viewsCount ?? 0,
        submissionsCount: f.submissionsCount ?? 0,
        role: f.form.userId === userId ? "THE_ARCHITECT" : (f.collaboratorRole ?? "THE_SHADE"),
      })),
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

  async getPublicForm(slug: string, password?: string) {
    const [form] = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.slug, slug))
      .limit(1);

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    }

    if (form.status !== "published") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Form is not published" });
    }

    // Expiry check
    if (form.expiresAt && form.expiresAt < new Date()) {
      return { form, fields: [], expired: true };
    }

    // Response limit cap check
    const [analytics] = await db
      .select({ submissionsCount: analyticsTable.submissionsCount })
      .from(analyticsTable)
      .where(eq(analyticsTable.formId, form.id))
      .limit(1);
    if (form.responseLimit && analytics && analytics.submissionsCount >= form.responseLimit) {
      return { form, fields: [], capReached: true };
    }

    // Password protection check
    if (form.passwordHash) {
      if (!password) {
        return { form: { id: form.id, title: form.title, theme: form.theme }, passwordRequired: true };
      }
      const match = await bcrypt.compare(password, form.passwordHash);
      if (!match) {
        return { form: { id: form.id, title: form.title, theme: form.theme }, passwordRequired: true, error: "Incorrect password" };
      }
    }

    // Load fields
    const fields = await db
      .select()
      .from(fieldsTable)
      .where(eq(fieldsTable.formId, form.id))
      .orderBy(asc(fieldsTable.order));

    return { form, fields };
  }

  async update(
    formId: string,
    data: Partial<{
      title: string;
      slug: string;
      status: "draft" | "published" | "archived";
      visibility: "public" | "unlisted";
      theme: string;
      responseLimit: number | null;
      expiresAt: string | null;
      password: string | null;
      thankYouMessage: string | null;
    }>,
    userId: string
  ) {
    const role = await getUserFormRole(formId, userId);

    if (!role || !can(role, "editForm")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to edit form" });
    }

    if (data.status === "published" && role === "THE_FORGER") {
      throw new TRPCError({ code: "FORBIDDEN", message: "THE_FORGER cannot publish forms" });
    }

    const { password, expiresAt, ...updateData } = data;
    const finalData: any = { ...updateData };

    if (expiresAt !== undefined) {
      finalData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    if (password !== undefined) {
      finalData.passwordHash = password ? await bcrypt.hash(password, 12) : null;
    }

    const [form] = await db
      .update(formsTable)
      .set(finalData)
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

  async clone(formId: string, userId: string) {
    const role = await getUserFormRole(formId, userId);
    if (!role || !can(role, "createForm")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to clone form" });
    }
    if (role === "THE_FORGER") {
      throw new TRPCError({ code: "FORBIDDEN", message: "THE_FORGER cannot clone forms" });
    }

    const [sourceForm] = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.id, formId))
      .limit(1);

    if (!sourceForm) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Source form not found" });
    }

    // Create copy inside transaction
    return await db.transaction(async (tx) => {
      const uniqueSlug = `${sourceForm.slug}-clone-${Math.random().toString(36).substring(2, 7)}`;
      const [newForm] = await tx
        .insert(formsTable)
        .values({
          userId,
          title: `${sourceForm.title} (Clone)`,
          slug: uniqueSlug,
          status: "draft",
          visibility: sourceForm.visibility,
          theme: sourceForm.theme,
          responseLimit: sourceForm.responseLimit,
          expiresAt: sourceForm.expiresAt,
          passwordHash: sourceForm.passwordHash,
          thankYouMessage: sourceForm.thankYouMessage,
        })
        .returning();

      if (!newForm) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cloning failed" });

      // Copy fields
      const sourceFields = await tx
        .select()
        .from(fieldsTable)
        .where(eq(fieldsTable.formId, formId))
        .orderBy(asc(fieldsTable.order));

      if (sourceFields.length > 0) {
        await tx.insert(fieldsTable).values(
          sourceFields.map((f) => ({
            formId: newForm.id,
            label: f.label,
            type: f.type,
            required: f.required,
            placeholder: f.placeholder,
            options: f.options,
            order: f.order,
          }))
        );
      }

      // Add analytics record
      await tx.insert(analyticsTable).values({
        formId: newForm.id,
        viewsCount: 0,
        submissionsCount: 0,
      });

      return newForm;
    });
  }
}

export const formsService = new FormsService();
