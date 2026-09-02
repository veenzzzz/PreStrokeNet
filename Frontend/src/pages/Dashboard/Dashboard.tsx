import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  LineChart,
  ListFilter,
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
import { SkeletonCard, SkeletonChart, SkeletonTable } from "../../components/Skeleton";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../services/authService";
import { getDashboardStatistics, getDashboardSummary } from "../../services/dashboardService";
import type { DashboardDistributionItem, DashboardStatistics } from "../../types";

function DistributionChart({ data }: { data: DashboardDistributionItem[] }) {
  const max = Math.max(...data.map((item) => item.count), 1);
  return (
    <div className="mt-4 space-y-3 font-mono text-xs">
      {data.length === 0 ? (
        <p className="text-muted italic">No risk distribution data available.</p>
      ) : (
        data.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-text">{item.label} Risk</span>
              <span className="font-bold text-text">{item.count} patients</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/5 border border-line">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  item.label === "High"
                    ? "bg-danger"
                    : item.label === "Medium"
                    ? "bg-warning"
                    : "bg-success"
                }`}
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  const load = () => {
    setIsLoading(true);
    setError("");
    Promise.all([getDashboardSummary(), getDashboardStatistics()])
      .then(([nextSummary, nextStats]) => {
        setSummary(nextSummary);
        setStats(nextStats);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Unable to load dashboard data.")))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const currentDateStr = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const filteredAssessments = useMemo(() => {
    if (!summary?.recent_assessments) return [];
    let items = [...summary.recent_assessments];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) => item.patient_name.toLowerCase().includes(q) || item.patient_code.toLowerCase().includes(q)
      );
    }

    if (riskFilter !== "All") {
      items = items.filter((item) => item.risk.toLowerCase() === riskFilter.toLowerCase());
    }

    if (dateFilter !== "All") {
      const now = new Date();
      items = items.filter((item) => {
        const itemDate = new Date(item.assessment_date);
        const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
        if (dateFilter === "Today") return diffDays <= 1;
        if (dateFilter === "7days") return diffDays <= 7;
        if (dateFilter === "30days") return diffDays <= 30;
        return true;
      });
    }

    if (sortBy === "Newest") {
      items.sort((a, b) => new Date(b.assessment_date).getTime() - new Date(a.assessment_date).getTime());
    } else if (sortBy === "Oldest") {
      items.sort((a, b) => new Date(a.assessment_date).getTime() - new Date(b.assessment_date).getTime());
    } else if (sortBy === "Highest Risk") {
      items.sort((a, b) => b.final_probability - a.final_probability);
    } else if (sortBy === "Lowest Risk") {
      items.sort((a, b) => a.final_probability - b.final_probability);
    }

    return items;
  }, [summary, searchQuery, riskFilter, dateFilter, sortBy]);

  if (error) {
    return (
      <div className="page-canvas space-y-6">
        <PageHeader eyebrow="Clinical Dashboard" title="Clinical Intelligence Command Center" description="Workspace error state." />
        <ErrorState title="Unable to load dashboard data" message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="page-canvas space-y-7">
      <PageHeader
        eyebrow="Clinical Command Center"
        title="Patient Monitoring & Decision Support Workspace"
        description={`Current date: ${currentDateStr} | Logged in as ${user?.fullName ?? "Clinician"} (${user?.role ?? "Doctor"})`}
        action={{ label: "New Assessment", to: "/prediction" }}
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonTable rows={4} />
          <SkeletonChart />
        </div>
      ) : summary ? (
        <>
          {/* 1. KEY PERFORMANCE INDICATORS */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <DashboardCard label="Total Patients" value={String(summary.total_patients)} trend="Distinct patient records" icon={UsersRound} tone="primary" />
            <DashboardCard label="Assessments" value={String(summary.total_assessments)} trend="Evaluated predictions" icon={Activity} tone="blue" />
            <DashboardCard label="High Risk" value={String(summary.high_risk)} trend="P ≥ 0.60" icon={AlertTriangle} tone="danger" />
            <DashboardCard label="Medium Risk" value={String(summary.medium_risk)} trend="0.30 ≤ P < 0.60" icon={Clock} tone="warning" />
            <DashboardCard label="Low Risk" value={String(summary.low_risk)} trend="P < 0.30" icon={CheckCircle2} tone="success" />
          </section>

          {/* 2. PATIENTS REQUIRING ATTENTION */}
          <section className="glass-panel p-6 border-danger/30 bg-danger/5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-danger/20 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-danger text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                    HIGH WORKFLOW PRIORITY
                  </span>
                  <span className="text-xs font-mono text-muted">
                    {summary.high_risk_patients?.length || 0} patients flagged for review
                  </span>
                </div>
                <h2 className="mt-1 font-display text-xl font-bold text-text flex items-center gap-2">
                  <AlertTriangle className="size-5 text-danger" /> Patients Requiring Attention
                </h2>
              </div>
              <Button variant="secondary" icon={ListFilter} onClick={() => navigate("/work-queue")}>
                View Work Queue
              </Button>
            </div>

            {!summary.high_risk_patients || summary.high_risk_patients.length === 0 ? (
              <EmptyState
                title="No High-Risk Attention Flags"
                description="All monitored patient assessments currently fall within Low or Medium risk workflow thresholds."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {summary.high_risk_patients.map((pat: any) => (
                  <div key={pat.id} className="rounded-xl border border-danger/30 bg-app/90 p-4 space-y-3 shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-base text-text">{pat.patient_name}</h4>
                        <span className="font-mono text-xs text-muted">ID: {pat.patient_code}</span>
                      </div>
                      <span className="badge badge-danger text-xs font-mono font-bold">
                        {(pat.final_probability * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="text-xs font-mono text-muted space-y-1">
                      <div className="flex justify-between">
                        <span>Risk Category:</span>
                        <span className="font-bold text-danger">HIGH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Workflow Priority:</span>
                        <span className="font-bold text-text">Requires Review</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-line/40 flex flex-wrap items-center gap-2 text-xs">
                      <Button variant="primary" onClick={() => navigate(`/patients/${encodeURIComponent(pat.patient_code)}/360`)}>
                        <UserCheck className="size-3.5 mr-1" /> Patient 360
                      </Button>
                      <Button variant="secondary" onClick={() => navigate(`/predictions/${pat.id}`)}>
                        <ExternalLink className="size-3.5 mr-1" /> Prediction
                      </Button>
                      <Button variant="secondary" onClick={() => navigate(`/clinical-assistant?patient_id=${encodeURIComponent(pat.patient_code)}`)}>
                        <Bot className="size-3.5 mr-1" /> Ask AI
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. RISK OVERVIEW & RECENT RISK TRANSITIONS */}
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Risk Distribution Overview */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">Risk Distribution</span>
                  <h3 className="font-display text-base font-bold text-text">Model Risk Cohort Breakdown</h3>
                </div>
                <BarChart3 className="size-5 text-primary" />
              </div>
              <DistributionChart data={stats?.risk_distribution || []} />
              <div className="border-t border-line/40 pt-3 text-[11px] text-muted italic">
                * Based on production model probability cutoff threshold = 0.15.
              </div>
            </div>

            {/* Recent Risk Changes */}
            <div className="glass-panel p-6 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-warning tracking-wider block">Longitudinal Shift</span>
                  <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                    <LineChart className="size-5 text-warning" /> Recent Risk Transitions
                  </h3>
                </div>
                <span className="text-xs font-mono text-muted">{summary.risk_changes?.length || 0} shift events</span>
              </div>

              {!summary.risk_changes || summary.risk_changes.length === 0 ? (
                <EmptyState
                  title="No Recent Risk Transitions"
                  description="No consecutive assessment probability shifts detected for active patients."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {summary.risk_changes.map((rc: any, idx: number) => (
                    <div key={idx} className="rounded-xl border border-line bg-white/[0.02] p-4 space-y-2 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-text">{rc.patient_name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            rc.status === "Risk Increased"
                              ? "bg-danger/20 text-danger"
                              : rc.status === "Risk Decreased"
                              ? "bg-success/20 text-success"
                              : "bg-white/10 text-muted"
                          }`}
                        >
                          {rc.status === "Risk Increased" ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          {rc.status}
                        </span>
                      </div>

                      <div className="flex justify-between text-muted pt-1">
                        <span>Prev: {rc.previous_risk} ({(rc.previous_prob * 100).toFixed(1)}%)</span>
                        <span>Curr: {rc.current_risk} ({(rc.current_prob * 100).toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. RECENT ASSESSMENTS WORKSPACE TABLE */}
          <section className="glass-panel p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">Assessments Workspace</span>
                <h3 className="font-display text-lg font-bold text-text">Recent Clinical Evaluations</h3>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[240px]">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Search patient name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-line bg-white/[0.03] pl-9 pr-4 py-2 text-xs text-text placeholder:text-muted focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center gap-2 text-xs border-b border-line/40 pb-3 font-mono">
              <span className="text-muted font-semibold">Filter Risk:</span>
              {["All", "Low", "Medium", "High"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={`px-2.5 py-1 rounded-lg transition-colors font-bold ${
                    riskFilter === r ? "bg-primary text-white shadow" : "bg-white/5 text-muted hover:text-text"
                  }`}
                >
                  {r}
                </button>
              ))}

              <span className="text-muted font-semibold ml-3">Date:</span>
              {[
                { label: "All", val: "All" },
                { label: "Today", val: "Today" },
                { label: "7 Days", val: "7days" },
                { label: "30 Days", val: "30days" },
              ].map((d) => (
                <button
                  key={d.val}
                  onClick={() => setDateFilter(d.val)}
                  className={`px-2.5 py-1 rounded-lg transition-colors font-bold ${
                    dateFilter === d.val ? "bg-primary text-white shadow" : "bg-white/5 text-muted hover:text-text"
                  }`}
                >
                  {d.label}
                </button>
              ))}

              <span className="text-muted font-semibold ml-4">Sort:</span>
              {["Newest", "Oldest", "Highest Risk"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-2.5 py-1 rounded-lg transition-colors font-bold ${
                    sortBy === s ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 text-muted hover:text-text"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {filteredAssessments.length === 0 ? (
              <EmptyState title="No Matching Evaluations" description="No clinical assessments match the active search and risk filter criteria." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-line bg-white/[0.02] text-muted">
                      <th className="p-3 font-semibold">Patient Name</th>
                      <th className="p-3 font-semibold">Patient ID</th>
                      <th className="p-3 font-semibold">Risk Category</th>
                      <th className="p-3 font-semibold text-right">Clinical Prob</th>
                      <th className="p-3 font-semibold text-right">Final Prob</th>
                      <th className="p-3 font-semibold">Assessment Date</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/40">
                    {filteredAssessments.map((item: any) => (
                      <tr key={item.id} className="hover:bg-white/[0.01]">
                        <td className="p-3 font-bold text-text">{item.patient_name}</td>
                        <td className="p-3 text-muted">{item.patient_code}</td>
                        <td className="p-3 font-bold text-text">{item.risk}</td>
                        <td className="p-3 text-right text-muted">{(item.clinical_probability * 100).toFixed(1)}%</td>
                        <td className="p-3 text-right font-extrabold text-primary">{(item.final_probability * 100).toFixed(1)}%</td>
                        <td className="p-3 text-muted">{new Date(item.assessment_date).toLocaleDateString()}</td>
                        <td className="p-3 text-right space-x-2">
                          <Button variant="secondary" onClick={() => navigate(`/patients/${encodeURIComponent(item.patient_code)}/360`)}>
                            Patient 360
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 5. SYSTEM HEALTH & SERVICE OPERATIONAL STATUS */}
          <section className="glass-panel p-5 border border-line bg-white/[0.01]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Service Infrastructure Status</span>
                <h3 className="text-sm font-bold text-text flex items-center gap-2 mt-0.5">
                  <ShieldCheck className="size-4 text-success" /> System Operational Status
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success font-medium">
                  <span className="size-2 rounded-full bg-success animate-pulse" /> Clinical Model: {summary.system_status?.clinical_model ?? "Operational"}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success font-medium">
                  <span className="size-2 rounded-full bg-success animate-pulse" /> TreeSHAP: {summary.system_status?.shap_explainer ?? "Operational"}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success font-medium">
                  <span className="size-2 rounded-full bg-success animate-pulse" /> Keystroke Model: {summary.system_status?.keystroke_model ?? "Operational"}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success font-medium">
                  <span className="size-2 rounded-full bg-success animate-pulse" /> AI Assistant: {summary.system_status?.ai_assistant ?? "Operational"}
                </span>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
