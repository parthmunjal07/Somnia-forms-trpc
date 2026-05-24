"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "~/lib/store";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import {
  Eye,
  Send,
  Plus,
  Copy,
  Trash2,
  ExternalLink,
  ChevronRight,
  LogOut,
  Sliders,
  Settings,
  Lock,
  Layers,
  Sparkles,
  Info,
  EyeOff,
} from "lucide-react";


// ─── Fog Canvas ───────────────────────────────────────────────────────────────
function FogAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles = Array.from({ length: 180 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 260 + 120,
      speedX: (Math.random() - 0.5) * 1.2,
      speedY: (Math.random() - 0.5) * 1.2,
      opacity: Math.random() * 0.06 + 0.02,
      gold: Math.random() > 0.85,
    }));

    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        const color = p.gold ? `rgba(201,147,58,${p.opacity})` : `rgba(60,70,90,${p.opacity})`;
        g.addColorStop(0, color);
        g.addColorStop(1, "rgba(10,10,15,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < -p.size) p.x = width + p.size;
        if (p.x > width + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = height + p.size;
        if (p.y > height + p.size) p.y = -p.size;
      }
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", onResize);
    draw();
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 1 }}
    />
  );
}

function Totem({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="12" fill="currentColor" r="3" />
      <path d="M12 2V5M12 19V22M2 12H5M19 12H22" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, clearUser } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form creation states
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newVisibility, setNewVisibility] = useState<"public" | "unlisted">("public");

  // Load forms using tRPC
  const utils = trpc.useUtils();
  const { data: formsData, isLoading: isFormsLoading } = trpc.forms.list.useQuery({
    limit: 50,
  });

  // Create form mutation
  const createFormMutation = trpc.forms.create.useMutation({
    onSuccess: (newForm) => {
      toast.success("Dreamscape generated successfully.");
      setIsCreateModalOpen(false);
      setNewTitle("");
      setNewSlug("");
      utils.forms.list.invalidate();
      router.push(`/dashboard/forms/${newForm.id}/build`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to project new dreamscape.");
    },
  });

  // Clone form mutation
  const cloneFormMutation = trpc.forms.clone.useMutation({
    onSuccess: () => {
      toast.success("Dreamscape cloned. A new level has been added.");
      utils.forms.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Cloning operation failed.");
    },
  });

  // Delete form mutation
  const deleteFormMutation = trpc.forms.delete.useMutation({
    onSuccess: () => {
      toast.success("Dreamscape collapsed successfully.");
      utils.forms.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to collapse dreamscape.");
    },
  });

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    // Auto slug generation: lowercase, replace spaces and special chars with dashes
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setNewSlug(generatedSlug);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSlug) {
      toast.error("All parameters are required to generate layout.");
      return;
    }
    createFormMutation.mutate({
      title: newTitle,
      slug: newSlug,
      visibility: newVisibility,
    });
  };

  const logoutMutation = trpc.auth.logout.useMutation();

