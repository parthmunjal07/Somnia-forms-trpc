"use client";

import { useEffect } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard Boundary Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#EEF3F8] font-mono flex flex-col items-center justify-center p-6 select-none relative">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,163,191,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(139,163,191,0.03) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="max-w-md w-full border border-red-950/60 bg-stone-900/30 p-8 rounded-lg text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.05)] relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div className="mx-auto w-14 h-14 rounded border border-red-900/50 bg-red-950/20 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <AlertTriangle size={26} className="animate-pulse" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-light font-cormorant tracking-wider uppercase text-red-400">
            Cognitive Dissonance
          </h2>
          <p className="text-[10px] text-red-500 uppercase tracking-[0.25em] font-semibold">
            System Error Encountered
          </p>
          <p className="text-xs text-[#8BA3BF]/80 uppercase tracking-widest leading-relaxed pt-2">
            A disruption in the architectural projection occurred. The dreamscape layer failed to render correctly.
          </p>
          <p className="text-[10px] text-red-400/60 font-mono bg-red-950/20 p-2 rounded border border-red-900/30 break-words mt-4 text-left">
            ERR: {error.message || "Unknown anomaly detected"}
          </p>
        </div>

        <div className="pt-4 flex flex-col space-y-3">
          <button
            onClick={() => reset()}
            className="w-full py-3 bg-red-950/40 hover:bg-red-900/50 border border-red-900/60 hover:border-red-500 text-xs font-bold uppercase tracking-widest text-red-400 rounded transition-all cursor-pointer inline-flex items-center justify-center"
          >
            Attempt Re-projection (Try Again)
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-[#0A0A0F] hover:bg-stone-900 border border-[rgba(200,216,232,0.1)] hover:border-[#8BA3BF]/50 text-xs font-bold uppercase tracking-widest text-[#8BA3BF] hover:text-[#EEF3F8] rounded transition-all cursor-pointer inline-flex items-center justify-center space-x-2"
          >
            <ArrowLeft size={13} />
            <span>Wake Up to Reality (Home)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
