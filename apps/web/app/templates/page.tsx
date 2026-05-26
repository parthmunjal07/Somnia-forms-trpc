"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Sparkles,
  Copy,
  Layers,
  Eye,
  ShieldCheck,
  HeartPulse,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { AuthGuard } from "~/components/AuthGuard";

// ─── UX FIX: Every title, description, field label, and CTA
//     is plain English first. The Inception-themed name appears
//     as a small secondary label — decorative, not the headline.
//     Users immediately understand what each template does without
//     having to decode "Limbo Evaluation" or "Operative Intake".
// ──────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    key: "feedback",
    // Plain English title — what the form actually does
    title: "Feedback Form",
    // Thematic subtitle — shown small, earns its place after the hook
    themeTitle: "The Limbo Evaluation",
    // Plain English description — no jargon
    description:
      "Collect ratings and written feedback from customers, teammates or users after an experience.",
    tag: "Feedback",
    icon: HeartPulse,
    // Plain English field descriptions
    fields: [
      "Overall rating (1–5 stars)",
      "What went well? (Select one)",
      "What could be improved? (Long text)",
      "Would you recommend us? (Checkbox)",
    ],
  },
  {
    key: "job_application",
    title: "Job Application",
    themeTitle: "Operative Recruitment",
    description:
      "Screen candidates with a structured application — name, contact, experience level and availability.",
    tag: "Recruitment",
    icon: ShieldCheck,
    fields: [
      "Full name (Short text)",
      "Email address (Email)",
      "Role applying for (Dropdown)",
      "Years of experience (Number)",
      "Available start date (Date picker)",
      "Tell us about yourself (Long text)",
    ],
  },
  {
    key: "event_registration",
    title: "Event Registration",
    themeTitle: "The Shared Seminar",
    description:
      "Collect RSVPs and attendee details for workshops, meetups, webinars or any live event.",
    tag: "RSVP",
    icon: Layers,
    fields: [
      "Full name (Short text)",
      "Email address (Email)",
      "Dietary or accessibility needs (Multi-select)",
      "I agree to the event terms (Required checkbox)",
    ],
  },
  {
    key: "security",
    title: "Security Audit",
    themeTitle: "Projection Defense Check",
    description:
      "Run a structured security or compliance checklist — identify vulnerabilities and track sign-offs.",
    tag: "Compliance",
    icon: ShieldAlert,
    fields: [
      "Reviewer name (Short text)",
      "Risk level identified (Dropdown)",
      "All controls verified? (Required checkbox)",
      "Describe any findings (Long text)",
      "Severity score (Number 1–10)",
    ],
  },
  {
    key: "research",
    title: "Research Survey",
    themeTitle: "The Chemist's Trial",
    description:
      "Run a structured research study — capture participant IDs, measurements and scored observations.",
    tag: "Research",
    icon: Sparkles,
    fields: [
      "Participant ID (Short text)",
      "Measurement value A (Number)",
      "Measurement value B (Number)",
      "Anomaly observed? (Checkbox)",
      "Quality score (Rating 1–5)",
    ],
  },
  {
    key: "lead_gen",
    title: "Lead Generation",
    themeTitle: "Architect Intake",
    description:
      "Qualify inbound leads — capture company details, project scope, timeline and budget range.",
    tag: "Sales",
    icon: Eye,
    fields: [
      "Company name (Short text)",
      "Project deadline (Date picker)",
      "Estimated budget range (Number)",
      "Project type (Dropdown)",
      "Tell us more about your needs (Long text)",
    ],
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [cloningKey, setCloningKey] = useState<string | null>(null);
  const [clonedKeys, setClonedKeys] = useState<Set<string>>(new Set());
  const cloneMutation = trpc.forms.createFromTemplate.useMutation();

  const handleClone = async (template: (typeof TEMPLATES)[0]) => {
    setCloningKey(template.key);
    try {
      const generatedSlug = `${template.key}-${Math.random().toString(36).substring(2, 7)}`;
      const result = await cloneMutation.mutateAsync({
        templateKey: template.key,
        title: template.title,
        slug: generatedSlug,
      });
      setClonedKeys((prev) => new Set([...prev, template.key]));
      toast.success(`"${template.title}" added to your dashboard.`);
      router.push(`/dashboard/forms/${result.id}/build`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create form from template.");
    } finally {
      setCloningKey(null);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0A0A0F] text-[#EEF3F8] font-mono flex flex-col relative selection:bg-[#C9933A]/20 selection:text-[#E8B455]">

        {/* Grid bg */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(139,163,191,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(139,163,191,0.03) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* ── HEADER ── */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
          style={{
            background: "rgba(10,10,15,0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "0.5px solid rgba(200,216,232,0.08)",
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-8 h-8 flex items-center justify-center rounded-sm text-[#8BA3BF] hover:text-[#EEF3F8] transition-colors"
              style={{ border: "0.5px solid rgba(200,216,232,0.1)" }}
            >
              <ArrowLeft size={14} />
            </button>

            <div>
              {/* Plain English page title */}
              <h1 className="text-[18px] font-medium text-[#EEF3F8] tracking-[0.04em]">
                Form Templates
              </h1>
              {/* Thematic subtitle — secondary, not the headline */}
              <p className="text-[14px] text-[rgba(139,163,191,0.4)] uppercase tracking-[0.2em] mt-0.5">
                Blueprints — start faster, customise freely
              </p>
            </div>
          </div>

          {/* UX FIX: Template count so user knows how many options exist */}
          <span
            className="text-[14px] tracking-[0.14em] uppercase text-[rgba(201,147,58,0.6)] px-2.5 py-1 rounded-sm"
            style={{ border: "0.5px solid rgba(201,147,58,0.2)", background: "rgba(201,147,58,0.04)" }}
          >
            {TEMPLATES.length} templates
          </span>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 z-10 flex flex-col gap-8">

          {/* ── Page intro ── */}
          <div className="flex flex-col gap-2">
            <h2
              className="font-cormorant font-light text-[#EEF3F8]"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}
            >
              Start with a template
            </h2>
            {/* UX FIX: Tells users exactly what will happen when they click */}
            <p className="text-[15px] text-[rgba(139,163,191,0.55)] leading-relaxed max-w-2xl">
              Pick a template below to create a pre-built form with questions already configured.
              You can edit every field, label and setting after — templates are just a head start.
            </p>
          </div>

          {/* ── Template grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((tpl) => {
              const Icon = tpl.icon;
              const isCloning = cloningKey === tpl.key;
              const isCloned = clonedKeys.has(tpl.key);
              const isDisabled = cloningKey !== null;

              return (
                <div
                  key={tpl.key}
                  className="group flex flex-col justify-between rounded-sm transition-all duration-300"
                  style={{
                    background: "rgba(200,216,232,0.02)",
                    border: "0.5px solid rgba(200,216,232,0.08)",
                    // Subtle gold border on hover
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.border =
                      "0.5px solid rgba(201,147,58,0.25)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.border =
                      "0.5px solid rgba(200,216,232,0.08)")
                  }
                >
                  <div className="p-5 flex flex-col gap-4">

                    {/* Card header: icon + tag */}
                    <div className="flex items-start justify-between">
                      <div
                        className="w-9 h-9 rounded-sm flex items-center justify-center text-[#C9933A] flex-shrink-0"
                        style={{
                          background: "rgba(201,147,58,0.06)",
                          border: "0.5px solid rgba(201,147,58,0.2)",
                        }}
                      >
                        <Icon size={17} />
                      </div>
                      {/* UX FIX: Tag is plain English category — not thematic */}
                      <span
                        className="text-[14px] tracking-[0.14em] uppercase font-bold px-2 py-0.5 rounded-sm"
                        style={{
                          background: "rgba(201,147,58,0.06)",
                          border: "0.5px solid rgba(201,147,58,0.2)",
                          color: "rgba(201,147,58,0.8)",
                        }}
                      >
                        {tpl.tag}
                      </span>
                    </div>

                    {/* Title block */}
                    <div className="flex flex-col gap-1">
                      {/* Plain English title — the headline */}
                      <h3 className="text-[16px] font-medium text-[#EEF3F8] leading-snug tracking-[0.02em]">
                        {tpl.title}
                      </h3>
                      {/* Thematic name — small, secondary, rewards the curious */}
                      <p className="text-[14px] tracking-[0.16em] uppercase text-[rgba(201,147,58,0.45)] font-cormorant italic">
                        {tpl.themeTitle}
                      </p>
                      {/* Plain English description */}
                      <p className="text-[14px] text-[rgba(139,163,191,0.55)] leading-relaxed mt-1">
                        {tpl.description}
                      </p>
                    </div>

                    {/* Field preview */}
                    <div
                      className="flex flex-col gap-1.5 pt-3"
                      style={{ borderTop: "0.5px solid rgba(200,216,232,0.06)" }}
                    >
                      {/* UX FIX: "Includes these questions" not "Included Variables" */}
                      <span className="text-[13px] uppercase tracking-[0.16em] text-[rgba(139,163,191,0.35)] mb-1 block">
                        Includes {tpl.fields.length} questions
                      </span>
                      <ul className="flex flex-col gap-1">
                        {tpl.fields.map((f, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-[13px] text-[rgba(139,163,191,0.5)] leading-relaxed"
                          >
                            <span
                              className="w-1 h-1 rounded-full bg-[#C9933A]/50 flex-shrink-0"
                              style={{ marginTop: "5px" }}
                            />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CTA */}
                  <div
                    className="px-5 pb-5"
                    style={{ paddingTop: "12px" }}
                  >
                    <button
                      onClick={() => handleClone(tpl)}
                      disabled={isDisabled}
                      className="w-full py-2.5 rounded-sm text-[14px] font-bold tracking-[0.14em] uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: isCloned
                          ? "rgba(74,255,158,0.06)"
                          : "rgba(201,147,58,0.08)",
                        border: isCloned
                          ? "0.5px solid rgba(74,255,158,0.3)"
                          : "0.5px solid rgba(201,147,58,0.3)",
                        color: isCloned ? "#4AFF9E" : "#C9933A",
                      }}
                    >
                      {isCloning ? (
                        <>
                          {/* UX FIX: Specific loading message */}
                          <span className="animate-pulse">Creating form...</span>
                        </>
                      ) : isCloned ? (
                        <>
                          <CheckCircle2 size={12} />
                          Form created — open builder
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          {/* UX FIX: "Use this template" not "Clone into Workshop" */}
                          Use this template
                        </>
                      )}
                    </button>

                    {/* UX FIX: Reassurance microcopy below CTA */}
                    {!isCloned && (
                      <p className="text-[14px] text-[rgba(139,163,191,0.25)] text-center mt-2">
                        Creates a new draft — nothing is published yet
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Bottom CTA — build from scratch ── */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-sm"
            style={{ border: "0.5px solid rgba(200,216,232,0.07)", background: "rgba(200,216,232,0.015)" }}
          >
            <div>
              <p className="text-[15px] text-[#C8D8E8] font-medium">
                Prefer to start from scratch?
              </p>
              <p className="text-[13px] text-[rgba(139,163,191,0.45)] mt-0.5">
                Go to your dashboard and create a blank form — add any questions you need.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-[13px] font-bold tracking-[0.14em] uppercase transition-all flex-shrink-0"
              style={{
                border: "0.5px solid rgba(200,216,232,0.12)",
                color: "#8BA3BF",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#EEF3F8";
                (e.currentTarget as HTMLButtonElement).style.border = "0.5px solid rgba(200,216,232,0.25)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#8BA3BF";
                (e.currentTarget as HTMLButtonElement).style.border = "0.5px solid rgba(200,216,232,0.12)";
              }}
            >
              Go to dashboard →
            </button>
          </div>

        </main>
      </div>
    </AuthGuard>
  );
}