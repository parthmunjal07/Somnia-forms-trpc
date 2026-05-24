"use client";

import React, { useState, useEffect } from "react";
import { trpc } from "~/trpc/client";
import { PasswordGate } from "./PasswordGate";
import { FormRunner } from "./FormRunner";
import { Totem } from "./Totem";
import { AlertCircle, EyeOff, ShieldAlert } from "lucide-react";
import { FieldDefinition } from "./FieldRenderer";

interface FormClientWrapperProps {
  slug: string;
  initialData: {
    form?: {
      id: string;
      title: string;
      theme: string;
      thankYouMessage: string | null;
      redirectUrl: string | null;
    };
    fields?: FieldDefinition[];
    unpublished?: boolean;
    expired?: boolean;
    capReached?: boolean;
    passwordRequired?: boolean;
  };
}

export function FormClientWrapper({ slug, initialData }: FormClientWrapperProps) {
  const [passcode, setPasscode] = useState<string | undefined>(undefined);
  const [checkingCache, setCheckingCache] = useState(initialData.passwordRequired ?? false);

  // Check sessionStorage on mount
  useEffect(() => {
    if (initialData.passwordRequired) {
      if (typeof window !== "undefined") {
        const cached = window.sessionStorage.getItem(`somnia_form_unlocked_${slug}`);
        if (cached) {
          setPasscode(cached);
        }
      }
      setCheckingCache(false);
    }
  }, [initialData.passwordRequired, slug]);

  // Client-side query if passcode is set
  const { data: clientData, isLoading: clientLoading, error: clientError } = trpc.forms.getBySlug.useQuery(
    { slug, password: passcode },
    {
      enabled: !!passcode,
      retry: false,
    }
  );

  // Determine which data to use (server initial data or client-loaded unlocked data)
  const currentData = clientData || initialData;
  const skin = currentData.form?.theme ?? "inception";

  const incrementViews = trpc.analytics.incrementViews.useMutation();

  useEffect(() => {
    if (currentData.form?.id) {
      incrementViews.mutate({ formId: currentData.form.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentData.form?.id]);

  // 1. Checking sessionStorage cache
  if (checkingCache) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center font-mono select-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
        <div className="relative flex flex-col items-center justify-center space-y-6">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border border-emerald-950 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin" />
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <span className="text-[10px] text-stone-500 uppercase tracking-[0.25em] animate-pulse">
            Verifying dream coordinates...
          </span>
        </div>
      </div>
    );
  }

  // 2. Client query is loading (after password verification)
  if (clientLoading) {
    return (
      <div className={`skin-${skin} ${"min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col items-center justify-center font-mono select-none"}`} style={{ background: "var(--theme-bg)" }}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-3 pointer-events-none" />
        <div className="relative flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 flex items-center justify-center">
            <Totem status="spinning" />
          </div>
          <span className="text-[10px] opacity-60 uppercase tracking-[0.25em] animate-pulse">
            Constructing projection variables...
          </span>
        </div>
      </div>
    );
  }

  // 3. Client query error (passcode was incorrect or revoked)
  if (clientError || currentData.passwordRequired && passcode && clientData?.passwordRequired) {
    return (
      <div className={`skin-${skin} ${"min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col items-center justify-center p-4 font-mono select-none"}`} style={{ background: "var(--theme-bg)" }}>
        <div className={`max-w-md w-full border p-8 rounded-lg bg-[var(--theme-surface)] border-[var(--theme-border)] shadow-[0_0_15px_var(--theme-border)]  text-center space-y-6 animate-in fade-in duration-500`}>
          <div className="mx-auto w-12 h-12 rounded border border-red-950 bg-red-950/10 flex items-center justify-center text-red-500">
            <ShieldAlert size={20} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-light font-cormorant tracking-wider uppercase text-red-400">
              Access Revoked
            </h2>
            <p className="text-xs opacity-60 uppercase tracking-widest leading-relaxed">
              Your passcode state was rejected. Try clearing your credentials.
            </p>
          </div>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.sessionStorage.removeItem(`somnia_form_unlocked_${slug}`);
              }
              setPasscode(undefined);
            }}
            className={`w-full py-2.5 text-xs font-semibold uppercase tracking-widest border transition-all cursor-pointer bg-[var(--theme-accent)] text-[var(--theme-bg)] border-[var(--theme-accent)] hover:opacity-90`}
          >
            Clear and retry
          </button>
        </div>
      </div>
    );
  }

  // 4. Status Pages rendered inside Wrapper with the correct active skin

  // A. Unpublished state
  if (currentData.unpublished) {
    return (
      <div className={`skin-${skin} ${"min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col items-center justify-center p-4 font-mono select-none"}`} style={{ background: "var(--theme-bg)" }}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-3 pointer-events-none" />
        <div className={`max-w-md w-full border p-8 rounded-lg text-center bg-[var(--theme-surface)] border-[var(--theme-border)] shadow-[0_0_15px_var(--theme-border)]  space-y-6 animate-in fade-in duration-500`}>
          <div className={`mx-auto w-12 h-12 rounded border border-current/20 bg-current/5 flex items-center justify-center text-[var(--theme-accent)]`}>
            <EyeOff size={20} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-light font-cormorant tracking-wider uppercase">
              Dreamscape Projecting...
            </h2>
            <p className="text-xs opacity-60 uppercase tracking-widest leading-relaxed">
              This subconscious architectural layer has not been published yet. The architect is still building its foundations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // B. Expired state
  if (currentData.expired) {
    return (
      <div className={`skin-${skin} ${"min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col items-center justify-center p-4 font-mono select-none"}`} style={{ background: "var(--theme-bg)" }}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-3 pointer-events-none" />
        <div className={`max-w-md w-full border p-8 rounded-lg text-center bg-[var(--theme-surface)] border-[var(--theme-border)] shadow-[0_0_15px_var(--theme-border)]  space-y-6 animate-in fade-in duration-500`}>
          <div className="flex justify-center">
            <Totem status="stopped" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-light font-cormorant tracking-wider uppercase">
              The Dream Has Ended
            </h2>
            <p className="text-xs opacity-60 uppercase tracking-widest leading-relaxed">
              This subconscious layer has expired. The temporal coordinates have shifted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // C. Cap/Limit Reached state
  if (currentData.capReached) {
    return (
      <div className={`skin-${skin} ${"min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col items-center justify-center p-4 font-mono select-none"}`} style={{ background: "var(--theme-bg)" }}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-3 pointer-events-none" />
        <div className={`max-w-md w-full border p-8 rounded-lg text-center bg-[var(--theme-surface)] border-[var(--theme-border)] shadow-[0_0_15px_var(--theme-border)]  space-y-6 animate-in fade-in duration-500`}>
          <div className="flex justify-center">
            <Totem status="stopped" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-light font-cormorant tracking-wider uppercase">
              Limbo Saturation
            </h2>
            <p className="text-xs opacity-60 uppercase tracking-widest leading-relaxed">
              The dreamscape is full. No more variables can be injected.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // D. Password Gate state
  if (currentData.passwordRequired && !passcode) {
    return (
      <PasswordGate
        slug={slug}
        title={currentData.form?.title || "Protected Layer"}
        onUnlock={(pwd) => setPasscode(pwd)}
      />
    );
  }

  // 5. Active form state (unlocked and loaded)
  if (currentData.form && currentData.fields) {
    return (
      <FormRunner
        form={currentData.form}
        fields={currentData.fields}
        passcode={passcode}
        />
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center font-mono p-4 selection:bg-red-500/20">
      <div className="max-w-md w-full bg-stone-900/30 border border-red-950/60 p-8 rounded-lg shadow-2xl text-center space-y-6">
        <div className="mx-auto w-12 h-12 rounded bg-red-950/10 border border-red-900/40 flex items-center justify-center text-red-500">
          <AlertCircle size={20} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-light text-stone-200 font-cormorant tracking-wider uppercase">
            Inconsistent Projection
          </h2>
          <p className="text-xs text-stone-500 uppercase tracking-widest leading-relaxed">
            The subconscious parameters did not resolve cleanly.
          </p>
        </div>
      </div>
    </div>
  );
}
