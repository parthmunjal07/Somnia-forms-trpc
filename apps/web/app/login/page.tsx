"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "~/lib/store";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";

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
      toast.error(error.message || "Failed to establish dream state connection.");
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
      toast.error(error.message || "Failed to forge new identity.");
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
