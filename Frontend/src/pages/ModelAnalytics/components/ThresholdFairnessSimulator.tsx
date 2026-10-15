import { AlertCircle, CheckCircle2, Filter, Layers, Scale, Sliders } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../services/api";

interface SimulatorData {
  requested_threshold: number;
  operating_point_threshold: number;
  mode: string;
  accuracy: number;
  recall_sensitivity: number;
  precision_ppv: number;
  specificity: number;
  f1_score: number;
  false_positive_rate: number;
  confusion_matrix: {
    true_positives: number;
    false_positives: number;
    false_negatives: number;
    true_negatives: number;
  };
  clinical_interpretation: string;
  available_threshold_points: number[];
}

interface FairnessData {
  title: string;
  evaluation_standard: string;
  demographic_subgroups: Array<{
    Subgroup: string;
    Sample_Size: number;
    Stroke_Count: number;
    Recall: number;
    Precision: number;
    F1_Score: number;
    FPR: number;
    TP: number;
    FP: number;
    FN: number;
    TN: number;
  }>;
  equalized_odds_assessment: {
    gender_recall_disparity: number;
    gender_fpr_disparity: number;
    fairness_verdict: string;
  };
  disclaimer: string;
}

export function ThresholdFairnessSimulator() {
  const [threshold, setThreshold] = useState<number>(0.15);
  const [simData, setSimData] = useState<SimulatorData | null>(null);
  const [fairnessData, setFairnessData] = useState<FairnessData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    apiFetch(`/model-analytics/threshold-simulator?threshold=${threshold}`)
      .then((data) => setSimData(data))
      .catch((err) => console.error("Threshold simulator error:", err))
      .finally(() => setIsLoading(false));
  }, [threshold]);

  useEffect(() => {
    apiFetch("/model-analytics/fairness")
      .then((data) => setFairnessData(data))
      .catch((err) => console.error("Fairness data error:", err));
  }, []);

  return (
    <section className="glass-panel p-6 sm:p-7 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
              Interactive Clinical Decision Boundary
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Operating Point Simulator
            </span>
          </div>
          <h2 className="mt-1 font-display text-xl font-bold text-text">
            Dynamic Threshold Simulator & Algorithmic Fairness Audit
          </h2>
        </div>
        <Sliders className="size-6 text-primary shrink-0" />
      </div>

      {/* Simulator Section */}
      <div className="space-y-6 rounded-2xl border border-line bg-white/[0.015] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-text flex items-center gap-2">
              <Filter className="size-4 text-primary" /> Decision Threshold Operating Point:{" "}
              <span className="font-mono text-primary font-bold text-lg">{threshold.toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              Slide to adjust clinical sensitivity vs. alert precision trade-offs.
            </div>
          </div>
          {simData && (
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                  simData.operating_point_threshold <= 0.15
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : simData.operating_point_threshold <= 0.30
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`}
              >
                {simData.mode}
              </span>
            </div>
          )}
        </div>

        {/* Range Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="0.05"
            max="0.50"
            step="0.01"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-primary h-2 bg-white/10 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono text-muted">
            <span>0.05 (Max Sensitivity / 92.9% Recall)</span>
            <span className="font-bold text-primary">0.15 (Production Baseline / 85.7% Recall)</span>
            <span>0.50 (Max Specificity / 99.0% Spec)</span>
          </div>
        </div>

        {/* Real-Time Metrics Display */}
        {simData && (
          <div className={`space-y-4 transition-opacity ${isLoading ? "opacity-60" : "opacity-100"}`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-line">
                <div className="text-[11px] text-muted uppercase">Sensitivity (Recall)</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {(simData.recall_sensitivity * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-muted mt-0.5">Stroke detection rate</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-line">
                <div className="text-[11px] text-muted uppercase">Specificity</div>
                <div className="text-xl font-bold text-primary mt-1">
                  {(simData.specificity * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-muted mt-0.5">True negative exclusion</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-line">
                <div className="text-[11px] text-muted uppercase">Precision (PPV)</div>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  {(simData.precision_ppv * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-muted mt-0.5">Positive predictive value</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-line">
                <div className="text-[11px] text-muted uppercase">False Positive Rate</div>
                <div className="text-xl font-bold text-rose-400 mt-1">
                  {(simData.false_positive_rate * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-muted mt-0.5">Alert fatigue probability</div>
              </div>
            </div>

            {/* Confusion Matrix Breakdown */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-line flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-2 text-muted">
                <Layers className="size-4 text-primary" /> Confusion Matrix:
              </div>
              <div className="flex items-center gap-4">
                <span>TP: <strong className="text-emerald-400">{simData.confusion_matrix.true_positives}</strong></span>
                <span>FP: <strong className="text-rose-400">{simData.confusion_matrix.false_positives}</strong></span>
                <span>FN: <strong className="text-amber-400">{simData.confusion_matrix.false_negatives}</strong></span>
                <span>TN: <strong className="text-text">{simData.confusion_matrix.true_negatives}</strong></span>
              </div>
            </div>

            {/* Clinical Interpretation Notice */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-text/90 font-mono flex items-start gap-3">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-primary font-semibold">Clinical Interpretation: </strong>
                {simData.clinical_interpretation}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fairness & Algorithmic Parity Section */}
      {fairnessData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <Scale className="size-4 text-emerald-400" /> Demographic Subgroup Fairness & Equalized Odds
            </h3>
            <span className="text-xs font-mono text-emerald-400">
              {fairnessData.equalized_odds_assessment.fairness_verdict}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-line flex items-center justify-between">
              <span className="text-muted">Gender Recall Disparity:</span>
              <span className="font-bold text-emerald-400">
                {(fairnessData.equalized_odds_assessment.gender_recall_disparity * 100).toFixed(2)}%
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-line flex items-center justify-between">
              <span className="text-muted">Gender False Positive Disparity:</span>
              <span className="font-bold text-emerald-400">
                {(fairnessData.equalized_odds_assessment.gender_fpr_disparity * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Subgroups Table */}
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/[0.03] text-muted border-b border-line uppercase text-[10px]">
                <tr>
                  <th className="p-3">Subgroup</th>
                  <th className="p-3 text-right">Sample N</th>
                  <th className="p-3 text-right">Stroke N</th>
                  <th className="p-3 text-right">Sensitivity</th>
                  <th className="p-3 text-right">Precision</th>
                  <th className="p-3 text-right">FPR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {fairnessData.demographic_subgroups.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-semibold text-text">{row.Subgroup}</td>
                    <td className="p-3 text-right text-muted">{row.Sample_Size}</td>
                    <td className="p-3 text-right text-text">{row.Stroke_Count}</td>
                    <td className="p-3 text-right text-emerald-400 font-bold">
                      {(row.Recall * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right text-amber-400">
                      {(row.Precision * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right text-rose-400">
                      {(row.FPR * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] font-mono text-muted flex items-start gap-2 pt-1">
            <AlertCircle className="size-3.5 shrink-0 text-muted mt-0.5" />
            <span>{fairnessData.disclaimer}</span>
          </div>
        </div>
      )}
    </section>
  );
}
