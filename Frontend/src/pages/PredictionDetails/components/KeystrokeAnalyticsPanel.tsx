import { Activity, Clock, Zap, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { KeystrokeAnalytics } from "../../../types";
import { apiFetch } from "../../../services/api";

interface Props {
  predictionId: number;
}

export function KeystrokeAnalyticsPanel({ predictionId }: Props) {
  const [analytics, setAnalytics] = useState<KeystrokeAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/predictions/${predictionId}/keystroke-analytics`)
      .then((data) => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setIsLoading(false));
  }, [predictionId]);

  if (isLoading) {
    return <div className="glass-panel p-6 animate-pulse h-48" />;
  }

  if (!analytics) {
    return null;
  }

  const { current_session, historical_baseline, baseline_deviations, behavioral_change_score, top_timing_factors, disclaimer } = analytics;

  return (
    <section className="glass-panel p-6 sm:p-7 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Biometric Profile</p>
          <h2 className="mt-1 font-display text-xl font-bold text-text">Keystroke Dynamics Analytics</h2>
        </div>
        <Activity className="size-5 text-primary" />
      </div>

      <p className="text-xs text-muted leading-relaxed">{disclaimer}</p>

      {/* Primary Timing Metrics Grid */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-white/[0.02] p-3.5">
          <p className="text-xs text-muted flex items-center gap-1.5"><Zap className="size-3.5 text-warning" /> Typing Speed</p>
          <p className="mt-1 font-mono text-base font-bold text-text">{current_session.typing_speed} keys/s</p>
          <p className="mt-1 text-xs text-muted font-mono">{baseline_deviations.typing_speed_pct > 0 ? "+" : ""}{baseline_deviations.typing_speed_pct}% baseline</p>
        </div>

        <div className="rounded-xl border border-line bg-white/[0.02] p-3.5">
          <p className="text-xs text-muted flex items-center gap-1.5"><Clock className="size-3.5 text-primary" /> Dwell Time (H)</p>
          <p className="mt-1 font-mono text-base font-bold text-text">{(current_session.dwell_time_mean * 1000).toFixed(0)} ms</p>
          <p className="mt-1 text-xs text-muted font-mono">{baseline_deviations.dwell_time_pct > 0 ? "+" : ""}{baseline_deviations.dwell_time_pct}% baseline</p>
        </div>

        <div className="rounded-xl border border-line bg-white/[0.02] p-3.5">
          <p className="text-xs text-muted flex items-center gap-1.5"><Clock className="size-3.5 text-success" /> Flight Time (UD)</p>
          <p className="mt-1 font-mono text-base font-bold text-text">{(current_session.flight_time_mean * 1000).toFixed(0)} ms</p>
          <p className="mt-1 text-xs text-muted font-mono">{baseline_deviations.flight_time_pct > 0 ? "+" : ""}{baseline_deviations.flight_time_pct}% baseline</p>
        </div>

        <div className="rounded-xl border border-line bg-white/[0.02] p-3.5">
          <p className="text-xs text-muted flex items-center gap-1.5"><AlertCircle className="size-3.5 text-danger" /> Behavioral Shift</p>
          <p className="mt-1 font-mono text-base font-bold text-text">{(behavioral_change_score * 100).toFixed(1)}%</p>
          <p className="mt-1 text-xs text-muted">Deviative Index</p>
        </div>
      </div>

      {/* Historical Baseline Comparison */}
      <div className="rounded-xl border border-line bg-white/[0.01] p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-strong">Historical Baseline vs Current Session</h3>
        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="space-y-1">
            <span className="text-muted">Metric</span>
            <p className="font-medium text-text">Typing Speed</p>
            <p className="font-medium text-text">Dwell Time (H)</p>
            <p className="font-medium text-text">Flight Time (UD)</p>
          </div>
          <div className="space-y-1 font-mono">
            <span className="text-muted">Historical Baseline</span>
            <p className="text-text">{historical_baseline.typing_speed} keys/s</p>
            <p className="text-text">{(historical_baseline.dwell_time_mean * 1000).toFixed(0)} ms</p>
            <p className="text-text">{(historical_baseline.flight_time_mean * 1000).toFixed(0)} ms</p>
          </div>
          <div className="space-y-1 font-mono">
            <span className="text-muted">Current Session</span>
            <p className="text-primary font-bold">{current_session.typing_speed} keys/s</p>
            <p className="text-primary font-bold">{(current_session.dwell_time_mean * 1000).toFixed(0)} ms</p>
            <p className="text-primary font-bold">{(current_session.flight_time_mean * 1000).toFixed(0)} ms</p>
          </div>
        </div>
      </div>

      {/* Top Timing Factors */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Top Behavioral Factors</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {top_timing_factors.map((factor, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-line bg-white/[0.02] text-xs">
              <span className="font-medium text-text">{factor.feature}</span>
              <span className="font-mono text-muted">{factor.observed_value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
