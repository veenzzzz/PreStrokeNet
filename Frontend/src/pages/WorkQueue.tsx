import {
  Bot,
  ExternalLink,
  RefreshCw,
  Search,
  UserCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "../services/api";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { PageHeader } from "../components/PageHeader";
import { RiskBadge } from "../components/PredictionCard";
import { SkeletonCard, SkeletonTable } from "../components/Skeleton";

interface WorkQueueItem {
  prediction_id: number;
  patient_id: string;
  patient_name: string;
  age: number;
  gender: string;
  latest_assessment_date: string;
  final_probability: number;
  clinical_probability: number;
  keystroke_probability: number;
  risk_category: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  priority_reason: string;
  workflow_status: string;
  has_unread_alert: boolean;
  has_pending_followup: boolean;
  is_saved: boolean;
}

interface WorkQueueResponse {
  work_queue: WorkQueueItem[];
  page: number;
  limit: number;
  total_count: number;
  kpi_summary: {
    total_requiring_review: number;
    high_priority_count: number;
    medium_priority_count: number;
    unread_alerts_count: number;
    pending_followups_count: number;
    saved_patients_count: number;
  };
}

export function WorkQueue() {
  const navigate = useNavigate();
  const [data, setData] = useState<WorkQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [search, setSearch] = useState("");

  const loadQueue = () => {
    setIsLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (statusFilter !== "All") params.set("status", statusFilter);
    if (priorityFilter !== "All") params.set("priority", priorityFilter);
    if (search.trim()) params.set("search", search.trim());

    apiFetch(`/work-queue?${params.toString()}`)
      .then((resData) => setData(resData))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load work queue."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadQueue();
  }, [statusFilter, priorityFilter]);

  if (error) {
    return (
      <div className="page-canvas space-y-6">
        <PageHeader eyebrow="Clinician Workflow" title="Clinical Work Queue & Patient Prioritization" description="Workspace error state." />
        <ErrorState title="Unable to load clinical work queue" message={error} onRetry={loadQueue} />
      </div>
    );
  }

  return (
    <div className="page-canvas space-y-7">
      <PageHeader
        eyebrow="Clinician Operational Workflow"
        title="Clinical Work Queue & Prioritized Review Workspace"
        description="Prioritized patient assessments requiring clinical review based on model risk scores, risk transitions, and pending follow-ups."
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonTable rows={5} />
        </div>
      ) : data ? (
        <>
          {/* KPI CARDS SUMMARY */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-panel p-4 space-y-1">
              <span className="text-[11px] text-muted block font-semibold">Total Requiring Review</span>
              <span className="font-mono text-2xl font-extrabold text-text">{data.kpi_summary.total_requiring_review}</span>
            </div>
            <div className="glass-panel p-4 space-y-1 border-danger/30 bg-danger/5">
              <span className="text-[11px] text-danger block font-semibold">High Priority</span>
              <span className="font-mono text-2xl font-extrabold text-danger">{data.kpi_summary.high_priority_count}</span>
            </div>
            <div className="glass-panel p-4 space-y-1 border-warning/30 bg-warning/5">
              <span className="text-[11px] text-warning block font-semibold">Medium Priority</span>
              <span className="font-mono text-2xl font-extrabold text-warning">{data.kpi_summary.medium_priority_count}</span>
            </div>
            <div className="glass-panel p-4 space-y-1 border-primary/30 bg-primary/5">
              <span className="text-[11px] text-primary block font-semibold">Unresolved Alerts</span>
              <span className="font-mono text-2xl font-extrabold text-primary">{data.kpi_summary.unread_alerts_count}</span>
            </div>
          </div>

          {/* FILTER & SEARCH TOOLBAR */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">Task Prioritization</span>
                <h2 className="font-display text-lg font-bold text-text">Clinician Review Queue</h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[240px]">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Search patient name or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadQueue()}
                    className="w-full rounded-xl border border-line bg-white/[0.03] pl-9 pr-4 py-2 text-xs text-text placeholder:text-muted focus:border-primary focus:outline-none"
                  />
                </div>
                <Button variant="secondary" icon={RefreshCw} onClick={loadQueue}>
                  Refresh
                </Button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono border-b border-line/40 pb-3">
              <span className="text-muted font-semibold">Priority Filter:</span>
              {["All", "HIGH", "MEDIUM", "LOW"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    priorityFilter === p ? "bg-primary text-white shadow" : "bg-white/5 text-muted hover:text-text"
                  }`}
                >
                  {p}
                </button>
              ))}

              <span className="text-muted font-semibold ml-4">Status Filter:</span>
              {["All", "new", "in_review", "reviewed", "resolved"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg font-bold uppercase transition ${
                    statusFilter === st ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 text-muted hover:text-text"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* TASK CARDS GRID */}
            {data.work_queue.length === 0 ? (
              <EmptyState title="No Work Queue Items" description="All monitored patient assessments fall within expected workflow parameters." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                {data.work_queue.map((item) => (
                  <div
                    key={item.prediction_id}
                    className={`rounded-2xl border p-5 space-y-3.5 transition shadow-lg ${
                      item.priority === "HIGH"
                        ? "border-danger/40 bg-danger/5"
                        : item.priority === "MEDIUM"
                        ? "border-warning/40 bg-warning/5"
                        : "border-line bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                            item.priority === "HIGH"
                              ? "bg-danger text-white"
                              : item.priority === "MEDIUM"
                              ? "bg-warning text-app"
                              : "bg-white/10 text-muted"
                          }`}
                        >
                          {item.priority} PRIORITY
                        </span>
                        <h3 className="mt-2 font-bold text-base text-text">{item.patient_name}</h3>
                        <span className="font-mono text-xs text-muted">ID: {item.patient_id}</span>
                      </div>
                      <RiskBadge level={(item.risk_category || "Low").toLowerCase() as "low" | "medium" | "high"} />
                    </div>

                    <div className="text-xs font-mono space-y-1.5 pt-2 border-t border-line/40">
                      <div className="flex justify-between">
                        <span className="text-muted">Reason:</span>
                        <span className="font-semibold text-text max-w-[170px] text-right truncate">{item.priority_reason}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Final Prob:</span>
                        <span className="font-extrabold text-primary">{(item.final_probability * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Workflow State:</span>
                        <span className="font-bold text-text uppercase">{item.workflow_status}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-line/40 flex flex-wrap gap-2 text-xs">
                      <Button variant="primary" onClick={() => navigate(`/patients/${encodeURIComponent(item.patient_id)}/360`)}>
                        <UserCheck className="size-3.5 mr-1" /> Patient 360
                      </Button>
                      <Button variant="secondary" onClick={() => navigate(`/predictions/${item.prediction_id}`)}>
                        <ExternalLink className="size-3.5 mr-1" /> Prediction
                      </Button>
                      <Button variant="secondary" onClick={() => navigate(`/clinical-assistant?patient_id=${encodeURIComponent(item.patient_id)}`)}>
                        <Bot className="size-3.5 mr-1" /> Ask AI
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
