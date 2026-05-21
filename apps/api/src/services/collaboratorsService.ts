import { db } from "@repo/database";
import { formCollaboratorsTable, formsTable } from "@repo/database/models/form";
import { usersTable } from "@repo/database/models/user";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getUserFormRole } from "./formsService";
import { can } from "../rbac";
import { SelectUser } from "@repo/database/models/user";
import { paginationInput } from "@repo/trpc/pagination";
import { z } from "zod";

export class CollaboratorsService {
  async getTierCollaboratorLimit(tier: SelectUser["subscriptionTier"]) {
    switch (tier) {
      case "free":
        return 0; // Free cannot invite collaborators
      case "pro":
        return 3;
      case "team":
      default:
        return Infinity;
    }
  }

  async list(formId: string, userId: string) {
    const role = await getUserFormRole(formId, userId);
    
    if (!role || !can(role, "manageCollaborators")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }

    const collaborators = await db
      .select({
        id: formCollaboratorsTable.id,
        role: formCollaboratorsTable.role,
        invitedAt: formCollaboratorsTable.invitedAt,
        acceptedAt: formCollaboratorsTable.acceptedAt,
        user: {
          id: usersTable.id,
          fullName: usersTable.fullName,
          email: usersTable.email,
        }
      })
      .from(formCollaboratorsTable)
      .innerJoin(usersTable, eq(usersTable.id, formCollaboratorsTable.userId))
      .where(eq(formCollaboratorsTable.formId, formId));

    return collaborators;
  }

  async invite(formId: string, inviterUserId: string, inviteeEmail: string, roleType: "THE_DREAMER" | "THE_EXTRACTOR" | "THE_ARCHITECT" | "THE_FORGER" | "THE_SHADE") {
    const role = await getUserFormRole(formId, inviterUserId);
    
    if (!role || !can(role, "manageCollaborators")) {
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

    const maxCollabs = await this.getTierCollaboratorLimit(ownerData.subscriptionTier);

    const existingCollabs = await db
      .select({ id: formCollaboratorsTable.id })
      .from(formCollaboratorsTable)
      .where(eq(formCollaboratorsTable.formId, formId));

    if (existingCollabs.length >= maxCollabs) {
      throw new TRPCError({ code: "FORBIDDEN", message: `Collaborator limit reached for ${ownerData.subscriptionTier} tier` });
    }

    const [invitee] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, inviteeEmail))
      .limit(1);

    if (!invitee) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User with this email not found" });
    }

    if (invitee.id === formOwner.userId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot invite the form owner" });
    }

    const [existing] = await db
      .select()
      .from(formCollaboratorsTable)
      .where(and(eq(formCollaboratorsTable.formId, formId), eq(formCollaboratorsTable.userId, invitee.id)))
      .limit(1);

    if (existing) {
      throw new TRPCError({ code: "CONFLICT", message: "User is already a collaborator or invited" });
    }

    const [collab] = await db
      .insert(formCollaboratorsTable)
      .values({
        formId,
        userId: invitee.id,
        role: roleType,
      })
      .returning();

    return collab;
  }

  async remove(formId: string, requesterUserId: string, collaboratorId: string) {
    const role = await getUserFormRole(formId, requesterUserId);
    
    if (!role || !can(role, "manageCollaborators")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }

    await db.delete(formCollaboratorsTable).where(
      and(
        eq(formCollaboratorsTable.id, collaboratorId),
        eq(formCollaboratorsTable.formId, formId)
      )
    );

    return { success: true };
  }
}

export const collaboratorsService = new CollaboratorsService();
