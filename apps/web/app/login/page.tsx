"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "~/lib/store";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { env } from "~/env.js";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success("Connection established. Welcome back, Architect.");
      setUser(data.user);
      router.push("/dashboard");
    },
    onError: (error) => {
      // Surface the first Zod validation issue if available, otherwise use the server message
      const zodMessage = (error.data as any)?.zodError?.fieldErrors &&
        Object.values((error.data as any).zodError.fieldErrors).flat()[0];
      toast.error((zodMessage as string) || error.message || "Failed to establish dream state connection.");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Identity established. Check your console/email for verification.");
      setActiveTab("login");
      // Pre-fill email and clear password
      setPassword("");
    },
    onError: (error) => {
      // Surface the first Zod validation issue if available (e.g. password strength rules)
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
    const baseUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-stone-950 text-stone-200 font-mono select-none overflow-hidden px-4">
      {/* Background blueprint grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />
      
      {/* Background soft glowing orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] rounded-full bg-emerald-950/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[25rem] h-[25rem] rounded-full bg-amber-950/10 blur-[100px] pointer-events-none" />

      {/* Main glassmorphic container */}
      <div className="relative w-full max-w-md bg-stone-900/50 backdrop-blur-xl border border-stone-800 rounded-lg p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 transition-all duration-300">
        
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl tracking-[0.2em] font-light text-stone-100 font-cormorant select-none">
            SOMNIA
          </h1>
          <p className="text-[10px] uppercase text-stone-500 tracking-[0.3em] mt-2">
            The Workshop / Dreamscapes Builder
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex border-b border-stone-800 mb-8 text-xs font-semibold relative">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`flex-1 pb-3 text-center tracking-widest transition-all duration-200 ${
              activeTab === "login" ? "text-emerald-400 font-bold" : "text-stone-500 hover:text-stone-300"
            }`}
          >
            CONNECT [LOG IN]
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={`flex-1 pb-3 text-center tracking-widest transition-all duration-200 ${
              activeTab === "register" ? "text-amber-400 font-bold" : "text-stone-500 hover:text-stone-300"
            }`}
          >
            FORGE ID [REGISTER]
          </button>
          
          {/* Active Tab Indicator Bar */}
          <div
            className={`absolute bottom-0 h-[2px] bg-gradient-to-r transition-all duration-300 ${
              activeTab === "login"
                ? "left-0 w-1/2 from-emerald-500 to-teal-400 shadow-[0_0_8px_#10b981]"
                : "left-1/2 w-1/2 from-amber-500 to-orange-400 shadow-[0_0_8px_#f59e0b]"
            }`}
          />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === "register" && (
            <div className="space-y-1">
              <label htmlFor="fullName" className="text-[10px] text-stone-400 tracking-wider block uppercase">
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
                className="w-full bg-stone-950/60 border border-stone-800 rounded px-3 py-2 text-stone-200 placeholder-stone-700 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
              />
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="text-[10px] text-stone-400 tracking-wider block uppercase">
              Dreamer Identity (Email)
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={isLoading}
              placeholder="alias@somnia.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-stone-950/60 border border-stone-800 rounded px-3 py-2 text-stone-200 placeholder-stone-700 text-sm focus:outline-none focus:ring-1 transition-all ${
                activeTab === "login"
                  ? "focus:ring-emerald-500 focus:border-emerald-500"
                  : "focus:ring-amber-500 focus:border-amber-500"
              }`}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-[10px] text-stone-400 tracking-wider block uppercase">
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
              className={`w-full bg-stone-950/60 border border-stone-800 rounded px-3 py-2 text-stone-200 placeholder-stone-700 text-sm focus:outline-none focus:ring-1 transition-all ${
                activeTab === "login"
                  ? "focus:ring-emerald-500 focus:border-emerald-500"
                  : "focus:ring-amber-500 focus:border-amber-500"
              }`}
            />
            {activeTab === "register" && (
              <p className="text-[9px] text-stone-600 mt-1 leading-normal">
                Must contain at least 8 characters, an uppercase letter, and a number.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 rounded text-xs font-semibold tracking-[0.2em] transition-all duration-300 relative overflow-hidden group border select-none cursor-pointer bg-stone-950/40 hover:bg-stone-900/50 text-stone-300 border-stone-800/60 hover:border-stone-500 shadow-[0_0_15px_rgba(255,255,255,0.02)] flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="relative z-10 uppercase">Sign in with Google</span>
          </button>
          
          <div className="flex items-center gap-3 w-full text-stone-600 text-[10px] tracking-widest my-2 uppercase">
            <div className="flex-1 h-px bg-stone-800"></div>
            <span>or</span>
            <div className="flex-1 h-px bg-stone-800"></div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded text-xs font-semibold tracking-[0.2em] transition-all duration-300 relative overflow-hidden group border select-none cursor-pointer ${
              activeTab === "login"
                ? "bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border-emerald-800/60 hover:border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                : "bg-amber-950/40 hover:bg-amber-900/50 text-amber-400 border-amber-800/60 hover:border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
            }`}
          >
            <span className="relative z-10 uppercase">
              {isLoading
                ? "Establishing connection..."
                : activeTab === "login"
                ? "Enter Limbo"
                : "Initialize Projection"}
            </span>
          </button>
        </form>

        {/* Bottom micro-info */}
        <div className="mt-8 pt-6 border-t border-stone-800/60 flex items-center justify-between text-[9px] text-stone-600">
          <span>REALITY INDEX: 1.000 (SECURE)</span>
          <span className="animate-pulse">TOTEM STATE: SPINNING</span>
        </div>
      </div>
    </main>
  );
}
