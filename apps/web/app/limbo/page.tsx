"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Totem } from "~/components/Totem";

export default function LimboPage() {
  useEffect(() => {
    import("~/lib/achievements").then(m => m.unlockAchievement("limbo_found"));
  }, []);
  return (
    <div className="min-h-screen bg-[#050505] text-[#C8D8E8] flex flex-col items-center justify-center font-mono relative overflow-hidden selection:bg-stone-800">
      <div className="absolute top-6 right-6 text-[10px] text-stone-600 font-bold opacity-60 tracking-[0.2em]">
        48°52'5"N 2°19'59"E
      </div>
      
      <div className="w-20 h-20 flex items-center justify-center mb-8">
        <Totem status="spinning" className="text-stone-400 scale-[1.5]" />
      </div>
      
      <p className="text-xs uppercase tracking-[0.15em] text-stone-500 max-w-md text-center leading-relaxed">
        You weren't supposed to find this.<br /><br />
        The API docs are at{" "}
        <Link href="/api/docs" className="text-[#E8B455] hover:text-[#C9933A] hover:underline transition-colors font-semibold">
          /api/docs
        </Link>
        .
      </p>
    </div>
  );
}
