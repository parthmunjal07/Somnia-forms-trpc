"use client";

import React, { useState } from "react";
import { trpc } from "~/trpc/client";
import { Lock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface PasswordGateProps {
  slug: string;
  title: string;
  onUnlock: (password: string) => void;
}

export function PasswordGate({ slug, title, onUnlock }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const verifyMutation = trpc.forms.verifyPasswordGate.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Subconscious access granted.");
        // Store in sessionStorage to bypass gate during session
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(`somnia_form_unlocked_${slug}`, password);
        }
        onUnlock(password);
      } else {
        setErrorMsg("Incorrect passcode. Access rejected.");
        toast.error("Incorrect passcode.");
      }
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to verify passcode.");
      toast.error("Verification failed.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setErrorMsg("");
    verifyMutation.mutate({ slug, password });
  };

  return (
    <div className={`min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col items-center justify-center p-4 font-mono select-none`}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-3 pointer-events-none" />

      <div className={`max-w-md w-full border p-8 rounded-lg bg-[var(--theme-surface)] border-[var(--theme-border)] shadow-[0_0_15px_var(--theme-border)]  space-y-6 animate-in fade-in zoom-in-95 duration-500`}>
        <div className="text-center space-y-2">
          <div className={`mx-auto w-12 h-12 rounded border border-current/20 flex items-center justify-center text-[var(--theme-accent)] bg-current/5`}>
            <Lock size={18} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-light font-cormorant tracking-wide">
            {title || "Protected Layer"}
          </h2>
          <p className="text-[9px] uppercase tracking-[0.2em] opacity-50">
            SUB-LEVEL PASSPHRASE REQUIRED
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] opacity-60 uppercase tracking-wider block font-semibold">
              Secret Passphrase
            </label>
            <input
              type="password"
              required
              placeholder="Enter passcode to synchronize..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={verifyMutation.isPending}
              className={`w-full rounded border px-3 py-2 text-xs focus:outline-none transition-all bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)] focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)]`}
            />
            {errorMsg && (
              <div className="text-[9px] text-red-500 mt-1.5 uppercase tracking-wider font-semibold flex items-center space-x-1">
                <ShieldAlert size={10} />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={verifyMutation.isPending}
            className={`w-full py-2.5 text-xs font-semibold uppercase tracking-widest border transition-all cursor-pointer bg-[var(--theme-accent)] text-[var(--theme-bg)] border-[var(--theme-accent)] hover:opacity-90`}
          >
            {verifyMutation.isPending ? "Verifying..." : "Verify Passcode"}
          </button>
        </form>
      </div>
    </div>
  );
}
