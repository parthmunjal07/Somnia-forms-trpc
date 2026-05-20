import type { SelectUser } from "@repo/database/schema";

type Role = SelectUser["role"];

type Action =
  | "viewForm"
  | "createForm"
  | "editForm"
  | "publishForm"
  | "deleteForm"
  | "viewResponses"
  | "inviteCollaborator"
  | "manageUsers";

const permissions: Record<Role, Action[]> = {
  THE_EXTRACTOR: [
    "viewForm",
    "createForm",
    "editForm",
    "publishForm",
    "deleteForm",
    "viewResponses",
    "inviteCollaborator",
    "manageUsers",
  ],
  THE_ARCHITECT: [
    "viewForm",
    "createForm",
    "editForm",
    "publishForm",
    "deleteForm",
    "viewResponses",
    "inviteCollaborator",
  ],
  THE_FORGER: ["viewForm", "editForm", "viewResponses"],
  THE_SHADE: ["viewForm"],
  THE_DREAMER: ["viewForm"],
};

export function can(role: Role, action: Action): boolean {
  return permissions[role]?.includes(action) ?? false;
}
