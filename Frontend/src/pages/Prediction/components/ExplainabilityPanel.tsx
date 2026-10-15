import { BrainCircuit, Info, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { Explainability } from "../../../types";

interface ExplainabilityPanelProps {
  explainability: Explainability;
}

export function ExplainabilityPanel({ explainability }: ExplainabilityPanelProps) {
  if (!explainability) return null;

  return (
    <section
      className="rounded-xl border border-line p-5"
      style={{ background: "var(--surface)" }}
      aria-labelledby="explainability-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <span
            className="flex size-8 items-center justify-center rounded-lg"
            style={{ background: "var(--blue-dim)", color: "var(--blue)" }}
          >
            <BrainCircuit className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="section-label" style={{ color: "var(--blue)" }}>Explainable AI</p>
            <h2 id="explainability-title" className="text-sm font-bold text-text">
              Why this result?
            </h2>
          </div>
        </div>
        <span className="badge badge-primary">
          {explainability.method.replace(/_/g, " ")}
        </span>
      </div>

      {/* Probability summary */}
      <div
        className="flex items-center justify-between rounded-lg border p-3 mb-5"
        style={{
          borderColor: "color-mix(in srgb, var(--primary) 25%, var(--line))",
          background: "color-mix(in srgb, var(--primary) 5%, var(--surface-strong))",
        }}
      >
        <div>
          <p className="text-xs text-muted">Final stroke probability</p>
          <p className="font-mono text-2xl font-600 text-text mt-0.5" style={{ fontWeight: 600 }}>
            {(explainability.final_probability * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Feature contributions */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Feature contributions</p>

        {explainability.feature_importance.slice(0, 8).map((factor) => {
          const isShap = explainability.method === "shap";
          const rawContrib = factor.contribution;
          const displayContrib = isShap && rawContrib !== undefined
            ? (rawContrib >= 0 ? `+${rawContrib.toFixed(4)}` : rawContrib.toFixed(4))
            : `${factor.contribution_percentage.toFixed(1)}%`;

          const dir = factor.direction;
          const dirColor =
            dir === "increased" ? "var(--risk-high)" :
            dir === "decreased" ? "var(--risk-low)" :
            "var(--muted)";
          const DirIcon = dir === "increased" ? TrendingUp : dir === "decreased" ? TrendingDown : Minus;

          return (
            <div key={factor.feature} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-text-secondary truncate">
                  {factor.feature}
                  <span className="ml-1 text-xs font-normal text-muted font-mono">
                    ({factor.value !== null ? String(factor.value) : "N/A"})
                  </span>
                </span>
                <span
                  className="flex items-center gap-1 text-xs font-mono font-medium shrink-0"
                  style={{ color: dirColor }}
                >
                  <DirIcon className="size-3" aria-hidden="true" />
                  {displayContrib}
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full"
                style={{ background: "var(--line-strong)" }}
                role="progressbar"
                aria-label={`${factor.feature} contribution`}
                aria-valuenow={factor.contribution_percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(2, factor.contribution_percentage)}%`,
                    background: dirColor,
                    boxShadow: `0 0 4px color-mix(in srgb, ${dirColor} 50%, transparent)`,
                    animationDelay: "0.1s",
                  }}
                />
              </div>
              <p className="text-xs leading-5 text-muted">{factor.explanation}</p>
            </div>
          );
        })}
      </div>

      {/* Clinical explanation */}
      <div className="mt-5 border-t border-line pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted mb-2">Clinical explanation</p>
        <p className="text-sm leading-6 text-muted">{explainability.clinical_explanation}</p>
      </div>

      {/* Recommendations */}
      {explainability.recommendations.length > 0 && (
        <div
          className="mt-5 rounded-lg border p-4"
          style={{
            borderColor: "color-mix(in srgb, var(--success) 20%, var(--line))",
            background: "color-mix(in srgb, var(--success) 4%, var(--surface-strong))",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--success)" }}>
            Clinical recommendations
          </p>
          <ul className="space-y-2 text-sm text-muted">
            {explainability.recommendations.map((rec) => (
              <li key={rec} className="flex gap-2">
                <span style={{ color: "var(--success)" }} aria-hidden="true">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-4 flex items-start gap-2 text-[11px] text-muted leading-5">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Feature contributions explain model behavior and are not a medical diagnosis. Use alongside full clinical context.
      </div>
    </section>
  );
}
