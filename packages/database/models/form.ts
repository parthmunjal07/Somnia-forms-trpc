import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  integer,
  jsonb,
  pgEnum,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const formStatusEnum = pgEnum("form_status", [
  "draft",
  "published",
  "archived",
]);

export const visibilityEnum = pgEnum("visibility", [
  "public",
  "unlisted",
]);

export const themeEnum = pgEnum("theme", [
  "inception",
  "dark_knight",
  "interstellar",
  "tenet",
]);

export const collaboratorRoleEnum = pgEnum("collaborator_role", [
  "THE_FORGER",
  "THE_SHADE",
]);

export const fieldTypeEnum = pgEnum("field_type", [
  "short_text",
  "long_text",
  "email",
  "number",
  "single_select",
  "multi_select",
  "checkbox",
  "date",
  "rating",
  "layer_break",
]);

export const formsTable = pgTable(
  "forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    status: formStatusEnum("status").default("draft").notNull(),
    visibility: visibilityEnum("visibility").default("public").notNull(),
    theme: themeEnum("theme").default("inception").notNull(),
    responseLimit: integer("response_limit"),
    expiresAt: timestamp("expires_at"),
    passwordHash: varchar("password_hash", { length: 255 }),
    thankYouMessage: text("thank_you_message"),
    redirectUrl: text("redirect_url"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("forms_user_id_idx").on(table.userId),
    index("forms_slug_idx").on(table.slug),
  ]
);

export const formCollaboratorsTable = pgTable(
  "form_collaborators",
  {
    formId: uuid("form_id")
      .references(() => formsTable.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    role: collaboratorRoleEnum("role").notNull(),
    invitedAt: timestamp("invited_at").defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at"),
  },
  (table) => [
    primaryKey({ columns: [table.formId, table.userId] }),
    index("form_collaborators_form_id_idx").on(table.formId),
    index("form_collaborators_user_id_idx").on(table.userId),
  ]
);

export const fieldsTable = pgTable(
  "fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .references(() => formsTable.id, { onDelete: "cascade" })
      .notNull(),
    label: text("label").notNull(),
    type: fieldTypeEnum("type").notNull(),
    required: boolean("required").default(false).notNull(),
    placeholder: text("placeholder"),
    options: jsonb("options"), // array of strings for dropdowns/checkboxes
    validationRules: jsonb("validation_rules"),
    order: integer("order").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [index("fields_form_id_idx").on(table.formId)]
);

export const responsesTable = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .references(() => formsTable.id, { onDelete: "cascade" })
      .notNull(),
    responseValues: jsonb("response_values").notNull(), // { "field_id": "value" }
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    timeToComplete: integer("time_to_complete"),
    isComplete: boolean("is_complete").default(false).notNull(),
  },
  (table) => [index("responses_form_id_idx").on(table.formId)]
);

export const formViewsTable = pgTable(
  "form_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .references(() => formsTable.id, { onDelete: "cascade" })
      .notNull(),
    viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  },
  (table) => [index("form_views_form_id_idx").on(table.formId)]
);

export const analyticsTable = pgTable(
  "analytics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .references(() => formsTable.id, { onDelete: "cascade" })
      .notNull(),
    viewsCount: integer("views_count").default(0).notNull(),
    submissionsCount: integer("submissions_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [index("analytics_form_id_idx").on(table.formId)]
);

export type SelectForm = typeof formsTable.$inferSelect;
export type InsertForm = typeof formsTable.$inferInsert;
export type SelectField = typeof fieldsTable.$inferSelect;
export type InsertField = typeof fieldsTable.$inferInsert;
export type SelectResponse = typeof responsesTable.$inferSelect;
export type InsertResponse = typeof responsesTable.$inferInsert;
export type SelectFormView = typeof formViewsTable.$inferSelect;
export type InsertFormView = typeof formViewsTable.$inferInsert;
export type SelectAnalytics = typeof analyticsTable.$inferSelect;
export type InsertAnalytics = typeof analyticsTable.$inferInsert;
