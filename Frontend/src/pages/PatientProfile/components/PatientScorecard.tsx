import { Award, Brain, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../services/api";

interface ScorecardData {
  patient: {
    patient_id: string;
    patient_name: string;
    age: number;
    gender: string;
  };
  scorecard: {
    clinical_model_probability: number;
    keystroke_model_probability: number;
    combined_final_probability: number;
    risk_category: string;
    trend_direction: string;
    last_assessment_date: string;
  };
  top_attributions: Array<{
    feature: string;
    field: string;
    contribution: number;
    impact: string;
  }>;
  keystroke_profile: {
    available: boolean;
    keystroke_probability: number;
    key_dwell_time?: number;
    up_down_flight_time?: number;
    down_down_latency?: number;
  };
  disclaimer: string;
}

export function PatientScorecard({ patientId }: { patientId: string }) {
  const [data, setData] = useState<ScorecardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/patients/${encodeURIComponent(patientId)}/scorecard`)
      .then((resData) => setData(resData))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [patientId]);

  if (isLoading) {
    return <div className="glass-panel p-6 animate-pulse h-64" />;
  }

  if (!data) {
    return null;
  }

  const { scorecard, top_attributions, keystroke_profile } = data;

  return (
    <div className="glass-panel p-6 sm:p-7 space-y-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <span className="badge badge-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
            Central Intelligence
          </span>
          <h2 className="mt-1 font-display text-lg font-bold text-text">Patient Risk Scorecard</h2>
        </div>
        <Award className="size-6 text-primary" />
      </div>

      {/* Main Score Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-line bg-white/[0.02] p-3.5 space-y-1">
          <span className="text-[11px] text-muted block font-semibold">Clinical Model</span>
          <span className="font-mono text-lg font-bold text-text">
            {(scorecard.clinical_model_probability * 100).toFixed(1)}%
          </span>
        </div>

        <div className="rounded-xl border border-line bg-white/[0.02] p-3.5 space-y-1">
          <span className="text-[11px] text-muted block font-semibold">Keystroke Model</span>
          <span className="font-mono text-lg font-bold text-text">
            {(scorecard.keystroke_model_probability * 100).toFixed(1)}%
          </span>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-1">
          <span className="text-[11px] text-primary block font-semibold">Combined Score</span>
          <span className="font-mono text-xl font-extrabold text-primary">
            {(scorecard.combined_final_probability * 100).toFixed(1)}%
          </span>
        </div>

        <div className="rounded-xl border border-line bg-white/[0.02] p-3.5 space-y-1">
          <span className="text-[11px] text-muted block font-semibold">Risk Category</span>
          <span
            className={`inline-block font-mono text-sm font-bold px-2 py-0.5 rounded ${
              scorecard.risk_category.toLowerCase() === "high"
                ? "bg-danger/20 text-danger"
                : scorecard.risk_category.toLowerCase() === "medium"
                ? "bg-warning/20 text-warning"
                : "bg-success/20 text-success"
            }`}
          >
            {scorecard.risk_category}
          </span>
        </div>
      </div>

      {/* Top Model Attributions & Keystroke Profile */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Top Attributions */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
            <Brain className="size-4 text-primary" /> Top TreeSHAP Risk Factors
          </h3>
          <div className="space-y-1.5">
            {top_attributions.map((attr) => (
              <div key={attr.field} className="flex justify-between items-center text-xs font-mono rounded-lg bg-white/[0.02] p-2">
                <span className="text-text">{attr.feature}</span>
                <span className={attr.contribution > 0 ? "text-danger font-bold" : "text-success font-bold"}>
                  {attr.contribution > 0 ? "↑ +" : "↓ "}{attr.contribution.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Keystroke Timing Profile */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound className="size-4 text-blue" /> Keystroke Behavioral Profile
          </h3>
          <div className="rounded-xl border border-line bg-white/[0.02] p-3.5 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted">Behavioral Status:</span>
              <span className={keystroke_profile.available ? "text-success font-bold" : "text-muted"}>
                {keystroke_profile.available ? "Active Data" : "Baseline Default"}
              </span>
            </div>
            {keystroke_profile.key_dwell_time != null && (
              <div className="flex justify-between">
                <span className="text-muted">Dwell Time (Hold):</span>
                <span className="text-text font-bold">{keystroke_profile.key_dwell_time.toFixed(1)} ms</span>
              </div>
            )}
            {keystroke_profile.up_down_flight_time != null && (
              <div className="flex justify-between">
                <span className="text-muted">Flight Latency (UD):</span>
                <span className="text-text font-bold">{keystroke_profile.up_down_flight_time.toFixed(1)} ms</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
