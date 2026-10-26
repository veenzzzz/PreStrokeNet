import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/Button";
import { DashboardCard } from "../../components/DashboardCard";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { SkeletonCard, SkeletonTable } from "../../components/Skeleton";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../services/authService";
import { getDashboardStatistics, getDashboardSummary } from "../../services/dashboardService";
import type { DashboardDistributionItem, DashboardStatistics } from "../../types";

/* ── Risk Distribution Chart ────────────────────────────────────────────── */
function RiskDistributionChart({ data }: { data: DashboardDistributionItem[] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;

  const riskConfig: Record<string, { color: string; bg: string; label: string }> = {
    Low:    { color: "var(--risk-low)",    bg: "var(--risk-low-dim)",    label: "Low risk" },
    Medium: { color: "var(--risk-medium)", bg: "var(--risk-medium-dim)", label: "Medium risk" },
    High:   { color: "var(--risk-high)",   bg: "var(--risk-high-dim)",   label: "High risk" },
  };

  if (!data.length) return (
    <p className="py-4 text-sm text-muted italic">No distribution data yet.</p>
  );

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const cfg = riskConfig[item.label] ?? riskConfig["Low"];
        const pct = Math.round((item.count / total) * 100);
        return (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: cfg.color }} aria-hidden="true" />
                <span className="text-sm text-text-secondary">{cfg.label}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold tabular-nums text-text">{item.count}</span>
                <span className="text-muted text-xs">({pct}%)</span>
              </div>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full"
              style={{ background: "var(--surface-muted)" }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${item.label} risk: ${item.count} patients`}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: cfg.color }}
              />
            </div>
          </div>
        );
      })}
      <p className="pt-2 text-[11px] text-muted border-t border-line mt-2">
        UI bands: Low &lt;0.30 · Medium 0.30–0.60 · High ≥0.60.{" "}
        <span className="italic">Model decision threshold: 0.15 (sensitivity-optimised).</span>
      </p>
    </div>
  );
}

/* ── Risk badge ──────────────────────────────────────────────────────────── */
function RiskBadge({ risk }: { risk: string }) {
  const r = risk.toLowerCase();
  if (r === "high")   return <span className="badge badge-danger">High</span>;
  if (r === "medium") return <span className="badge badge-warning">Medium</span>;
  return <span className="badge badge-success">Low</span>;
}

/* ── Status dot ─────────────────────────────────────────────────────────── */
function StatusDot({ label, status }: { label: string; status?: string }) {
  const isOk = !status || status.toLowerCase().includes("operational") || status.toLowerCase() === "ok";
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span
        className={`size-1.5 rounded-full shrink-0 ${isOk ? "status-pulse" : ""}`}
        style={{ background: isOk ? "var(--success)" : "var(--danger)" }}
        aria-hidden="true"
      />
      <span style={{ color: isOk ? "var(--success)" : "var(--danger)" }}>{label}</span>
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

  const load = useCallback(() => {
    setIsLoading(true);
    setError("");
    Promise.all([getDashboardSummary(), getDashboardStatistics()])
      .then(([nextSummary, nextStats]) => { setSummary(nextSummary); setStats(nextStats); })
      .catch((err) => setError(getApiErrorMessage(err, "Unable to load dashboard data.")))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

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
        <ErrorState title="Unable to load dashboard" message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="page-canvas space-y-6 animate-fade-up">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted font-medium">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-text">
            {greeting}, {user?.fullName?.split(" ")[0] ?? "Clinician"}
          </h1>
          <p className="mt-0.5 text-sm text-muted">Clinical overview · PreStrokeNet</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load}>Refresh</Button>
          <Button size="sm" icon={Activity} onClick={() => navigate("/prediction")}>New Assessment</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonTable rows={5} />
        </div>
      ) : summary ? (
        <>
          {/* KPI strip — 4 cards, not 5, giving each more breathing room */}
          <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              label="Total patients"
              value={String(summary.total_patients ?? 0)}
              trend="Distinct records"
              icon={UsersRound}
              tone="primary"
            />
            <DashboardCard
              label="Total assessments"
              value={String(summary.total_assessments ?? 0)}
              trend="All predictions"
              icon={Activity}
              tone="blue"
            />
            <DashboardCard
              label="High risk"
              value={String(summary.high_risk ?? 0)}
              trend="Combined P ≥ 0.60"
              icon={AlertTriangle}
              tone="danger"
            />
            <DashboardCard
              label="Pending review"
              value={String(summary.high_risk_patients?.length ?? 0)}
              trend="Require attention"
              icon={Clock}
              tone="warning"
            />
          </section>

          {/* Risk overview — distribution takes 1/3, transitions take 2/3 */}
          <section className="grid gap-5 lg:grid-cols-3" aria-label="Risk overview">
            {/* Distribution */}
            <div
              className="rounded-lg border border-line p-5"
              style={{ background: "var(--surface)" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-text">Risk distribution</h2>
                  <p className="text-xs text-muted mt-0.5">Across all assessments</p>
                </div>
                <BarChart3 className="size-4 text-muted" aria-hidden="true" />
              </div>
              <RiskDistributionChart data={stats?.risk_distribution ?? []} />
            </div>

            {/* Risk transitions */}
            <div
              className="rounded-lg border border-line p-5 lg:col-span-2"
              style={{ background: "var(--surface)" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-text">Risk transitions</h2>
                  <p className="text-xs text-muted mt-0.5">
                    Consecutive assessment probability changes
                  </p>
                </div>
                {(summary.risk_changes?.length ?? 0) > 0 && (
                  <span className="badge badge-primary">{summary.risk_changes.length} events</span>
                )}
              </div>

              {!summary.risk_changes?.length ? (
                <EmptyState
                  title="No transitions yet"
                  description="No probability shifts detected between consecutive assessments."
                />
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {summary.risk_changes.map((rc: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md border border-line p-3 text-sm"
                      style={{ background: "var(--surface-strong)" }}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-text truncate">{rc.patient_name}</p>
                        <p className="text-xs text-muted mt-0.5 tabular-nums">
                          {(rc.previous_prob * 100).toFixed(1)}% → {(rc.current_prob * 100).toFixed(1)}%
                        </p>
                      </div>
                      <span
                        className={`badge shrink-0 ml-3 ${
                          rc.status === "Risk Increased" ? "badge-danger" :
                          rc.status === "Risk Decreased" ? "badge-success" : "badge-warning"
                        }`}
                      >
                        {rc.status === "Risk Increased"
                          ? <ArrowUpRight className="size-3" aria-hidden="true" />
                          : <ArrowDownRight className="size-3" aria-hidden="true" />
                        }
                        {rc.status === "Risk Increased" ? "Up" : "Down"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* High-risk patients */}
          {summary.high_risk_patients?.length > 0 && (
            <section
              aria-label="Patients requiring attention"
              className="rounded-lg border p-5"
              style={{
                borderColor: "color-mix(in srgb, var(--danger) 20%, var(--line))",
                background: "color-mix(in srgb, var(--danger) 2.5%, var(--surface))",
              }}
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="size-4 text-danger shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-text">Patients requiring attention</p>
                    <p className="text-xs text-muted">High-risk assessments pending clinical review</p>
                  </div>
                  <span className="badge badge-danger">{summary.high_risk_patients.length} flagged</span>
                </div>
                <Button variant="secondary" size="sm" icon={ArrowRight} onClick={() => navigate("/work-queue")}>
                  Work Queue
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {summary.high_risk_patients.map((pat: any) => (
                  <div
                    key={pat.id}
                    className="flex items-center justify-between rounded-md border p-3.5"
                    style={{
                      borderColor: "color-mix(in srgb, var(--danger) 18%, var(--line))",
                      background: "var(--surface)",
                    }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">{pat.patient_name}</p>
                      <p className="text-xs text-muted font-mono">{pat.patient_code}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <span className="badge badge-danger tabular-nums">
                        {(pat.final_probability * 100).toFixed(1)}%
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/patients/${encodeURIComponent(pat.patient_code)}/360`)}
                        title="360 view"
                      >
                        <UserCheck className="size-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/clinical-assistant?patient_id=${encodeURIComponent(pat.patient_code)}`)}
                        title="Ask AI"
                      >
                        <Bot className="size-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent assessments table */}
          <section
            className="rounded-lg border border-line overflow-hidden"
            style={{ background: "var(--surface)" }}
            aria-label="Recent assessments"
          >
            {/* Toolbar */}
            <div className="flex flex-col gap-3 p-4 border-b border-line sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text">Recent assessments</h2>
                <p className="text-xs text-muted mt-0.5">Latest clinical evaluations</p>
              </div>
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search patient…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-line bg-surface-strong pl-8 pr-3 py-1.5 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none"
                  aria-label="Search patients"
                />
              </div>
            </div>

            {/* Filter strip */}
            <div
              className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 border-b border-line text-xs"
              style={{ background: "var(--surface-strong)" }}
            >
              <span className="text-muted mr-1">Risk:</span>
              {["All", "Low", "Medium", "High"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={`rounded px-2.5 py-1 font-medium transition-colors ${
                    riskFilter === r
                      ? "bg-primary text-white"
                      : "text-muted hover:text-text hover:bg-surface-muted"
                  }`}
                >
                  {r}
                </button>
              ))}
              <span className="ml-3 text-muted mr-1">Sort:</span>
              {["Newest", "Oldest", "Highest Risk"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`rounded px-2.5 py-1 font-medium transition-colors ${
                    sortBy === s
                      ? "text-primary border border-primary/30 bg-primary-dim"
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
                  <thead
                    className="border-b border-line text-xs text-muted"
                    style={{ background: "var(--surface-strong)" }}
                  >
                    <tr>
                      <th className="px-4 py-3 font-medium">Patient</th>
                      <th className="px-4 py-3 font-medium text-muted">ID</th>
                      <th className="px-4 py-3 font-medium">Risk</th>
                      <th className="px-4 py-3 font-medium text-right">Score</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredAssessments.map((item: any) => (
                      <tr key={item.id} className="table-row-hover transition-colors">
                        <td className="px-4 py-3 font-medium text-text">{item.patient_name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted">{item.patient_code}</td>
                        <td className="px-4 py-3"><RiskBadge risk={item.risk} /></td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-semibold" style={{ color: "var(--primary)" }}>
                          {(item.final_probability * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {new Date(item.assessment_date).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/patients/${encodeURIComponent(item.patient_code)}/360`)}
                            >
                              360 View
                              <ArrowRight className="size-3" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/predictions/${item.id}`)}
                              title="Prediction details"
                            >
                              <ExternalLink className="size-3" aria-hidden="true" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* System status — thin footer strip instead of a full card */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-4 py-3 text-xs"
            style={{ background: "var(--surface)" }}
            aria-label="System status"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-success shrink-0" aria-hidden="true" />
              <span className="font-medium text-text">System status</span>
              <span className="badge badge-success">Operational</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <StatusDot label="Clinical model" status={summary.system_status?.clinical_model} />
              <StatusDot label="TreeSHAP" status={summary.system_status?.shap_explainer} />
              <StatusDot label="Keystroke model" status={summary.system_status?.keystroke_model} />
              <StatusDot label="AI Assistant" status={summary.system_status?.ai_assistant} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

