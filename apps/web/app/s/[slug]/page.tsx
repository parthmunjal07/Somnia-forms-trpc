"use client";

import React, { useState, use } from "react";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import {
  Lock,
  CheckCircle,
  AlertCircle,
  EyeOff,
  Sparkles,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

// Theme Skins Config (aligned with builder page)
function getSkinStyles(skinId: string) {
  switch (skinId) {
    case "classic-light":
      return {
        bg: "bg-stone-100 text-stone-900 border-stone-300",
        cardBg: "bg-white border-stone-200 shadow-sm",
        input: "bg-stone-50 border-stone-300 text-stone-900 focus:ring-stone-600 focus:border-stone-600 placeholder-stone-400",
        btn: "bg-stone-900 hover:bg-stone-800 text-white border-stone-950",
        accent: "text-stone-700",
        glow: "shadow-[0_0_15px_rgba(0,0,0,0.05)]",
      };
    case "neon-cyan":
      return {
        bg: "bg-black text-cyan-400 border-cyan-900",
        cardBg: "bg-black border-cyan-800 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
        input: "bg-zinc-950 border-cyan-850 text-cyan-200 focus:ring-cyan-500 focus:border-cyan-500 placeholder-cyan-900",
        btn: "bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-400 border-cyan-700 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]",
        accent: "text-cyan-400",
        glow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]",
      };
    case "limbo-fade":
      return {
        bg: "bg-zinc-900 text-stone-300 border-stone-800",
        cardBg: "bg-stone-950 border-stone-800 shadow-[0_4px_30px_rgba(0,0,0,0.5)]",
        input: "bg-stone-950 border-stone-850 text-stone-300 focus:ring-amber-500 focus:border-amber-500 placeholder-stone-700",
        btn: "bg-amber-950/20 hover:bg-amber-900/30 text-amber-500 border-amber-900 hover:border-amber-500",
        accent: "text-amber-500",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
      };
    case "vintage-amber":
      return {
        bg: "bg-amber-50 text-amber-950 border-amber-200",
        cardBg: "bg-amber-100/60 border-amber-200 shadow-inner",
        input: "bg-amber-50/50 border-amber-300 text-amber-900 focus:ring-amber-600 focus:border-amber-600 placeholder-amber-400",
        btn: "bg-amber-950 text-amber-50 hover:bg-amber-900 border-amber-950",
        accent: "text-amber-800",
        glow: "shadow-[0_0_15px_rgba(120,53,4,0.05)]",
      };
    case "monochrome":
      return {
        bg: "bg-black text-white border-zinc-800",
        cardBg: "bg-black border border-white shadow-none",
        input: "bg-black border border-zinc-700 text-white focus:ring-white focus:border-white rounded-none placeholder-zinc-800",
        btn: "bg-white text-black hover:bg-zinc-200 border-white rounded-none",
        accent: "text-zinc-300",
        glow: "shadow-none",
      };
    case "blood-moon":
      return {
        bg: "bg-zinc-950 text-red-400 border-red-950",
        cardBg: "bg-stone-950 border-red-950 shadow-[0_0_25px_rgba(239,68,68,0.1)]",
        input: "bg-black border-red-950 text-red-300 focus:ring-red-600 focus:border-red-600 placeholder-red-950",
        btn: "bg-red-950/30 hover:bg-red-900/40 text-red-400 border-red-900 hover:border-red-500",
        accent: "text-red-500",
        glow: "shadow-[0_0_15px_rgba(239,68,68,0.2)]",
      };
    case "royal-gold":
      return {
        bg: "bg-[#0b132b] text-yellow-100 border-[#1c2541]",
        cardBg: "bg-[#1c2541] border-[#3a506b] shadow-[0_4px_30px_rgba(0,0,0,0.3)]",
        input: "bg-[#0b132b] border-[#3a506b] text-yellow-100 focus:ring-yellow-500 focus:border-yellow-500 placeholder-yellow-800",
        btn: "bg-yellow-950/30 hover:bg-yellow-900/40 text-yellow-400 border-yellow-700 hover:border-yellow-400",
        accent: "text-yellow-500",
        glow: "shadow-[0_0_15px_rgba(234,179,8,0.25)]",
      };
    case "classic-dark":
    default:
      return {
        bg: "bg-stone-950 text-stone-200 border-stone-800",
        cardBg: "bg-stone-900/50 border-stone-800 shadow-[0_0_20px_rgba(0,0,0,0.5)]",
        input: "bg-stone-950 border-stone-850 text-stone-200 focus:ring-emerald-500 focus:border-emerald-500 placeholder-stone-800",
        btn: "bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 border-emerald-900 hover:border-emerald-500",
        accent: "text-emerald-400",
        glow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
      };
  }
}

