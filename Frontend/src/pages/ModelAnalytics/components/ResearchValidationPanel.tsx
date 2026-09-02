import { AlertCircle, Microscope, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../services/api";

interface BootstrapCI {
  Metric: string;
  Point_Estimate: number;
  Lower_95_CI: number;
  Upper_95_CI: number;
  CI_Range: string;
}

interface ResearchData {
  title: string;
  is_research_validated: boolean;
  disclaimer: string;
  bootstrap_confidence_intervals?: BootstrapCI[];
  calibration_analysis: any[];
  subgroup_error_analysis: any[];
}

export function ResearchValidationPanel() {
  const [data, setData] = useState<ResearchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch("/model-analytics/research")
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
            <span className="badge badge-success text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
              Paper-Ready Evidence
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-success">
              Phase 14 Research
            </span>
          </div>
          <h2 className="mt-1 font-display text-xl font-bold text-text">
            Bootstrap Confidence Intervals & Subgroup Robustness
          </h2>
        </div>
        <Microscope className="size-6 text-success" />
      </div>

      <div className="rounded-xl border border-line bg-white/[0.02] p-4 text-xs space-y-1.5">
        <p className="text-text font-semibold flex items-center gap-1.5">
          <AlertCircle className="size-4 text-primary" /> Research Validation Disclaimer
        </p>
        <p className="text-muted leading-relaxed">{data.disclaimer}</p>
      </div>

      {/* Bootstrap Confidence Intervals Table */}
      {data.bootstrap_confidence_intervals && data.bootstrap_confidence_intervals.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-text flex items-center gap-2 mb-3">
            <TrendingUp className="size-4 text-primary" /> Non-Parametric Bootstrap 95% Confidence Intervals (B = 2,000)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-white/[0.02] text-muted">
                  <th className="p-3 font-semibold">Evaluation Metric</th>
                  <th className="p-3 font-semibold text-right">Point Estimate</th>
                  <th className="p-3 font-semibold text-right">Lower 95% CI</th>
                  <th className="p-3 font-semibold text-right">Upper 95% CI</th>
                  <th className="p-3 font-semibold text-right">95% CI Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {data.bootstrap_confidence_intervals.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.01]">
                    <td className="p-3 font-bold text-text">{row.Metric}</td>
                    <td className="p-3 text-right font-mono font-bold text-primary">{row.Point_Estimate.toFixed(4)}</td>
                    <td className="p-3 text-right font-mono text-muted">{row.Lower_95_CI.toFixed(4)}</td>
                    <td className="p-3 text-right font-mono text-muted">{row.Upper_95_CI.toFixed(4)}</td>
                    <td className="p-3 text-right font-mono text-success font-semibold">{row.CI_Range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subgroup Error Analysis Table */}
      {data.subgroup_error_analysis && data.subgroup_error_analysis.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-text flex items-center gap-2 mb-3">
            <Sparkles className="size-4 text-warning" /> Demographic Subgroup Error & Sensitivity Analysis
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-white/[0.02] text-muted">
                  <th className="p-3 font-semibold">Subgroup Cohort</th>
                  <th className="p-3 font-semibold text-right">Sample Size</th>
                  <th className="p-3 font-semibold text-right">Stroke Cases</th>
                  <th className="p-3 font-semibold text-right">Recall (Sensitivity)</th>
                  <th className="p-3 font-semibold text-right">Precision</th>
                  <th className="p-3 font-semibold text-right">F1 Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {data.subgroup_error_analysis.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.01]">
                    <td className="p-3 font-bold text-text">{row.Subgroup}</td>
                    <td className="p-3 text-right font-mono text-muted">{row.Sample_Size}</td>
                    <td className="p-3 text-right font-mono text-text">{row.Stroke_Count ?? row.Stroke_Cases}</td>
                    <td className="p-3 text-right font-mono text-success font-bold">
                      {((row.Recall ?? 0) * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right font-mono text-text">
                      {((row.Precision ?? 0) * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right font-mono text-text">
                      {((row.F1_Score ?? row.F1 ?? 0) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
