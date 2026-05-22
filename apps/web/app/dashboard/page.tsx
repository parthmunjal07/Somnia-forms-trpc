"use client";

import { useState } from "react";
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
    <div className="min-h-screen bg-stone-950 text-stone-200 font-mono flex flex-col selection:bg-emerald-500/30">
      {/* Background design elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-stone-900/45 backdrop-blur-xl border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl tracking-[0.25em] font-light text-stone-100 font-cormorant select-none">
            SOMNIA
          </span>
          <span className="hidden sm:inline text-[9px] border border-stone-800 text-stone-500 px-1.5 py-0.5 rounded tracking-widest uppercase">
            v1.0.0
          </span>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[10px] text-stone-400 font-semibold uppercase">{user?.email ? user.email.split("@")[0] : "Dreamer"}</span>
            <span className="text-[9px] text-stone-600 tracking-wider">
              ROLE: {user?.role ? user.role.replace("THE_", "") : "UNKNOWN"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 text-stone-500 hover:text-red-400 transition-colors text-xs uppercase tracking-wider cursor-pointer select-none"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Wake Up</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 z-10">

        {/* Observer Mode Banner — appears when user is THE_SHADE on at least one form */}
        {!isFormsLoading && formsData?.items?.some((f) => f.role === "THE_SHADE") && (
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
            <h2 className="text-2xl font-light text-stone-100 tracking-wider font-cormorant">
              Projected Dreamscapes
            </h2>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">
              Active subconscious architectural layers
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800/60 hover:border-emerald-500 px-4 py-2.5 rounded text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.05)] cursor-pointer select-none"
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
                className="h-44 bg-stone-900/20 border border-stone-900 rounded p-6 flex flex-col justify-between animate-pulse"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-stone-800 rounded w-2/3" />
                  <div className="h-3 bg-stone-800 rounded w-1/2" />
                </div>
                <div className="h-6 bg-stone-800 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : formsData?.items && formsData.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formsData.items.map((item) => {
              const isOwner = item.role === "THE_ARCHITECT";
              const isForger = item.role === "THE_FORGER";
              const isShade = item.role === "THE_SHADE";

              return (
                <div
                  key={item.id}
                  className={`group relative bg-stone-900/25 border rounded p-6 flex flex-col justify-between transition-all duration-300 ${
                    isShade
                      ? "border-amber-900/30 hover:border-amber-800/50 hover:shadow-[0_4px_30px_rgba(180,100,0,0.15)]"
                      : "border-stone-850 hover:border-stone-700/80 hover:shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
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
                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 group-hover:from-emerald-600/40 group-hover:via-emerald-500/50 group-hover:to-teal-500/40 transition-all duration-500" />
                  )}

                  {/* Card Content Top — add top padding when shade ribbon is visible */}
                  <div className={isShade ? "mt-5" : ""}>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-light text-stone-100 group-hover:text-white transition-colors tracking-wide font-cormorant">
                          {item.title}
                        </h3>
                        <p className="text-[10px] text-stone-500 mt-1 select-all cursor-pointer">
                          /f/{item.slug}
                        </p>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-col items-end space-y-1.5">
                        <span
                          className={`text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded font-bold border ${
                            item.status === "published"
                              ? "bg-emerald-950/20 border-emerald-900/60 text-emerald-400"
                              : item.status === "archived"
                              ? "bg-red-950/20 border-red-900/60 text-red-400"
                              : "bg-amber-950/20 border-amber-900/60 text-amber-400"
                          }`}
                        >
                          {item.status}
                        </span>

                        {/* Collaborator Role Badge */}
                        <span
                          className={`text-[8px] tracking-wider uppercase px-1.5 py-0.5 rounded border ${
                            isOwner
                              ? "bg-stone-950 border-stone-800 text-stone-400"
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
                    <div className="flex items-center space-x-4 text-stone-400 text-xs">
                      <div className="flex items-center space-x-1.5">
                        <Eye size={13} className="text-stone-500" />
                        <span>{item.viewsCount} views</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Send size={12} className="text-stone-500" />
                        <span>{item.submissionsCount} submissions</span>
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* Card Actions Bottom */}
                  <div className="mt-6 pt-4 border-t border-stone-850 flex items-center justify-between text-xs text-stone-500">
                    <span className="text-[9px] uppercase tracking-wider text-stone-600">
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
                        className={`p-1.5 rounded border border-stone-800 text-stone-400 hover:text-amber-400 hover:border-amber-900/60 transition-all cursor-pointer ${
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
                        className={`p-1.5 rounded border border-stone-800 text-stone-400 hover:text-red-400 hover:border-red-950/60 transition-all cursor-pointer ${
                          isShade || isForger ? "opacity-35 cursor-not-allowed" : ""
                        }`}
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Launch Builder */}
                      <button
                        onClick={() => router.push(`/dashboard/forms/${item.id}/build`)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 bg-stone-900/60 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white rounded text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer"
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
          <div className="relative border border-dashed border-stone-800 rounded-lg p-16 flex flex-col items-center justify-center text-center space-y-6 bg-stone-900/10 backdrop-blur-[2px] overflow-hidden max-w-3xl mx-auto">
            {/* Spinning totem wireframe */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute w-24 h-24 border border-dashed border-stone-800 rounded-full animate-[spin_10s_linear_infinite]" />
              <div className="absolute w-16 h-16 border border-stone-800 rotate-45 animate-[pulse_2s_ease-in-out_infinite]" />
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_12px_#10b981]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-light text-stone-300 font-cormorant tracking-wide">
                Limbo Subconscious Layer detected
              </h3>
              <p className="text-xs text-stone-500 uppercase tracking-widest max-w-md mx-auto leading-relaxed">
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
          <div className="bg-stone-900 border border-stone-800 rounded-lg p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-light text-stone-100 mb-6 font-cormorant tracking-wider uppercase border-b border-stone-800 pb-2">
              Project New Dreamscape Layer
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[9px] text-stone-500 uppercase tracking-wider block">
                  Dreamscape Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Limbo Registration"
                  value={newTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-850 rounded px-3 py-2 text-sm text-stone-200 placeholder-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-stone-500 uppercase tracking-wider block">
                  Subconscious Slug / Path URL
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-stone-600 text-xs select-none">/f/</span>
                  <input
                    type="text"
                    required
                    placeholder="limbo-registration"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    className="w-full bg-stone-950 border border-stone-850 rounded pl-10 pr-3 py-2 text-sm text-stone-200 placeholder-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-stone-500 uppercase tracking-wider block">
                  Visibility Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewVisibility("public")}
                    className={`py-2 text-xs border rounded transition-all cursor-pointer font-semibold ${
                      newVisibility === "public"
                        ? "bg-emerald-950/20 border-emerald-500 text-emerald-400"
                        : "bg-stone-950 border-stone-850 text-stone-500 hover:text-stone-300"
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
                        : "bg-stone-950 border-stone-850 text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    UNLISTED
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-stone-800/60 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-950 hover:bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 rounded text-xs tracking-wider uppercase transition-colors cursor-pointer"
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
