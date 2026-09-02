import {
  ArrowUpRight,
  Award,
  Bot,
  Brain,
  Clock,
  FileText,
  KeyRound,
  LineChart,
  PlusCircle,
  RefreshCw,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "../../components/Button";
import { ErrorState } from "../../components/ErrorState";
import { PageHeader } from "../../components/PageHeader";
import { RiskBadge } from "../../components/PredictionCard";
import { SkeletonProfile, SkeletonTable } from "../../components/Skeleton";
import { useToast } from "../../components/useToast";
import { getApiErrorMessage } from "../../services/authService";
import { downloadPdf } from "../../services/reportService";

import { apiFetch } from "../../services/api";

export function Patient360() {
  const { patient_id } = useParams<{ patient_id: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const loadData = useCallback(() => {
    if (!patient_id) return;
    setIsLoading(true);
    setError("");

    apiFetch(`/patients/${encodeURIComponent(patient_id)}/360`)
      .then((resData) => {
        setData(resData);
        setIsSaved(resData.scorecard?.scorecard?.is_saved || false);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Unable to load Patient 360 data.")))
      .finally(() => setIsLoading(false));
  }, [patient_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSavePatient = async () => {
    if (!patient_id) return;
    try {
      const method = isSaved ? "DELETE" : "POST";
      await apiFetch(`/saved-patients/${encodeURIComponent(patient_id)}`, { method });
      setIsSaved(!isSaved);
      notify({ type: "success", title: isSaved ? "Removed from My Patients" : "Saved to My Patients" });
    } catch {
      notify({ type: "error", title: "Could not update saved patient status." });
    }
  };

  const handleStateTransition = async (targetState: string) => {
    if (!patient_id || !data?.scorecard?.scorecard?.latest_prediction_id) return;
    try {
      const predId = data.scorecard.scorecard.latest_prediction_id || data.scorecard.top_attributions?.[0]?.prediction_id;
      await apiFetch(`/patients/${encodeURIComponent(patient_id)}/workflow-transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prediction_id: predId || 1,
          target_state: targetState,
          note: `Workflow transitioned to ${targetState}`,
        }),
      });
      notify({ type: "success", title: `Workflow state updated to ${targetState}` });
      loadData();
    } catch {
      notify({ type: "error", title: "Failed to update workflow state." });
    }
  };

  const handleCreateFollowUp = async () => {
    if (!patient_id || !followUpNote.trim() || !followUpDate) return;
    try {
      await apiFetch(`/patients/${encodeURIComponent(patient_id)}/follow-ups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: followUpNote.trim(),
          due_date: followUpDate,
        }),
      });
      notify({ type: "success", title: "Follow-up reminder scheduled." });
      setShowFollowUpModal(false);
      setFollowUpNote("");
      setFollowUpDate("");
      loadData();
    } catch {
      notify({ type: "error", title: "Failed to schedule follow-up." });
    }
  };

  if (isLoading) {
    return (
      <div className="page-canvas space-y-6">
        <PageHeader eyebrow="Clinician 360 Workspace" title="Patient 360° Profile" description="Loading complete patient intelligence record..." />
        <SkeletonProfile />
        <SkeletonTable rows={4} />
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="page-canvas space-y-6">
        <PageHeader eyebrow="Clinician 360 Workspace" title="Patient 360° Profile" description="Unable to load profile." />
        <ErrorState title="Unable to load Patient 360 record" message={error} onRetry={loadData} />
      </div>
    );
  }

  const { scorecard, longitudinal_forecast, risk_change_analysis, pending_followups, recent_timeline_events } = data;
  const patient = scorecard.patient;
  const card = scorecard.scorecard;
  const topAttr = scorecard.top_attributions || [];
  const keystroke = scorecard.keystroke_profile || {};

  const currentRisk = (card.risk_category || "Low").toLowerCase() as "low" | "medium" | "high";

  return (
    <div className="page-canvas space-y-7">
      {/* 1. PATIENT 360 HEADER */}
      <div className="glass-panel p-6 sm:p-7 space-y-5 border-primary/20 bg-primary/5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-line/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                FLAGSHIP PATIENT 360° WORKSPACE
              </span>
              <span className="badge badge-success text-[10px] font-mono font-bold">
                {data.smart_workflow_status}
              </span>
              <button
                onClick={toggleSavePatient}
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded transition ${
                  isSaved ? "bg-warning/20 text-warning" : "bg-white/5 text-muted hover:text-text"
                }`}
              >
                <Star className={`size-3.5 ${isSaved ? "fill-warning text-warning" : ""}`} />
                {isSaved ? "Saved in My Patients" : "Save Patient"}
              </button>
            </div>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-text">
              {patient.patient_name}
            </h1>
            <p className="text-xs font-mono text-muted mt-1">
              Patient ID: {patient.patient_id} · Age: {patient.age} · Gender: {patient.gender} · Last Assessment: {card.last_assessment_date ? new Date(card.last_assessment_date).toLocaleDateString() : "—"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge level={currentRisk} />
            <Button variant="primary" icon={Bot} onClick={() => navigate(`/clinical-assistant?patient_id=${patient.patient_id}`)}>
              Ask AI
            </Button>
            <Button variant="secondary" icon={PlusCircle} onClick={() => navigate("/prediction")}>
              New Assessment
            </Button>
            <Button variant="secondary" icon={FileText} onClick={() => void downloadPdf(1)}>
              Generate Report
            </Button>
          </div>
        </div>

        {/* WORKFLOW STEPPER */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-muted uppercase tracking-wider text-[11px]">Workflow Stepper:</span>
          <div className="flex items-center gap-2 font-mono">
            {["new", "in_review", "reviewed", "follow_up", "resolved"].map((st) => (
              <button
                key={st}
                onClick={() => handleStateTransition(st)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition ${
                  (card.workflow_status || "new").toLowerCase() === st
                    ? "bg-primary text-white shadow"
                    : "bg-white/5 text-muted hover:bg-white/10"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE LAYOUT */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* LEFT / MAIN COLUMN (2 COLS) */}
        <div className="xl:col-span-2 space-y-6">
          {/* 2. CURRENT RISK HERO CARD */}
          <div className="glass-panel p-6 space-y-4 border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">Decision Support Output</span>
                <h3 className="font-display text-lg font-bold text-text">Current Model-Assessed Risk Score</h3>
              </div>
              <RiskBadge level={currentRisk} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="rounded-xl border border-line bg-white/[0.02] p-3 space-y-1">
                <span className="text-muted block text-[11px]">Clinical Prob</span>
                <span className="font-bold text-lg text-text">{(card.clinical_model_probability * 100).toFixed(1)}%</span>
              </div>

              <div className="rounded-xl border border-line bg-white/[0.02] p-3 space-y-1">
                <span className="text-muted block text-[11px]">Keystroke Prob</span>
                <span className="font-bold text-lg text-text">{(card.keystroke_model_probability * 100).toFixed(1)}%</span>
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 space-y-1 col-span-2 sm:col-span-2">
                <span className="text-primary block text-[11px] font-bold">Combined Final Probability</span>
                <span className="font-extrabold text-2xl text-primary">{(card.combined_final_probability * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white/[0.02] p-3 text-xs text-muted font-mono leading-relaxed">
              <p className="font-bold text-text mb-1">Combined Decision Fusion Formula:</p>
              Final Probability = 0.7 × Clinical Prob + 0.3 × Keystroke Prob
              <p className="mt-1 text-[11px] italic text-muted">* Model probability output provides clinical decision support and does not constitute a diagnostic medical conclusion.</p>
            </div>
          </div>

          {/* 4. RISK PROGRESSION & LONGITUDINAL FORECAST */}
          {longitudinal_forecast && (
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-warning tracking-wider block">Longitudinal Tracking</span>
                  <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                    <LineChart className="size-5 text-warning" /> Risk Progression & Historical Trend
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-warning">{longitudinal_forecast.trend_direction} Trend</span>
              </div>

              {longitudinal_forecast.has_sufficient_data ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="border-b border-line bg-white/[0.02] text-muted">
                          <th className="p-2.5 font-semibold">Assessment Date</th>
                          <th className="p-2.5 font-semibold text-right">Clinical Prob</th>
                          <th className="p-2.5 font-semibold text-right">Keystroke Prob</th>
                          <th className="p-2.5 font-semibold text-right">Final Prob</th>
                          <th className="p-2.5 font-semibold">Risk Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/40">
                        {longitudinal_forecast.historical_points.map((pt: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/[0.01]">
                            <td className="p-2.5 text-text">{new Date(pt.date).toLocaleDateString()}</td>
                            <td className="p-2.5 text-right text-muted">{(pt.clinical_probability * 100).toFixed(1)}%</td>
                            <td className="p-2.5 text-right text-muted">{(pt.keystroke_probability * 100).toFixed(1)}%</td>
                            <td className="p-2.5 text-right font-bold text-primary">{(pt.final_probability * 100).toFixed(1)}%</td>
                            <td className="p-2.5 font-bold text-text">{pt.risk_level}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-xl border border-line bg-white/[0.02] p-3 text-xs flex justify-between items-center font-mono">
                    <span className="text-muted">30-Day Trend Slope:</span>
                    <span className="font-bold text-warning">
                      {longitudinal_forecast.trend_slope_per_month > 0 ? "+" : ""}
                      {(longitudinal_forecast.trend_slope_per_month * 100).toFixed(2)}% / month
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted italic p-3">{longitudinal_forecast.message}</p>
              )}
            </div>
          )}

          {/* 5. TREESHAP ATTRIBUTIONS ("WHY THIS SCORE?") */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">Explainable AI</span>
                <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                  <Brain className="size-5 text-primary" /> Why Did the Model Produce This Score?
                </h3>
              </div>
              <Link to={`/predictions/${scorecard.top_attributions?.[0]?.prediction_id || 1}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                Full Why-Risk View <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {topAttr.map((attr: any) => (
                <div key={attr.field} className="flex justify-between items-center rounded-xl border border-line bg-white/[0.02] p-3">
                  <span className="text-text font-semibold">{attr.feature}</span>
                  <span className={attr.contribution > 0 ? "font-bold text-danger" : "font-bold text-success"}>
                    {attr.contribution > 0 ? "↑ +" : "↓ "}{attr.contribution.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-line bg-white/[0.02] p-3 text-xs text-muted font-mono leading-relaxed">
              <p className="font-bold text-text mb-1">Additive TreeSHAP Reconstruction:</p>
              Base Value (50.04%) + Sum of SHAP Attributions ≈ Final Clinical Probability
              <p className="mt-1 text-[11px] italic text-muted">* SHAP values describe model feature attributions, not medical causation.</p>
            </div>
          </div>

          {/* 7. RISK CHANGE ("WHAT CHANGED?") */}
          {risk_change_analysis && (
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                  <RefreshCw className="size-5 text-warning" /> What Changed Between Assessments?
                </h3>
                <span className="text-xs font-mono text-muted">Delta Analysis</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="rounded-xl border border-line bg-white/[0.02] p-3">
                  <span className="text-muted block text-[11px]">Previous Probability</span>
                  <span className="font-bold text-base text-text">{(risk_change_analysis.previous_prediction?.final_probability * 100).toFixed(1)}%</span>
                </div>
                <div className="rounded-xl border border-line bg-white/[0.02] p-3">
                  <span className="text-muted block text-[11px]">Current Probability</span>
                  <span className="font-bold text-base text-primary">{(risk_change_analysis.current_prediction?.final_probability * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT / SIDEBAR COLUMN (1 COL) */}
        <div className="space-y-6">
          {/* 3. PATIENT SCORECARD */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-bold text-text flex items-center gap-1.5">
                <Award className="size-4 text-primary" /> Patient Scorecard
              </h3>
              <span className="text-xs font-mono font-bold text-success">{card.trend_direction}</span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted">Current Risk:</span>
                <span className="font-bold text-text">{card.risk_category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Workflow Status:</span>
                <span className="font-bold text-text">{data.smart_workflow_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Open Notifications:</span>
                <span className="font-bold text-primary">{data.open_notifications_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Pending Reminders:</span>
                <span className="font-bold text-warning">{pending_followups?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* 6. KEYSTROKE DYNAMICS */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-bold text-text flex items-center gap-1.5">
                <KeyRound className="size-4 text-blue" /> Keystroke Dynamics
              </h3>
              <span className="text-xs font-mono text-muted">Behavioral Latency</span>
            </div>

            <div className="rounded-xl border border-line bg-white/[0.02] p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted">Dwell Time (H):</span>
                <span className="font-bold text-text">{keystroke.key_dwell_time != null ? `${keystroke.key_dwell_time.toFixed(1)} ms` : "Baseline Default"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Flight Latency (UD):</span>
                <span className="font-bold text-text">{keystroke.up_down_flight_time != null ? `${keystroke.up_down_flight_time.toFixed(1)} ms` : "Baseline Default"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Down-Down Latency (DD):</span>
                <span className="font-bold text-text">{keystroke.down_down_latency != null ? `${keystroke.down_down_latency.toFixed(1)} ms` : "Baseline Default"}</span>
              </div>
            </div>
          </div>

          {/* 8. FOLLOW-UP REMINDERS */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-bold text-text flex items-center gap-1.5">
                <Clock className="size-4 text-warning" /> Follow-up Reminders
              </h3>
              <Button variant="secondary" icon={Clock} onClick={() => setShowFollowUpModal(true)}>
                New
              </Button>
            </div>

            {pending_followups && pending_followups.length > 0 ? (
              <div className="space-y-2 font-mono text-xs">
                {pending_followups.map((f: any) => (
                  <div key={f.id} className="rounded-xl border border-line bg-white/[0.02] p-3 space-y-1">
                    <span className="font-bold text-text block">{f.note}</span>
                    <span className="text-muted text-[11px]">Due: {f.due_date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted italic">No active pending follow-up reminders scheduled.</p>
            )}
          </div>

          {/* 7. PATIENT TIMELINE */}
          {recent_timeline_events && recent_timeline_events.length > 0 && (
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="font-display text-base font-bold text-text flex items-center gap-1.5">
                  <Clock className="size-4 text-primary" /> Patient Event Timeline
                </h3>
                <span className="text-xs font-mono text-muted">{recent_timeline_events.length} events</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {recent_timeline_events.map((ev: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-line bg-white/[0.02] p-3 space-y-1">
                    <span className="font-bold text-text block">{ev.event_type || ev.type || "Assessment"}</span>
                    <span className="text-muted text-[11px]">{new Date(ev.timestamp || ev.date || Date.now()).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. AI ASSISTANT LAUNCHER */}
          <div className="glass-panel p-6 space-y-4 border-primary/30 bg-primary/5">
            <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
              <Bot className="size-5 text-primary" /> AI Clinical Assistant
            </h3>
            <p className="text-xs text-muted leading-relaxed font-mono">
              Ask grounded questions regarding recent risk shifts, TreeSHAP attributions, or assessment history.
            </p>
            <Button variant="primary" icon={Bot} className="w-full" onClick={() => navigate(`/clinical-assistant?patient_id=${patient.patient_id}`)}>
              Launch AI Assistant
            </Button>
          </div>
        </div>
      </div>

      {/* FOLLOW UP MODAL */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-6 space-y-4 border-line">
            <h3 className="font-display text-lg font-bold text-text">Schedule Follow-up Reminder</h3>
            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-muted block font-semibold mb-1">Reminder Note</label>
                <textarea
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="e.g. Review updated lab values and glucose readings..."
                  className="w-full rounded-xl border border-line bg-white/[0.03] p-3 text-text text-xs focus:border-primary focus:outline-none min-h-20"
                />
              </div>

              <div>
                <label className="text-muted block font-semibold mb-1">Due Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white/[0.03] p-2.5 text-text text-xs focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowFollowUpModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateFollowUp}>
                Schedule Reminder
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
