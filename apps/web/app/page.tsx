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
      speedX: (Math.random() - 0.5) * 0.6,
      speedY: (Math.random() - 0.5) * 0.6,
      opacity: Math.random() * 0.06 + 0.02,
      gold: Math.random() > 0.85,
    }));

    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        const color = p.gold ? `rgba(201,147,58,${p.opacity})` : `rgba(60,70,90,${p.opacity})`;
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
function Totem({ size = 24, className = "" }: { size?: number; className?: string }) {
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
      <path d="M12 2V5M12 19V22M2 12H5M19 12H22" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const LAYERS = [
  {
    num: "LAYER 01",
    title: "Build",
    subtitle: "THE WORKSHOP",
    desc: "Drag anchors into place. Configure field types, validation rules, themes and conditional logic. Preview live before you deploy.",
    stat: "9 field types",
  },
  {
    num: "LAYER 02",
    title: "Share",
    subtitle: "THE DREAMSCAPE",
    desc: "Publish with a custom slug. Distribute QR codes or unlisted links. Gate with passwords. Set response caps and expiry dates.",
    stat: "Public or unlisted",
  },
  {
    num: "LAYER 03",
    title: "Analyze",
    subtitle: "THE PROJECTION",
    desc: "Track signals in real time. Funnel charts show anchor-level drop-off. Export CSV. Filter by date range and completion.",
    stat: "Live analytics",
  },
];

const ROLES = [
  {
    code: "THE_ARCHITECT",
    label: "Creator",
    color: "#C9933A",
    border: "rgba(201,147,58,0.3)",
    bg: "rgba(201,147,58,0.05)",
    desc: "Owns the dreamscape. Builds, publishes, reads every signal.",
  },
  {
    code: "THE_FORGER",
    label: "Collaborator",
    color: "#4A9EFF",
    border: "rgba(74,158,255,0.3)",
    bg: "rgba(74,158,255,0.05)",
    desc: "Edits anchors and views responses. Cannot publish or delete.",
  },
  {
    code: "THE_SHADE",
    label: "Observer",
    color: "#8BA3BF",
    border: "rgba(139,163,191,0.3)",
    bg: "rgba(139,163,191,0.05)",
    desc: "Read-only access. Can view signals, nothing else.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Somnia replaced every form tool we had. The dreamscape metaphor isn't just aesthetic — it changes how respondents engage.",
    name: "Ariadne K.",
    role: "Product Architect",
  },
  {
    quote:
      "I deployed a multi-layer intake form in under ten minutes. The analytics alone are worth the tier upgrade.",
    name: "Robert F.",
    role: "Extraction Lead",
  },
  {
    quote:
      "Nothing else has the same depth of role-based access. THE_FORGER / THE_SHADE split is exactly what our team needed.",
    name: "Yusuf M.",
    role: "Team Dreamspace",
  },
];

const TIERS = [
  {
    name: "ONE LEVEL DEEP",
    price: "Free",
    sub: "Forever",
    highlight: false,
    features: ["3 Dreamscapes", "100 signals / month", "3 layer skins", "Basic projection"],
  },
  {
    name: "FULL EXTRACTION",
    price: "$12",
    sub: "/ month",
    highlight: true,
    features: ["Unlimited Dreamscapes", "10,000 signals / month", "All 8 skins", "Advanced projection", "THE_FORGER access", "CSV export", "Custom slugs"],
  },
  {
    name: "SHARED DREAMSPACE",
    price: "$49",
    sub: "/ month",
    highlight: false,
    features: ["Everything in Full Extraction", "Unlimited signals", "10 collaborators", "THE_SHADE access", "Password protection", "Priority support"],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [copied, setCopied] = useState(false);

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
      <header
        className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3"
        style={{ background: "rgba(10,10,15,0.85)", backdropFilter: "blur(12px)", borderBottom: "0.5px solid rgba(200,216,232,0.07)" }}
      >
        <div className="flex items-center gap-3">
          <Totem size={22} className="text-[#C9933A] animate-[spin_10s_linear_infinite]" />
          <span className="font-cormorant text-2xl text-[#C9933A] tracking-[0.15em]">SOMNIA</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {[["The Workshop", "/dashboard"], ["Constructs", "/pricing"], ["Limbo", "/api/docs"]].map(([label, href]) => (
            <Link
              key={label}
              href={href ?? "/"}
              className="text-[11px] tracking-[0.16em] uppercase text-[#8BA3BF] hover:text-[#EEF3F8] transition-colors duration-200"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[11px] tracking-[0.14em] uppercase text-[#8BA3BF] hover:text-[#EEF3F8] transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 bg-[#C9933A] text-[#0A0A0F] text-[10px] font-bold tracking-[0.16em] uppercase rounded-sm hover:bg-[#E8B455] transition-all hover:shadow-[0_0_20px_rgba(201,147,58,0.3)]"
          >
            Plant a Dream
          </Link>
        </div>
      </header>

      <div className="relative z-10 pt-20">

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* HERO                                                           */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section className="min-h-screen flex flex-col justify-center items-center px-4 text-center max-w-5xl mx-auto">
          <div className="mb-8">
            <span
              className="inline-flex items-center gap-2 text-[9px] font-medium tracking-[0.22em] uppercase text-[#C9933A] px-3 py-1.5 rounded-sm"
              style={{ border: "0.5px solid rgba(201,147,58,0.35)", background: "rgba(201,147,58,0.05)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9933A] animate-pulse" />
              Layer 0 — Reality
            </span>
          </div>

          <h1 className="font-cormorant font-medium text-[#EEF3F8] tracking-tight mb-8 leading-[1.04]"
            style={{ fontSize: "clamp(3.2rem,8vw,6rem)" }}>
            Plant Your First<br />
            <em className="italic text-[#C9933A]">Dream.</em>
          </h1>

          <p className="text-[16px] text-[#8BA3BF] tracking-[0.18em] uppercase leading-[2.2] max-w-3xl mb-14">
            Architect powerful, multi-layered forms. Share signals with Forgers and Shades.
            Read the projection. Control the dreamscape.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <Link
              href="/dashboard"
              className="group px-10 py-4 bg-[#C9933A] text-[#0A0A0F] text-[15px] font-bold tracking-[0.1em] uppercase rounded-sm hover:bg-[#E8B455] transition-all hover:shadow-[0_0_40px_rgba(201,147,58,0.3)] hover:-translate-y-px active:translate-y-0 flex items-center gap-2"
            >
              ENTER THE DREAM
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/pricing"
              className="px-10 py-4 text-[#8BA3BF] text-[15px] tracking-[0.1em] uppercase rounded-sm hover:text-[#EEF3F8] transition-all"
              style={{ border: "0.5px solid rgba(139,163,191,0.2)" }}
            >
              VIEW TIERS
            </Link>
          </div>

          {/* Mock form card */}
          <div className="w-full max-w-md text-left" style={{ filter: "drop-shadow(0 24px 64px rgba(0,0,0,0.6))" }}>
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
                style={{ borderBottom: "0.5px solid rgba(200,216,232,0.07)", background: "rgba(255,255,255,0.015)" }}
              >
                <div className="flex gap-1.5">
                  {[0.3, 0.18, 0.1].map((o, i) => (
                    <span key={i} className="w-2 h-2 rounded-full bg-[#8BA3BF]" style={{ opacity: o }} />
                  ))}
                </div>
                <span className="text-[13px] tracking-[0.18em] uppercase text-[#8BA3BF]/40">
                  The Extraction — Layer 2
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#4AFF9E] animate-pulse" />
                  <span className="text-[13px] tracking-[0.1em] uppercase text-[#4AFF9E]/60">Deployed</span>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="font-cormorant font-light text-[#EEF3F8] text-2xl leading-snug mb-4">
                  What drives your deepest ambitions?
                </p>
                <div
                  className="w-full px-3.5 py-3 text-[16px] text-[#8BA3BF]/40 rounded-sm mb-1"
                  style={{ background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(200,216,232,0.1)" }}
                >
                  Describe your reality...
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <span className="text-[13px] tracking-[0.12em] uppercase text-[#8BA3BF]/30 whitespace-nowrap">Layer 1 / 3</span>
                  <div className="flex-1 h-px bg-[#8BA3BF]/10 overflow-hidden rounded-full">
                    <div className="h-full w-1/3 bg-[#C9933A]" style={{ boxShadow: "0 0 6px rgba(201,147,58,0.5)" }} />
                  </div>
                  <span className="text-[13px] tracking-[0.12em] uppercase text-[#C9933A]/60">33%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* LAYERS                                                          */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section
          className="py-24 max-w-[1200px] mx-auto px-4"
          style={{ borderTop: "0.5px solid rgba(200,216,232,0.06)" }}
        >
          <div className="flex justify-between items-end mb-12 pb-4" style={{ borderBottom: "0.5px solid rgba(200,216,232,0.06)" }}>
            <div>
              <h2 className="font-cormorant text-4xl text-[#EEF3F8] font-medium">How It Works</h2>
              <p className="text-[15px] tracking-[0.2em] uppercase text-[#8BA3BF]/50 mt-1">Three layers. One extraction.</p>
            </div>
            <span className="text-[15px] tracking-[0.15em] uppercase text-[#C9933A]/60">03 LAYERS</span>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ border: "0.5px solid rgba(200,216,232,0.06)" }}
          >
            {LAYERS.map((layer, i) => (
              <div
                key={layer.num}
                className="p-8 group hover:bg-[#0F1520] transition-colors duration-300"
                style={{ borderRight: i < 2 ? "0.5px solid rgba(200,216,232,0.06)" : "none" }}
              >
                <p className="text-[14px] tracking-[0.22em] uppercase text-[#C9933A]/50 mb-1 group-hover:text-[#C9933A]/80 transition-colors">
                  {layer.num}
                </p>
                <p className="text-[13px] tracking-[0.18em] uppercase text-[#8BA3BF]/30 mb-4">{layer.subtitle}</p>
                <h3 className="font-cormorant text-3xl text-[#EEF3F8] font-medium mb-3">{layer.title}</h3>
                <p className="text-[15px] leading-[1.9] text-[#8BA3BF]/55 mb-6">{layer.desc}</p>
                <span
                  className="text-[14px] tracking-[0.15em] uppercase text-[#C9933A] px-2 py-1 rounded-sm"
                  style={{ border: "0.5px solid rgba(201,147,58,0.25)", background: "rgba(201,147,58,0.04)" }}
                >
                  {layer.stat}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* RBAC ROLES                                                      */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section
          className="py-24 px-4"
          style={{ borderTop: "0.5px solid rgba(200,216,232,0.06)", background: "rgba(15,21,32,0.4)" }}
        >
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-12 text-center">
              <p className="text-[14px] tracking-[0.25em] uppercase text-[#8BA3BF]/35 mb-3">Role Architecture</p>
              <h2 className="font-cormorant text-5xl text-[#EEF3F8] font-medium">
                Every team member<br />
                <em className="italic text-[#C9933A]">has a role.</em>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(200,216,232,0.05)]">
              {ROLES.map((role) => (
                <div
                  key={role.code}
                  className="bg-[#0A0A0F] p-8 group hover:bg-[#0F1520] transition-colors duration-300"
                >
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm mb-6"
                    style={{ border: `0.5px solid ${role.border}`, background: role.bg }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: role.color }} />
                    <span className="text-[14px] tracking-[0.18em] uppercase" style={{ color: role.color }}>
                      {role.code}
                    </span>
                  </div>
                  <h3 className="font-cormorant text-3xl text-[#EEF3F8] mb-3">{role.label}</h3>
                  <p className="text-[15px] leading-[1.9] text-[#8BA3BF]/55">{role.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* STATS                                                           */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section
          className="py-24 px-4"
          style={{ borderTop: "0.5px solid rgba(200,216,232,0.06)" }}
        >
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-cormorant text-6xl text-[#EEF3F8] font-medium mb-6 leading-tight">
                Technical<br /><em className="italic text-[#C9933A]">Integrity</em>
              </h2>
              <p className="text-[14] text-[#8BA3BF]/60 leading-[1.9] mb-8">
                Built on tRPC, Drizzle ORM and Zod. Every API call is type-safe end-to-end.
                Dynamic Zod schema compilation means your validation rules live in the database —
                not hardcoded in your frontend.
              </p>
              <ul className="space-y-3 text-[15px] text-[#C8D8E8]/70">
                {[
                  "Type-safe API via tRPC + Zod",
                  "Dynamic schema compilation per form",
                  "Cursor-based pagination everywhere",
                  "Rate limiting on all public endpoints",
                  "Graceful shutdown + DB pool drain",
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
              style={{ background: "rgba(200,216,232,0.06)", border: "0.5px solid rgba(200,216,232,0.08)" }}
            >
              {[
                { label: "Field Types", value: "9" },
                { label: "Layer Skins", value: "8" },
                { label: "API Endpoints", value: "24+" },
                { label: "Phase", value: "STBL" },
              ].map((s) => (
                <div key={s.label} className="bg-[#0A0A0F] p-8 hover:bg-[#0F1520] transition-colors">
                  <p className="text-[13px] tracking-[0.12em] uppercase text-[#C9933A]/60 mb-2">{s.label}</p>
                  <p className="font-mono text-5xl text-[#EEF3F8]">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TESTIMONIALS                                                    */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section
          className="py-24 px-4"
          style={{ borderTop: "0.5px solid rgba(200,216,232,0.06)", background: "rgba(15,21,32,0.4)" }}
        >
          <p className="text-center text-[16px] tracking-[0.28em] uppercase text-[#8BA3BF]/35 mb-14">
            Architects Speak
          </p>
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(200,216,232,0.05)]">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-[#0A0A0F] px-8 py-10 hover:bg-[#0F1520] transition-colors duration-300">
                <span
                  className="font-cormorant text-[4rem] leading-none text-[#C9933A]/25 block mb-4"
                  aria-hidden
                >"</span>
                <p className="text-[16px] leading-[2] text-[#8BA3BF]/65 mb-8">{t.quote}</p>
                <div style={{ borderTop: "0.5px solid rgba(200,216,232,0.06)", paddingTop: "16px" }}>
                  <p className="text-[15px] tracking-[0.14em] uppercase text-[#EEF3F8]/70">{t.name}</p>
                  <p className="text-[14px] tracking-[0.1em] uppercase text-[#8BA3BF]/35 mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* PRICING PREVIEW                                                 */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section
          className="py-24 px-4"
          style={{ borderTop: "0.5px solid rgba(200,216,232,0.06)" }}
        >
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-14">
              <p className="text-[14px] tracking-[0.25em] uppercase text-[#8BA3BF]/35 mb-3">Extraction Tiers</p>
              <h2 className="font-cormorant text-6xl text-[#EEF3F8] font-medium">
                Choose your <em className="italic text-[#C9933A]">depth.</em>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[rgba(200,216,232,0.05)]">
              {TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className="bg-[#0A0A0F] p-8 flex flex-col hover:bg-[#0F1520] transition-colors duration-300"
                  style={tier.highlight ? { border: "0.5px solid rgba(201,147,58,0.25)", background: "rgba(201,147,58,0.02)" } : {}}
                >
                  {tier.highlight && (
                    <span
                      className="inline-block text-[8px] tracking-[0.2em] uppercase text-[#C9933A] px-2 py-1 rounded-sm mb-4 self-start"
                      style={{ border: "0.5px solid rgba(201,147,58,0.3)", background: "rgba(201,147,58,0.08)" }}
                    >
                      Recommended
                    </span>
                  )}
                  <p className="text-[13px] tracking-[0.2em] uppercase text-[#8BA3BF]/40 mb-4">{tier.name}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-cormorant text-6xl text-[#EEF3F8] font-light">{tier.price}</span>
                    <span className="text-[14px] text-[#8BA3BF]/40 tracking-[0.1em]">{tier.sub}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-[15px] text-[#8BA3BF]/65">
                        <span className="w-1 h-1 rounded-full bg-[#C9933A]/60 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`w-full py-3 text-center text-[10px] tracking-[0.16em] uppercase rounded-sm transition-all ${tier.highlight
                      ? "bg-[#C9933A] text-[#0A0A0F] font-bold hover:bg-[#E8B455] hover:shadow-[0_0_24px_rgba(201,147,58,0.3)]"
                      : "text-[#8BA3BF] hover:text-[#EEF3F8] hover:border-[rgba(200,216,232,0.3)]"
                      }`}
                    style={!tier.highlight ? { border: "0.5px solid rgba(139,163,191,0.2)" } : {}}
                  >
                    {tier.highlight ? "Begin Extraction →" : "Get Started"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* CTA BAND                                                        */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section
          className="py-24 px-4 text-center"
          style={{ borderTop: "0.5px solid rgba(200,216,232,0.06)", background: "rgba(15,21,32,0.5)" }}
        >
          <p className="text-[16px] tracking-[0.28em] uppercase text-[#8BA3BF]/35 mb-6">Begin the extraction</p>
          <h2
            className="font-cormorant font-light text-[#EEF3F8] mb-10 leading-tight"
            style={{ fontSize: "clamp(2rem,5vw,3.5rem)" }}
          >
            Your first Dreamscape<br />
            <em className="italic text-[#C9933A]">is free.</em>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-10 py-4 bg-[#C9933A] text-[#0A0A0F] text-[15px] font-bold tracking-[0.18em] uppercase rounded-sm hover:bg-[#E8B455] hover:shadow-[0_0_40px_rgba(201,147,58,0.3)] hover:-translate-y-px transition-all"
            >
              Plant Your Dream →
            </Link>
            <button
              onClick={copyLink}
              className="px-10 py-4 text-[15px] tracking-[0.18em] uppercase rounded-sm transition-all"
              style={{ border: "0.5px solid rgba(139,163,191,0.2)", color: copied ? "#4AFF9E" : "#8BA3BF" }}
            >
              {copied ? "Link Copied " : "Copy Link"}
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
              <span className="font-cormorant text-2xl text-[#C9933A] tracking-[0.15em]">SOMNIA</span>
            </div>
            <div className="flex gap-8">
              {[["Pricing", "/pricing"], ["API Docs", "/api/docs"], ["Log In", "/login"]].map(([label, href]) => (
                <Link
                  key={label}
                  href={href ?? "/"}
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