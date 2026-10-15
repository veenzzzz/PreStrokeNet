import { Activity, AlertTriangle, Calendar, ChevronRight, Compass, HeartPulse, ShieldAlert, Sparkles, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";

import { getPredictionCarePathway } from "../../../services/predictionHistoryService";
import type { CarePathway } from "../../../types";

export function CarePathwayPanel({ predictionId }: { predictionId: number }) {
  const [pathway, setPathway] = useState<CarePathway | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPredictionCarePathway(predictionId)
      .then((data) => setPathway(data))
      .catch(() => setPathway(null))
      .finally(() => setIsLoading(false));
  }, [predictionId]);

  if (isLoading) {
    return <div className="glass-panel p-6 animate-pulse h-64" />;
  }

  if (!pathway) {
    return null;
  }

  return (
    <section className="glass-panel p-6 sm:p-7 space-y-6">
      <div className="flex items-start justify-between border-b border-line pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
              AHA/ASA Guideline-Grounded
            </span>
            <span className="text-xs text-muted font-mono">
              Risk: <strong className="text-text">{pathway.risk_level}</strong>
            </span>
          </div>
          <h2 className="mt-1 font-display text-lg font-bold text-text flex items-center gap-2">
            <Compass className="size-5 text-primary" aria-hidden="true" />
            Clinical Care Pathway & Action Plan
          </h2>
          <p className="mt-1 text-xs text-muted">
            Personalized secondary prevention interventions mapped directly from model risk attributions.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-mono">
          <Calendar className="size-4" />
          <span>Follow-up: <strong>{pathway.recommended_follow_up.split("(")[0].trim()}</strong></span>
        </div>
      </div>

      {/* Primary Risk Drivers */}
      {pathway.primary_risk_drivers && pathway.primary_risk_drivers.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
            Identified Risk Factor Drivers
          </span>
          <div className="flex flex-wrap gap-2">
            {pathway.primary_risk_drivers.map((driver) => (
              <span
                key={driver}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-danger/30 bg-danger/10 text-danger"
              >
                <AlertTriangle className="size-3" />
                {driver}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Diagnostic Workup */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
            <Stethoscope className="size-4 text-primary" />
            Targeted Diagnostic Workup
          </span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {pathway.diagnostic_workup.map((item, index) => {
            const isHigh = item.urgency === "High";
            return (
              <div
                key={index}
                className={`p-3.5 rounded-xl border transition-all ${
                  isHigh
                    ? "border-danger/30 bg-danger/[0.04]"
                    : "border-line bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-xs text-text">{item.test}</h3>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isHigh
                        ? "bg-danger/15 text-danger border border-danger/25"
                        : "bg-primary/10 text-primary border border-primary/20"
                    }`}
                  >
                    {item.urgency}
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">{item.rationale}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Physiological Target Goals */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
          <HeartPulse className="size-4 text-success" />
          AHA/ASA Evidence-Based Physiological Targets
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          {pathway.physiological_targets.map((tgt, index) => {
            const isAlert = tgt.status.includes("Above") || tgt.status.includes("Indicated") || tgt.status.includes("Elevated");
            return (
              <div
                key={index}
                className={`p-3 rounded-xl border ${
                  isAlert
                    ? "border-warning/30 bg-warning/[0.04]"
                    : "border-success/30 bg-success/[0.04]"
                }`}
              >
                <span className="text-muted block text-[11px]">{tgt.metric}</span>
                <span className="font-bold text-xs text-text block mt-1">{tgt.target}</span>
                <span
                  className={`mt-2 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isAlert ? "text-warning bg-warning/10" : "text-success bg-success/10"
                  }`}
                >
                  {tgt.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Neurological & Behavioral Surveillance */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
          <Activity className="size-4 text-blue" />
          Neuromotor & Behavioral Surveillance
        </span>

        <div className="space-y-2">
          {pathway.neurological_surveillance.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-muted leading-relaxed rounded-lg border border-line bg-white/[0.02] p-2.5">
              <ChevronRight className="size-4 text-primary shrink-0 mt-0.5" />
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lifestyle & Follow-Up Bar */}
      <div className="rounded-xl border border-line bg-white/[0.02] p-4 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-text font-semibold">
          <Sparkles className="size-4 text-primary" />
          <span>Recommended Lifestyle Modifications & Prevention</span>
        </div>
        <ul className="space-y-1.5 text-muted list-disc list-inside">
          {pathway.lifestyle_interventions.map((life, idx) => (
            <li key={idx}>{life}</li>
          ))}
        </ul>

        <div className="pt-2 border-t border-line flex items-center justify-between text-xs font-mono">
          <span className="text-muted">Recommended Follow-up Schedule:</span>
          <span className="font-bold text-primary">{pathway.recommended_follow_up}</span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-[11px] text-muted italic border-t border-line pt-3">
        <ShieldAlert className="size-4 shrink-0 text-muted" />
        <span>{pathway.disclaimer}</span>
      </div>
    </section>
  );
}
