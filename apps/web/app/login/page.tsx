"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "~/lib/store";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { env } from "~/env.js";
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

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("tab") === "register") {
        setActiveTab("register");
      }
      const err = urlParams.get("error");
      if (err) {
        toast.error(decodeURIComponent(err));
      }
      if (urlParams.get("verified") === "true") {
        toast.success("Identity verified successfully. You may now login.");
      }
      
      // Clean up URL parameters after handling them
      if (err || urlParams.get("verified") || urlParams.get("tab")) {
        const url = new URL(window.location.href);
        url.search = "";
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success("Connection established. Welcome back, Architect.");
      setUser(data.user);
      router.push("/dashboard");
    },
    onError: (error) => {
      const zodMessage = (error.data as any)?.zodError?.fieldErrors &&
        Object.values((error.data as any).zodError.fieldErrors).flat()[0];
      toast.error((zodMessage as string) || error.message || "Failed to establish dream state connection.");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Identity established. Check your console/email for verification.");
      setActiveTab("login");
      setPassword("");
    },
    onError: (error) => {
      const zodMessage = (error.data as any)?.zodError?.fieldErrors &&
        Object.values((error.data as any).zodError.fieldErrors).flat()[0];
      toast.error((zodMessage as string) || error.message || "Failed to forge new identity.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "login") {
      loginMutation.mutate({ email, password });
    } else {
      registerMutation.mutate({ fullName, email, password });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[#0A0A0F] text-[#C8D8E8] font-mono select-none overflow-hidden px-4 selection:bg-[#C9933A]/20 selection:text-[#E8B455]">

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

      <Link href="/" className="absolute top-8 left-8 z-50 flex items-center gap-3 hover:opacity-80 transition-opacity">
        <Totem size={18} className="text-[#C9933A]" />
        <span className="font-cormorant text-2xl text-[#C9933A] tracking-[0.15em]">SOMNIA</span>
      </Link>

      {/* Main glassmorphic container */}
      <div
        className="relative w-full max-w-md p-6 sm:p-8 rounded-sm z-10 transition-all duration-300 shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
        style={{
          background: "rgba(10,10,15,0.75)",
          backdropFilter: "blur(12px)",
          border: "0.5px solid rgba(200,216,232,0.1)",
          boxShadow: "0 0 0 0.5px rgba(201,147,58,0.08)",
        }}
      >

        {/* Title */}
        <div className="text-center mb-8 mt-2 sm:mt-0">
          <h1 className="text-3xl sm:text-4xl tracking-[0.15em] text-[#EEF3F8] font-cormorant select-none font-medium mb-1">
            {activeTab === "login" ? "Enter the Dream" : "Initialize Identity"}
          </h1>
          <p className="text-[14px] uppercase text-[#8BA3BF]/60 tracking-[0.25em]">
            The Workshop / Architect Setup
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex mb-8 relative text-[15px] uppercase tracking-[0.2em]">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`flex-1 pb-4 text-center transition-all duration-200 ${activeTab === "login" ? "text-[#C9933A]" : "text-[#8BA3BF]/40 hover:text-[#8BA3BF]"
              }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={`flex-1 pb-4 text-center transition-all duration-200 ${activeTab === "register" ? "text-[#C9933A]" : "text-[#8BA3BF]/40 hover:text-[#8BA3BF]"
              }`}
          >
            Register ID
          </button>

          {/* Active Tab Indicator Bar */}
          <div className="absolute bottom-0 left-0 w-full h-[0.5px] bg-[rgba(200,216,232,0.1)]">
            <div
              className="h-[1.5px] bg-[#C9933A] transition-all duration-300"
              style={{
                width: "50%",
                transform: activeTab === "login" ? "translateX(0)" : "translateX(100%)",
                boxShadow: "0 0 8px rgba(201,147,58,0.5)"
              }}
            />
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === "register" && (
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-[14px] text-[#8BA3BF] tracking-[0.2em] block uppercase">
                Full Name / Alias
              </label>
              <input
                id="fullName"
                type="text"
                required
                disabled={isLoading}
                placeholder="e.g. Cobb"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-[#EEF3F8] placeholder-[#8BA3BF]/30 text-[15px] tracking-wide focus:outline-none transition-all px-4 py-3 rounded-sm"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "0.5px solid rgba(200,216,232,0.1)",
                }}
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-[14px] text-[#8BA3BF] tracking-[0.2em] block uppercase">
              Dreamer Identity (Email)
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={isLoading}
              placeholder="alias@somnia.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-[#EEF3F8] placeholder-[#8BA3BF]/30 text-[15px] tracking-wide focus:outline-none transition-all px-4 py-3 rounded-sm"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "0.5px solid rgba(200,216,232,0.1)",
              }}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-[14px] text-[#8BA3BF] tracking-[0.2em] block uppercase">
              Passphrase (Password)
            </label>
            <input
              id="password"
              type="password"
              required
              disabled={isLoading}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-[#EEF3F8] placeholder-[#8BA3BF]/30 text-[15px] tracking-wide focus:outline-none transition-all px-4 py-3 rounded-sm"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "0.5px solid rgba(200,216,232,0.1)",
              }}
            />
            {activeTab === "register" && (
              <p className="text-[12px] text-[#8BA3BF]/50 mt-2 leading-relaxed tracking-wider uppercase">
                Must contain at least 8 characters, an uppercase letter, and a number.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#C9933A] text-[#0A0A0F] text-[15px] font-bold tracking-[0.2em] uppercase rounded-sm hover:bg-[#E8B455] transition-all hover:shadow-[0_0_30px_rgba(201,147,58,0.25)] hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isLoading
              ? "Connecting..."
              : activeTab === "login"
                ? "Establish Login"
                : "Register Identity"}
          </button>
        </form>

        <div className="flex items-center gap-3 w-full text-[#8BA3BF]/40 text-[12px] tracking-[0.2em] my-6 uppercase">
          <div className="flex-1 h-[0.5px] bg-[rgba(200,216,232,0.1)]"></div>
          <span>Or</span>
          <div className="flex-1 h-[0.5px] bg-[rgba(200,216,232,0.1)]"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3 text-[15px] tracking-[0.2em] uppercase rounded-sm transition-all text-[#8BA3BF] hover:text-[#EEF3F8] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ border: "0.5px solid rgba(139,163,191,0.2)" }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google Link
        </button>

        {/* Bottom micro-info */}
        <div className="mt-8 pt-4 flex items-center justify-between text-[12px] tracking-[0.2em] text-[#8BA3BF]/40 uppercase" style={{ borderTop: "0.5px solid rgba(200,216,232,0.1)" }}>
          <span>Layer 0 / Reality</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4AFF9E] animate-pulse" />
            <span>Totem Active</span>
          </div>
        </div>
      </div>
    </main>
  );
}
