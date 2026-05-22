"use client";

import React, { useState, useEffect, use } from "react";
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
  } = trpc.analytics.getSummary.useQuery({ formId: id, filters });

  const {
    data: dropoffs,
    isLoading: isDropoffsLoading,
  } = trpc.analytics.getFieldDropoffs.useQuery({ formId: id, filters });

  const {
    data: dailyStats,
    isLoading: isDailyStatsLoading,
  } = trpc.analytics.getDailyStats.useQuery({ formId: id, filters });

  const {
    data: distributions,
    isLoading: isDistributionsLoading,
  } = trpc.analytics.getFieldDistributions.useQuery({ formId: id, filters });

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
      : (collaborators?.find((c) => c.userId === user?.id)?.role ?? "THE_SHADE")
    : "THE_SHADE";

  const isShade = userRoleOnForm === "THE_SHADE" || summaryError?.message.includes("Access Revoked");

  // Export CSV Handler
  const [isExporting, setIsExporting] = useState(false);
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csvContent = await utils.client.responses.exportCSV.query({
        formId: id,
        filters,
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
      <div className="min-h-screen bg-stone-950 text-stone-200 font-mono flex flex-col items-center justify-center p-6 select-none relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

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
            <p className="text-xs text-stone-500 uppercase tracking-widest leading-relaxed pt-2">
              As <strong className="text-stone-400">THE_SHADE</strong>, you possess read-only observation rights. Deep cognitive analytics data is restricted to authorized Extractors and Architects.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 bg-stone-950 hover:bg-stone-900 border border-stone-850 hover:border-red-950 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-red-400 rounded transition-all cursor-pointer inline-flex items-center justify-center space-x-2"
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
    <div className="min-h-screen bg-stone-950 text-stone-200 font-mono flex flex-col selection:bg-amber-500/30 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-stone-900/45 backdrop-blur-xl border-b border-stone-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <button
            onClick={() => router.push(`/dashboard/forms/${id}/build`)}
            className="p-2 rounded border border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-700 transition-all cursor-pointer"
            title="Back to Builder"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="truncate">
            <h1 className="text-xl font-light text-stone-100 truncate font-cormorant tracking-wide">
              {form?.title ?? "Dreamscape Analytics"}
            </h1>
            <p className="text-[8px] text-stone-500 uppercase tracking-widest mt-0.5">
              THE PROJECTION / LAYER DEPTH LEVEL SECURE ACCESS
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={isExporting || isGlobalLoading || !summary?.submissionsCount}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-amber-950/20 hover:bg-amber-900/30 text-amber-400 border border-amber-900/40 hover:border-amber-500 px-4 py-2.5 rounded text-xs font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none"
        >
          <Download size={14} />
          <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 z-10">

        {/* Filter Bar */}
        <section className="bg-stone-900/30 border border-stone-850 p-5 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-stone-400">
            <Filter size={14} className="text-amber-500" />
            <h3 className="text-xs uppercase tracking-wider font-semibold">Filter Projection Layer</h3>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Start Date */}
            <div className="flex items-center bg-stone-950 border border-stone-850 rounded px-3 py-2 space-x-2">
              <Calendar size={13} className="text-stone-600" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  handleFilterChange();
                }}
                className="bg-transparent border-none text-xs text-stone-300 focus:outline-none focus:ring-0 w-full sm:w-28 uppercase"
                placeholder="Start Date"
              />
            </div>

            {/* End Date */}
            <div className="flex items-center bg-stone-950 border border-stone-850 rounded px-3 py-2 space-x-2">
              <Calendar size={13} className="text-stone-600" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  handleFilterChange();
                }}
                className="bg-transparent border-none text-xs text-stone-300 focus:outline-none focus:ring-0 w-full sm:w-28 uppercase"
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
                  ? "bg-amber-950/20 border-amber-500 text-amber-400"
                  : "bg-stone-950 border-stone-850 text-stone-500 hover:text-stone-300"
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
                <div key={n} className="h-24 bg-stone-900/20 border border-stone-850 rounded-lg p-5" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-80 bg-stone-900/20 border border-stone-850 rounded-lg" />
              <div className="h-80 bg-stone-900/20 border border-stone-850 rounded-lg" />
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Signals (Submissions) */}
              <div className="bg-stone-900/20 border border-stone-850 p-5 rounded-lg space-y-2 relative overflow-hidden group hover:border-stone-700 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-stone-400 group-hover:scale-110 transition-transform">
                  <Send size={48} />
                </div>
                <p className="text-[9px] uppercase tracking-widest text-stone-500 font-bold">Total Signals</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-light text-stone-100 font-cormorant tracking-wide">
                    {summary?.submissionsCount ?? 0}
                  </span>
                  <span className="text-[9px] text-stone-600">records</span>
                </div>
                <p className="text-[8px] text-stone-500 uppercase tracking-wider">Submissions captured</p>
              </div>

              {/* Total Dreamers Reached (Views) */}
              <div className="bg-stone-900/20 border border-stone-850 p-5 rounded-lg space-y-2 relative overflow-hidden group hover:border-stone-700 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-stone-400 group-hover:scale-110 transition-transform">
                  <Eye size={48} />
                </div>
                <p className="text-[9px] uppercase tracking-widest text-stone-500 font-bold">Dreamers Reached</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-light text-stone-100 font-cormorant tracking-wide">
                    {summary?.viewsCount ?? 0}
                  </span>
                  <span className="text-[9px] text-stone-600">visits</span>
                </div>
                <p className="text-[8px] text-stone-500 uppercase tracking-wider">Aggregate view count</p>
              </div>

              {/* Completion Rate */}
              <div className="bg-stone-900/20 border border-stone-850 p-5 rounded-lg space-y-2 relative overflow-hidden group hover:border-stone-700 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-stone-400 group-hover:scale-110 transition-transform">
                  <TrendingUp size={48} />
                </div>
                <p className="text-[9px] uppercase tracking-widest text-stone-500 font-bold">Completion Rate</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-light text-amber-500 font-cormorant tracking-wide">
                    {summary && summary.viewsCount > 0
                      ? Math.round((summary.submissionsCount / summary.viewsCount) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <p className="text-[8px] text-stone-500 uppercase tracking-wider">Signals / Reached ratio</p>
              </div>

              {/* Avg Time to Complete */}
              <div className="bg-stone-900/20 border border-stone-850 p-5 rounded-lg space-y-2 relative overflow-hidden group hover:border-stone-700 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-stone-400 group-hover:scale-110 transition-transform">
                  <Clock size={48} />
                </div>
                <p className="text-[9px] uppercase tracking-widest text-stone-500 font-bold">Avg Stabilize Time</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-light text-stone-100 font-cormorant tracking-wide">
                    {summary?.avgTimeToComplete ?? "--"}
                  </span>
                  <span className="text-[9px] text-stone-600">{summary?.avgTimeToComplete ? "sec" : "no data"}</span>
                </div>
                <p className="text-[8px] text-stone-500 uppercase tracking-wider">Mean projection duration</p>
              </div>

              {/* Drop-off Rate */}
              <div className="bg-stone-900/20 border border-stone-850 p-5 rounded-lg space-y-2 relative overflow-hidden group hover:border-stone-700 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-stone-400 group-hover:scale-110 transition-transform">
                  <XCircle size={48} />
                </div>
                <p className="text-[9px] uppercase tracking-widest text-stone-500 font-bold">Drop-off Rate</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-light text-stone-100 font-cormorant tracking-wide">
                    {summary && summary.viewsCount > 0
                      ? 100 - Math.round((summary.submissionsCount / summary.viewsCount) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <p className="text-[8px] text-stone-500 uppercase tracking-wider">Unstabilized views ratio</p>
              </div>
            </section>

            {/* Charts Section */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chronological 30-Day Line Chart */}
              <div className="lg:col-span-2 bg-stone-900/20 border border-stone-850 p-6 rounded-lg flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-200">Chronological Wave</h3>
                    <p className="text-[8px] text-stone-500 uppercase tracking-widest mt-0.5">Views vs Submissions timeline</p>
                  </div>
                  <div className="flex items-center space-x-4 text-[9px] uppercase tracking-widest">
                    <span className="flex items-center space-x-1.5 font-bold">
                      <span className="w-2.5 h-0.5 bg-stone-500 inline-block" />
                      <span className="text-stone-400">Views</span>
                    </span>
                    <span className="flex items-center space-x-1.5 font-bold">
                      <span className="w-2.5 h-0.5 bg-amber-600 inline-block" />
                      <span className="text-amber-500">Submissions</span>
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full text-xs">
                  {isMounted && dailyStats && dailyStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyStats} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1917" />
                        <XAxis dataKey="date" stroke="#444" tickFormatter={(str) => str.slice(5)} />
                        <YAxis stroke="#444" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0c0a09", borderColor: "#292524", color: "#e7e5e4", fontFamily: "monospace" }}
                          itemStyle={{ fontSize: "10px" }}
                          labelStyle={{ fontSize: "10px", color: "#a8a29e", marginBottom: "4px" }}
                        />
                        <Line type="monotone" dataKey="views" stroke="#52525b" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="submissions" stroke="#d97706" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-stone-500 text-[10px] uppercase tracking-widest">
                      Chronological data unavailable
                    </div>
                  )}
                </div>
              </div>

              {/* Completion Funnel Drop-off */}
              <div className="bg-stone-900/20 border border-stone-850 p-6 rounded-lg flex flex-col space-y-4 justify-between">
                <div>
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-200">Completion Funnel</h3>
                  <p className="text-[8px] text-stone-500 uppercase tracking-widest mt-0.5">Field-level drop-off analysis</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-64">
                  {dropoffs && dropoffs.length > 0 ? (
                    dropoffs.map((field, idx) => {
                      const percentage = field.total > 0 ? Math.round((field.filled / field.total) * 100) : 0;
                      return (
                        <div key={field.fieldId} className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-medium text-stone-300 truncate max-w-[70%]">
                              {idx + 1}. {field.label}
                            </span>
                            <span className="text-stone-500 uppercase font-semibold">
                              {field.filled}/{field.total} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-stone-950 border border-stone-850 h-2.5 rounded-full overflow-hidden p-0.5">
                            <div
                              style={{ width: `${percentage}%` }}
                              className="bg-gradient-to-r from-amber-600 to-amber-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center text-stone-500 text-[10px] uppercase tracking-widest">
                      Funnel drop-off data unavailable
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Answer Distributions Grid */}
            <section className="bg-stone-900/20 border border-stone-850 p-6 rounded-lg space-y-6">
              <div>
                <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-200">Parameter Distribution</h3>
                <p className="text-[8px] text-stone-500 uppercase tracking-widest mt-0.5">Response patterns for select and rating fields</p>
              </div>

              {distributions && Object.keys(distributions).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(distributions).map(([fieldId, dist]) => {
                    const fieldDef = fields?.find((f) => f.id === fieldId);
                    if (!fieldDef) return null;

                    // Calculate total counts for percentage
                    const totalResponses = dist.reduce((acc, curr) => acc + curr.count, 0);

                    return (
                      <div key={fieldId} className="border border-stone-850 bg-stone-950/20 p-4 rounded space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold text-stone-300 truncate">{fieldDef.label}</h4>
                          <span className="text-[8px] text-stone-500 uppercase tracking-wider">{fieldDef.type.replace("_", " ")}</span>
                        </div>

                        <div className="space-y-2.5">
                          {dist.map((option) => {
                            const percent = totalResponses > 0 ? Math.round((option.count / totalResponses) * 100) : 0;
                            return (
                              <div key={option.value} className="space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-stone-400 truncate max-w-[70%]">{option.value}</span>
                                  <span className="text-stone-500 uppercase font-semibold">
                                    {option.count} ({percent}%)
                                  </span>
                                </div>
                                <div className="w-full bg-stone-950 h-1.5 rounded overflow-hidden">
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
                <div className="py-8 text-center text-stone-500 text-[10px] uppercase tracking-widest">
                  No parameter distribution charts available for this dreamscape
                </div>
              )}
            </section>

            {/* Expandable Responses List Table */}
            <section className="bg-stone-900/20 border border-stone-850 rounded-lg p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-200">Stabilized Signals Record</h3>
                  <p className="text-[8px] text-stone-500 uppercase tracking-widest mt-0.5">Chronological list of captured responses</p>
                </div>
              </div>

              {responsesData?.items && responsesData.items.length > 0 ? (
                <div className="space-y-4">
                  <div className="border border-stone-850 rounded overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-950/80 border-b border-stone-850 text-stone-400 text-[9px] uppercase tracking-widest font-bold">
                          <th className="p-4 w-12 text-center" />
                          <th className="p-4">Submission ID</th>
                          <th className="p-4">Submitted At</th>
                          <th className="p-4 text-center">Stability</th>
                          <th className="p-4 text-right">Completion Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {responsesData.items.map((resp) => {
                          const isExpanded = expandedResponseId === resp.id;
                          return (
                            <React.Fragment key={resp.id}>
                              <tr
                                onClick={() => setExpandedResponseId(isExpanded ? null : resp.id)}
                                className="border-b border-stone-850 hover:bg-stone-900/35 transition-colors cursor-pointer"
                              >
                                <td className="p-4 text-center text-stone-500">
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </td>
                                <td className="p-4 font-bold text-stone-300 font-mono tracking-wider">
                                  {resp.id.slice(0, 8)}...
                                </td>
                                <td className="p-4 text-stone-400">
                                  {new Date(resp.submittedAt).toLocaleString()}
                                </td>
                                <td className="p-4 text-center">
                                  {resp.isComplete ? (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded border border-emerald-900/60 bg-emerald-950/20 text-emerald-400 text-[8px] uppercase tracking-wider font-bold">
                                      <CheckCircle2 size={10} />
                                      <span>Stable</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded border border-amber-900/60 bg-amber-950/20 text-amber-500 text-[8px] uppercase tracking-wider font-bold">
                                      <Info size={10} className="animate-pulse" />
                                      <span>Unstable</span>
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-right font-semibold text-stone-300">
                                  {resp.timeToComplete !== null ? `${resp.timeToComplete} sec` : "--"}
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr className="bg-stone-950/40 border-b border-stone-850">
                                  <td colSpan={5} className="p-6">
                                    <div className="space-y-4 max-w-4xl animate-in fade-in slide-in-from-top-2 duration-200">
                                      <div className="flex items-center space-x-2 text-stone-500 text-[9px] uppercase tracking-widest border-b border-stone-850 pb-2">
                                        <Layers size={10} />
                                        <span>Projection Variables Decoded</span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {fields && fields.length > 0 ? (
                                          fields.map((field) => {
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

                                            return (
                                              <div key={field.id} className="space-y-1">
                                                <span className="text-[9px] text-stone-500 uppercase tracking-wider block">
                                                  {field.label} {field.required && <span className="text-amber-600">*</span>}
                                                </span>
                                                <p className="text-xs text-stone-200 bg-stone-950 border border-stone-850/60 p-2.5 rounded font-mono whitespace-pre-wrap leading-relaxed">
                                                  {renderedVal}
                                                </p>
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <p className="text-stone-600 italic">No fields projected in this layer.</p>
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
                  <div className="flex items-center justify-between text-xs text-stone-500 pt-2 select-none">
                    <div>
                      Showing <strong className="text-stone-300">{offset + 1}</strong> -{" "}
                      <strong className="text-stone-300">
                        {offset + (responsesData?.items.length ?? 0)}
                      </strong>{" "}
                      of active records
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setOffset((prev) => Math.max(0, prev - LIMIT))}
                        disabled={offset === 0}
                        className="p-2 border border-stone-850 rounded bg-stone-950 text-stone-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center space-x-1 font-bold uppercase tracking-wider text-[10px]"
                      >
                        <ChevronLeft size={12} />
                        <span>Prev</span>
                      </button>

                      <button
                        onClick={() => setOffset((prev) => prev + LIMIT)}
                        disabled={!responsesData?.nextCursor}
                        className="p-2 border border-stone-850 rounded bg-stone-950 text-stone-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center space-x-1 font-bold uppercase tracking-wider text-[10px]"
                      >
                        <span>Next</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 border border-dashed border-stone-850 rounded-lg text-center text-stone-500 text-[10px] uppercase tracking-widest">
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
