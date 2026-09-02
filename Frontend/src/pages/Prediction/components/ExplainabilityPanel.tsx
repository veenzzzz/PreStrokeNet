import { BrainCircuit, CheckCircle2, Info } from "lucide-react";

import type { Explainability } from "../../../types";

interface ExplainabilityPanelProps {
  explainability: Explainability;
}

export function ExplainabilityPanel({ explainability }: ExplainabilityPanelProps) {
  return (
    <section className="glass-panel p-6 sm:p-7" aria-labelledby="explainability-title">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-blue/10 text-blue"><BrainCircuit className="size-5" aria-hidden="true" /></span>
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">Explainable AI</p><h2 id="explainability-title" className="mt-1 font-display text-xl font-bold text-text">Why this result was predicted</h2></div>
        </div>
        <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{explainability.method.replace("_", " ")}</span>
      </div>
      <div className="mt-6 flex items-end justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4"><div><p className="text-xs text-muted">Final stroke probability</p><p className="mt-1 font-mono text-3xl text-text">{(explainability.final_probability * 100).toFixed(1)}%</p></div><CheckCircle2 className="size-6 text-primary" aria-hidden="true" /></div>
      <div className="mt-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Feature contribution</p>
        {explainability.feature_importance.slice(0, 8).map((factor) => {
          const isShap = explainability.method === "shap";
          const rawContrib = factor.contribution;
          const displayContrib = isShap && rawContrib !== undefined
            ? (rawContrib >= 0 ? `+${rawContrib.toFixed(4)}` : rawContrib.toFixed(4))
            : `${factor.contribution_percentage.toFixed(1)}%`;
          
          const effectLabel = factor.direction === "increased"
            ? "Increases risk"
            : factor.direction === "decreased"
              ? "Decreases risk"
              : "Neutral";

          return (
            <div key={factor.feature}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-text">
                  {factor.feature}
                  <span className="ml-1 text-xs font-normal text-muted">
                    ({factor.value !== null ? String(factor.value) : "N/A"})
                  </span>
                </span>
                <span className="font-mono text-muted text-xs">
                  {displayContrib} ({effectLabel})
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5" role="progressbar" aria-label={`${factor.feature} contribution`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={factor.contribution_percentage}>
                <div className={`h-full rounded-full ${factor.direction === "increased" ? "bg-warning" : factor.direction === "decreased" ? "bg-success" : "bg-primary"}`} style={{ width: `${Math.max(2, factor.contribution_percentage)}%` }} />
              </div>
              <p className="mt-1 text-xs leading-5 text-muted">{factor.explanation}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-6 border-t border-line pt-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Clinical explanation</p><p className="mt-3 text-sm leading-6 text-muted">{explainability.clinical_explanation}</p></div>
      <div className="mt-5 rounded-xl border border-success/20 bg-success/5 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-success">Clinical recommendation</p><ul className="mt-3 space-y-2 text-sm leading-6 text-muted">{explainability.recommendations.map((recommendation) => <li key={recommendation} className="flex gap-2"><span className="text-success">•</span>{recommendation}</li>)}</ul></div>
      <p className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-muted"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />These feature contributions explain how the machine-learning model arrived at its prediction. They are not a medical diagnosis and should not replace professional clinical judgment.</p>
    </section>
  );
}