export default function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [password, setPassword] = useState("");
  const [enteredPassword, setEnteredPassword] = useState<string | undefined>(undefined);
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  // Fetch Public Form Data using TRPC
  const { data: publicForm, isLoading, error } = trpc.forms.getPublic.useQuery(
    {
      slug,
      password: enteredPassword,
    },
    {
      retry: false,
    }
  );

  // Submit Response mutation
  const submitMutation = trpc.responses.submit.useMutation({
    onSuccess: () => {
      setSubmittedData(true);
      toast.success("Submission successfully synchronized to the database.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to finalize projection submittal.");
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnteredPassword(password);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicForm || !publicForm.form) return;

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const answers: Record<string, any> = {};

    // Validate and process input fields
    for (const field of publicForm.fields || []) {
      if (field.type === "multi_select") {
        const values = formData.getAll(field.id);
        if (field.required && values.length === 0) {
          toast.error(`Field "${field.label}" is required.`);
          return;
        }
        answers[field.id] = values;
      } else if (field.type === "checkbox") {
        const checked = formData.get(field.id) !== null;
        if (field.required && !checked) {
          toast.error(`Field "${field.label}" must be checked.`);
          return;
        }
        answers[field.id] = checked;
      } else {
        const value = formData.get(field.id);
        if (field.required && (!value || value.toString().trim() === "")) {
          toast.error(`Field "${field.label}" is required.`);
          return;
        }
        answers[field.id] = field.type === "number" && value ? Number(value) : value;
      }
    }

    submitMutation.mutate({
      formId: publicForm.form.id,
      data: answers,
      password: enteredPassword,
    });
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center font-mono selection:bg-emerald-500/20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
        <div className="relative flex flex-col items-center justify-center space-y-6">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 border border-emerald-950 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin" />
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_#10b981]" />
          </div>
          <span className="text-[10px] text-stone-500 uppercase tracking-[0.25em] animate-pulse">
            Connecting to subconscious layer...
          </span>
        </div>
      </div>
    );
  }

  // 2. Error or Not Found State
  if (error || !publicForm) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center font-mono p-4 selection:bg-red-500/20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
        <div className="max-w-md w-full bg-stone-900/30 border border-red-950/60 p-8 rounded-lg shadow-2xl text-center space-y-6 backdrop-blur-sm">
          <div className="mx-auto w-12 h-12 rounded bg-red-950/10 border border-red-900/40 flex items-center justify-center text-red-500 animate-pulse">
            <EyeOff size={20} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-light text-stone-200 font-cormorant tracking-wider uppercase">
              Dreamscape Unreachable
            </h2>
            <p className="text-xs text-stone-500 uppercase tracking-widest leading-relaxed">
              {error?.message || "The requested subconscious path does not exist or has been collapsed by the architect."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Determine theme and visual variables
  const skin = publicForm.form?.theme ?? "classic-dark";
  const styles = getSkinStyles(skin);

  // 3. Expired State
  if (publicForm.expired) {
    return (
      <div className={`min-h-screen ${styles.bg} flex flex-col items-center justify-center p-4 selection:bg-amber-500/20 font-mono`}>
        <div className="max-w-md w-full bg-stone-900/20 border border-current/10 p-8 rounded-lg shadow-2xl text-center space-y-6 backdrop-blur-sm">
          <div className="mx-auto w-12 h-12 rounded bg-amber-950/10 border border-amber-950/40 flex items-center justify-center text-amber-500 animate-pulse">
            <AlertCircle size={20} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-light font-cormorant tracking-wider uppercase">
              Dreamscape Closed
            </h2>
            <p className="text-xs opacity-60 uppercase tracking-widest leading-relaxed">
              This subconscious architectural layer has expired. The temporal coordinates have shifted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Response Cap / Limit Reached State
  if (publicForm.capReached) {
    return (
      <div className={`min-h-screen ${styles.bg} flex flex-col items-center justify-center p-4 selection:bg-amber-500/20 font-mono`}>
        <div className="max-w-md w-full bg-stone-900/20 border border-current/10 p-8 rounded-lg shadow-2xl text-center space-y-6 backdrop-blur-sm">
          <div className="mx-auto w-12 h-12 rounded bg-amber-950/10 border border-amber-950/40 flex items-center justify-center text-amber-500 animate-pulse">
            <AlertCircle size={20} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-light font-cormorant tracking-wider uppercase">
              Capacity Reached
            </h2>
            <p className="text-xs opacity-60 uppercase tracking-widest leading-relaxed">
              This subconscious layer is saturated. The response limit has been reached. No more variables can be injected.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 5. Password Required State
  if (publicForm.passwordRequired) {
    return (
      <div className={`min-h-screen ${styles.bg} flex flex-col items-center justify-center p-4 font-mono`}>
        <div className={`max-w-md w-full border p-8 rounded-lg ${styles.cardBg} ${styles.glow} space-y-6`}>
          <div className="text-center space-y-2">
            <div className={`mx-auto w-10 h-10 rounded border flex items-center justify-center opacity-80 ${styles.accent}`}>
              <Lock size={16} />
            </div>
            <h2 className="text-2xl font-light font-cormorant tracking-wide">
              {publicForm.form?.title ?? "Protected Layer"}
            </h2>
            <p className="text-[9px] uppercase tracking-widest opacity-50">
              SUB-LEVEL PASSPHRASE DEPLOYED
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] opacity-60 uppercase tracking-wider block font-semibold">
                Secret Passphrase
              </label>
              <input
                type="password"
                required
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded border px-3 py-2 text-xs focus:outline-none transition-all ${styles.input}`}
              />
              {publicForm.error && (
                <p className="text-[9px] text-red-500 mt-1 uppercase tracking-wider font-semibold">
                  * {publicForm.error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className={`w-full py-2 text-xs font-semibold uppercase tracking-widest border transition-all cursor-pointer ${styles.btn}`}
            >
              Verify Passcode
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 6. Success Submitted Thank You State
  if (submittedData) {
    return (
      <div className={`min-h-screen ${styles.bg} flex flex-col items-center justify-center p-4 font-mono`}>
        <div className={`max-w-md w-full border p-8 rounded-lg text-center ${styles.cardBg} ${styles.glow} space-y-6`}>
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-center text-emerald-400">
            <CheckCircle size={24} />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-light font-cormorant tracking-wide">
              Projection Stabilized
            </h2>
            <p className="text-[9px] uppercase tracking-widest opacity-60 font-semibold">
              subconscious configuration updated
            </p>
          </div>

          <div className="border-t border-dashed border-current/15 pt-6 text-xs leading-relaxed opacity-75">
            {publicForm.form && "thankYouMessage" in publicForm.form && publicForm.form.thankYouMessage ? (
              <p className="whitespace-pre-wrap">{publicForm.form.thankYouMessage}</p>
            ) : (
              <p>THE PROJECTED DATA STABILIZED SUCCESSFULLY. YOU MAY SAFELY WAKE UP NOW OR CLOSE THIS TAB LEVEL.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 7. Render Form fields
  return (
    <div className={`min-h-screen ${styles.bg} flex flex-col items-center justify-center p-6 md:p-8 font-mono`}>
      <div className={`w-full max-w-2xl border p-8 rounded-lg ${styles.cardBg} ${styles.glow} space-y-6`}>
        
        {/* Form Title */}
        <div className="text-center border-b border-current/10 pb-4">
          <h1 className="text-3xl font-light font-cormorant tracking-wide">
            {publicForm.form?.title ?? "Dreamscape Form"}
          </h1>
          <p className="text-[9px] uppercase tracking-[0.2em] opacity-50 mt-1">
            Projection Skin: {skin.replace("-", " ")}
          </p>
        </div>

        {/* Form Fields Submit Form */}
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {(publicForm.fields || []).map((field) => (
            <div key={field.id} className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider block opacity-80">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>

              {/* Inputs based on types */}
              {field.type === "long_text" ? (
                <textarea
                  required={field.required}
                  name={field.id}
                  placeholder={field.placeholder ?? "Projection parameters..."}
                  className={`w-full rounded border px-3 py-2 text-xs focus:outline-none transition-all h-24 ${styles.input}`}
                />
              ) : field.type === "single_select" ? (
                <select
                  required={field.required}
                  name={field.id}
                  className={`w-full rounded border px-3 py-2 text-xs focus:outline-none transition-all ${styles.input}`}
                >
                  <option value="">Select option...</option>
                  {((field.options as string[]) ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === "multi_select" ? (
                <div className="space-y-1.5 border border-current/10 p-3 rounded bg-current/5">
                  {((field.options as string[]) ?? []).map((opt) => (
                    <label key={opt} className="flex items-center space-x-2 text-xs select-none">
                      <input
                        type="checkbox"
                        name={field.id}
                        value={opt}
                        className="rounded accent-emerald-500 border-stone-700"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              ) : field.type === "checkbox" ? (
                <label className="flex items-center space-x-2 text-xs select-none cursor-pointer">
                  <input
                    type="checkbox"
                    required={field.required}
                    name={field.id}
                    className="rounded accent-emerald-500 border-stone-700"
                  />
                  <span>Check to confirm parameters</span>
                </label>
              ) : field.type === "rating" ? (
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label key={n} className="cursor-pointer">
                      <input
                        type="radio"
                        name={field.id}
                        value={n}
                        required={field.required}
                        className="sr-only peer"
                      />
                      <div className={`w-10 h-10 rounded border flex items-center justify-center text-xs transition-all peer-checked:bg-current peer-checked:text-black opacity-60 peer-checked:opacity-100 hover:opacity-90`}>
                        {n}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type={field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                  required={field.required}
                  name={field.id}
                  placeholder={field.placeholder ?? "Type here..."}
                  className={`w-full rounded border px-3 py-2 text-xs focus:outline-none transition-all ${styles.input}`}
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitMutation.isPending}
            className={`w-full py-3 rounded text-xs font-semibold uppercase tracking-[0.25em] border transition-all cursor-pointer flex items-center justify-center space-x-2 ${styles.btn}`}
          >
            {submitMutation.isPending ? (
              <span>Synchronizing Projection...</span>
            ) : (
              <>
                <span>Commit Projection</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
