"use client";

import React, { useState } from "react";
import { trpc } from "~/trpc/client";
import { Lock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface PasswordGateProps {
  slug: string;
  title: string;
  styles: {
    bg: string;
    cardBg: string;
    input: string;
    btn: string;
    accent: string;
    glow: string;
  };
  onUnlock: (password: string) => void;
}

export function PasswordGate({ slug, title, styles, onUnlock }: PasswordGateProps) {
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
    <div className={`min-h-screen ${styles.bg} flex flex-col items-center justify-center p-4 font-mono select-none`}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-3 pointer-events-none" />

      <div className={`max-w-md w-full border p-8 rounded-lg ${styles.cardBg} ${styles.glow} space-y-6 animate-in fade-in zoom-in-95 duration-500`}>
        <div className="text-center space-y-2">
          <div className={`mx-auto w-12 h-12 rounded border border-current/20 flex items-center justify-center ${styles.accent} bg-current/5`}>
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
              className={`w-full rounded border px-3 py-2 text-xs focus:outline-none transition-all ${styles.input}`}
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
            className={`w-full py-2.5 text-xs font-semibold uppercase tracking-widest border transition-all cursor-pointer ${styles.btn}`}
          >
            {verifyMutation.isPending ? "Verifying..." : "Verify Passcode"}
          </button>
        </form>
      </div>
    </div>
  );
}
