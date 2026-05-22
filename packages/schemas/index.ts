import { z } from "zod";

export const validationRulesSchema = z.object({
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(0).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
}).optional();

export const createFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must only contain lowercase letters, numbers, and hyphens"
    ),
  visibility: z.enum(["public", "unlisted"]).optional(),
  redirectUrl: z.string().url("Invalid redirect URL").nullable().optional(),
});

export const updateFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255).optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must only contain lowercase letters, numbers, and hyphens"
    )
    .optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  visibility: z.enum(["public", "unlisted"]).optional(),
  redirectUrl: z.string().url("Invalid redirect URL").nullable().optional(),
});

export const addFieldSchema = z.object({
  formId: z.string().uuid("Invalid form ID"),
  label: z.string().min(1, "Label is required"),
  type: z.enum([
    "short_text",
    "long_text",
    "email",
    "number",
    "single_select",
    "multi_select",
    "checkbox",
    "date",
    "rating",
  ]),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  validationRules: validationRulesSchema,
  order: z.number().int(),
});

export const updateFieldSchema = z.object({
  label: z.string().min(1, "Label is required").optional(),
  type: z
    .enum([
      "short_text",
      "long_text",
      "email",
      "number",
      "single_select",
      "multi_select",
      "checkbox",
      "date",
      "rating",
    ])
    .optional(),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  validationRules: validationRulesSchema,
  order: z.number().int().optional(),
});

export const inviteCollaboratorSchema = z.object({
  formId: z.string().uuid("Invalid form ID"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["THE_FORGER", "THE_SHADE"]),
});
