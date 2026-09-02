import { HelpCircle, MinusCircle, PlusCircle, Scale } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../services/api";

interface WhyRiskData {
  prediction_id: number;
  patient_id: string;
  clinical_probability: number;
  explanation_method: string;
  base_value: number;
  sum_shap_contributions: number;
  reconstructed_probability: number;
  factors_increasing_risk: Array<{
    feature: string;
    field: string;
    value: string;
    shap_contribution: number;
  }>;
  factors_decreasing_risk: Array<{
    feature: string;
    field: string;
    value: string;
    shap_contribution: number;
  }>;
  disclaimer: string;
}

export function WhyRiskView({ predictionId }: { predictionId: number }) {
  const [data, setData] = useState<WhyRiskData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/predictions/${predictionId}/why`)
      .then((resData) => setData(resData))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [predictionId]);

  if (isLoading) {
    return <div className="glass-panel p-6 animate-pulse h-48" />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="glass-panel p-6 sm:p-7 space-y-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <span className="badge badge-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
            TreeSHAP Reconstruction
          </span>
          <h2 className="mt-1 font-display text-lg font-bold text-text">Why Did the Model Assign This Score?</h2>
        </div>
        <Scale className="size-6 text-primary" />
      </div>

      {/* Reconstruction Formula Bar */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div>
          <span className="text-muted block">Base Value:</span>
          <span className="font-bold text-text">{data.base_value.toFixed(4)}</span>
        </div>
        <span className="text-muted font-bold">+</span>
        <div>
          <span className="text-muted block">Sum of SHAP Attributions:</span>
          <span className={data.sum_shap_contributions > 0 ? "font-bold text-danger" : "font-bold text-success"}>
            {data.sum_shap_contributions > 0 ? "+" : ""}{data.sum_shap_contributions.toFixed(4)}
          </span>
        </div>
        <span className="text-muted font-bold">≈</span>
        <div>
          <span className="text-primary font-bold block">Final Model Output:</span>
          <span className="font-extrabold text-sm text-primary">{(data.clinical_probability * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Increasing vs Decreasing Factors Grid */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Factors Increasing Risk Score */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-danger uppercase tracking-wider flex items-center gap-1.5">
            <PlusCircle className="size-4 text-danger" /> Factors Increasing Risk Score
          </h3>
          <div className="space-y-2">
            {data.factors_increasing_risk.map((item) => (
              <div key={item.field} className="rounded-xl border border-line bg-white/[0.02] p-3 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-text block">{item.feature}</span>
                  <span className="text-[11px] text-muted">Value: {item.value}</span>
                </div>
                <span className="font-mono font-bold text-danger bg-danger/10 px-2 py-0.5 rounded">
                  +{item.shap_contribution.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Factors Decreasing Risk Score */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-success uppercase tracking-wider flex items-center gap-1.5">
            <MinusCircle className="size-4 text-success" /> Factors Decreasing Risk Score
          </h3>
          <div className="space-y-2">
            {data.factors_decreasing_risk.map((item) => (
              <div key={item.field} className="rounded-xl border border-line bg-white/[0.02] p-3 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-text block">{item.feature}</span>
                  <span className="text-[11px] text-muted">Value: {item.value}</span>
                </div>
                <span className="font-mono font-bold text-success bg-success/10 px-2 py-0.5 rounded">
                  {item.shap_contribution.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-[11px] text-muted flex items-center gap-1.5 border-t border-line/40 pt-3">
        <HelpCircle className="size-3.5 text-muted shrink-0" />
        <span>{data.disclaimer}</span>
      </div>
    </div>
  );
}
