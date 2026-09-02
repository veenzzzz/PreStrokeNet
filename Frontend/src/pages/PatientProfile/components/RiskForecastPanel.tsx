import { AlertCircle, LineChart, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../services/api";

interface ForecastData {
  has_sufficient_data: boolean;
  message?: string;
  patient_id?: string;
  observation_count: number;
  last_assessment_date?: string;
  trend_slope_per_month?: number;
  trend_direction?: string;
  current_final_probability?: number;
  projected_30d_probability?: number;
  projected_30d_risk_level?: string;
  historical_points: Array<{
    prediction_id: number;
    date: string;
    final_probability: number;
    risk_level: string;
  }>;
  disclaimer?: string;
}

export function RiskForecastPanel({ patientId }: { patientId: string }) {
  const [data, setData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/patients/${encodeURIComponent(patientId)}/risk-forecast`)
      .then((resData) => setData(resData))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [patientId]);

  if (isLoading) {
    return <div className="glass-panel p-6 animate-pulse h-40" />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="badge badge-warning text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
            Research Trend Projection
          </span>
          <h3 className="mt-1 font-display text-base font-bold text-text">Model Risk Longitudinal Forecast</h3>
        </div>
        <LineChart className="size-5 text-warning" />
      </div>

      {!data.has_sufficient_data ? (
        <div className="rounded-xl border border-line bg-white/[0.02] p-4 text-xs text-muted leading-relaxed">
          <p className="font-semibold text-text flex items-center gap-1.5 mb-1">
            <AlertCircle className="size-4 text-primary" /> Longitudinal Data Notice
          </p>
          {data.message || "Insufficient longitudinal data for trend projection."}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-line bg-white/[0.02] p-3 space-y-1">
              <span className="text-muted block">Trend Direction:</span>
              <span className="font-bold text-text flex items-center gap-1">
                {data.trend_direction === "Increasing" ? (
                  <TrendingUp className="size-4 text-danger" />
                ) : data.trend_direction === "Decreasing" ? (
                  <TrendingDown className="size-4 text-success" />
                ) : (
                  "→"
                )}
                {data.trend_direction}
              </span>
            </div>

            <div className="rounded-xl border border-line bg-white/[0.02] p-3 space-y-1">
              <span className="text-muted block">Slope (/30 days):</span>
              <span className="font-mono font-bold text-text">
                {data.trend_slope_per_month! > 0 ? "+" : ""}
                {(data.trend_slope_per_month! * 100).toFixed(2)}%
              </span>
            </div>

            <div className="rounded-xl border border-line bg-white/[0.02] p-3 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-muted block">30-Day Projection:</span>
              <span className="font-mono font-bold text-warning">
                {(data.projected_30d_probability! * 100).toFixed(1)}% ({data.projected_30d_risk_level})
              </span>
            </div>
          </div>

          <p className="text-[11px] text-muted italic">
            * {data.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
