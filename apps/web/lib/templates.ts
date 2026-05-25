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
      options: ["Architect", "Forger", "Chemist", "Point Man", "Extrator"],
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
} as const;
