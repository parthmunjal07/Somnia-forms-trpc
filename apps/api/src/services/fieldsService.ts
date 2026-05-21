import { db } from "@repo/database";
import { fieldsTable, formsTable } from "@repo/database/models/form";
import { usersTable } from "@repo/database/models/user";
import { eq, and, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getUserFormRole } from "./formsService";
import { can } from "../rbac";
import { InsertField } from "@repo/database/models/form";
import { SelectUser } from "@repo/database/models/user";

export class FieldsService {
  async getTierLimit(tier: SelectUser["subscriptionTier"]) {
    switch (tier) {
      case "free":
        return 10;
      case "pro":
      case "team":
      default:
        return 100;
    }
  }

  async list(formId: string, userId: string) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || !can(role, "viewForm")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }

    const fields = await db
      .select()
      .from(fieldsTable)
      .where(eq(fieldsTable.formId, formId))
      .orderBy(asc(fieldsTable.order));

    return fields;
  }
  
  async getPublicFields(formId: string) {
    const fields = await db
      .select()
      .from(fieldsTable)
      .where(eq(fieldsTable.formId, formId))
      .orderBy(asc(fieldsTable.order));

    return fields;
  }

  async create(formId: string, userId: string, fieldData: Omit<InsertField, "id" | "formId" | "createdAt" | "updatedAt">) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || !can(role, "editForm")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }

    const [formOwner] = await db
      .select({ userId: formsTable.userId })
      .from(formsTable)
      .where(eq(formsTable.id, formId))
      .limit(1);

    if (!formOwner) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });

    const [ownerData] = await db
      .select({ subscriptionTier: usersTable.subscriptionTier })
      .from(usersTable)
      .where(eq(usersTable.id, formOwner.userId))
      .limit(1);
      
    if (!ownerData) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const maxFields = await this.getTierLimit(ownerData.subscriptionTier);

    const existingFields = await db
      .select({ id: fieldsTable.id })
      .from(fieldsTable)
      .where(eq(fieldsTable.formId, formId));

    if (existingFields.length >= maxFields) {
      throw new TRPCError({ code: "FORBIDDEN", message: `Field limit reached for ${ownerData.subscriptionTier} tier (${maxFields})` });
    }

    const [field] = await db
      .insert(fieldsTable)
      .values({
        formId,
        ...fieldData,
      })
      .returning();

    return field;
  }

  async update(fieldId: string, formId: string, userId: string, data: Partial<InsertField>) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || !can(role, "editForm")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }

    const [field] = await db
      .update(fieldsTable)
      .set(data)
      .where(and(eq(fieldsTable.id, fieldId), eq(fieldsTable.formId, formId)))
      .returning();

    if (!field) throw new TRPCError({ code: "NOT_FOUND", message: "Field not found" });

    return field;
  }

  async delete(fieldId: string, formId: string, userId: string) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || !can(role, "editForm")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }

    const [deleted] = await db
      .delete(fieldsTable)
      .where(and(eq(fieldsTable.id, fieldId), eq(fieldsTable.formId, formId)))
      .returning({ id: fieldsTable.id });

    if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Field not found" });

    return { success: true };
  }

  async reorder(formId: string, userId: string, fieldIds: string[]) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || !can(role, "editForm")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }

    await db.transaction(async (tx) => {
      for (let i = 0; i < fieldIds.length; i++) {
        await tx
          .update(fieldsTable)
          .set({ order: i })
          .where(and(eq(fieldsTable.id, fieldIds[i]!), eq(fieldsTable.formId, formId)));
      }
    });

    return { success: true };
  }
}

export const fieldsService = new FieldsService();
