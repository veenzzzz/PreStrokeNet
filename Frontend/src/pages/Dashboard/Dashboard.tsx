import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/Button";
import { DashboardCard } from "../../components/DashboardCard";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { PageHeader } from "../../components/PageHeader";
import { SkeletonCard, SkeletonTable } from "../../components/Skeleton";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../services/authService";
import { getDashboardStatistics, getDashboardSummary } from "../../services/dashboardService";
import type { DashboardDistributionItem, DashboardStatistics } from "../../types";

/* ── Risk Distribution Chart ────────────────────────────────────────────── */
function RiskDistributionChart({ data }: { data: DashboardDistributionItem[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  const riskConfig: Record<string, { color: string; bg: string; label: string }> = {
    Low:    { color: "var(--risk-low)",    bg: "var(--risk-low-dim)",    label: "Low Risk" },
    Medium: { color: "var(--risk-medium)", bg: "var(--risk-medium-dim)", label: "Medium Risk" },
    High:   { color: "var(--risk-high)",   bg: "var(--risk-high-dim)",   label: "High Risk" },
  };

  if (!data.length) {
    return (
      <p className="py-4 text-sm text-muted italic">No distribution data available yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const cfg = riskConfig[item.label] ?? riskConfig["Low"];
        const pct = Math.round((item.count / max) * 100);
        return (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ background: cfg.color }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-text-secondary">{cfg.label}</span>
              </div>
              <span className="font-mono text-sm font-600 text-text" style={{ fontWeight: 600 }}>
                {item.count}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ background: "var(--surface-muted)" }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${item.label} risk: ${item.count} patients`}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: cfg.color,
                  boxShadow: `0 0 8px color-mix(in srgb, ${cfg.color} 40%, transparent)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Risk badge ──────────────────────────────────────────────────────────── */
function RiskBadge({ risk }: { risk: string }) {
  const r = risk.toLowerCase();
  if (r === "high") return <span className="badge badge-danger">High</span>;
  if (r === "medium") return <span className="badge badge-warning">Medium</span>;
  return <span className="badge badge-success">Low</span>;
}

/* ── Status dot ─────────────────────────────────────────────────────────── */
function StatusDot({ status }: { status?: string }) {
  const isOk = !status || status.toLowerCase().includes("operational") || status.toLowerCase() === "ok";
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`size-1.5 rounded-full ${isOk ? "status-pulse" : ""}`}
        style={{ background: isOk ? "var(--success)" : "var(--danger)" }}
        aria-hidden="true"
      />
      <span
        className="text-xs font-medium"
        style={{ color: isOk ? "var(--success)" : "var(--danger)" }}
      >
        {status ?? "Operational"}
      </span>
    </span>
  );
}

/* ── Dashboard ───────────────────────────────────────────────────────────── */
export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  const load = () => {
    setIsLoading(true);
    setError("");
    Promise.all([getDashboardSummary(), getDashboardStatistics()])
      .then(([nextSummary, nextStats]) => { setSummary(nextSummary); setStats(nextStats); })
      .catch((err) => setError(getApiErrorMessage(err, "Unable to load dashboard data.")))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const filteredAssessments = useMemo(() => {
    if (!summary?.recent_assessments) return [];
    let items = [...summary.recent_assessments];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i: any) =>
        i.patient_name?.toLowerCase().includes(q) || i.patient_code?.toLowerCase().includes(q)
      );
    }
    if (riskFilter !== "All") {
      items = items.filter((i: any) => i.risk?.toLowerCase() === riskFilter.toLowerCase());
    }
    if (sortBy === "Newest") {
      items.sort((a: any, b: any) => new Date(b.assessment_date).getTime() - new Date(a.assessment_date).getTime());
    } else if (sortBy === "Oldest") {
      items.sort((a: any, b: any) => new Date(a.assessment_date).getTime() - new Date(b.assessment_date).getTime());
    } else if (sortBy === "Highest Risk") {
      items.sort((a: any, b: any) => b.final_probability - a.final_probability);
    }
    return items;
  }, [summary, searchQuery, riskFilter, sortBy]);

  if (error) {
    return (
      <div className="page-canvas space-y-6">
        <PageHeader eyebrow="Dashboard" title="Clinical Overview" />
        <ErrorState title="Unable to load dashboard" message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="page-canvas space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label">{greeting}, {user?.fullName?.split(" ")[0] ?? "Clinician"}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Clinical Overview
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load}>
            Refresh
          </Button>
          <Button size="sm" icon={Activity} onClick={() => navigate("/prediction")}>
            New Assessment
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonTable rows={5} />
        </div>
      ) : summary ? (
        <>
          {/* KPI cards */}
          <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <DashboardCard
              label="Total Patients"
              value={String(summary.total_patients ?? 0)}
              trend="Distinct records"
              icon={UsersRound}
              tone="primary"
            />
            <DashboardCard
              label="Assessments"
              value={String(summary.total_assessments ?? 0)}
              trend="All predictions"
              icon={Activity}
              tone="blue"
            />
            <DashboardCard
              label="High Risk"
              value={String(summary.high_risk ?? 0)}
              trend="P ≥ 0.60"
              icon={AlertTriangle}
              tone="danger"
            />
            <DashboardCard
              label="Medium Risk"
              value={String(summary.medium_risk ?? 0)}
              trend="0.30 ≤ P < 0.60"
              icon={Clock}
              tone="warning"
            />
            <DashboardCard
              label="Low Risk"
              value={String(summary.low_risk ?? 0)}
              trend="P < 0.30"
              icon={CheckCircle2}
              tone="success"
            />
          </section>

          {/* Main grid: distribution + risk transitions */}
          <section className="grid gap-5 lg:grid-cols-3" aria-label="Risk overview">
            {/* Risk distribution */}
            <div
              className="rounded-xl border border-line p-5"
              style={{ background: "var(--surface)" }}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="section-label">Distribution</p>
                  <h2 className="mt-1 text-base font-bold text-text">Risk Cohort Breakdown</h2>
                </div>
                <BarChart3 className="size-4 text-muted" aria-hidden="true" />
              </div>
              <RiskDistributionChart data={stats?.risk_distribution ?? []} />
              <p className="mt-4 text-[11px] text-muted italic border-t border-line pt-3">
                Threshold = 0.15 (sensitivity-optimized)
              </p>
            </div>

            {/* Risk transitions */}
            <div
              className="rounded-xl border border-line p-5 lg:col-span-2"
              style={{ background: "var(--surface)" }}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="section-label mb-0">Longitudinal</p>
                  <h2 className="mt-1 text-base font-bold text-text">Recent Risk Transitions</h2>
                </div>
                <span className="badge badge-primary">
                  {summary.risk_changes?.length ?? 0} events
                </span>
              </div>

              {!summary.risk_changes?.length ? (
                <EmptyState
                  title="No risk transitions"
                  description="No consecutive assessment probability shifts detected for active patients."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {summary.risk_changes.map((rc: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-line p-3.5 text-sm"
                      style={{ background: "var(--surface-strong)" }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-text truncate">{rc.patient_name}</span>
                        <span
                          className={`badge ${rc.status === "Risk Increased" ? "badge-danger" : rc.status === "Risk Decreased" ? "badge-success" : "badge-warning"}`}
                        >
                          {rc.status === "Risk Increased" ? (
                            <ArrowUpRight className="size-3" aria-hidden="true" />
                          ) : (
                            <ArrowDownRight className="size-3" aria-hidden="true" />
                          )}
                          {rc.status === "Risk Increased" ? "Increased" : "Decreased"}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-muted font-mono">
                        <span>Prev: {(rc.previous_prob * 100).toFixed(1)}%</span>
                        <span>Now: {(rc.current_prob * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* High-risk patients */}
          {summary.high_risk_patients?.length > 0 && (
            <section
              aria-label="High risk patients"
              className="rounded-xl border p-5"
              style={{
                borderColor: "color-mix(in srgb, var(--danger) 25%, var(--line))",
                background: "color-mix(in srgb, var(--danger) 3%, var(--surface))",
              }}
            >
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-danger" aria-hidden="true" />
                    <p className="text-sm font-semibold text-text">Patients Requiring Attention</p>
                    <span className="badge badge-danger">{summary.high_risk_patients.length} flagged</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    High-risk assessments pending clinical review
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => navigate("/work-queue")}
                >
                  View Work Queue
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {summary.high_risk_patients.map((pat: any) => (
                  <div
                    key={pat.id}
                    className="rounded-lg border p-4 space-y-3"
                    style={{
                      borderColor: "color-mix(in srgb, var(--danger) 20%, var(--line))",
                      background: "var(--surface-strong)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-text">{pat.patient_name}</p>
                        <p className="text-xs text-muted font-mono">{pat.patient_code}</p>
                      </div>
                      <span className="badge badge-danger text-sm font-mono">
                        {(pat.final_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/patients/${encodeURIComponent(pat.patient_code)}/360`)}
                      >
                        <UserCheck className="size-3.5" aria-hidden="true" />
                        360 View
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/predictions/${pat.id}`)}
                      >
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                        Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/clinical-assistant?patient_id=${encodeURIComponent(pat.patient_code)}`)}
                      >
                        <Bot className="size-3.5" aria-hidden="true" />
                        AI
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent assessments table */}
          <section
            className="rounded-xl border border-line overflow-hidden"
            style={{ background: "var(--surface)" }}
            aria-label="Recent assessments"
          >
            {/* Table toolbar */}
            <div className="flex flex-col gap-3 p-5 border-b border-line sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="section-label">Assessments</p>
                <h2 className="mt-1 text-base font-bold text-text">Recent Clinical Evaluations</h2>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search patient…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-line bg-app/50 pl-9 pr-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none"
                  aria-label="Search patients"
                />
              </div>
            </div>

            {/* Filters */}
            <div
              className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-line text-xs"
              style={{ background: "var(--surface-strong)" }}
            >
              <span className="text-muted font-medium mr-1">Risk:</span>
              {["All", "Low", "Medium", "High"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    riskFilter === r
                      ? "bg-primary text-app"
                      : "text-muted hover:text-text hover:bg-surface-muted"
                  }`}
                >
                  {r}
                </button>
              ))}
              <span className="ml-3 text-muted font-medium mr-1">Sort:</span>
              {["Newest", "Oldest", "Highest Risk"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    sortBy === s
                      ? "text-primary border border-line-strong bg-primary-dim"
                      : "text-muted hover:text-text hover:bg-surface-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Table */}
            {filteredAssessments.length === 0 ? (
              <div className="p-10">
                <EmptyState title="No matching evaluations" description="Try a different search or filter." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line text-xs text-muted" style={{ background: "var(--surface-strong)" }}>
                    <tr>
                      <th className="px-5 py-3 font-medium">Patient</th>
                      <th className="px-5 py-3 font-medium">ID</th>
                      <th className="px-5 py-3 font-medium">Risk</th>
                      <th className="px-5 py-3 font-medium text-right font-mono">Score</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredAssessments.map((item: any) => (
                      <tr
                        key={item.id}
                        className="table-row-hover transition-colors"
                      >
                        <td className="px-5 py-3.5 font-medium text-text">{item.patient_name}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-muted">{item.patient_code}</td>
                        <td className="px-5 py-3.5"><RiskBadge risk={item.risk} /></td>
                        <td className="px-5 py-3.5 text-right font-mono text-sm font-600 text-primary" style={{ fontWeight: 600 }}>
                          {(item.final_probability * 100).toFixed(1)}%
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted">
                          {new Date(item.assessment_date).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/patients/${encodeURIComponent(item.patient_code)}/360`)}
                          >
                            360 View
                            <ArrowRight className="size-3" aria-hidden="true" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* System status */}
          <section
            className="rounded-xl border border-line p-5"
            style={{ background: "var(--surface)" }}
            aria-label="System status"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-success" aria-hidden="true" />
                <span className="text-sm font-medium text-text">System Status</span>
                <span className="badge badge-success">Operational</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <StatusDot status={summary.system_status?.clinical_model ?? "Operational"} />
                <span className="text-muted">Clinical Model</span>
                <StatusDot status={summary.system_status?.shap_explainer ?? "Operational"} />
                <span className="text-muted">TreeSHAP</span>
                <StatusDot status={summary.system_status?.keystroke_model ?? "Operational"} />
                <span className="text-muted">Keystroke Model</span>
                <StatusDot status={summary.system_status?.ai_assistant ?? "Operational"} />
                <span className="text-muted">AI Assistant</span>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
