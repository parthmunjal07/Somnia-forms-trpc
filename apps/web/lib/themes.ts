export function getSkinStyles(skinId: string) {
  switch (skinId) {
    case "classic-light":
      return {
        bg: "bg-stone-100 text-stone-900 border-stone-300",
        cardBg: "bg-white border-stone-200 shadow-sm",
        input: "bg-stone-50 border-stone-300 text-stone-900 focus:ring-stone-600 focus:border-stone-600 placeholder-stone-400",
        btn: "bg-stone-900 hover:bg-stone-850 text-white border-stone-950 shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
        accent: "text-stone-700",
        glow: "shadow-[0_0_15px_rgba(0,0,0,0.05)]",
      };
    case "neon-cyan":
      return {
        bg: "bg-black text-cyan-400 border-cyan-900",
        cardBg: "bg-black border-cyan-800 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
        input: "bg-zinc-950 border-cyan-850 text-cyan-200 focus:ring-cyan-500 focus:border-cyan-500 placeholder-cyan-900",
        btn: "bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-400 border-cyan-750 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]",
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
        btn: "bg-amber-950 text-amber-50 hover:bg-amber-900 border-amber-950 shadow-md",
        accent: "text-amber-855",
        glow: "shadow-[0_0_15px_rgba(120,53,4,0.05)]",
      };
    case "monochrome":
      return {
        bg: "bg-black text-white border-zinc-800",
        cardBg: "bg-black border border-white shadow-none rounded-none",
        input: "bg-black border border-zinc-700 text-white focus:ring-white focus:border-white rounded-none placeholder-zinc-800",
        btn: "bg-white text-black hover:bg-zinc-200 border-white rounded-none",
        accent: "text-zinc-300",
        glow: "shadow-none",
      };
    case "blood-moon":
      return {
        bg: "bg-zinc-950 text-red-400 border-red-950",
        cardBg: "bg-stone-950 border-red-950 shadow-[0_0_25px_rgba(239,68,68,0.1)]",
        input: "bg-black border-red-950 text-red-300 focus:ring-red-650 focus:border-red-650 placeholder-red-950/40",
        btn: "bg-red-950/30 hover:bg-red-900/40 text-red-400 border-red-900 hover:border-red-500",
        accent: "text-red-500",
        glow: "shadow-[0_0_15px_rgba(239,68,68,0.2)]",
      };
    case "royal-gold":
      return {
        bg: "bg-[#0b132b] text-yellow-100 border-[#1c2541]",
        cardBg: "bg-[#1c2541] border-[#3a506b] shadow-[0_4px_30px_rgba(0,0,0,0.3)]",
        input: "bg-[#0b132b] border-[#3a506b] text-yellow-100 focus:ring-yellow-500 focus:border-yellow-500 placeholder-yellow-800",
        btn: "bg-yellow-950/30 hover:bg-yellow-900/40 text-yellow-400 border-yellow-750 hover:border-yellow-400",
        accent: "text-yellow-500",
        glow: "shadow-[0_0_15px_rgba(234,179,8,0.25)]",
      };
    case "classic-dark":
    default:
      return {
        bg: "bg-stone-950 text-stone-200 border-stone-800",
        cardBg: "bg-stone-900/50 border-stone-850 shadow-[0_0_20px_rgba(0,0,0,0.5)]",
        input: "bg-stone-950 border-stone-850 text-stone-200 focus:ring-emerald-500 focus:border-emerald-500 placeholder-stone-800",
        btn: "bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 border-emerald-900 hover:border-emerald-500",
        accent: "text-emerald-400",
        glow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
      };
  }
}
