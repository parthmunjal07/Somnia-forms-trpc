"use client";

import { useAuthStore } from "~/lib/store";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { TotemNavbar } from "~/components/TotemNavbar";
import { FogCanvas } from "~/components/FogCanvas";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();

  const upgradeMutation = trpc.auth.upgradeTier.useMutation({
    onSuccess: (data) => {
      toast.success(`Access granted to ${data.tier.toUpperCase()} tier.`);
      if (user) {
        setUser({ ...user, subscriptionTier: data.tier });
      }
      router.push("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to upgrade tier.");
    },
  });

  const handleUpgrade = (tier: "free" | "pro" | "team") => {
    if (!user) {
      toast.error("You must authenticate to access deeper layers.");
      router.push("/login");
      return;
    }
    upgradeMutation.mutate({ tier });
  };

  const tiers = [
    {
      id: "free",
      name: "Limbo",
      price: "Free",
      description: "Basic subconscious projections.",
      features: [
        "Up to 3 Dreamscapes (Forms)",
        "Public & Unlisted visibility",
        "Basic response collection",
        "No collaboration",
      ],
      current: user?.subscriptionTier === "free",
    },
    {
      id: "pro",
      name: "Architect",
      price: "$12/mo",
      description: "Advanced structural control.",
      features: [
        "Unlimited Dreamscapes",
        "Invite THE_FORGER",
        "Advanced Analytics",
        "Priority architectural support",
      ],
      current: user?.subscriptionTier === "pro",
    },
    {
      id: "team",
      name: "Syndicate",
      price: "$49/mo",
      description: "Full collaborative dream sharing.",
      features: [
        "Everything in Architect",
        "Invite THE_SHADE (Observers)",
        "Team level analytics",
        "Custom domain projections",
      ],
      current: user?.subscriptionTier === "team",
    },
  ];

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-200 font-mono">
      <TotemNavbar />
      <FogCanvas />
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-32 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-light text-stone-100 font-cormorant tracking-wider mb-4 text-center">
          Architectural Tiers
        </h1>
        <p className="text-stone-400 text-xs tracking-widest uppercase mb-16 text-center max-w-2xl">
          Select the depth of your subconscious construct. Higher tiers allow for deeper collaboration and infinite dreamscapes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`bg-stone-900/40 border p-8 flex flex-col relative transition-all duration-300 ${
                tier.current
                  ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                  : "border-stone-800 hover:border-stone-600"
              }`}
            >
              {tier.current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-950 border border-emerald-500/50 text-emerald-400 text-[9px] uppercase tracking-widest px-3 py-1 rounded-full font-bold">
                  Current Layer
                </div>
              )}
              
              <div className="mb-6 border-b border-stone-800/60 pb-6">
                <h3 className="text-2xl font-light font-cormorant tracking-wide mb-2 text-stone-100">
                  {tier.name}
                </h3>
                <div className="text-xl font-bold tracking-wider mb-2">
                  {tier.price}
                </div>
                <p className="text-xs text-stone-500 uppercase tracking-wider h-8">
                  {tier.description}
                </p>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {tier.features.map((feat, i) => (
                  <li key={i} className="flex items-start space-x-3 text-xs tracking-wide text-stone-300">
                    <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(tier.id as any)}
                disabled={tier.current || upgradeMutation.isPending}
                className={`w-full py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                  tier.current
                    ? "bg-stone-950 border border-emerald-900/30 text-emerald-600 cursor-not-allowed opacity-50"
                    : tier.id === "team"
                    ? "bg-emerald-950/40 border border-emerald-800 hover:border-emerald-500 text-emerald-400 hover:bg-emerald-900/50 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                    : "bg-stone-900 border border-stone-700 hover:border-stone-500 text-stone-300 hover:text-stone-100"
                }`}
              >
                {tier.current ? "Active" : upgradeMutation.isPending ? "Connecting..." : `Select ${tier.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
