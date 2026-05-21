import { db } from "@repo/database";
import { formCollaboratorsTable, usersTable } from "@repo/database/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { can } from "../rbac";
import { getUserFormRole } from "./formsService";

export class CollaboratorsService {
  async list(formId: string, currentUserId: string) {
    // 1. Check if the current user even has permission to view this form
    const role = await getUserFormRole(formId, currentUserId);
    
    if (!role || !can(role as any, "viewForm")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to view collaborators" });
    }

    // 2. Fetch collaborators joined with their user details
    const collaborators = await db
      .select({
        userId: usersTable.id,
        email: usersTable.email,
        fullName: usersTable.fullName,
        role: formCollaboratorsTable.role,
        invitedAt: formCollaboratorsTable.invitedAt,
        acceptedAt: formCollaboratorsTable.acceptedAt,
      })
      .from(formCollaboratorsTable)
      .innerJoin(usersTable, eq(formCollaboratorsTable.userId, usersTable.id))
      .where(eq(formCollaboratorsTable.formId, formId));

    return collaborators;
  }

  async invite(
    formId: string, 
    currentUserId: string, 
    targetEmail: string, 
    role: "THE_FORGER" | "THE_SHADE"
  ) {
    // 1. Only THE_ARCHITECT (form owner) or an Admin can invite people
    const currentUserRole = await getUserFormRole(formId, currentUserId);
    
    if (!currentUserRole || !can(currentUserRole as any, "inviteCollaborator")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the Architect can invite collaborators" });
    }

    // 2. Look up the user being invited by email
    const [targetUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, targetEmail))
      .limit(1);

    if (!targetUser) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User with this email does not exist" });
    }

    if (targetUser.id === currentUserId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot invite yourself" });
    }

    // 3. Prevent duplicate invitations
    const [existing] = await db
      .select()
      .from(formCollaboratorsTable)
      .where(
        and(
          eq(formCollaboratorsTable.formId, formId),
          eq(formCollaboratorsTable.userId, targetUser.id)
        ) as any
      )
      .limit(1);

    if (existing) {
      throw new TRPCError({ code: "CONFLICT", message: "User is already a collaborator on this Dreamscape" });
    }

    // 4. Insert the collaborator record
    const [collaborator] = await db
      .insert(formCollaboratorsTable)
      .values({
        formId,
        userId: targetUser.id,
        role,
        // Auto-accepting immediately so the frontend dashboard populates seamlessly 
        // without needing a complex email-accept flow for the hackathon.
        acceptedAt: new Date(), 
      })
      .returning();

    return collaborator;
  }

  async remove(formId: string, currentUserId: string, collaboratorId: string) {
    // 1. Only THE_ARCHITECT can remove collaborators
    const currentUserRole = await getUserFormRole(formId, currentUserId);
    
    if (!currentUserRole || !can(currentUserRole as any, "inviteCollaborator")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the Architect can remove collaborators" });
    }

    if (currentUserId === collaboratorId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot remove yourself" });
    }

    // 2. Delete the record
    await db
      .delete(formCollaboratorsTable)
      .where(
        and(
          eq(formCollaboratorsTable.formId, formId),
          eq(formCollaboratorsTable.userId, collaboratorId)
        ) as any
      );

    return { success: true };
  }
}

export const collaboratorsService = new CollaboratorsService();