import { ArrowLeft, RefreshCw, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, Download, Eye, Bot } from "lucide-react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { Loader } from "../../components/Loader";
import { useToast } from "../../components/useToast";
import { RiskBadge } from "../../components/PredictionCard";
import { getApiErrorMessage } from "../../services/authService";
import { getPatientHistory, getPatientRiskProgression, getPatientTimeline } from "../../services/patient";
import { downloadPdf } from "../../services/reportService";
import { PatientScorecard } from "./components/PatientScorecard";
import { RiskForecastPanel } from "./components/RiskForecastPanel";
import { RiskChangeComparison } from "./components/RiskChangeComparison";
import type {
  PatientAssessmentHistoryItem,
  RiskProgressionResponse,
  ActivityEvent,
  RiskProgressionPoint
} from "../../types";

export function PatientProfile() {
  const { patient_id } = useParams<{ patient_id: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();

  const [history, setHistory] = useState<PatientAssessmentHistoryItem[]>([]);
  const [progression, setProgression] = useState<RiskProgressionPoint[]>([]);
  const [latestAssessment, setLatestAssessment] = useState<RiskProgressionResponse["latest_assessment"] | null>(null);
  const [timeline, setTimeline] = useState<ActivityEvent[]>([]);

  // Assessment Comparison Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeComparisonPair, setActiveComparisonPair] = useState<[number, number] | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters for Assessment History
  const [riskFilter, setRiskFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  const loadData = useCallback(async () => {
    if (!patient_id) return;
    setIsLoading(true);
    setError("");

    try {
      const [histData, progData, timelineData] = await Promise.all([
        getPatientHistory(patient_id),
        getPatientRiskProgression(patient_id),
        getPatientTimeline(patient_id)
      ]);

      setHistory(histData);
      setProgression(progData.progression);
      setLatestAssessment(progData.latest_assessment);
      setTimeline(timelineData);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load patient records."));
    } finally {
      setIsLoading(false);
    }
  }, [patient_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filters calculation
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (riskFilter !== "All" && item.risk.toLowerCase() !== riskFilter.toLowerCase()) {
        return false;
      }
      if (statusFilter !== "All" && item.status !== statusFilter) {
        return false;
      }
      if (dateFromFilter) {
        const fromDate = new Date(dateFromFilter);
        const itemDate = new Date(item.created_at);
        if (itemDate < fromDate) return false;
      }
      if (dateToFilter) {
        const toDate = new Date(dateToFilter);
        // set to end of day
        toDate.setHours(23, 59, 59, 999);
        const itemDate = new Date(item.created_at);
        if (itemDate > toDate) return false;
      }
      return true;
    });
  }, [history, riskFilter, statusFilter, dateFromFilter, dateToFilter]);

  const handleDownloadPdf = async (id: number) => {
    try {
      await downloadPdf(id);
      notify({ type: "success", title: "PDF downloaded successfully" });
    } catch (err) {
      notify({
        type: "error",
        title: "Download failed",
        message: getApiErrorMessage(err, "Unable to download report PDF.")
      });
    }
  };

  const latestPrediction = useMemo(() => {
    if (history.length === 0) return null;
    // History is sorted descending (latest first)
    return history[0];
  }, [history]);

  if (isLoading) {
    return (
      <div className="page-canvas" aria-label="Loading patient profile">
        <PageHeader eyebrow="Patient profile" title="Loading profile..." description="Retrieving patient history, progression, and clinical timelines." />
        <div className="glass-panel mt-7 flex h-96 items-center justify-center">
          <Loader label="Gathering patient data" />
        </div>
      </div>
    );
  }

  if (error || !latestPrediction) {
    return (
      <div className="page-canvas">
        <PageHeader eyebrow="Patient profile" title="Patient Profile" description="Overview of patient stroke risk assessments." action={{ label: "Back to reports", to: "/reports", icon: ArrowLeft }} />
        <div className="glass-panel mt-7 p-7 text-center">
          <AlertCircle className="mx-auto size-12 text-danger" />
          <h2 className="mt-4 font-display text-xl font-bold text-text">Error Loading Profile</h2>
          <p className="mt-2 text-sm text-muted">{error || "Patient has no history or prediction records."}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate("/reports")}>Back to reports</Button>
            <Button onClick={loadData} icon={RefreshCw}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-canvas">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Clinician Decision-Support"
          title={`Patient: ${latestPrediction.patient_name}`}
          description={`Patient ID: ${latestPrediction.patient_id} · Detailed risk tracking over time.`}
          action={{ label: "Back to reports", to: "/reports", icon: ArrowLeft }}
        />
        <Button variant="secondary" icon={Bot} onClick={() => navigate(`/clinical-assistant?patient_id=${patient_id}`)}>
          Ask AI Assistant
        </Button>
      </div>

      {activeComparisonPair && patient_id && (
        <div className="mt-7">
          <RiskChangeComparison
            patientId={patient_id}
            previousId={activeComparisonPair[0]}
            currentId={activeComparisonPair[1]}
            onClose={() => setActiveComparisonPair(null)}
          />
        </div>
      )}

      {patient_id && (
        <div className="mt-7 space-y-5">
          <PatientScorecard patientId={patient_id} />
          <RiskForecastPanel patientId={patient_id} />
        </div>
      )}

      <div className="mt-7 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        {/* Left Column: Progression & Historical Details */}
        <div className="space-y-5">
          {/* Patient Details & Latest Assessment */}
          <section className="glass-panel p-6 sm:p-7">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Patient Demographics</p>
                <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <span className="text-xs text-muted">Name</span>
                    <p className="font-medium text-text">{latestPrediction.patient_name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted">Patient ID</span>
                    <p className="font-mono text-text">{latestPrediction.patient_id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted">Age</span>
                    <p className="font-medium text-text">{latestPrediction.age} years</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted">Gender</span>
                    <p className="font-medium text-text">{latestPrediction.gender === 1 ? "Male" : latestPrediction.gender === 0 ? "Female" : "—"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-white/[0.02] p-5 md:min-w-[240px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-success">Latest Assessment</span>
                  <RiskBadge level={latestPrediction.risk.toLowerCase() as "low" | "medium" | "high"} />
                </div>
                <h3 className="mt-3 font-display text-4xl font-bold text-text">
                  {(latestPrediction.final_probability * 100).toFixed(1)}%
                </h3>
                <p className="text-xs text-muted">Combined Predicted Stroke Risk</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-white/[0.02] p-2">
                    <span className="text-muted block">Clinical</span>
                    <span className="font-mono font-medium text-text">{(latestPrediction.clinical_probability * 100).toFixed(1)}%</span>
                  </div>
                  <div className="rounded-lg bg-white/[0.02] p-2">
                    <span className="text-muted block">Keystroke</span>
                    <span className="font-mono font-medium text-text">{(latestPrediction.keystroke_probability * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Risk Progression Chart */}
          <section className="glass-panel p-6 sm:p-7">
            <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Stroke Risk Progression Trend
            </h2>
            <p className="text-xs text-muted mt-1">Sequential assessments plotted over time</p>
            
            <div className="mt-6">
              {progression.length < 2 ? (
                <div className="flex flex-col items-center justify-center py-10 border border-dashed border-line rounded-xl bg-white/[0.01]">
                  <TrendingUp className="size-10 text-muted opacity-40" />
                  <p className="mt-3 font-medium text-text">No progression data available</p>
                  <p className="mt-1 text-xs text-muted">Multiple assessments are required to show trends over time.</p>
                </div>
              ) : (
                <ProgressionChart points={progression} />
              )}
            </div>
          </section>

          {/* Assessment History Table */}
          <section className="glass-panel overflow-hidden">
            <div className="p-6 sm:p-7 border-b border-line">
              <h2 className="font-display text-lg font-bold text-text">Historical Assessments</h2>
              <p className="text-xs text-muted mt-1">Observational log of all completed assessments</p>
              
              {/* Table Filters */}
              <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label htmlFor="risk-filter" className="text-xs font-medium text-muted">Risk level</label>
                  <select
                    id="risk-filter"
                    className="field-shell mt-1.5 w-full px-3 py-2 text-xs text-text outline-hidden"
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                  >
                    <option value="All">All Risks</option>
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="status-filter" className="text-xs font-medium text-muted">Report status</label>
                  <select
                    id="status-filter"
                    className="field-shell mt-1.5 w-full px-3 py-2 text-xs text-text outline-hidden"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="final">Final</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="date-from-filter" className="text-xs font-medium text-muted">Date from</label>
                  <input
                    id="date-from-filter"
                    type="date"
                    className="field-shell mt-1.5 w-full px-3 py-2 text-xs text-text outline-hidden"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="date-to-filter" className="text-xs font-medium text-muted">Date to</label>
                  <input
                    id="date-to-filter"
                    type="date"
                    className="field-shell mt-1.5 w-full px-3 py-2 text-xs text-text outline-hidden"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                  />
                </div>
              </div>
              {selectedIds.length === 2 && (
                <div className="mt-4 flex items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary/10">
                  <span className="text-xs text-text font-semibold">2 assessments selected for Risk Change Comparison</span>
                  <Button
                    onClick={() => setActiveComparisonPair([selectedIds[0], selectedIds[1]])}
                    className="text-xs"
                  >
                    Explain Risk Change ({selectedIds[0]} ↔ {selectedIds[1]})
                  </Button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-surface-strong text-xs text-muted">
                  <tr>
                    <th className="px-3 py-4 text-center">Compare</th>
                    <th className="px-6 py-4 text-left">Date & Time</th>
                    <th className="px-6 py-4 text-left">Clinical</th>
                    <th className="px-6 py-4 text-left">Keystroke</th>
                    <th className="px-6 py-4 text-left">Final Prob</th>
                    <th className="px-6 py-4 text-left">Risk</th>
                    <th className="px-6 py-4 text-left">Method</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredHistory.map((item) => {
                    const isChecked = selectedIds.includes(item.id);
                    return (
                      <tr key={item.id} className="transition-colors hover:bg-white/[0.015]">
                        <td className="px-3 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedIds(selectedIds.filter((id) => id !== item.id));
                              } else {
                                if (selectedIds.length >= 2) {
                                  setSelectedIds([selectedIds[1], item.id]);
                                } else {
                                  setSelectedIds([...selectedIds, item.id]);
                                }
                              }
                            }}
                            className="rounded border-line bg-white/5 text-primary focus:ring-0"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-text">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-muted">
                        {(item.clinical_probability * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-muted">
                        {(item.keystroke_probability * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-medium text-text">
                        {(item.final_probability * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RiskBadge level={item.risk.toLowerCase() as "low" | "medium" | "high"} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-muted">
                        <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] uppercase ${item.explainability_method === "shap" ? "bg-primary/10 text-primary" : "bg-white/5 text-muted"}`}>
                          {item.explainability_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <div className="flex justify-end gap-2">
                          <Link
                            className="rounded-lg p-2 text-muted hover:bg-white/6 hover:text-text"
                            to={`/predictions/${item.id}`}
                            title="View report"
                          >
                            <Eye className="size-4" />
                          </Link>
                          <Button
                            variant="ghost"
                            icon={Download}
                            title="Download PDF"
                            onClick={() => handleDownloadPdf(item.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-muted">
                        No historical assessments match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column: Risk Change, SHAP Contrast, Timeline */}
        <aside className="space-y-5">
          {/* Risk Change Analysis Card */}
          {latestAssessment && (
            <section className="glass-panel p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-success">Risk Progression</p>
              <h2 className="mt-1 font-display text-xl font-bold text-text">Risk Change Analysis</h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-line bg-white/[0.01] p-3 text-center">
                  <span className="text-[11px] text-muted block">Previous Risk</span>
                  <span className="font-mono text-lg font-medium text-muted">
                    {latestAssessment.previous_probability !== null 
                      ? `${(latestAssessment.previous_probability * 100).toFixed(1)}%` 
                      : "—"}
                  </span>
                </div>
                <div className="rounded-xl border border-line bg-white/[0.01] p-3 text-center">
                  <span className="text-[11px] text-muted block">Current Risk</span>
                  <span className="font-mono text-lg font-medium text-text">
                    {(latestAssessment.current_probability * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                <div>
                  <span className="text-xs text-muted block">Absolute Change</span>
                  <span className={`font-mono text-sm font-bold flex items-center gap-1 mt-1 ${latestAssessment.direction === "Increased" ? "text-danger" : latestAssessment.direction === "Decreased" ? "text-success" : "text-text"}`}>
                    {latestAssessment.direction === "Increased" && <ArrowUpRight className="size-4" />}
                    {latestAssessment.direction === "Decreased" && <ArrowDownRight className="size-4" />}
                    {latestAssessment.absolute_change > 0 ? "+" : ""}
                    {(latestAssessment.percentage_change).toFixed(1)} pp
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted block">Trend Status</span>
                  <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${latestAssessment.direction === "Increased" ? "bg-danger/10 text-danger" : latestAssessment.direction === "Decreased" ? "bg-success/10 text-success" : "bg-white/5 text-text"}`}>
                    {latestAssessment.direction}
                  </span>
                </div>
              </div>

              <div className="mt-5 p-3 rounded-lg bg-white/[0.02] border border-line/50">
                <p className="text-xs text-text leading-relaxed">
                  {latestAssessment.status_message}
                </p>
                <p className="text-[10px] text-muted mt-2 leading-relaxed">
                  *SHAP contributions represent statistical model attributions (how the model arrived at this prediction) and are not a medically causal diagnosis.
                </p>
              </div>
            </section>
          )}

          {/* SHAP Contrast Analysis */}
          {latestAssessment && latestAssessment.shap_comparison.length > 0 && (
            <section className="glass-panel p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Explainable AI Contrast</p>
              <h2 className="mt-1 font-display text-xl font-bold text-text">Top Contributor Shift</h2>
              <p className="text-xs text-muted mt-1">Attribution shifts between current and previous assessments</p>

              {latestAssessment.previous_probability === null ? (
                <div className="mt-5 p-4 text-center text-xs text-muted bg-white/[0.01] border border-dashed border-line rounded-lg">
                  No previous assessment available for SHAP comparison.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {latestAssessment.shap_comparison.slice(0, 5).map((comp) => {
                    return (
                      <div key={comp.field} className="rounded-xl border border-line bg-white/[0.01] p-3 text-xs">
                        <div className="flex justify-between font-medium text-text">
                          <span>{comp.feature}</span>
                          <span className={`font-mono ${comp.change > 0 ? "text-danger" : comp.change < 0 ? "text-success" : "text-text"}`}>
                            {comp.change > 0 ? "+" : ""}{comp.change.toFixed(3)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-muted text-[11px] font-mono">
                          <span>
                            Prev: {comp.previous_contribution !== null ? `${comp.previous_contribution > 0 ? "+" : ""}${comp.previous_contribution.toFixed(3)}` : "—"}
                          </span>
                          <span>
                            Curr: {comp.current_contribution > 0 ? "+" : ""}{comp.current_contribution.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Clinical Timeline Event Feed */}
          <section className="glass-panel p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Timeline Event Feed</p>
            <h2 className="mt-1 font-display text-xl font-bold text-text">Patient Timeline</h2>
            
            <div className="mt-6 space-y-5 max-h-96 overflow-y-auto pr-1">
              {timeline.length === 0 ? (
                <p className="text-sm text-muted">No activity events recorded yet.</p>
              ) : (
                timeline.map((event) => (
                  <div key={event.id} className="relative flex gap-3 pb-1">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm text-text font-medium">{event.message}</p>
                      <p className="mt-1 text-[11px] text-muted">
                        {new Date(event.created_at).toLocaleString()}
                        {event.actor_name ? ` · ${event.actor_name}` : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

// progression chart SVG line drawing
function ProgressionChart({ points }: { points: RiskProgressionPoint[] }) {
  const width = 620;
  const height = 180;
  const paddingX = 40;
  const paddingY = 20;

  const pointsCount = points.length;

  const coords = useMemo(() => {
    return points.map((p, index) => {
      const x = paddingX + (index / (pointsCount - 1)) * (width - 2 * paddingX);
      const yClinical = height - paddingY - (p.clinical_probability * (height - 2 * paddingY));
      const yKeystroke = height - paddingY - (p.keystroke_probability * (height - 2 * paddingY));
      const yFinal = height - paddingY - (p.final_probability * (height - 2 * paddingY));

      return { x, yClinical, yKeystroke, yFinal, date: new Date(p.assessment_date).toLocaleDateString(), risk: p.risk };
    });
  }, [points, pointsCount]);

  const drawPath = (key: "yClinical" | "yKeystroke" | "yFinal") => {
    return coords.map((c, index) => `${index === 0 ? "M" : "L"}${c.x.toFixed(1)} ${c[key].toFixed(1)}`).join(" ");
  };

  return (
    <div className="w-full">
      <svg className="w-full overflow-visible h-44" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Horizontal grid lines */}
        {[0.25, 0.50, 0.75].map((val) => {
          const y = height - paddingY - (val * (height - 2 * paddingY));
          return (
            <g key={val}>
              <line x1={paddingX} x2={width - paddingX} y1={y} y2={y} stroke="var(--line)" strokeDasharray="3 8" />
              <text x={paddingX - 10} y={y + 4} textAnchor="end" fill="var(--muted)" className="text-[10px] font-mono">
                {Math.round(val * 100)}%
              </text>
            </g>
          );
        })}

        {/* Drawn paths */}
        <path d={drawPath("yClinical")} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d={drawPath("yKeystroke")} fill="none" stroke="#fb923c" strokeWidth="1.5" strokeDasharray="2 2" />
        <path d={drawPath("yFinal")} fill="none" stroke="var(--primary)" strokeWidth="3" />

        {/* Draw dots on the Final probability path */}
        {coords.map((c, index) => (
          <g key={index}>
            <circle cx={c.x} cy={c.yFinal} r="4" fill="var(--primary)" />
            <title>{`Final Prob: ${c.risk} (${c.date})`}</title>
          </g>
        ))}
      </svg>

      {/* Axis dates */}
      <div className="mt-2 flex justify-between text-[10px] text-muted px-10">
        <span>{coords[0]?.date}</span>
        {coords.length > 2 && <span>{coords[Math.floor(coords.length / 2)]?.date}</span>}
        <span>{coords.at(-1)?.date}</span>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 border-t-2 border-[#38bdf8] border-dashed" />
          <span>Clinical Prob</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 border-t-2 border-[#fb923c] border-dotted" />
          <span>Keystroke Prob</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-primary" style={{ height: "3px" }} />
          <span className="font-semibold text-text">Final Combined Prob</span>
        </div>
      </div>
    </div>
  );
}
