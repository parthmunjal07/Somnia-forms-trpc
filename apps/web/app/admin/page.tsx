"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "~/lib/store";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { ArrowLeft, ShieldAlert, Users, Layers, Trash2, Ban, UserCheck, RefreshCw } from "lucide-react";
import { AuthGuard } from "~/components/AuthGuard";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"users" | "forms">("users");

  const utils = trpc.useUtils();

  // Queries
  const { data: users, isLoading: isUsersLoading } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: user?.role === "THE_EXTRACTOR" || user?.role === "THE_DREAMER",
  });
  const { data: forms, isLoading: isFormsLoading } = trpc.admin.listAllForms.useQuery(undefined, {
    enabled: user?.role === "THE_EXTRACTOR" || user?.role === "THE_DREAMER",
  });

  // Mutations
  const changeRoleMutation = trpc.admin.changeRole.useMutation({
    onSuccess: () => {
      toast.success("Operative security role updated.");
      utils.admin.listUsers.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to update role."),
  });

  const toggleSuspendMutation = trpc.admin.toggleSuspend.useMutation({
    onSuccess: () => {
      toast.success("Operative suspension state toggled.");
      utils.admin.listUsers.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to toggle suspension state."),
  });

  const deleteFormMutation = trpc.admin.deleteForm.useMutation({
    onSuccess: () => {
      toast.success("Dreamscape layer collapsed successfully.");
      utils.admin.listAllForms.invalidate();
      utils.admin.listUsers.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to collapse dreamscape."),
  });

  // Authorization check
  const isAuthorized = user?.role === "THE_EXTRACTOR" || user?.role === "THE_DREAMER";

  if (!isAuthorized) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#0A0A0F] text-[#EEF3F8] font-mono flex flex-col items-center justify-center p-6 select-none">
          <div className="max-w-md w-full border border-red-950/60 bg-[#12121A] p-8 rounded-lg text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.05)]">
            <div className="mx-auto w-14 h-14 rounded border border-red-900/50 bg-red-950/20 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <ShieldAlert size={26} className="animate-pulse" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-light font-cormorant tracking-wider uppercase text-red-400 font-bold">
                Access Denied
              </h2>
              <p className="text-[10px] text-red-500 uppercase tracking-[0.25em] font-semibold">
                Gated Construct: Extractor Eyes Only
              </p>
              <p className="text-xs text-[#8BA3BF]/80 uppercase tracking-widest leading-relaxed pt-2">
                This panel controls active client entities, role badges, and dreamscape projections. Observer or Architect accounts do not hold the required keys.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full py-3 bg-[#0A0A0F] hover:bg-stone-900 border border-[rgba(200,216,232,0.1)] text-xs font-bold uppercase tracking-widest text-[#8BA3BF] rounded transition-all cursor-pointer inline-flex items-center justify-center space-x-2"
              >
                <ArrowLeft size={13} />
                <span>Wake Up to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0A0A0F] text-[#EEF3F8] font-mono flex flex-col relative selection:bg-[#C9933A]/20 selection:text-[#E8B455]">
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
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 rounded border border-[rgba(200,216,232,0.1)] text-[#8BA3BF]/80 hover:text-[#EEF3F8] hover:border-[#C9933A]/30 transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <h1 className="text-xl font-light text-[#C9933A] font-cormorant tracking-wide">
                The Extractor Panel
              </h1>
              <p className="text-[8px] text-[#8BA3BF]/80 uppercase tracking-widest mt-0.5">
                Centralized Subconscious Management Console
              </p>
            </div>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 z-10">
          {/* Navigation tabs */}
          <div className="flex border-b border-[rgba(200,216,232,0.1)] gap-4 select-none">
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-4 px-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
                activeTab === "users"
                  ? "border-[#C9933A] text-white"
                  : "border-transparent text-[#8BA3BF]/60 hover:text-white"
              }`}
            >
              <Users size={14} />
              <span>Operative Directory</span>
            </button>
            <button
              onClick={() => setActiveTab("forms")}
              className={`pb-4 px-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
                activeTab === "forms"
                  ? "border-[#C9933A] text-white"
                  : "border-transparent text-[#8BA3BF]/60 hover:text-white"
              }`}
            >
              <Layers size={14} />
              <span>Dreamscapes Registry</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "users" ? (
            <section className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-light text-stone-100 font-cormorant tracking-wider">Operative Directory</h3>
                <p className="text-xs text-[#8BA3BF]/80 uppercase tracking-widest">Inspect entities, roles, projected layers, and signal counts</p>
              </div>

              {isUsersLoading ? (
                <div className="h-48 bg-stone-900/30 border border-stone-850 rounded animate-pulse" />
              ) : users && users.length > 0 ? (
                <div className="border border-[rgba(200,216,232,0.1)] rounded overflow-hidden bg-stone-950/20 backdrop-blur-[2px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0A0A0F]/80 border-b border-[rgba(200,216,232,0.1)] text-[#8BA3BF] text-[9px] uppercase tracking-widest font-bold">
                        <th className="p-4">Operative Identity</th>
                        <th className="p-4">Assigned Role Badge</th>
                        <th className="p-4 text-center">Forms projected</th>
                        <th className="p-4 text-center">Signals Extracted</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u: any) => {
                        const isSelf = u.id === user?.id;
                        const isDemo = u.email === "demo@somnia.io";

                        return (
                          <tr key={u.id} className="border-b border-[rgba(200,216,232,0.1)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded bg-gradient-to-br from-stone-800 to-stone-950 border border-stone-850 flex items-center justify-center text-xs text-[#C9933A] uppercase font-bold">
                                  {u.fullName.slice(0, 2)}
                                </div>
                                <div>
                                  <p className="font-semibold text-stone-200">{u.fullName} {isSelf && <span className="text-[8px] text-[#C9933A] border border-[#C9933A]/30 px-1 py-0.5 rounded ml-1 tracking-widest">YOU</span>}</p>
                                  <p className="text-[10px] text-[#8BA3BF]/60 mt-0.5">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <select
                                disabled={isSelf || isDemo || changeRoleMutation.isPending}
                                value={u.role}
                                onChange={(e) => {
                                  if (confirm(`Alter role of ${u.fullName} to ${e.target.value}?`)) {
                                    changeRoleMutation.mutate({ userId: u.id, role: e.target.value as any });
                                  }
                                }}
                                className="bg-[#0A0A0F] border border-stone-850 text-stone-300 px-2 py-1 rounded text-xs focus:outline-none focus:border-[#C9933A] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                              >
                                <option value="THE_DREAMER">THE_DREAMER</option>
                                <option value="THE_EXTRACTOR">THE_EXTRACTOR</option>
                                <option value="THE_ARCHITECT">THE_ARCHITECT</option>
                                <option value="THE_FORGER">THE_FORGER</option>
                                <option value="THE_SHADE">THE_SHADE</option>
                              </select>
                            </td>
                            <td className="p-4 text-center font-bold text-stone-200">{u.formCount}</td>
                            <td className="p-4 text-center font-bold text-[#C9933A]">{u.signalCount}</td>
                            <td className="p-4 text-center">
                              {u.isSuspended ? (
                                <span className="px-2 py-0.5 rounded border border-red-950/60 bg-red-950/20 text-red-400 text-[8px] uppercase tracking-wider font-bold">
                                  Suspended
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded border border-emerald-950/60 bg-emerald-950/20 text-emerald-400 text-[8px] uppercase tracking-wider font-bold">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                disabled={isSelf || isDemo || toggleSuspendMutation.isPending}
                                onClick={() => {
                                  if (confirm(`Suspend/Activate user account: ${u.fullName}?`)) {
                                    toggleSuspendMutation.mutate({ userId: u.id });
                                  }
                                }}
                                className={`px-2.5 py-1 rounded border text-[10px] uppercase font-bold tracking-wider cursor-pointer inline-flex items-center space-x-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none ${
                                  u.isSuspended
                                    ? "border-emerald-900/60 bg-emerald-950/15 text-emerald-400 hover:bg-emerald-900/30 font-bold"
                                    : "border-red-900/60 bg-red-950/15 text-red-400 hover:bg-red-900/30 font-bold"
                                }`}
                              >
                                {u.isSuspended ? <UserCheck size={11} /> : <Ban size={11} />}
                                <span>{u.isSuspended ? "Restore" : "Suspend"}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 border border-dashed border-stone-850 rounded text-center text-[#8BA3BF]/50">No users found.</div>
              )}
            </section>
          ) : (
            <section className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-light text-stone-100 font-cormorant tracking-wider">Dreamscapes Registry</h3>
                <p className="text-xs text-[#8BA3BF]/80 uppercase tracking-widest">Global list of active subconscious layers projected across the system</p>
              </div>

              {isFormsLoading ? (
                <div className="h-48 bg-stone-900/30 border border-stone-850 rounded animate-pulse" />
              ) : forms && forms.length > 0 ? (
                <div className="border border-[rgba(200,216,232,0.1)] rounded overflow-hidden bg-stone-950/20 backdrop-blur-[2px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0A0A0F]/80 border-b border-[rgba(200,216,232,0.1)] text-[#8BA3BF] text-[9px] uppercase tracking-widest font-bold">
                        <th className="p-4">Dreamscape / Layer Title</th>
                        <th className="p-4">Owner Operative</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Extracted Signals</th>
                        <th className="p-4">Created Date</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forms.map((f: any) => (
                        <tr key={f.id} className="border-b border-[rgba(200,216,232,0.1)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                          <td className="p-4 font-bold text-stone-200">
                            <div>
                              <p className="tracking-wide text-sm">{f.title}</p>
                              <p className="text-[10px] text-[#8BA3BF]/50 mt-0.5 select-all">/f/{f.slug}</p>
                            </div>
                          </td>
                          <td className="p-4 text-[#8BA3BF]">
                            <div>
                              <p>{f.ownerName}</p>
                              <p className="text-[10px] text-[#8BA3BF]/50 mt-0.5">{f.ownerEmail}</p>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-[10px] tracking-widest uppercase px-1.5 py-0.5 rounded font-bold border ${
                              f.status === "published"
                                ? "bg-[#C9933A]/10 border-[#C9933A]/30 text-[#C9933A]"
                                : "bg-amber-950/20 border-amber-900/60 text-amber-400"
                            }`}>
                              {f.status}
                            </span>
                          </td>
                          <td className="p-4 text-center font-bold text-stone-200">{f.submissionsCount}</td>
                          <td className="p-4 text-[#8BA3BF]">{new Date(f.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 text-right">
                            <button
                              disabled={deleteFormMutation.isPending}
                              onClick={() => {
                                if (confirm(`Permanently collapse and erase dreamscape "${f.title}"? This cannot be undone.`)) {
                                  deleteFormMutation.mutate({ formId: f.id });
                                }
                              }}
                              className="p-2 text-stone-500 hover:text-red-400 hover:bg-red-950/15 border border-transparent hover:border-red-900/40 rounded transition-colors cursor-pointer inline-flex items-center space-x-1 font-bold select-none disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Trash2 size={13} />
                              <span className="text-[10px] uppercase tracking-wider">Collapse</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 border border-dashed border-stone-850 rounded text-center text-[#8BA3BF]/50">No dreamscapes projected.</div>
              )}
            </section>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
