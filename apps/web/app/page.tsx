import { api } from "~/trpc/server";
import { FogCanvas } from "~/components/FogCanvas";
import { TotemNavbar } from "~/components/TotemNavbar";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { status } = await api.health.getHealth.query();
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-stone-950 text-stone-200 selection:bg-emerald-500/30">
      <TotemNavbar />
      
      {/* Background design elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none z-0" />
      <FogCanvas />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-light text-stone-100 font-cormorant tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          Architect Your Reality
        </h1>
        
        <p className="max-w-2xl text-xs md:text-sm text-stone-400 font-mono tracking-[0.2em] uppercase leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300 fill-mode-backwards">
          Project powerful, multi-layered forms to construct data architectures. 
          Share them with Forgers and Shades. Control the dreamscape.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-backwards">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-sm font-bold uppercase tracking-widest hover:bg-emerald-900/50 hover:border-emerald-500 transition-all rounded shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]"
          >
            Enter the Dream
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-4 border border-stone-800 text-stone-400 text-sm font-bold uppercase tracking-widest hover:text-stone-200 hover:border-stone-600 transition-all rounded"
          >
            View Tiers
          </Link>
        </div>
      </div>
      
      {/* Footer / Server Status */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
        <div className="flex items-center space-x-2 text-[10px] text-stone-600 font-mono uppercase tracking-widest">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Core Status: {status}</span>
        </div>
      </div>
    </main>
  );
}
