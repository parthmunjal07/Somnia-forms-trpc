import { describe, it, expect } from "vitest";
import { can } from "../rbac";
import type { SelectUser } from "@repo/database/schema";

type Role = SelectUser["role"];

describe("RBAC Permissions", () => {
  it("should allow THE_SHADE to viewForm only", () => {
    expect(can("THE_SHADE", "viewForm")).toBe(true);
    expect(can("THE_SHADE", "publishForm")).toBe(false);
    expect(can("THE_SHADE", "deleteForm")).toBe(false);
    expect(can("THE_SHADE", "editForm")).toBe(false);
    expect(can("THE_SHADE", "viewResponses")).toBe(false);
  });

  it("should allow THE_FORGER to view, edit, and viewResponses, but not delete/publish", () => {
    expect(can("THE_FORGER", "viewForm")).toBe(true);
    expect(can("THE_FORGER", "editForm")).toBe(true);
    expect(can("THE_FORGER", "viewResponses")).toBe(true);
    
    expect(can("THE_FORGER", "publishForm")).toBe(false);
    expect(can("THE_FORGER", "deleteForm")).toBe(false);
    expect(can("THE_FORGER", "inviteCollaborator")).toBe(false);
  });

  it("should allow THE_ARCHITECT to do everything except manageUsers", () => {
    expect(can("THE_ARCHITECT", "viewForm")).toBe(true);
    expect(can("THE_ARCHITECT", "createForm")).toBe(true);
    expect(can("THE_ARCHITECT", "editForm")).toBe(true);
    expect(can("THE_ARCHITECT", "publishForm")).toBe(true);
    expect(can("THE_ARCHITECT", "deleteForm")).toBe(true);
    expect(can("THE_ARCHITECT", "viewResponses")).toBe(true);
    expect(can("THE_ARCHITECT", "inviteCollaborator")).toBe(true);

    expect(can("THE_ARCHITECT", "manageUsers")).toBe(false);
  });

  it("should allow THE_EXTRACTOR and THE_DREAMER to do everything", () => {
    const fullAccessRoles: Role[] = ["THE_EXTRACTOR", "THE_DREAMER"];
    const allActions = [
      "viewForm",
      "createForm",
      "editForm",
      "publishForm",
      "deleteForm",
      "viewResponses",
      "inviteCollaborator",
      "manageUsers",
    ] as const;

    for (const role of fullAccessRoles) {
      for (const action of allActions) {
        expect(can(role, action)).toBe(true);
      }
    }
  });

  it("should return false for unknown roles or actions", () => {
    // @ts-expect-error Testing invalid role
    expect(can("UNKNOWN_ROLE", "viewForm")).toBe(false);
    // @ts-expect-error Testing invalid action
    expect(can("THE_DREAMER", "unknownAction")).toBe(false);
  });
});
