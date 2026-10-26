import {
  AlertTriangle,
  Bot,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  UserCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "../services/api";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { SkeletonTable } from "../components/Skeleton";

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

function PriorityBadge({ priority }: { priority: "HIGH" | "MEDIUM" | "LOW" }) {
  if (priority === "HIGH")
    return <span className="badge badge-danger">High priority</span>;
  if (priority === "MEDIUM")
    return <span className="badge badge-warning">Medium priority</span>;
  return <span className="badge badge-success">Low priority</span>;
}

function RiskPill({ category }: { category: string }) {
  const r = category.toLowerCase();
  if (r === "high")   return <span className="badge badge-danger">High</span>;
  if (r === "medium") return <span className="badge badge-warning">Medium</span>;
  return <span className="badge badge-success">Low</span>;
}

export function WorkQueue() {
  const navigate = useNavigate();
  const [data, setData] = useState<WorkQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadQueue = useCallback(() => {
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
  }, [statusFilter, priorityFilter, search]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  if (error) {
    return (
      <div className="page-canvas space-y-6">
        <ErrorState title="Unable to load work queue" message={error} onRetry={loadQueue} />
      </div>
    );
  }

  return (
    <div className="page-canvas space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Work Queue</h1>
          <p className="mt-0.5 text-sm text-muted">
            Prioritised assessments requiring clinical review
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadQueue}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : data ? (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Requiring review", value: data.kpi_summary.total_requiring_review, tone: "text-text" },
              { label: "High priority", value: data.kpi_summary.high_priority_count, tone: "text-danger" },
              { label: "Medium priority", value: data.kpi_summary.medium_priority_count, tone: "text-warning" },
              { label: "Unresolved alerts", value: data.kpi_summary.unread_alerts_count, tone: "text-primary" },
            ].map(({ label, value, tone }) => (
              <div key={label} className="rounded-lg border border-line p-4" style={{ background: "var(--surface)" }}>
                <p className="text-xs text-muted">{label}</p>
                <p className={`mt-1.5 text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Main table card */}
          <div className="rounded-lg border border-line overflow-hidden" style={{ background: "var(--surface)" }}>
            {/* Toolbar */}
            <div className="flex flex-col gap-3 p-4 border-b border-line sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text">Patient review queue</h2>
                <p className="text-xs text-muted mt-0.5">{data.total_count} patients · sorted by priority</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Search patient…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadQueue()}
                    className="w-48 rounded-md border border-line bg-surface-strong pl-8 pr-3 py-1.5 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none"
                    aria-label="Search patients"
                  />
                </div>
                <button
                  onClick={() => setFiltersOpen((o) => !o)}
                  className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-text"
                  style={{ background: "var(--surface-strong)" }}
                  aria-expanded={filtersOpen}
                >
                  <Filter className="size-3.5" aria-hidden="true" />
                  Filters
                  {filtersOpen
                    ? <ChevronUp className="size-3" aria-hidden="true" />
                    : <ChevronDown className="size-3" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Collapsible filters */}
            {filtersOpen && (
              <div
                className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-line text-xs"
                style={{ background: "var(--surface-strong)" }}
              >
                <span className="text-muted mr-1">Priority:</span>
                {["All", "HIGH", "MEDIUM", "LOW"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`rounded px-2.5 py-1 font-medium transition-colors ${
                      priorityFilter === p
                        ? "bg-primary text-white"
                        : "text-muted hover:text-text hover:bg-surface-muted"
                    }`}
                  >
                    {p === "All" ? "All" : p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
                <span className="ml-3 text-muted mr-1">Status:</span>
                {["All", "new", "in_review", "reviewed", "resolved"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded px-2.5 py-1 font-medium transition-colors ${
                      statusFilter === st
                        ? "text-primary border border-primary/30 bg-primary-dim"
                        : "text-muted hover:text-text hover:bg-surface-muted"
                    }`}
                  >
                    {st === "All" ? "All" : st.replace("_", " ")}
                  </button>
                ))}
              </div>
            )}

            {/* Table */}
            {data.work_queue.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  title="Queue is clear"
                  description="All monitored patients are within expected workflow parameters."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead
                    className="border-b border-line text-xs text-muted"
                    style={{ background: "var(--surface-strong)" }}
                  >
                    <tr>
                      <th className="px-4 py-3 font-medium">Patient</th>
                      <th className="px-4 py-3 font-medium">Priority</th>
                      <th className="px-4 py-3 font-medium">Risk</th>
                      <th className="px-4 py-3 font-medium text-right">Score</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Reason</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.work_queue.map((item) => (
                      <tr key={item.prediction_id} className="table-row-hover transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-text">{item.patient_name}</p>
                          <p className="text-xs text-muted font-mono">{item.patient_id} · {item.age}y {item.gender}</p>
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={item.priority} />
                          {item.has_unread_alert && (
                            <span title="Unread alert" className="ml-1.5 inline-flex">
                              <AlertTriangle className="size-3 text-warning" aria-label="Unread alert" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <RiskPill category={item.risk_category || "Low"} />
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: "var(--primary)" }}>
                          {(item.final_probability * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-text-secondary capitalize">
                            {item.workflow_status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="text-xs text-muted truncate" title={item.priority_reason}>
                            {item.priority_reason}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate(`/patients/${encodeURIComponent(item.patient_id)}/360`)}
                              title="Patient 360 view"
                            >
                              <UserCheck className="size-3.5" aria-hidden="true" />
                              360
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/predictions/${item.prediction_id}`)}
                              title="View prediction"
                            >
                              <ExternalLink className="size-3.5" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/clinical-assistant?patient_id=${encodeURIComponent(item.patient_id)}`)}
                              title="Ask AI assistant"
                            >
                              <Bot className="size-3.5" aria-hidden="true" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
