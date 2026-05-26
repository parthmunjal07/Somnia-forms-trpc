import { z } from "zod";

export const validationRulesSchema = z.object({
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(0).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
}).optional();

export const conditionalLogicSchema = z.object({
  rules: z.array(z.object({
    fieldId: z.string().uuid("Invalid target field ID"),
    operator: z.enum(["equals", "not_equals"]),
    value: z.string(),
    action: z.enum(["show", "hide"]),
  })).optional()
}).nullable().optional();

export const FORM_TEMPLATES = {
  feedback: [
    {
      label: "Extraction Success Rating",
      type: "rating",
      required: true,
      options: null,
    },
    {
      label: "Primary Subject Subconscious State",
      type: "single_select",
      required: true,
      options: ["Stable", "Volatile", "Hostile", "Fragmented"],
    },
    {
      label: "Operational Anomalies Encountered",
      type: "long_text",
      required: false,
      options: null,
    },
    {
      label: "Require follow-up integration?",
      type: "checkbox",
      required: false,
      options: null,
    },
  ],
  job_application: [
    {
      label: "Operative Alias / Full Name",
      type: "short_text",
      required: true,
      options: null,
    },
    {
      label: "Secure Comm Channel (Email)",
      type: "email",
      required: true,
      options: null,
    },
    {
      label: "Specialization Tier",
      type: "single_select",
      required: true,
      options: ["Architect", "Forger", "Chemist", "Point Man", "Extractor"],
    },
    {
      label: "Years Active in the Field",
      type: "number",
      required: true,
      options: null,
    },
    {
      label: "Available for Immediate Deployment (Date)",
      type: "date",
      required: true,
      options: null,
    },
    {
      label: "Briefing: Most Complex Extraction to Date",
      type: "long_text",
      required: true,
      options: null,
    },
  ],
  event_registration: [
    {
      label: "Attendee Identity Code (Name)",
      type: "short_text",
      required: true,
      options: null,
    },
    {
      label: "Transmission Address (Email)",
      type: "email",
      required: true,
      options: null,
    },
    {
      label: "Requested Arsenal / Equipment",
      type: "multi_select",
      required: false,
      options: ["Suppressed Sidearm", "Sedative Kit", "Totem Calibration Tool", "Architect Grid Specs"],
    },
    {
      label: "Agree to Non-Disclosure Directive",
      type: "checkbox",
      required: true,
      options: null,
    },
  ],
  security: [
    {
      label: "Subject Alias/Identifier",
      type: "short_text",
      required: true,
      options: null,
    },
    {
      label: "Hostile Projection Activity Level",
      type: "single_select",
      required: true,
      options: ["None", "Low", "Medium", "High", "Critical"],
    },
    {
      label: "Totem Calibration Confirmed?",
      type: "checkbox",
      required: true,
      options: null,
    },
    {
      label: "Describe Your Totem's Physical Behavior",
      type: "long_text",
      required: true,
      options: null,
    },
    {
      label: "Last Known Active Dream Level",
      type: "number",
      required: true,
      options: null,
    },
  ],
  research: [
    {
      label: "Compound Batch ID",
      type: "short_text",
      required: true,
      options: null,
    },
    {
      label: "Intravenous Dosage Level (mg)",
      type: "number",
      required: true,
      options: null,
    },
    {
      label: "Dream Duration (Hours)",
      type: "number",
      required: true,
      options: null,
    },
    {
      label: "Did Subject Experience Limbo?",
      type: "checkbox",
      required: true,
      options: null,
    },
    {
      label: "Subject Somatic Stability Score",
      type: "rating",
      required: true,
      options: null,
    },
  ],
  lead_gen: [
    {
      label: "Client Organization Alias",
      type: "short_text",
      required: true,
      options: null,
    },
    {
      label: "Project Deadline",
      type: "date",
      required: true,
      options: null,
    },
    {
      label: "Requested Dream Depth Layers",
      type: "number",
      required: true,
      options: null,
    },
    {
      label: "Architectural Style Reference",
      type: "single_select",
      required: true,
      options: ["Classical", "Modernist", "Brutalist", "Paradoxical/Escherian"],
    },
    {
      label: "Space Constraints / Grid Bounds",
      type: "long_text",
      required: false,
      options: null,
    },
  ],
} as const;

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
  theme: z.enum(["inception", "dark_knight", "interstellar", "tenet"]).optional(),
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
    "layer_break",
  ]),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  validationRules: validationRulesSchema,
  pageIndex: z.number().int().min(0).optional(),
  conditionalLogic: conditionalLogicSchema,
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
      "layer_break",
    ])
    .optional(),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  validationRules: validationRulesSchema,
  pageIndex: z.number().int().min(0).optional(),
  conditionalLogic: conditionalLogicSchema,
  order: z.number().int().optional(),
});

export const inviteCollaboratorSchema = z.object({
  formId: z.string().uuid("Invalid form ID"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["THE_FORGER", "THE_SHADE"]),
});
