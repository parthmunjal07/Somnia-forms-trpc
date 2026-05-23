"use client";

import Link from "next/link";
import { useAuthStore } from "~/lib/store";
import { Totem } from "./Totem";

export function TotemNavbar() {
  const { user } = useAuthStore();

  return (
    <nav className="absolute top-0 w-full z-50 flex items-center justify-between px-6 md:px-12 py-6">
      <Link href="/" className="flex items-center space-x-2 group">
        <div className="scale-[0.35] origin-left -ml-4 group-hover:scale-[0.4] transition-transform">
          <Totem status="spinning" />
        </div>
        <span className="text-xl md:text-2xl tracking-[0.25em] font-light text-stone-100 font-cormorant select-none">
          SOMNIA
        </span>
      </Link>

      <div className="flex items-center space-x-6">
        {user ? (
          <>
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] text-stone-400 font-semibold uppercase">
                {user.email.split("@")[0]}
              </span>
              <span className="text-[9px] text-stone-600 tracking-wider">
                ROLE: {user.role.replace("THE_", "")}
              </span>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-bold uppercase tracking-wider hover:bg-emerald-900/50 hover:border-emerald-500 transition-all rounded shadow-[0_0_15px_rgba(16,185,129,0.05)]"
            >
              Dashboard
            </Link>
          </>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 border border-stone-800 text-stone-400 text-xs font-bold uppercase tracking-wider hover:text-stone-200 hover:border-stone-600 transition-all rounded"
          >
            Authenticate
          </Link>
        )}
      </div>
    </nav>
  );
}
