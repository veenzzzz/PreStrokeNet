import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  FileSpreadsheet,
  FileText,
  Mail,
  Printer,
  Save,
  ShieldCheck,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { Button } from "../../components/Button";
import { ErrorState } from "../../components/ErrorState";
import { PageHeader } from "../../components/PageHeader";
import { RiskBadge } from "../../components/PredictionCard";
import { SkeletonCard, SkeletonTable } from "../../components/Skeleton";
import { useToast } from "../../components/useToast";
import { getApiErrorMessage } from "../../services/authService";
import { deletePrediction, getPrediction, updateDoctorNotes, updatePrediction } from "../../services/predictionHistoryService";
import { downloadExcel, downloadPdf, emailReport } from "../../services/reportService";
import type { DoctorNotePayload, EmailReportPayload, PredictionDetail, PredictionUpdatePayload } from "../../types";
import { ExplainabilityPanel } from "../Prediction/components/ExplainabilityPanel";
import { EmailReportDialog } from "../Reports/components/EmailReportDialog";
import { KeystrokeAnalyticsPanel } from "./components/KeystrokeAnalyticsPanel";
import { WhyRiskView } from "./components/WhyRiskView";
import { PredictionEditForm } from "./PredictionEditForm";

const featureLabels: Record<string, string> = {
  gender: "Gender",
  age: "Age (years)",
  hypertension: "Hypertension",
  heart_disease: "Heart disease",
  ever_married: "Ever married",
  work_type: "Work type",
  Residence_type: "Residence type",
  avg_glucose_level: "Average glucose (mg/dL)",
  bmi: "BMI (kg/m²)",
  smoking_status: "Smoking status",
  key: "Key code",
  H: "Hold time H (ms)",
  UD: "Up-down latency UD (ms)",
  DD: "Down-down latency DD (ms)",
};

