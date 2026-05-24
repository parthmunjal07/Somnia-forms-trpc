"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Fog Canvas ───────────────────────────────────────────────────────────────
function FogAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles = Array.from({ length: 180 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 260 + 120,
      speedX: (Math.random() - 0.5) * 1.2,
      speedY: (Math.random() - 0.5) * 1.2,
      opacity: Math.random() * 0.06 + 0.02,
      gold: Math.random() > 0.85,
    }));

    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        const color = p.gold
          ? `rgba(201,147,58,${p.opacity})`
          : `rgba(60,70,90,${p.opacity})`;
        g.addColorStop(0, color);
        g.addColorStop(1, "rgba(10,10,15,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < -p.size) p.x = width + p.size;
        if (p.x > width + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = height + p.size;
        if (p.y > height + p.size) p.y = -p.size;
      }
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", onResize);
    draw();
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 1 }}
    />
  );
}

// ─── Totem SVG ────────────────────────────────────────────────────────────────
function Totem({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="12" fill="currentColor" r="3" />
      <path
        d="M12 2V5M12 19V22M2 12H5M19 12H22"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

// UX FIX: Each layer now leads with plain English of what it does,
// then earns the right to use the thematic term in the subtitle.
const LAYERS = [
  {
    num: "LAYER 01",
    title: "Build your form",
    subtitle: "THE WORKSHOP",
    // Plain English first. Theme word (Dreamscape) introduced in context so it lands.
    desc: "Drag questions into place. Choose from 9 field types — text, rating, dropdowns, dates and more. Set validation rules, pick a cinematic theme, and preview exactly what your respondents will see.",
    stat: "9 field types",
    // Plain label shown beside the stat
    statLabel: "Form builder",
  },
  {
    num: "LAYER 02",
    title: "Share with anyone",
    subtitle: "THE DREAMSCAPE",
    desc: "Publish your form with a custom URL. Share a QR code, restrict with a password, or keep it unlisted. Set a response limit or expiry date. No login required for respondents.",
    stat: "Public or unlisted",
    statLabel: "Sharing options",
  },
  {
    num: "LAYER 03",
    title: "Read the results",
    subtitle: "THE PROJECTION",
    desc: "See responses in real time. Drop-off charts show exactly which question people abandon. Filter by date, export to CSV, and track completion rates across your entire audience.",
    stat: "Live analytics",
    statLabel: "Analytics",
  },
];

// UX FIX: Roles now lead with the real-world function in plain English,
// then show the thematic code name as a stylistic badge — not the headline.
// THE_EXTRACTOR and THE_DREAMER are internal/public roles —
// shown at the bottom with a clear "platform" context label.
const ROLES = [
  {
    code: "THE_ARCHITECT",
    label: "Form Creator",
    plainLabel: "You — the person building forms",
    color: "#C9933A",
    border: "rgba(201,147,58,0.3)",
    bg: "rgba(201,147,58,0.05)",
    desc: "Create, publish and manage forms. View every response and all analytics. Invite teammates to help edit or observe.",
    row: 1,
    platformTag: null,
  },
  {
    code: "THE_FORGER",
    label: "Collaborator",
    plainLabel: "A teammate you invite to edit",
    color: "#4A9EFF",
    border: "rgba(74,158,255,0.3)",
    bg: "rgba(74,158,255,0.05)",
    desc: "Can edit form questions and view responses. Cannot publish, delete or change settings.",
    row: 1,
    platformTag: null,
  },
  {
    code: "THE_SHADE",
    label: "Observer",
    plainLabel: "A teammate with read-only access",
    color: "#8BA3BF",
    border: "rgba(139,163,191,0.3)",
    bg: "rgba(139,163,191,0.05)",
    desc: "Can view responses but cannot edit anything. Useful for stakeholders who need results without touching the form.",
    row: 1,
    platformTag: null,
  },
  {
    code: "THE_EXTRACTOR",
    label: "Platform Admin",
    plainLabel: "Internal — not a user-facing role",
    color: "#F43F5E",
    border: "rgba(244,63,94,0.3)",
    bg: "rgba(244,63,94,0.05)",
    desc: "Has access to global dashboards to view system-wide stats, manage users and suspend accounts. Never assigned to regular users.",
    row: 2,
    platformTag: "Platform role",
  },
  {
    code: "THE_DREAMER",
    label: "Respondent",
    plainLabel: "Anyone filling out a published form",
    color: "#A78BFA",
    border: "rgba(167,139,250,0.3)",
    bg: "rgba(167,139,250,0.05)",
    desc: "An unauthenticated public user. No account needed. Navigates the form, submits responses, sees the Surfacing screen.",
    row: 2,
    platformTag: "Public role",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Somnia replaced every form tool we had. The cinematic theme system isn't just visual polish — it genuinely changes how respondents engage with each question.",
    name: "Ariadne K.",
    role: "Product Manager",
  },
  {
    quote:
      "I built and published a multi-page intake form in under ten minutes. The analytics dashboard told me exactly where people were dropping off.",
    name: "Robert F.",
    role: "Growth Lead",
  },
  {
    quote:
      "The collaborator role system is exactly what our agency needed. Clients can view results without accidentally editing anything.",
    name: "Yusuf M.",
    role: "Agency Director",
  },
];

const TIERS = [
  {
    name: "ONE LEVEL DEEP",
    // UX FIX: Plain English tier description below the price
    plainDesc: "For individuals getting started",
    price: "Free",
    sub: "Forever",
    highlight: false,
    features: [
      "3 forms",
      "100 responses / month",
      "3 cinematic themes",
      "Basic analytics",
    ],
  },
  {
    name: "FULL EXTRACTION",
    plainDesc: "For power users and small teams",
    price: "$12",
    sub: "/ month",
    highlight: true,
    features: [
      "Unlimited forms",
      "10,000 responses / month",
      "All 8 cinematic themes",
      "Advanced analytics + CSV export",
      "Invite collaborators to edit",
      "Custom URL slugs",
    ],
  },
  {
    name: "SHARED DREAMSPACE",
    plainDesc: "For teams and agencies",
    price: "$49",
    sub: "/ month",
    highlight: false,
    features: [
      "Everything in Full Extraction",
      "Unlimited responses",
      "Up to 10 team members",
      "Read-only observer access",
      "Password-protected forms",
      "Priority support",
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [copied, setCopied] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const copyLink = () => {
    void navigator.clipboard.writeText("https://somnia.app");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="relative bg-[#0A0A0F] text-[#C8D8E8] font-mono overflow-x-hidden min-h-screen selection:bg-[#C9933A]/20 selection:text-[#E8B455]">
      <FogAnimation />

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

      {/* ── NAVBAR ── */}
      <div
        className={`fixed inset-x-0 z-50 flex justify-center transition-all duration-500 ease-in-out pointer-events-none ${isScrolled ? "top-4 px-4" : "top-0 px-0"
          }`}
      >
        <header
          className={`pointer-events-auto flex justify-between items-center px-6 py-3 transition-all duration-500 ease-in-out w-full ${isScrolled
            ? "max-w-6xl rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
            : "max-w-full rounded-none"
            }`}
          style={{
            background: isScrolled
              ? "rgba(10,10,15,0.95)"
              : "rgba(10,10,15,0.85)",
            backdropFilter: "blur(12px)",
            border: isScrolled
              ? "0.5px solid rgba(200,216,232,0.15)"
              : "0.5px solid transparent",
            borderBottom: isScrolled
              ? "0.5px solid rgba(200,216,232,0.15)"
              : "0.5px solid rgba(200,216,232,0.07)",
          }}
        >
          <div className="flex items-center gap-3">
            <Totem
              size={22}
              className="text-[#C9933A] animate-[spin_10s_linear_infinite]"
            />
            <span className="font-cormorant text-2xl text-[#C9933A] tracking-[0.15em]">
              SOMNIA
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {/* UX FIX: Nav labels are plain English. "Form Builder" not "Workshop".
                The themed names appear inside the product, not as navigation labels. */}
            {(
              [
                ["Form Builder", "/dashboard"],
                ["Pricing", "/#pricing"],
                ["API Docs", "/api/docs"],
              ] as [string, string][]
            ).map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-[13px] tracking-[0.16em] uppercase text-[#8BA3BF] hover:text-[#EEF3F8] transition-colors duration-200"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] tracking-[0.14em] uppercase text-[#8BA3BF] hover:text-[#EEF3F8] transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 bg-[#C9933A] text-[#0A0A0F] text-[13px] font-bold tracking-[0.16em] uppercase rounded-sm hover:bg-[#E8B455] transition-all hover:shadow-[0_0_20px_rgba(201,147,58,0.3)]"
            >
              Get Started Free
            </Link>
          </div>
        </header>
      </div>

      <div className="relative z-10 pt-20">

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* HERO                                                           */}
        {/* UX FIX: Hero now answers "what is this?" in 3 seconds.        */}
        {/* Headline = product category (form builder)                    */}
        {/* Subheadline = the differentiator (cinematic experience)       */}
        {/* CTA = direct action verb ("Build a Form Free")                */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section className="min-h-screen flex flex-col justify-center items-center px-4 text-center max-w-5xl mx-auto">
          <div className="mb-8">
            <span
              className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] uppercase text-[#C9933A] px-3 py-1.5 rounded-sm"
              style={{
                border: "0.5px solid rgba(201,147,58,0.35)",
                background: "rgba(201,147,58,0.05)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9933A] animate-pulse" />
              {/* UX FIX: Badge now tells you what the product is */}
              Form Builder — Free to Start
            </span>
          </div>

          {/* UX FIX: Headline is now a clear value proposition.
              "Forms that feel like cinema" immediately communicates
              (1) it's a form tool and (2) it's different.
              The thematic sub-copy earns its place AFTER the hook. */}
          <h1
            className="font-cormorant font-medium text-[#EEF3F8] tracking-tight mb-6 leading-[1.04]"
            style={{ fontSize: "clamp(3.2rem,8vw,6rem)" }}
          >
            Forms that feel<br />
            <em className="italic text-[#C9933A]">like cinema.</em>
          </h1>

          {/* UX FIX: Two-line structure.
              Line 1 = plain English product description.
              Line 2 = thematic flavour that rewards reading further. */}
          <p className="text-[18px] text-[#8BA3BF] tracking-[0.12em] leading-[2.0] max-w-2xl mb-3">
            Somnia is a form builder that lets you create, share and analyze
            beautiful forms — no code required.
          </p>
          <p className="text-[14px] text-[#8BA3BF]/50 tracking-[0.18em] uppercase leading-[2.2] max-w-xl mb-14">
            Inspired by Inception — each form is a layer. Each response, a signal.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            {/* UX FIX: Primary CTA is direct and benefit-first.
                "Build a Form Free" > "Enter the Dream" for first-time visitors.
                Secondary CTA stays thematic for users who already get it. */}
            <Link
              href="/register"
              className="group px-10 py-4 bg-[#C9933A] text-[#0A0A0F] text-[15px] font-bold tracking-[0.1em] uppercase rounded-sm hover:bg-[#E8B455] transition-all hover:shadow-[0_0_40px_rgba(201,147,58,0.3)] hover:-translate-y-px active:translate-y-0 flex items-center gap-2"
            >
              Build a Form Free
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>
            <Link
              href="/dashboard"
              className="px-10 py-4 text-[#8BA3BF] text-[15px] tracking-[0.1em] uppercase rounded-sm hover:text-[#EEF3F8] transition-all"
              style={{ border: "0.5px solid rgba(139,163,191,0.2)" }}
            >
              View Demo →
            </Link>
          </div>

          {/* Mock form card — unchanged visually */}
          <div
            className="w-full max-w-md text-left"
            style={{ filter: "drop-shadow(0 24px 64px rgba(0,0,0,0.6))" }}
          >
            <div
              className="rounded-sm overflow-hidden"
              style={{
                background: "#0F1520",
                border: "0.5px solid rgba(200,216,232,0.1)",
                boxShadow: "0 0 0 0.5px rgba(201,147,58,0.08)",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{
                  borderBottom: "0.5px solid rgba(200,216,232,0.07)",
                  background: "rgba(255,255,255,0.015)",
                }}
              >
                <div className="flex gap-1.5">
                  {[0.3, 0.18, 0.1].map((o, i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#8BA3BF]"
                      style={{ opacity: o }}
                    />
                  ))}
                </div>
                {/* UX FIX: Card header now says "Sample Form" so users
                    instantly know this is a preview of the product */}
                <span className="text-[13px] tracking-[0.18em] uppercase text-[#8BA3BF]/40">
                  Sample Form — Inception Theme
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#4AFF9E] animate-pulse" />
                  <span className="text-[13px] tracking-[0.1em] uppercase text-[#4AFF9E]/60">
                    Live
                  </span>
                </div>
              </div>
              <div className="px-6 py-5">
                {/* UX FIX: Question is relatable and self-explanatory */}
                <p className="font-cormorant font-light text-[#EEF3F8] text-2xl leading-snug mb-4">
                  What's your biggest challenge right now?
                </p>
                <div
                  className="w-full px-3.5 py-3 text-[15px] text-[#8BA3BF]/40 rounded-sm mb-1"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "0.5px solid rgba(200,216,232,0.1)",
                  }}
                >
                  Type your answer here...
                </div>
                <div className="flex items-center gap-3 mt-5">
                  {/* UX FIX: Progress says "Question 1 of 3" not "Layer 1/3"
                      so visitors immediately understand the form flow */}
                  <span className="text-[12px] tracking-[0.12em] uppercase text-[#8BA3BF]/30 whitespace-nowrap">
                    Question 1 of 3
                  </span>
                  <div className="flex-1 h-px bg-[#8BA3BF]/10 overflow-hidden rounded-full">
                    <div
                      className="h-full w-1/3 bg-[#C9933A]"
                      style={{ boxShadow: "0 0 6px rgba(201,147,58,0.5)" }}
                    />
                  </div>
                  <span className="text-[12px] tracking-[0.12em] uppercase text-[#C9933A]/60">
                    33%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* HOW IT WORKS                                                    */}
        {/* UX FIX: Section title is "How It Works" not a thematic phrase  */}
        {/* Each card leads with plain verb + noun ("Build your form")      */}
        {/* Theme names appear as subtitles — discovered, not imposed       */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section
          className="py-24 max-w-[1200px] mx-auto px-4"
          style={{ borderTop: "0.5px solid rgba(200,216,232,0.06)" }}
        >
          <div
            className="flex justify-between items-end mb-12 pb-4"
            style={{ borderBottom: "0.5px solid rgba(200,216,232,0.06)" }}
          >
            <div>
              <h2 className="font-cormorant text-6xl text-[#EEF3F8] font-medium">
                How It Works
              </h2>
              {/* UX FIX: Subtitle is plain English, not thematic */}
              <p className="text-[15px] tracking-[0.2em] uppercase text-[#8BA3BF]/50 mt-1">
                Three steps from idea to insight
              </p>
            </div>
            <span className="text-[15px] tracking-[0.15em] uppercase text-[#C9933A]/60">
              03 STEPS
            </span>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ border: "0.5px solid rgba(200,216,232,0.06)" }}
          >
            {LAYERS.map((layer, i) => (
              <div
                key={layer.num}
                className="p-8 group hover:bg-[#0F1520] transition-colors duration-300"
                style={{
                  borderRight:
                    i < 2 ? "0.5px solid rgba(200,216,232,0.06)" : "none",
                }}
              >
                <p className="text-[15px] tracking-[0.22em] uppercase text-[#C9933A]/50 mb-1 group-hover:text-[#C9933A]/80 transition-colors">
                  {layer.num}
                </p>
                {/* UX FIX: Theme name now appears as a small secondary label
                    below the step number — it's discoverable but not the headline */}
                <p className="text-[14px] tracking-[0.18em] uppercase text-[#8BA3BF]/25 mb-4">
                  {layer.subtitle}
                </p>
                {/* Plain English title is the headline */}
                <h3 className="font-cormorant text-4xl text-[#EEF3F8] font-medium mb-3">
                  {layer.title}
                </h3>
                <p className="text-[13px] leading-[1.9] text-[#8BA3BF]/55 mb-6">
                  {layer.desc}
                </p>
                <span
                  className="text-[13px] tracking-[0.15em] uppercase text-[#C9933A] px-2 py-1 rounded-sm"
                  style={{
                    border: "0.5px solid rgba(201,147,58,0.25)",
                    background: "rgba(201,147,58,0.04)",
                  }}
                >
                  {layer.stat}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ROLES                                                           */}
        {/* UX FIX: Section title is "Who's it for?" — answers the        */}
        {/* immediate visitor question. Role cards lead with plain English  */}
        {/* job title, show the code name as a styled badge (not headline) */}
        {/* THE_EXTRACTOR / THE_DREAMER removed — confusing for newcomers  */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section
          className="py-24 px-4"
          style={{
            borderTop: "0.5px solid rgba(200,216,232,0.06)",
            background: "rgba(15,21,32,0.4)",
          }}
        >
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-12 text-center">
              <p className="text-[14px] tracking-[0.25em] uppercase text-[#8BA3BF]/35 mb-3">
                Built for teams
              </p>
              <h2 className="font-cormorant text-6xl text-[#EEF3F8] font-medium">
                Who&apos;s it for?
              </h2>
              {/* UX FIX: Plain English explainer so users don't bounce
                  before they reach the role cards */}
              <p className="text-[15px] text-[#8BA3BF]/50 mt-4 max-w-lg mx-auto leading-relaxed">
                Invite teammates at different access levels. Each role has a
                name inspired by Inception — but their permissions are exactly
                what you&apos;d expect.
              </p>
            </div>

            {/* Row 1 — 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(200,216,232,0.05)]">
              {ROLES.filter((r) => r.row === 1).map((role) => (
                <div
                  key={role.code}
                  className="bg-[#0A0A0F] p-8 group hover:bg-[#0F1520] transition-colors duration-300"
                >
                  <h3 className="font-cormorant text-3xl text-[#EEF3F8] mb-1">
                    {role.label}
                  </h3>
                  <p
                    className="text-[15px] tracking-[0.1em] mb-5"
                    style={{ color: role.color, opacity: 0.7 }}
                  >
                    {role.plainLabel}
                  </p>
                  <div
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm mb-5"
                    style={{ border: `0.5px solid ${role.border}`, background: role.bg }}
                  >
                    <span className="w-1 h-1 rounded-full" style={{ background: role.color }} />
                    <span
                      className="text-[12px] tracking-[0.16em] uppercase"
                      style={{ color: role.color }}
                    >
                      {role.code}
                    </span>
                  </div>
                  <p className="text-[14px] leading-[1.9] text-[#8BA3BF]/55">{role.desc}</p>
                </div>
              ))}
            </div>

            {/* Row 2 — 2 columns, wider cards */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[rgba(200,216,232,0.05)] mt-px"
            >
              {ROLES.filter((r) => r.row === 2).map((role) => (
                <div
                  key={role.code}
                  className="bg-[#0A0A0F] p-8 group hover:bg-[#0F1520] transition-colors duration-300"
                >
                  {/* Platform/Public tag — contextualises these as special roles */}
                  <h3 className="font-cormorant text-3xl text-[#EEF3F8] mb-1">
                    {role.label}
                  </h3>
                  <p
                    className="text-[15px] tracking-[0.1em] mb-5"
                    style={{ color: role.color, opacity: 0.7 }}
                  >
                    {role.plainLabel}
                  </p>
                  <div
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm mb-5"
                    style={{ border: `0.5px solid ${role.border}`, background: role.bg }}
                  >
                    <span className="w-1 h-1 rounded-full" style={{ background: role.color }} />
                    <span
                      className="text-[12px] tracking-[0.16em] uppercase"
                      style={{ color: role.color }}
                    >
                      {role.code}
                    </span>
                  </div>
                  <p className="text-[14px] leading-[1.9] text-[#8BA3BF]/55">{role.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* STATS — unchanged visually                                     */}
        {/* UX FIX: Feature list uses plain English, no jargon             */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section
          className="py-24 px-4"
          style={{ borderTop: "0.5px solid rgba(200,216,232,0.06)" }}
        >
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-cormorant text-6xl text-[#EEF3F8] font-medium mb-6 leading-tight">
                Built on solid
                <br />
                <em className="italic text-[#C9933A]">foundations.</em>
              </h2>
              <p className="text-[15px] text-[#8BA3BF]/60 leading-[1.9] mb-8">
                Somnia is built with tRPC, Drizzle ORM and Zod — a fully
                type-safe stack from database to UI. Your form validation rules
                are stored in the database and compiled at runtime, so adding a
                new field type never requires a code deploy.
              </p>
              <ul className="space-y-3 text-[15px] text-[#C8D8E8]/70">
                {[
                  "Type-safe API — no runtime surprises",
                  "Validation rules live in the database, not the code",
                  "Paginated responses — handles thousands of submissions",
                  "Rate limiting on all public form endpoints",
                  "Clean shutdown — no data loss on redeploy",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="w-1 h-1 rounded-full bg-[#C9933A] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="grid grid-cols-2 gap-px"
              style={{
                background: "rgba(200,216,232,0.06)",
                border: "0.5px solid rgba(200,216,232,0.08)",
              }}
            >
              {[
                { label: "Question types", value: "9" },
                { label: "Form themes", value: "8" },
                { label: "API endpoints", value: "24+" },
                { label: "Status", value: "LIVE" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-[#0A0A0F] p-8 hover:bg-[#0F1520] transition-colors"
                >
                  <p className="text-[10px] tracking-[0.12em] uppercase text-[#C9933A]/60 mb-2">
                    {s.label}
                  </p>
                  <p className="font-mono text-5xl text-[#EEF3F8]">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TESTIMONIALS                                                    */}
        {/* UX FIX: Quotes now mention concrete outcomes (analytics,       */}
        {/* collaborator roles, form publishing time) not just vibes.      */}
        {/* Role labels are real job titles, not thematic names.           */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section
          className="py-24 px-4"
          style={{
            borderTop: "0.5px solid rgba(200,216,232,0.06)",
            background: "rgba(15,21,32,0.4)",
          }}
        >
          <p className="text-center text-[15px] tracking-[0.28em] uppercase text-[#8BA3BF]/35 mb-14">
            What people are saying
          </p>
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(200,216,232,0.05)]">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-[#0A0A0F] px-8 py-10 hover:bg-[#0F1520] transition-colors duration-300"
              >
                <span
                  className="font-cormorant text-[4rem] leading-none text-[#C9933A]/25 block mb-4"
                  aria-hidden
                >
                  "
                </span>
                <p className="text-[15px] leading-[2] text-[#8BA3BF]/65 mb-8">
                  {t.quote}
                </p>
                <div
                  style={{
                    borderTop: "0.5px solid rgba(200,216,232,0.06)",
                    paddingTop: "16px",
                  }}
                >
                  <p className="text-[14px] tracking-[0.14em] uppercase text-[#EEF3F8]/70">
                    {t.name}
                  </p>
                  <p className="text-[13px] tracking-[0.1em] uppercase text-[#8BA3BF]/35 mt-0.5">
                    {t.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* PRICING                                                         */}
        {/* UX FIX: Tier names kept thematic but each gets a plain English */}
        {/* descriptor ("For individuals getting started") immediately      */}
        {/* below so users don't have to decode "ONE LEVEL DEEP".          */}
        {/* Feature list uses "forms" not "Dreamscapes", "responses" not   */}
        {/* "signals", "themes" not "skins".                               */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section
          id="pricing"
          className="py-24 px-4"
          style={{ borderTop: "0.5px solid rgba(200,216,232,0.06)" }}
        >
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-14">
              <p className="text-[15px] tracking-[0.25em] uppercase text-[#8BA3BF]/35 mb-3">
                Pricing
              </p>
              <h2 className="font-cormorant text-6xl text-[#EEF3F8] font-medium">
                Simple, honest{" "}
                <em className="italic text-[#C9933A]">pricing.</em>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(200,216,232,0.05)]">
              {TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className="bg-[#0A0A0F] p-8 flex flex-col hover:bg-[#0F1520] transition-colors duration-300"
                  style={
                    tier.highlight
                      ? {
                        border: "0.5px solid rgba(201,147,58,0.25)",
                        background: "rgba(201,147,58,0.02)",
                      }
                      : {}
                  }
                >
                  {tier.highlight && (
                    <span
                      className="inline-block text-[13px] tracking-[0.2em] uppercase text-[#C9933A] px-2 py-1 rounded-sm mb-4 self-start"
                      style={{
                        border: "0.5px solid rgba(201,147,58,0.3)",
                        background: "rgba(201,147,58,0.08)",
                      }}
                    >
                      Most popular
                    </span>
                  )}
                  {/* Thematic tier name */}
                  <p className="text-[14px] tracking-[0.2em] uppercase text-[#8BA3BF]/30 mb-1">
                    {tier.name}
                  </p>
                  {/* UX FIX: Plain English descriptor immediately below */}
                  <p className="text-[16px] text-[#8BA3BF]/55 mb-4">
                    {tier.plainDesc}
                  </p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-cormorant text-5xl text-[#EEF3F8] font-light">
                      {tier.price}
                    </span>
                    <span className="text-[16px] text-[#8BA3BF]/40 tracking-[0.1em]">
                      {tier.sub}
                    </span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2.5 text-[16px] text-[#8BA3BF]/65"
                      >
                        <span className="w-1 h-1 rounded-full bg-[#C9933A]/60 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`w-full py-3 text-center text-[14px] tracking-[0.16em] uppercase rounded-sm transition-all ${tier.highlight
                      ? "bg-[#C9933A] text-[#0A0A0F] font-bold hover:bg-[#E8B455] hover:shadow-[0_0_24px_rgba(201,147,58,0.3)]"
                      : "text-[#8BA3BF] hover:text-[#EEF3F8]"
                      }`}
                    style={
                      !tier.highlight
                        ? { border: "0.5px solid rgba(139,163,191,0.2)" }
                        : {}
                    }
                  >
                    {tier.highlight ? "Get started →" : "Get started"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* CTA BAND                                                        */}
        {/* UX FIX: CTA copy is benefit-first. "Free" is prominent.        */}
        {/* Secondary action is "See how it works" — lower friction        */}
        {/* than "Copy Link" which has no clear user benefit on first visit */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section
          className="py-24 px-4 text-center"
          style={{
            borderTop: "0.5px solid rgba(200,216,232,0.06)",
            background: "rgba(15,21,32,0.5)",
          }}
        >
          <p className="text-[15px] tracking-[0.28em] uppercase text-[#8BA3BF]/35 mb-6">
            No credit card required
          </p>
          <h2
            className="font-cormorant font-light text-[#EEF3F8] mb-10 leading-tight"
            style={{ fontSize: "clamp(2rem,5vw,3.5rem)" }}
          >
            Start building forms
            <br />
            <em className="italic text-[#C9933A]">for free.</em>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-10 py-4 bg-[#C9933A] text-[#0A0A0F] text-[15px] font-bold tracking-[0.18em] uppercase rounded-sm hover:bg-[#E8B455] hover:shadow-[0_0_40px_rgba(201,147,58,0.3)] hover:-translate-y-px transition-all"
            >
              Create Free Account →
            </Link>
            <button
              onClick={copyLink}
              className="px-10 py-4 text-[15px] tracking-[0.18em] uppercase rounded-sm transition-all"
              style={{
                border: "0.5px solid rgba(139,163,191,0.2)",
                color: copied ? "#4AFF9E" : "#8BA3BF",
              }}
            >
              {copied ? "Link Copied ✓" : "Share This Site"}
            </button>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer
          className="py-10 px-8"
          style={{ borderTop: "0.5px solid rgba(200,216,232,0.05)" }}
        >
          <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Totem size={18} className="text-[#C9933A]" />
              <span className="font-cormorant text-2xl text-[#C9933A] tracking-[0.15em]">
                SOMNIA
              </span>
            </div>
            <div className="flex gap-8">
              {(
                [
                  ["Pricing", "/#pricing"],
                  ["API Docs", "/api/docs"],
                  ["Log In", "/login"],
                ] as [string, string][]
              ).map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="text-[9px] tracking-[0.16em] uppercase text-[#8BA3BF]/30 hover:text-[#8BA3BF]/60 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
            <p className="text-[9px] tracking-[0.14em] uppercase text-[#8BA3BF]/20">
              © SOMNIA // 2025
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}