const handleLogout = async () => {
      // We can clear cookie by calling api, but since we are in client, we can clear store & redirect
    // And to clear the cookies on backend, let's call a logout procedure if it exists.
    // If it doesn't, we can just clear user state.
    // Let's check: does trpc have a logout endpoint? Let's check our auth router.
    // We did not see a logout procedure. That's fine! Clearing the cookie is usually done on reload or we can clear token manually.
    // Let's write a simple document cookie clearing mechanism just in case.
  await logoutMutation.mutateAsync(); // Tells Express to clear httpOnly cookies
  clearUser();                        // Clears Zustand
  toast.success("You have woken up.");
  router.push("/login");
};

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#EEF3F8] font-mono flex flex-col selection:bg-[#C9933A]/20 selection:text-[#E8B455]">
      {/* Background design elements */}
      <FogAnimation />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,163,191,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(139,163,191,0.03) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[rgba(10,10,15,0.75)] backdrop-blur-[12px] border-b border-[rgba(200,216,232,0.1)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl tracking-[0.25em] font-light text-[#C9933A] font-cormorant select-none">
            SOMNIA
          </span>
          <span className="hidden sm:inline text-[9px] border border-[rgba(200,216,232,0.1)] text-[#8BA3BF] px-1.5 py-0.5 rounded tracking-widest uppercase">
            v1.0.0
          </span>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[10px] text-[#8BA3BF] font-semibold uppercase">{user?.email ? user.email.split("@")[0] : "Dreamer"}</span>
            <span className="text-[9px] text-[#8BA3BF]/60 tracking-wider">
              ROLE: {user?.role ? user.role.replace("THE_", "") : "UNKNOWN"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 text-[#8BA3BF] hover:text-red-400 transition-colors text-xs uppercase tracking-wider cursor-pointer select-none"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Wake Up</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 z-10">

        {/* Observer Mode Banner — appears when user is THE_SHADE on at least one form */}
        {!isFormsLoading && formsData?.items?.some((f: any) => f.role === "THE_SHADE") && (
          <div className="flex items-start space-x-3 bg-amber-950/20 border border-amber-900/40 rounded p-4 text-amber-500 animate-in fade-in duration-500">
            <EyeOff size={16} className="mt-0.5 shrink-0 animate-pulse" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest">Observer Mode Active</p>
              <p className="text-[9px] text-amber-600 mt-1 leading-relaxed uppercase tracking-wider">
                One or more dreamscapes in your workspace were shared with you as <strong className="text-amber-500">THE_SHADE</strong>. You have read-only observation access — you can view and inspect but cannot modify, clone, or delete these layers.
              </p>
            </div>
          </div>
        )}
        
        {/* Upper Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-4xl font-light text-stone-100 tracking-wider font-cormorant">
              Projected Dreamscapes
            </h2>
            <p className="text-[13px] text-[#8BA3BF] uppercase tracking-widest mt-1">
              Active subconscious architectural layers
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800/60 hover:border-emerald-500 px-4 py-2.5 rounded text-sm font-bold tracking-wider uppercase transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.05)] cursor-pointer select-none"
          >
            <Plus size={16} />
            <span>Generate Layer</span>
          </button>
        </div>

        {/* Dashboard Grid / Loader */}
        {isFormsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[188px] animate-shimmer border border-[rgba(200,216,232,0.1)] rounded p-6 flex flex-col justify-between overflow-hidden"
              >
                <div className="space-y-3 mt-4">
                  <div className="h-4 bg-[rgba(200,216,232,0.1)] rounded w-2/3" />
                  <div className="h-3 bg-[rgba(200,216,232,0.1)] rounded w-1/2" />
                </div>
                <div className="h-6 bg-[rgba(200,216,232,0.1)] rounded w-1/3 mt-6 pt-4 border-t border-[rgba(200,216,232,0.05)]" />
              </div>
            ))}
          </div>
        ) : formsData?.items && formsData.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formsData.items.map((item: any) => {
              const isOwner = item.role === "THE_ARCHITECT";
              const isForger = item.role === "THE_FORGER";
              const isShade = item.role === "THE_SHADE";

              return (
                <div
                  key={item.id}
                  className={`group relative bg-[rgba(255,255,255,0.02)] border border-[rgba(200,216,232,0.1)] rounded p-6 flex flex-col justify-between transition-all duration-300 ${
                    isShade
                      ? "border-amber-900/30 hover:border-amber-800/50 hover:shadow-[0_4px_30px_rgba(180,100,0,0.15)]"
                      : "border-[rgba(200,216,232,0.1)] hover:border-[#C9933A]/30 hover:shadow-[0_4px_30px_rgba(201,147,58,0.1)]"
                  }`}
                >
                  {/* Observer Mode Ribbon for THE_SHADE */}
                  {isShade && (
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-center space-x-1.5 bg-amber-950/30 border-b border-amber-900/40 py-1 px-3 rounded-t text-amber-600 text-[8px] uppercase tracking-[0.2em] font-bold">
                      <EyeOff size={9} />
                      <span>Observer Mode — Read Only</span>
                    </div>
                  )}
                  {/* Subtle hover accent line — hidden when shade ribbon is active */}
                  {!isShade && (
                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-[rgba(200,216,232,0.1)] via-[rgba(200,216,232,0.2)] to-[rgba(200,216,232,0.1)] group-hover:from-[#C9933A]/40 group-hover:via-[#E8B455]/50 group-hover:to-[#C9933A]/40 transition-all duration-500" />
                  )}

                  {/* Card Content Top — add top padding when shade ribbon is visible */}
                  <div className={isShade ? "mt-5" : ""}>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-light text-stone-100 group-hover:text-white transition-colors tracking-wide font-cormorant">
                          {item.title}
                        </h3>
                        <p className="text-[12px] text-[#8BA3BF] mt-1 select-all cursor-pointer">
                          /f/{item.slug}
                        </p>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-col items-end space-y-1.5">
                        <span
                          className={`text-[10px] tracking-widest uppercase px-1.5 py-0.5 rounded font-bold border ${
                            item.status === "published"
                              ? "bg-[#C9933A]/10 border-[#C9933A]/30 text-[#C9933A]"
                              : item.status === "archived"
                              ? "bg-red-950/20 border-red-900/60 text-red-400"
                              : "bg-amber-950/20 border-amber-900/60 text-amber-400"
                          }`}
                        >
                          {item.status}
                        </span>

                        {/* Collaborator Role Badge */}
                        <span
                          className={`text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded border ${
                            isOwner
                              ? "bg-stone-950 border-[rgba(200,216,232,0.1)] text-[#8BA3BF]"
                              : isForger
                              ? "bg-amber-950/10 border-amber-900/30 text-amber-500"
                              : "bg-blue-950/10 border-blue-900/30 text-blue-400"
                          }`}
                        >
                          {isOwner ? "Architect" : isForger ? "Forger" : "Shade"}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-[#8BA3BF] text-xs">
                      <div className="flex items-center space-x-1.5">
                        <Eye size={13} className="text-[#8BA3BF]" />
                        <span>{item.viewsCount} views</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Send size={12} className="text-[#8BA3BF]" />
                        <span>{item.submissionsCount} submissions</span>
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* Card Actions Bottom */}
                  <div className="mt-6 pt-4 border-t border-stone-850 flex items-center justify-between text-xs text-[#8BA3BF]">
                    <span className="text-11px] uppercase tracking-wider text-[#8BA3BF]/60">
                      Proj: {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "Just now"}
                    </span>

                    <div className="flex items-center space-x-2">
                      {/* Clone Option */}
                      <button
                        onClick={() => {
                          if (isForger) {
                            toast.error("Forgers are not authorized to clone dreamscape layouts.");
                            return;
                          }
                          if (confirm("Proceed to duplicate this dreamscape configuration?")) {
                            cloneFormMutation.mutate({ id: item.id });
                          }
                        }}
                        disabled={isForger}
                        title={isForger ? "The Forger cannot duplicate layouts" : "Duplicate Dreamscape"}
                        className={`p-1.5 rounded border border-[rgba(200,216,232,0.1)] text-[#8BA3BF] hover:text-amber-400 hover:border-amber-900/60 transition-all cursor-pointer ${
                          isForger ? "opacity-35 cursor-not-allowed" : ""
                        }`}
                      >
                        <Copy size={13} />
                      </button>

                      {/* Delete Option */}
                      <button
                        onClick={() => {
                          if (isShade || isForger) {
                            toast.error("You do not possess architectural authority to collapse this dreamscape.");
                            return;
                          }
                          if (confirm("WARNING: This will permanently collapse this dreamscape level and destroy all records. Continue?")) {
                            deleteFormMutation.mutate({ id: item.id });
                          }
                        }}
                        disabled={isShade || isForger}
                        title={isShade || isForger ? "Insufficient permissions" : "Collapse Dreamscape"}
                        className={`p-1.5 rounded border border-[rgba(200,216,232,0.1)] text-[#8BA3BF] hover:text-red-400 hover:border-red-950/60 transition-all cursor-pointer ${
                          isShade || isForger ? "opacity-35 cursor-not-allowed" : ""
                        }`}
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Analytics Option */}
                      {!isShade ? (
                        <button
                          onClick={() => router.push(`/dashboard/forms/${item.id}/analytics`)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-950/20 hover:bg-amber-900/30 border border-amber-900/40 hover:border-amber-500/55 text-amber-400 rounded text-[12px] uppercase font-bold tracking-widest transition-all cursor-pointer"
                        >
                          <span>Analytics</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          title="THE_SHADE is blocked from viewing analytics"
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-stone-950/50 border border-stone-900 text-[#8BA3BF]/60 rounded text-[10px] uppercase font-bold tracking-widest cursor-not-allowed opacity-40"
                        >
                          <span>Analytics</span>
                        </button>
                      )}

                      {/* Launch Builder */}
                      <button
                        onClick={() => router.push(`/dashboard/forms/${item.id}/build`)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(200,216,232,0.1)] hover:border-stone-700 text-[#EEF3F8] hover:text-[#E8B455] rounded text-[12px] uppercase font-bold tracking-widest transition-all cursor-pointer"
                      >
                        <span>Build</span>
                        <ChevronRight size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="relative border border-dashed border-[rgba(200,216,232,0.1)] rounded-lg p-16 flex flex-col items-center justify-center text-center space-y-6 bg-[rgba(10,10,15,0.4)] backdrop-blur-[4px] overflow-hidden max-w-3xl mx-auto">
            {/* Spinning totem wireframe */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute w-24 h-24 border border-dashed border-[rgba(200,216,232,0.1)] rounded-full animate-[spin_10s_linear_infinite]" />
              <div className="absolute w-16 h-16 border border-[rgba(200,216,232,0.1)] rotate-45 animate-[pulse_2s_ease-in-out_infinite]" />
              <div className="w-1.5 h-1.5 bg-[#E8B455] rounded-full shadow-[0_0_12px_#E8B455]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-light text-stone-300 font-cormorant tracking-wide">
                Limbo Subconscious Layer detected
              </h3>
              <p className="text-xs text-[#8BA3BF] uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                No active dreamscape architecture has been projected. Plant a totem seed to begin construction of your builder forms.
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800/60 hover:border-emerald-500 px-6 py-3 rounded text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.08)] cursor-pointer select-none"
            >
              <Plus size={15} />
              <span>Plant a new Dream</span>
            </button>
          </div>
        )}
      </main>

      {/* Modal - Create Form */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono select-none">
          <div className="bg-stone-900 border border-[rgba(200,216,232,0.1)] rounded-lg p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-light text-stone-100 mb-6 font-cormorant tracking-wider uppercase border-b border-[rgba(200,216,232,0.1)] pb-2">
              Project New Dreamscape Layer
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[9px] text-[#8BA3BF] uppercase tracking-wider block">
                  Dreamscape Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Limbo Registration"
                  value={newTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-[#0A0A0F] border-[rgba(200,216,232,0.1)] rounded px-3 py-2 text-sm text-stone-200 placeholder-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-[#8BA3BF] uppercase tracking-wider block">
                  Subconscious Slug / Path URL
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[#8BA3BF]/60 text-xs select-none">/f/</span>
                  <input
                    type="text"
                    required
                    placeholder="limbo-registration"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    className="w-full bg-[#0A0A0F] border-[rgba(200,216,232,0.1)] rounded pl-10 pr-3 py-2 text-sm text-stone-200 placeholder-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-[#8BA3BF] uppercase tracking-wider block">
                  Visibility Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewVisibility("public")}
                    className={`py-2 text-xs border rounded transition-all cursor-pointer font-semibold ${
                      newVisibility === "public"
                        ? "bg-emerald-950/20 border-emerald-500 text-emerald-400"
                        : "bg-stone-950 border-stone-850 text-[#8BA3BF] hover:text-stone-300"
                    }`}
                  >
                    PUBLIC
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewVisibility("unlisted")}
                    className={`py-2 text-xs border rounded transition-all cursor-pointer font-semibold ${
                      newVisibility === "unlisted"
                        ? "bg-emerald-950/20 border-emerald-500 text-emerald-400"
                        : "bg-stone-950 border-stone-850 text-[#8BA3BF] hover:text-stone-300"
                    }`}
                  >
                    UNLISTED
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-[rgba(200,216,232,0.1)]/60 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-950 hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(200,216,232,0.1)] text-[#8BA3BF] hover:text-stone-200 rounded text-xs tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createFormMutation.isPending}
                  className="flex-1 py-2.5 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800 hover:border-emerald-500 rounded text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.05)] cursor-pointer"
                >
                  {createFormMutation.isPending ? "Projecting..." : "Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