export function PredictionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const predictionId = Number(id);
  const [detail, setDetail] = useState<PredictionDetail | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [status, setStatus] = useState<DoctorNotePayload["status"]>("reviewed");
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const { notify } = useToast();

  const load = useCallback(() => {
    setIsLoading(true);
    getPrediction(predictionId)
      .then((next) => {
        setDetail(next);
        setNotes(next.doctor_notes ?? "");
        setDiagnosis(next.diagnosis ?? "");
        setRecommendation(next.recommendation ?? "");
        setFollowUpDate(next.follow_up_date ?? "");
        setStatus(next.status ?? "reviewed");
        setError("");
      })
      .catch((requestError) => setError(getApiErrorMessage(requestError, "Unable to load this prediction.")))
      .finally(() => setIsLoading(false));
  }, [predictionId]);

  useEffect(() => {
    if (Number.isFinite(predictionId)) load();
    else {
      setError("Prediction ID is invalid.");
      setIsLoading(false);
    }
  }, [load, predictionId]);

  useEffect(() => {
    if (searchParams.get("edit") === "1" && detail) {
      document.getElementById("edit-prediction")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [detail, searchParams]);

  if (isLoading) {
    return (
      <div className="page-canvas space-y-6">
        <PageHeader eyebrow="Clinical record" title="Prediction details" description="Loading prediction details..." />
        <SkeletonCard />
        <SkeletonTable rows={4} />
      </div>
    );
  }

  if (!detail || error) {
    return (
      <div className="page-canvas space-y-6">
        <PageHeader eyebrow="Clinical record" title="Prediction details" description="Unable to load record." />
        <ErrorState title="Unable to load prediction record" message={error || "Prediction not found."} onRetry={load} />
      </div>
    );
  }

  const saveNotes = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload: DoctorNotePayload = {
        diagnosis: diagnosis.trim() || null,
        doctor_notes: notes.trim(),
        recommendation: recommendation.trim() || null,
        follow_up_date: followUpDate || null,
        status,
      };
      const next = await updateDoctorNotes(detail.id, payload);
      setDetail(next);
      setError("");
      notify({ type: "success", title: "Doctor notes saved" });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to save doctor notes."));
    } finally {
      setIsSaving(false);
    }
  };

  const updateRecord = async (payload: PredictionUpdatePayload) => {
    setIsSaving(true);
    try {
      const next = await updatePrediction(detail.id, payload);
      setDetail(next);
      setNotes(next.doctor_notes ?? "");
      setDiagnosis(next.diagnosis ?? "");
      setRecommendation(next.recommendation ?? "");
      setFollowUpDate(next.follow_up_date ?? "");
      setStatus(next.status ?? "draft");
      setError("");
      notify({ type: "success", title: "Report updated" });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to update this prediction."));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRecord = async () => {
    if (!window.confirm("Delete this prediction? This cannot be undone.")) return;
    try {
      await deletePrediction(detail.id);
      notify({ type: "success", title: "Report deleted" });
      navigate("/reports");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to delete this prediction."));
    }
  };

  const sendEmail = async (payload: EmailReportPayload) => {
    setIsSaving(true);
    try {
      await emailReport(detail.id, payload);
      setIsEmailOpen(false);
      setError("");
      notify({ type: "success", title: "Email sent" });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to send this report."));
    } finally {
      setIsSaving(false);
    }
  };

  const download = async (action: () => Promise<void>, title: string) => {
    try {
      await action();
      notify({ type: "success", title });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to download this report."));
    }
  };

  const normalizedRisk = detail.risk.toLowerCase() as "low" | "medium" | "high";

  return (
    <div className="page-canvas space-y-7">
      <PageHeader
        eyebrow="Clinical Decision Support"
        title={detail.patient_name || "Prediction Assessment Record"}
        description={`${detail.patient_id || "No patient ID"} · Evaluation record ID #${detail.id}`}
        action={{ label: "Back to reports", to: "/reports", icon: ArrowLeft }}
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          {/* 2. CURRENT MODEL-ASSESSED RISK HERO CARD */}
          <section className="glass-panel p-6 sm:p-7 space-y-4 border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">Prediction Output</span>
                <h2 className="font-display text-lg font-bold text-text">Model-Assessed Risk Score</h2>
              </div>
              <div className="flex items-center gap-3">
                <RiskBadge level={normalizedRisk} />
                <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="rounded-xl border border-line bg-white/[0.02] p-3 space-y-1">
                <span className="text-muted block text-[11px]">Clinical Prob</span>
                <span className="font-bold text-base text-text">{(detail.clinical_probability * 100).toFixed(1)}%</span>
              </div>

              <div className="rounded-xl border border-line bg-white/[0.02] p-3 space-y-1">
                <span className="text-muted block text-[11px]">Keystroke Prob</span>
                <span className="font-bold text-base text-text">{(detail.keystroke_probability * 100).toFixed(1)}%</span>
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-primary block text-[11px] font-bold">Combined Final Prob</span>
                <span className="font-extrabold text-xl text-primary">{(detail.final_probability * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white/[0.02] p-3 text-xs text-muted font-mono leading-relaxed">
              <p className="font-bold text-text mb-1">Decision Fusion Formula:</p>
              Final Probability = 0.7 × Clinical Prob + 0.3 × Keystroke Prob
              <p className="mt-1 text-[11px] italic text-muted">* Model-assessed probability is decision-support output and does not constitute a diagnostic conclusion.</p>
            </div>
          </section>

          {/* 4. WHY THIS SCORE? (TREESHAP ATTRIBUTIONS) */}
          <WhyRiskView predictionId={detail.id} />

          {/* 5. ADDITIONAL EXPLAINABILITY PANEL */}
          <ExplainabilityPanel explainability={detail.explainability} />

          {/* 6. CLINICAL & PATIENT INPUT VALUES */}
          <FeatureSection title="Patient information" values={{ "Patient name": detail.patient_name || "Not provided", "Patient ID": detail.patient_id || "Not provided", Age: detail.age ?? "—", Gender: detail.gender === 1 ? "Male" : detail.gender === 0 ? "Female" : "—" }} patientId={detail.patient_id} />
          <FeatureSection title="Clinical medical parameters" values={detail.clinical_features} />

          {/* 8. KEYSTROKE BEHAVIORAL ANALYTICS */}
          <FeatureSection title="Keystroke behavioral timing" values={detail.keystroke_features} />
          <KeystrokeAnalyticsPanel predictionId={detail.id} />

          {/* 9. RESEARCH MODEL RELIABILITY & EVALUATION METRICS */}
          <section className="glass-panel p-6 sm:p-7 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-success">Research Evaluation Context</p>
            <h2 className="font-display text-lg font-bold text-text">Model Reliability & Evaluation Metrics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="rounded-xl border border-line bg-white/[0.02] p-3"><span className="text-muted block">ROC-AUC:</span><span className="font-bold text-success">0.8801</span></div>
              <div className="rounded-xl border border-line bg-white/[0.02] p-3"><span className="text-muted block">PR-AUC:</span><span className="font-bold text-primary">0.4298</span></div>
              <div className="rounded-xl border border-line bg-white/[0.02] p-3"><span className="text-muted block">Recall:</span><span className="font-bold text-success">0.8810</span></div>
              <div className="rounded-xl border border-line bg-white/[0.02] p-3"><span className="text-muted block">F1-Score:</span><span className="font-bold text-text">0.2803</span></div>
              <div className="rounded-xl border border-line bg-white/[0.02] p-3"><span className="text-muted block">Brier Score:</span><span className="font-bold text-text">0.0373</span></div>
              <div className="rounded-xl border border-line bg-white/[0.02] p-3"><span className="text-muted block">Threshold:</span><span className="font-bold text-text">0.15</span></div>
            </div>
            <p className="text-[11px] text-muted italic">
              * Metrics describe Random Forest evaluation on held-out research data and do not represent individual medical diagnostic certainty.
            </p>
          </section>
        </div>

        {/* RIGHT / SIDEBAR COLUMN */}
        <aside className="space-y-6 xl:sticky xl:top-24">
          {/* 10. REPORT ACTIONS */}
          <section className="glass-panel p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-success block">Clinical Workflow</p>
                <h2 className="font-display text-lg font-bold text-text">Report Actions</h2>
              </div>
              <FileText className="size-5 text-success" aria-hidden="true" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Button variant="primary" icon={Bot} onClick={() => navigate(`/clinical-assistant?prediction_id=${detail.id}${detail.patient_id ? `&patient_id=${detail.patient_id}` : ""}`)}>
                Ask AI Assistant
              </Button>
              {detail.patient_id && (
                <Button variant="secondary" icon={UserCheck} onClick={() => navigate(`/patients/${encodeURIComponent(detail.patient_id!)}/360`)}>
                  Patient 360 Workspace
                </Button>
              )}
              <Button variant="secondary" icon={FileText} onClick={() => void download(() => downloadPdf(detail.id), "PDF downloaded")}>
                Download PDF
              </Button>
              <Button variant="secondary" icon={FileSpreadsheet} onClick={() => void download(() => downloadExcel(detail.id), "Excel exported")}>
                Download Excel
              </Button>
              <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
                Print Report
              </Button>
              <Button variant="secondary" icon={Mail} onClick={() => setIsEmailOpen(true)}>
                Email Report
              </Button>
              <Button variant="danger" icon={Trash2} onClick={deleteRecord}>
                Delete Prediction
              </Button>
            </div>
          </section>

          {/* EDIT PREDICTION FORM */}
          <PredictionEditForm detail={detail} isLoading={isSaving} onSave={updateRecord} />

          {/* DOCTOR NOTES FORM */}
          <form className="glass-panel p-6 sm:p-7 space-y-4" onSubmit={saveNotes}>
            <div className="border-b border-line pb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary block">Doctor Notes</p>
              <h2 className="font-display text-lg font-bold text-text">Clinician Review & Notes</h2>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <label className="block space-y-1.5" htmlFor="doctor-diagnosis">
                <span className="text-muted font-semibold">Diagnosis Note</span>
                <input id="doctor-diagnosis" className="w-full rounded-xl border border-line bg-white/[0.03] p-2.5 text-text focus:border-primary focus:outline-none" value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} />
              </label>

              <label className="block space-y-1.5" htmlFor="doctor-notes">
                <span className="text-muted font-semibold">Clinical Review Context</span>
                <textarea id="doctor-notes" className="w-full rounded-xl border border-line bg-white/[0.03] p-3 text-text min-h-28 focus:border-primary focus:outline-none" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add context for care team..." />
              </label>

              <label className="block space-y-1.5" htmlFor="doctor-recommendation">
                <span className="text-muted font-semibold">Recommendation</span>
                <textarea id="doctor-recommendation" className="w-full rounded-xl border border-line bg-white/[0.03] p-3 text-text min-h-20 focus:border-primary focus:outline-none" value={recommendation} onChange={(event) => setRecommendation(event.target.value)} />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5" htmlFor="doctor-follow-up">
                  <span className="text-muted font-semibold">Follow-up Date</span>
                  <input id="doctor-follow-up" type="date" className="w-full rounded-xl border border-line bg-white/[0.03] p-2 text-text focus:border-primary focus:outline-none" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} />
                </label>

                <label className="block space-y-1.5" htmlFor="doctor-status">
                  <span className="text-muted font-semibold">Report Status</span>
                  <select id="doctor-status" className="w-full rounded-xl border border-line bg-white/[0.03] p-2 text-text focus:border-primary focus:outline-none" value={status} onChange={(event) => setStatus(event.target.value as DoctorNotePayload["status"])}>
                    <option value="draft">Draft</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="final">Final</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>
            </div>

            <Button className="w-full mt-2" icon={Save} type="submit" isLoading={isSaving}>
              Save Doctor Notes
            </Button>
          </form>

          {/* PREDICTION TIMELINE AUDIT LOG */}
          <section className="glass-panel p-6 sm:p-7 space-y-4">
            <div className="border-b border-line pb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted block">Audit Trail</p>
              <h2 className="font-display text-base font-bold text-text">Prediction Activity History</h2>
            </div>
            <div className="space-y-3 font-mono text-xs">
              {detail.timeline.length === 0 ? (
                <p className="text-muted italic">No activity recorded yet.</p>
              ) : (
                detail.timeline.map((event) => (
                  <div key={event.id} className="flex gap-2.5">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-text">{event.message}</p>
                      <p className="mt-0.5 text-[11px] text-muted">
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

      <EmailReportDialog open={isEmailOpen} patientLabel={detail.patient_name || detail.patient_id || "patient"} isLoading={isSaving} onClose={() => setIsEmailOpen(false)} onSubmit={sendEmail} />
    </div>
  );
}

function FeatureSection({ title, values, patientId }: { title: string; values: Record<string, string | number | null>; patientId?: string | null }) {
  return (
    <section className="glass-panel p-6 sm:p-7 space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <h2 className="font-display text-lg font-bold text-text">{title}</h2>
        {title === "Patient information" && patientId && (
          <Link to={`/patients/${encodeURIComponent(patientId)}/360`} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium font-mono">
            Patient 360 <ArrowUpRight className="size-3.5" />
          </Link>
        )}
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 font-mono text-xs">
        {Object.entries(values).map(([key, value]) => (
          <div key={key} className="rounded-xl border border-line bg-white/[0.02] p-3 space-y-1">
            <dt className="text-muted text-[11px]">{featureLabels[key] ?? key}</dt>
            <dd className="text-text font-bold">
              {key === "Patient ID" && value && value !== "Not provided" ? (
                <Link to={`/patients/${encodeURIComponent(String(value))}/360`} className="hover:underline text-primary">
                  {value}
                </Link>
              ) : (
                formatFeatureValue(key, value)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function formatFeatureValue(key: string, value: string | number | null) {
  if (value === null || value === undefined) return "—";
  if (["H", "UD", "DD"].includes(key) && typeof value === "number") return `${value.toFixed(4)} ms`;
  if (["hypertension", "heart_disease", "smoking_status"].includes(key)) return value === 1 ? "Yes" : "No";
  return String(value);
}
