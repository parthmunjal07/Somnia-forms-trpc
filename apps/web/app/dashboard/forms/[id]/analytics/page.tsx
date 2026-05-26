"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "~/lib/store";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Send,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldAlert,
  Info,
  Layers,
} from "lucide-react";

// Recharts components (safely imported, rendered only after mount to avoid NextJS SSR mismatch)
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";




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

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useAuthStore();
  const utils = trpc.useUtils();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [completedOnly, setCompletedOnly] = useState(false);
  const [offset, setOffset] = useState(0);
  const [expandedResponseId, setExpandedResponseId] = useState<string | null>(null);

  // Pagination Limit
  const LIMIT = 10;

  // Compile filters object
  const filters = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    completed: completedOnly ? true : undefined,
  };

  // Queries
  const { data: form, isLoading: isFormLoading } = trpc.forms.getById.useQuery({ id });
  const { data: fields, isLoading: isFieldsLoading } = trpc.fields.list.useQuery({ formId: id });
  const { data: collaborators, isLoading: isCollabLoading } = trpc.collaborators.list.useQuery({ formId: id });

  const {
    data: summary,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = trpc.analytics.getSummary.useQuery({ formId: id, ...filters });

  const {
    data: dropoffs,
    isLoading: isDropoffsLoading,
  } = trpc.analytics.getFieldDropoffs.useQuery({ formId: id, ...filters });

  const {
    data: dailyStats,
    isLoading: isDailyStatsLoading,
  } = trpc.analytics.getDailyStats.useQuery({ formId: id, ...filters });

  const {
    data: distributions,
    isLoading: isDistributionsLoading,
  } = trpc.analytics.getFieldDistributions.useQuery({ formId: id, ...filters });

  const {
    data: responsesData,
    isLoading: isResponsesLoading,
  } = trpc.responses.list.useQuery({
    formId: id,
    limit: LIMIT,
    cursor: offset.toString(),
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    completed: completedOnly ? true : undefined,
  });

  // Reset pagination on filter change
  const handleFilterChange = () => {
    setOffset(0);
    setExpandedResponseId(null);
  };

  // Determine User Role
  const userRoleOnForm = form
    ? form.userId === user?.id
      ? "THE_ARCHITECT"
      : (collaborators?.find((c: any) => c.userId === user?.id)?.role ?? "THE_SHADE")
    : "THE_SHADE";

  const isShade = userRoleOnForm === "THE_SHADE" || summaryError?.message.includes("Access Revoked");

  // Export CSV Handler
  const [isExporting, setIsExporting] = useState(false);
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csvContent = await utils.client.responses.exportCSV.query({
        formId: id,
        ...filters,
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `projection_responses_${form?.slug || id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Projection record exported successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to export projection records.");
    } finally {
      setIsExporting(false);
    }
  };

  // Render Access Revoked screen for THE_SHADE
  if (isShade && !isFormLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-[#EEF3F8] font-mono flex flex-col items-center justify-center p-6 select-none relative">
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

        <div className="max-w-md w-full border border-red-950/60 bg-stone-900/30 p-8 rounded-lg text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.05)] animate-in fade-in slide-in-from-bottom-6 duration-500">
          <div className="mx-auto w-14 h-14 rounded border border-red-900/50 bg-red-950/20 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <ShieldAlert size={26} className="animate-pulse" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-light font-cormorant tracking-wider uppercase text-red-400">
              Access Revoked
            </h2>
            <p className="text-[10px] text-red-500 uppercase tracking-[0.25em] font-semibold">
              Security Level Cleared: Blocked
            </p>
            <p className="text-xs text-[#8BA3BF]/80 uppercase tracking-widest leading-relaxed pt-2">
              As <strong className="text-[#8BA3BF]">THE_SHADE</strong>, you possess read-only observation rights. Deep cognitive analytics data is restricted to authorized Extractors and Architects.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 bg-[#0A0A0F] hover:bg-stone-900 border border-[rgba(200,216,232,0.1)] hover:border-red-950 text-xs font-bold uppercase tracking-widest text-[#8BA3BF] hover:text-red-400 rounded transition-all cursor-pointer inline-flex items-center justify-center space-x-2"
            >
              <ArrowLeft size={13} />
              <span>Wake Up to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loader state
  const isGlobalLoading = isFormLoading || isSummaryLoading || isFieldsLoading || isCollabLoading;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#EEF3F8] font-mono flex flex-col selection:bg-[#C9933A]/20 selection:text-[#E8B455] relative">
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

      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-[rgba(10,10,15,0.75)] backdrop-blur-[12px] border-b border-[rgba(200,216,232,0.1)] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <button
            onClick={() => router.push(`/dashboard/forms/${id}/build`)}
            className="p-2 rounded border border-[rgba(200,216,232,0.1)] text-[#8BA3BF]/80 hover:text-[#EEF3F8] hover:border-[#C9933A]/30 transition-all cursor-pointer"
            title="Back to Builder"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="truncate">
            <h1 className="text-xl font-light text-[#C9933A] truncate font-cormorant tracking-wide">
              {form?.title ?? "Dreamscape Analytics"}
            </h1>
            <p className="text-[8px] text-[#8BA3BF]/80 uppercase tracking-widest mt-0.5">
              THE PROJECTION / LAYER DEPTH LEVEL SECURE ACCESS
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={isExporting || isGlobalLoading || !summary?.submissionsCount}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#C9933A]/10 hover:bg-[#C9933A]/20 text-[#C9933A] border border-[#C9933A]/30 hover:border-[#C9933A]/60 px-4 py-2.5 rounded text-xs font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none"
        >
          <Download size={14} />
          <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 z-10">

        {/* Filter Bar */}
        <section className="bg-[rgba(255,255,255,0.02)] border border-[rgba(200,216,232,0.1)] p-5 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-[#8BA3BF]">
            <Filter size={14} className="text-[#C9933A]" />
            <h3 className="text-xs uppercase tracking-wider font-semibold">Filter Projection Layer</h3>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Start Date */}
            <div className="flex items-center bg-[#0A0A0F] border border-[rgba(200,216,232,0.1)] rounded px-3 py-2 space-x-2">
              <Calendar size={13} className="text-[#8BA3BF]/50" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  handleFilterChange();
                }}
                className="bg-transparent border-none text-xs text-[#EEF3F8] focus:outline-none focus:ring-0 w-full sm:w-28 uppercase"
                placeholder="Start Date"
              />
            </div>

            {/* End Date */}
            <div className="flex items-center bg-[#0A0A0F] border border-[rgba(200,216,232,0.1)] rounded px-3 py-2 space-x-2">
              <Calendar size={13} className="text-[#8BA3BF]/50" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  handleFilterChange();
                }}
                className="bg-transparent border-none text-xs text-[#EEF3F8] focus:outline-none focus:ring-0 w-full sm:w-28 uppercase"
                placeholder="End Date"
              />
            </div>

            {/* Completed Toggle */}
            <button
              onClick={() => {
                setCompletedOnly(!completedOnly);
                handleFilterChange();
              }}
              className={`px-4 py-2 rounded border text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                completedOnly
                  ? "bg-amber-950/20 border-amber-500 text-[#C9933A]"
                  : "bg-[#0A0A0F] border-[rgba(200,216,232,0.1)] text-[#8BA3BF]/80 hover:text-[#EEF3F8]"
              }`}
            >
              Completed Only
            </button>
          </div>
        </section>

        {isGlobalLoading ? (
          // Skeletons
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-24 bg-[rgba(255,255,255,0.02)] border border-[rgba(200,216,232,0.1)] rounded-lg p-5" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-80 bg-[rgba(255,255,255,0.02)] border border-[rgba(200,216,232,0.1)] rounded-lg" />
              <div className="h-80 bg-[rgba(255,255,255,0.02)] border border-[rgba(200,216,232,0.1)] rounded-lg" />
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Signals (Submissions) */}
              <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(200,216,232,0.1)] p-5 rounded-lg space-y-2 relative overflow-hidden group hover:border-[#C9933A]/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-[#8BA3BF] group-hover:scale-110 transition-transform">
                  <Send size={48} />
                </div>
                <p className="text-[9px] uppercase tracking-widest text-[#8BA3BF]/80 font-bold">Total Signals</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-light text-[#C9933A] font-cormorant tracking-wide">
                    {summary?.submissionsCount ?? 0}
                  </span>
                  <span className="text-[9px] text-[#8BA3BF]/50">records</span>
                </div>
                <p className="text-[8px] text-[#8BA3BF]/80 uppercase tracking-wider">Submissions captured</p>
              </div>

              {/* Total Dreamers Reached (Views) */}
              <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(200,216,232,0.1)] p-5 rounded-lg space-y-2 relative overflow-hidden group hover:border-[#C9933A]/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-[#8BA3BF] group-hover:scale-110 transition-transform">
                  <Eye size={48} />
                </div>
                <p className="text-[9px] uppercase tracking-widest text-[#8BA3BF]/80 font-bold">Dreamers Reached</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-light text-[#C9933A] font-cormorant tracking-wide">
                    {summary?.viewsCount ?? 0}
                  </span>
                  <span className="text-[9px] text-[#8BA3BF]/50">visits</span>
                </div>
                <p className="text-[8px] text-[#8BA3BF]/80 uppercase tracking-wider">Aggregate view count</p>
              </div>

              {/* Completion Rate */}
              <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(200,216,232,0.1)] p-5 rounded-lg space-y-2 relative overflow-hidden group hover:border-[#C9933A]/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-[#8BA3BF] group-hover:scale-110 transition-transform">
                  <TrendingUp size={48} />
                </div>
                <p className="text-[9px] uppercase tracking-widest text-[#8BA3BF]/80 font-bold">Completion Rate</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-light text-[#C9933A] font-cormorant tracking-wide">
                    {summary && summary.viewsCount > 0
                      ? Math.round((summary.submissionsCount / summary.viewsCount) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <p className="text-[8px] text-[#8BA3BF]/80 uppercase tracking-wider">Signals / Reached ratio</p>
              </div>

              {/* Avg Time to Complete */}
              <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(200,216,232,0.1)] p-5 rounded-lg space-y-2 relative overflow-hidden group hover:border-[#C9933A]/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-[#8BA3BF] group-hover:scale-110 transition-transform">
                  <Clock size={48} />
                </div>
                <p className="text-[9px] uppercase tracking-widest text-[#8BA3BF]/80 font-bold">Avg Stabilize Time</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-light text-[#C9933A] font-cormorant tracking-wide">
                    {summary?.avgTimeToComplete ?? "--"}
                  </span>
                  <span className="text-[9px] text-[#8BA3BF]/50">{summary?.avgTimeToComplete ? "sec" : "no data"}</span>
                </div>
                <p className="text-[8px] text-[#8BA3BF]/80 uppercase tracking-wider">Mean projection duration</p>
              </div>

              {/* Drop-off Rate */}
              <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(200,216,232,0.1)] p-5 rounded-lg space-y-2 relative overflow-hidden group hover:border-[#C9933A]/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-[#8BA3BF] group-hover:scale-110 transition-transform">
                  <XCircle size={48} />
                </div>
                <p className="text-[9px] uppercase tracking-widest text-[#8BA3BF]/80 font-bold">Drop-off Rate</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-light text-[#C9933A] font-cormorant tracking-wide">
                    {summary && summary.viewsCount > 0
                      ? 100 - Math.round((summary.submissionsCount / summary.viewsCount) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <p className="text-[8px] text-[#8BA3BF]/80 uppercase tracking-wider">Unstabilized views ratio</p>
              </div>
            </section>

            {/* Charts Section */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chronological 30-Day Line Chart */}
              <div className="lg:col-span-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(200,216,232,0.1)] p-6 rounded-lg flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs uppercase tracking-wider font-semibold text-[#EEF3F8]">Chronological Wave</h3>
                    <p className="text-[8px] text-[#8BA3BF]/80 uppercase tracking-widest mt-0.5">Views vs Submissions timeline</p>
                  </div>
                  <div className="flex items-center space-x-4 text-[9px] uppercase tracking-widest">
                    <span className="flex items-center space-x-1.5 font-bold">
                      <span className="w-2.5 h-0.5 bg-[#8BA3BF] inline-block" />
                      <span className="text-[#8BA3BF]">Views</span>
                    </span>
                    <span className="flex items-center space-x-1.5 font-bold">
                      <span className="w-2.5 h-0.5 bg-[#C9933A] inline-block" />
                      <span className="text-[#C9933A]">Submissions</span>
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full text-xs">
                  {isMounted && dailyStats && dailyStats.length > 0 ? (
                    <ResponsiveContainer width="99%" height="100%">
                      <LineChart data={dailyStats} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,216,232,0.05)" />
                        <XAxis dataKey="date" stroke="rgba(200,216,232,0.2)" tickFormatter={(str) => str.slice(5)} />
                        <YAxis stroke="rgba(200,216,232,0.2)" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0A0A0F", borderColor: "rgba(200,216,232,0.1)", color: "#EEF3F8", fontFamily: "monospace" }}
                          itemStyle={{ fontSize: "10px" }}
                          labelStyle={{ fontSize: "10px", color: "#8BA3BF", marginBottom: "4px" }}
                        />
                        <Line type="monotone" dataKey="views" stroke="#8BA3BF" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="submissions" stroke="#C9933A" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[#8BA3BF]/80 text-[10px] uppercase tracking-widest">
                      Chronological data unavailable
                    </div>
                  )}
                </div>
              </div>

              {/* Completion Funnel Drop-off */}
              <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(200,216,232,0.1)] p-6 rounded-lg flex flex-col space-y-4 justify-between">
                <div>
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-[#EEF3F8]">Completion Funnel</h3>
                  <p className="text-[8px] text-[#8BA3BF]/80 uppercase tracking-widest mt-0.5">Field-level drop-off analysis</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-64">
                  {dropoffs && dropoffs.length > 0 ? (
                    dropoffs.map((field: any, idx: any) => {
                      const percentage = field.total > 0 ? Math.round((field.filled / field.total) * 100) : 0;
                      return (
                        <div key={field.fieldId} className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-medium text-[#EEF3F8] truncate max-w-[70%]">
                              {idx + 1}. {field.label}
                            </span>
                            <span className="text-[#8BA3BF]/80 uppercase font-semibold">
                              {field.filled}/{field.total} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-[#0A0A0F] border border-[rgba(200,216,232,0.1)] h-2.5 rounded-full overflow-hidden p-0.5">
                            <div
                              style={{ width: `${percentage}%` }}
                              className="bg-gradient-to-r from-amber-600 to-amber-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(201,147,58,0.2)]"
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center text-[#8BA3BF]/80 text-[10px] uppercase tracking-widest">
                      Funnel drop-off data unavailable
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Answer Distributions Grid */}
            <section className="bg-[rgba(255,255,255,0.02)] border border-[rgba(200,216,232,0.1)] p-6 rounded-lg space-y-6">
              <div>
                <h3 className="text-xs uppercase tracking-wider font-semibold text-[#EEF3F8]">Parameter Distribution</h3>
                <p className="text-[8px] text-[#8BA3BF]/80 uppercase tracking-widest mt-0.5">Response patterns for select and rating fields</p>
              </div>

              {distributions && Object.keys(distributions).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(distributions).map(([fieldId, dist]: [string, any]) => {
                    const fieldDef = fields?.find((f: any) => f.id === fieldId);
                    if (!fieldDef) return null;

                    // Calculate total counts for percentage
                    const totalResponses = dist.reduce((acc: any, curr: any) => acc + curr.count, 0);

                    return (
                      <div key={fieldId} className="border border-[rgba(200,216,232,0.1)] bg-[#0A0A0F]/20 p-4 rounded space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold text-[#EEF3F8] truncate">{fieldDef.label}</h4>
                          <span className="text-[8px] text-[#8BA3BF]/80 uppercase tracking-wider">{fieldDef.type.replace("_", " ")}</span>
                        </div>

                        <div className="space-y-2.5">
                          {dist.map((option: any) => {
                            const percent = totalResponses > 0 ? Math.round((option.count / totalResponses) * 100) : 0;
                            return (
                              <div key={option.value} className="space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-[#8BA3BF] truncate max-w-[70%]">{option.value}</span>
                                  <span className="text-[#8BA3BF]/80 uppercase font-semibold">
                                    {option.count} ({percent}%)
                                  </span>
                                </div>
                                <div className="w-full bg-[#0A0A0F] h-1.5 rounded overflow-hidden">
                                  <div
                                    style={{ width: `${percent}%` }}
                                    className="bg-stone-600 h-full rounded transition-all duration-500"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-[#8BA3BF]/80 text-[10px] uppercase tracking-widest">
                  No parameter distribution charts available for this dreamscape
                </div>
              )}
            </section>

            {/* Expandable Responses List Table */}
            <section className="bg-[rgba(255,255,255,0.02)] border border-[rgba(200,216,232,0.1)] rounded-lg p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-[#EEF3F8]">Stabilized Signals Record</h3>
                  <p className="text-[8px] text-[#8BA3BF]/80 uppercase tracking-widest mt-0.5">Chronological list of captured responses</p>
                </div>
              </div>

              {responsesData?.items && responsesData.items.length > 0 ? (
                <div className="space-y-4">
                  <div className="border border-[rgba(200,216,232,0.1)] rounded overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#0A0A0F]/80 border-b border-[rgba(200,216,232,0.1)] text-[#8BA3BF] text-[9px] uppercase tracking-widest font-bold">
                          <th className="p-4 w-12 text-center" />
                          <th className="p-4">Submission ID</th>
                          <th className="p-4">Submitted At</th>
                          <th className="p-4 text-center">Stability</th>
                          <th className="p-4 text-right">Completion Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {responsesData.items.map((resp: any) => {
                          const isExpanded = expandedResponseId === resp.id;
                          return (
                            <React.Fragment key={resp.id}>
                              <tr
                                onClick={() => setExpandedResponseId(isExpanded ? null : resp.id)}
                                className="border-b border-[rgba(200,216,232,0.1)] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer"
                              >
                                <td className="p-4 text-center text-[#8BA3BF]/80">
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </td>
                                <td className="p-4 font-bold text-[#EEF3F8] font-mono tracking-wider">
                                  {resp.id.slice(0, 8)}...
                                </td>
                                <td className="p-4 text-[#8BA3BF]">
                                  {new Date(resp.submittedAt).toLocaleString()}
                                </td>
                                <td className="p-4 text-center">
                                  {resp.isComplete ? (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded border border-emerald-900/60 bg-emerald-950/20 text-emerald-400 text-[8px] uppercase tracking-wider font-bold">
                                      <CheckCircle2 size={10} />
                                      <span>Stable</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded border border-amber-900/60 bg-amber-950/20 text-[#C9933A] text-[8px] uppercase tracking-wider font-bold">
                                      <Info size={10} className="animate-pulse" />
                                      <span>Unstable</span>
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-right font-semibold text-[#EEF3F8]">
                                  {resp.timeToComplete !== null ? `${resp.timeToComplete} sec` : "--"}
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr className="bg-[#0A0A0F]/40 border-b border-[rgba(200,216,232,0.1)]">
                                  <td colSpan={5} className="p-6">
                                    <div className="space-y-4 max-w-4xl animate-in fade-in slide-in-from-top-2 duration-200">
                                      <div className="flex items-center space-x-2 text-[#8BA3BF]/80 text-[9px] uppercase tracking-widest border-b border-[rgba(200,216,232,0.1)] pb-2">
                                        <Layers size={10} />
                                        <span>Projection Variables Decoded</span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {fields && fields.length > 0 ? (
                                          fields.map((field: any) => {
                                            const val = (resp.responseValues as Record<string, any>)[field.id];
                                            let renderedVal = "";
                                            if (val === undefined || val === null || val === "") {
                                              renderedVal = "--";
                                            } else if (Array.isArray(val)) {
                                              renderedVal = val.join(", ");
                                            } else if (typeof val === "boolean") {
                                              renderedVal = val ? "CONFIRMED (YES)" : "DECLINED (NO)";
                                            } else {
                                              renderedVal = String(val);
                                            }

                                            const isSelectOrRating = ["single_select", "multi_select", "rating"].includes(field.type);
                                            const dist = distributions?.[field.id];

                                            return (
                                              <div key={field.id} className="space-y-1.5">
                                                <span className="text-[9px] text-[#8BA3BF]/80 uppercase tracking-wider block">
                                                  {field.label} {field.required && <span className="text-[#E8B455]">*</span>}
                                                </span>
                                                <p className="text-xs text-[#EEF3F8] bg-[#0A0A0F] border border-[rgba(200,216,232,0.1)]/60 p-2.5 rounded font-mono whitespace-pre-wrap leading-relaxed">
                                                  {renderedVal}
                                                </p>
                                                {isSelectOrRating && dist && dist.length > 0 && (
                                                  <div className="mt-2 p-3 bg-[#0A0A0F]/60 border border-[rgba(200,216,232,0.05)] rounded space-y-2">
                                                    <span className="text-[8px] text-[#8BA3BF]/60 uppercase tracking-widest block font-bold">
                                                      Distribution Wave (Highlighted is user answer)
                                                    </span>
                                                    <div className="space-y-2">
                                                      {(() => {
                                                        const total = dist.reduce((sum: number, d: any) => sum + d.count, 0);
                                                        return dist.map((option: any) => {
                                                          const percent = total > 0 ? Math.round((option.count / total) * 100) : 0;
                                                          const isChosen = Array.isArray(val)
                                                            ? val.map(String).includes(String(option.value))
                                                            : val !== undefined && val !== null && val !== "" && String(val) === String(option.value);

                                                          return (
                                                            <div key={option.value} className="space-y-1">
                                                              <div className="flex justify-between items-center text-[9px]">
                                                                <span className={`truncate max-w-[70%] font-mono ${isChosen ? "text-[#C9933A] font-bold" : "text-[#8BA3BF]/80"}`}>
                                                                  {option.value} {isChosen && "◀"}
                                                                </span>
                                                                <span className={`font-semibold ${isChosen ? "text-[#C9933A]" : "text-[#8BA3BF]/60"}`}>
                                                                  {option.count} ({percent}%)
                                                                </span>
                                                              </div>
                                                              <div className="w-full bg-[#0A0A0F] h-1.5 rounded overflow-hidden p-[1px] border border-[rgba(200,216,232,0.05)]">
                                                                <div
                                                                  style={{ width: `${percent}%` }}
                                                                  className={`h-full rounded transition-all duration-500 ${
                                                                    isChosen
                                                                      ? "bg-[#C9933A] shadow-[0_0_8px_rgba(201,147,58,0.4)]"
                                                                      : "bg-stone-800"
                                                                  }`}
                                                                />
                                                              </div>
                                                            </div>
                                                          );
                                                        });
                                                      })()}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <p className="text-[#8BA3BF]/50 italic">No fields projected in this layer.</p>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between text-xs text-[#8BA3BF]/80 pt-2 select-none">
                    <div>
                      Showing <strong className="text-[#EEF3F8]">{offset + 1}</strong> -{" "}
                      <strong className="text-[#EEF3F8]">
                        {offset + (responsesData?.items.length ?? 0)}
                      </strong>{" "}
                      of active records
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setOffset((prev) => Math.max(0, prev - LIMIT))}
                        disabled={offset === 0}
                        className="p-2 border border-[rgba(200,216,232,0.1)] rounded bg-[#0A0A0F] text-[#8BA3BF] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center space-x-1 font-bold uppercase tracking-wider text-[10px]"
                      >
                        <ChevronLeft size={12} />
                        <span>Prev</span>
                      </button>

                      <button
                        onClick={() => setOffset((prev) => prev + LIMIT)}
                        disabled={!responsesData?.nextCursor}
                        className="p-2 border border-[rgba(200,216,232,0.1)] rounded bg-[#0A0A0F] text-[#8BA3BF] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center space-x-1 font-bold uppercase tracking-wider text-[10px]"
                      >
                        <span>Next</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 border border-dashed border-[rgba(200,216,232,0.1)] rounded-lg text-center text-[#8BA3BF]/80 text-[10px] uppercase tracking-widest">
                  No stabilized records match the filter criteria
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
