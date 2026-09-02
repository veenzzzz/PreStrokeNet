import { Layers, Sliders, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../services/api";

interface FusionExperiment {
  "Fusion Scheme": string;
  "Clinical Weight": number;
  "Keystroke Weight": number;
  Threshold: number;
  Accuracy: number;
  Precision: number;
  Recall: number;
  "F1-Score": number;
  Specificity: number;
  "ROC-AUC": number;
}

interface AblationResult {
  "System Component": string;
  Scope: string;
  "Predictive Accuracy": number;
  "ROC-AUC": number;
  "Primary Role": string;
}

interface FusionData {
  title: string;
  is_experimental: boolean;
  disclaimer: string;
  data_compatibility: {
    is_paired: boolean;
    clinical_records: number;
    keystroke_records: number;
    shared_patient_id: boolean;
    supervised_joint_learning_valid: boolean;
    note: string;
  };
  fusion_experiments: FusionExperiment[];
  ablation_results: AblationResult[];
}

export function MultimodalFusionPanel() {
  const [data, setData] = useState<FusionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch("/model-analytics/fusion")
      .then((resData) => setData(resData))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="glass-panel p-6 animate-pulse h-48" />;
  }

  if (!data) {
    return null;
  }

  return (
    <section className="glass-panel p-6 sm:p-7 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-warning text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">Experimental Analysis</span>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Phase 9 Evaluation</span>
          </div>
          <h2 className="mt-1 font-display text-xl font-bold text-text">Multimodal Decision Fusion & System Ablation</h2>
        </div>
        <Layers className="size-6 text-primary" />
      </div>

      {/* Scientific Disclosure Box */}
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-xs space-y-2">
        <div className="flex items-center gap-2 text-warning font-semibold">
          <AlertTriangle className="size-4 shrink-0" />
          <span>Data Pairing Disclosures & Scientific Framing</span>
        </div>
        <p className="text-muted leading-relaxed">{data.disclaimer}</p>
        <p className="text-muted-strong font-mono text-[11px]">{data.data_compatibility.note}</p>
      </div>

      {/* Subsystem Ablation Table */}
      <div>
        <h3 className="text-sm font-bold text-text flex items-center gap-2 mb-3">
          <ShieldCheck className="size-4 text-success" /> System Subsystem Ablation Results
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-white/[0.02] text-muted">
                <th className="p-3 font-semibold">Subsystem Component</th>
                <th className="p-3 font-semibold">Scope & Data Domain</th>
                <th className="p-3 font-semibold text-right">Accuracy</th>
                <th className="p-3 font-semibold text-right">ROC-AUC</th>
                <th className="p-3 font-semibold">Primary Architectural Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {data.ablation_results.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.01]">
                  <td className="p-3 font-semibold text-text">{row["System Component"]}</td>
                  <td className="p-3 text-muted">{row.Scope}</td>
                  <td className="p-3 text-right font-mono text-text">{(row["Predictive Accuracy"] * 100).toFixed(2)}%</td>
                  <td className="p-3 text-right font-mono text-primary font-bold">{row["ROC-AUC"].toFixed(4)}</td>
                  <td className="p-3 text-muted-strong">{row["Primary Role"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fusion Weighting Sensitivity Table */}
      <div>
        <h3 className="text-sm font-bold text-text flex items-center gap-2 mb-3">
          <Sliders className="size-4 text-primary" /> Fusion Weighting Sensitivity Analysis (Threshold = 0.15)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-white/[0.02] text-muted">
                <th className="p-3 font-semibold">Fusion Scheme</th>
                <th className="p-3 font-semibold text-center">Clinical (w1)</th>
                <th className="p-3 font-semibold text-center">Keystroke (w2)</th>
                <th className="p-3 font-semibold text-right">Accuracy</th>
                <th className="p-3 font-semibold text-right">Precision</th>
                <th className="p-3 font-semibold text-right">Recall</th>
                <th className="p-3 font-semibold text-right">F1-Score</th>
                <th className="p-3 font-semibold text-right">ROC-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {data.fusion_experiments.map((row, idx) => {
                const isProd = row["Fusion Scheme"].includes("Production");
                return (
                  <tr key={idx} className={isProd ? "bg-primary/10 font-medium" : "hover:bg-white/[0.01]"}>
                    <td className="p-3 text-text flex items-center gap-2">
                      {isProd && <CheckCircle2 className="size-3.5 text-primary" />}
                      <span className={isProd ? "font-bold text-primary" : ""}>{row["Fusion Scheme"]}</span>
                    </td>
                    <td className="p-3 text-center font-mono">{row["Clinical Weight"]}</td>
                    <td className="p-3 text-center font-mono">{row["Keystroke Weight"]}</td>
                    <td className="p-3 text-right font-mono text-text">{(row.Accuracy * 100).toFixed(2)}%</td>
                    <td className="p-3 text-right font-mono text-text">{(row.Precision * 100).toFixed(2)}%</td>
                    <td className="p-3 text-right font-mono text-text">{(row.Recall * 100).toFixed(2)}%</td>
                    <td className="p-3 text-right font-mono text-text">{(row["F1-Score"] * 100).toFixed(2)}%</td>
                    <td className="p-3 text-right font-mono text-primary font-bold">{row["ROC-AUC"].toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
