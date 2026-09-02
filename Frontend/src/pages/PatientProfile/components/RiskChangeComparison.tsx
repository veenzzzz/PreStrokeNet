import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/Button";
import { Loader } from "../../../components/Loader";
import { getApiErrorMessage } from "../../../services/authService";
import { getPatientRiskChange } from "../../../services/patient";

interface RiskChangeComparisonProps {
  patientId: string;
  previousId: number;
  currentId: number;
  onClose: () => void;
}

export function RiskChangeComparison({
  patientId,
  previousId,
  currentId,
  onClose,
}: RiskChangeComparisonProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setError("");
    getPatientRiskChange(patientId, previousId, currentId)
      .then((resData) => setData(resData))
      .catch((err) => setError(getApiErrorMessage(err, "Unable to load risk comparison.")))
      .finally(() => setIsLoading(false));
  }, [patientId, previousId, currentId]);

  if (isLoading) {
    return (
      <div className="glass-panel p-8 text-center space-y-4">
        <Loader label="Computing explainable risk change..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel p-6 border border-danger/25 bg-danger/5 text-danger space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-sm">{error || "Unable to compare assessments."}</span>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  const { previous, current, changes, clinical_feature_changes, shap_comparison, keystroke_available, keystroke_changes, summary } = data;

  const isIncreased = summary.status === "increased";
  const isDecreased = summary.status === "decreased";

  return (
    <div className="glass-panel p-6 sm:p-8 space-y-7 border border-primary/20 bg-app/95">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
              Explainable Risk Engine
            </span>
            <span className="text-xs font-mono text-muted">Patient: {data.patient.patient_name} ({patientId})</span>
          </div>
          <h2 className="mt-1 font-display text-xl font-bold text-text">Historical Assessment Risk Comparison</h2>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-text hover:bg-white/5">
          <X className="size-5" />
        </button>
      </div>

      {/* Deterministic Summary Banner */}
      <div
        className={`rounded-xl border p-5 space-y-2 ${
          isIncreased
            ? "border-danger/30 bg-danger/5 text-danger font-medium"
            : isDecreased
            ? "border-success/30 bg-success/5 text-success font-medium"
            : "border-line bg-white/[0.02] text-text font-medium"
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-sm">
          {isIncreased ? (
            <TrendingUp className="size-5 text-danger" />
          ) : isDecreased ? (
            <TrendingDown className="size-5 text-success" />
          ) : (
            <CheckCircle2 className="size-5 text-primary" />
          )}
          <span>{summary.message}</span>
        </div>

        {summary.highlights && summary.highlights.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-muted list-disc pl-5">
            {summary.highlights.map((h: string, idx: number) => (
              <li key={idx}>{h}</li>
            ))}
          </ul>
        )}

        <p className="mt-2 text-[11px] text-muted italic pt-2 border-t border-line/40">
          💡 {summary.disclaimer}
        </p>
      </div>

      {/* Side-by-Side Probability & Risk Transition Card */}
      <div className="grid gap-4 sm:grid-cols-3 items-center">
        {/* Previous Assessment */}
        <div className="rounded-xl border border-line bg-white/[0.02] p-4 space-y-2">
          <span className="text-xs font-semibold text-muted block">Previous Assessment #{previous.prediction_id}</span>
          <span className="text-[10px] font-mono text-muted block">{new Date(previous.created_at).toLocaleDateString()}</span>
          <div className="pt-2 flex justify-between items-baseline">
            <span className="text-xs text-muted">Clinical Prob:</span>
            <span className="font-mono text-xs font-bold text-text">{(previous.clinical_probability * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted">Keystroke Prob:</span>
            <span className="font-mono text-xs font-bold text-text">{(previous.keystroke_probability * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-baseline pt-1 border-t border-line/40">
            <span className="text-xs font-bold text-text">Final Risk:</span>
            <span className="font-mono text-sm font-bold text-primary">{(previous.final_probability * 100).toFixed(1)}% ({previous.risk_level})</span>
          </div>
        </div>

        {/* Transition Delta Arrow */}
        <div className="text-center space-y-1 py-2">
          <div className="inline-flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary">
            <ArrowRight className="size-5" />
          </div>
          <span className="block text-xs font-mono font-bold text-text">
            Risk Delta: {changes.final_delta > 0 ? "+" : ""}{(changes.final_delta * 100).toFixed(1)}%
          </span>
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 font-mono">
            {changes.risk_transition}
          </span>
        </div>

        {/* Current Assessment */}
        <div className="rounded-xl border border-line bg-white/[0.02] p-4 space-y-2">
          <span className="text-xs font-semibold text-muted block">Current Assessment #{current.prediction_id}</span>
          <span className="text-[10px] font-mono text-muted block">{new Date(current.created_at).toLocaleDateString()}</span>
          <div className="pt-2 flex justify-between items-baseline">
            <span className="text-xs text-muted">Clinical Prob:</span>
            <span className="font-mono text-xs font-bold text-text">{(current.clinical_probability * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted">Keystroke Prob:</span>
            <span className="font-mono text-xs font-bold text-text">{(current.keystroke_probability * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-baseline pt-1 border-t border-line/40">
            <span className="text-xs font-bold text-text">Final Risk:</span>
            <span className="font-mono text-sm font-bold text-primary">{(current.final_probability * 100).toFixed(1)}% ({current.risk_level})</span>
          </div>
        </div>
      </div>

      {/* Clinical Feature Input Comparison Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-text flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" /> Clinical Input Feature Changes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-white/[0.02] text-muted">
                <th className="p-3 font-semibold">Clinical Feature</th>
                <th className="p-3 font-semibold">Previous Value</th>
                <th className="p-3 font-semibold">Current Value</th>
                <th className="p-3 font-semibold text-right">Difference</th>
                <th className="p-3 font-semibold text-right">Direction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {clinical_feature_changes.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-white/[0.01]">
                  <td className="p-3 font-bold text-text">{row.feature}</td>
                  <td className="p-3 font-mono text-muted">{row.previous_value}</td>
                  <td className="p-3 font-mono text-text">{row.current_value}</td>
                  <td className="p-3 text-right font-mono font-bold text-primary">{row.difference}</td>
                  <td className="p-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.direction === "Increased"
                          ? "bg-danger/20 text-danger"
                          : row.direction === "Decreased"
                          ? "bg-success/20 text-success"
                          : "bg-white/5 text-muted"
                      }`}
                    >
                      {row.direction}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TreeSHAP Attribution Shift Visualization */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <BrainCircuit className="size-4 text-warning" /> TreeSHAP Model Attribution Shift Comparison
          </h3>
          <span className="text-[10px] font-mono text-muted bg-white/5 px-2 py-0.5 rounded uppercase">
            Method: {data.explanation_method}
          </span>
        </div>
        <p className="text-xs text-muted">
          Features sorted by absolute TreeSHAP attribution shift (ΔSHAP). Positive delta indicates increased risk contribution.
        </p>

        <div className="space-y-3 pt-2">
          {shap_comparison.map((item: any) => {
            const isPos = item.delta > 0;
            const isNeg = item.delta < 0;
            return (
              <div key={item.field} className="rounded-xl border border-line bg-white/[0.01] p-3 text-xs space-y-1.5">
                <div className="flex justify-between font-bold text-text">
                  <span>{item.feature}</span>
                  <span className={`font-mono ${isPos ? "text-danger" : isNeg ? "text-success" : "text-muted"}`}>
                    ΔSHAP: {item.delta > 0 ? "+" : ""}{item.delta.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-muted font-mono">
                  <span>Previous SHAP: {item.previous_shap > 0 ? "+" : ""}{item.previous_shap.toFixed(4)}</span>
                  <span>Current SHAP: {item.current_shap > 0 ? "+" : ""}{item.current_shap.toFixed(4)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isPos ? "bg-danger" : isNeg ? "bg-success" : "bg-primary"}`}
                    style={{ width: `${Math.min(Math.abs(item.delta) * 500, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keystroke Behavioral Metrics Comparison */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-text flex items-center gap-2">
          <Activity className="size-4 text-blue" /> Keystroke Behavioral Metrics Shift
        </h3>
        {!keystroke_available || keystroke_changes.length === 0 ? (
          <div className="rounded-xl border border-line bg-white/[0.01] p-4 text-xs text-muted">
            No comparable keystroke timing history is available for these assessments.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {keystroke_changes.map((kc: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-line bg-white/[0.01] p-3 text-xs space-y-1">
                <span className="font-bold text-text block">{kc.metric}</span>
                <div className="flex justify-between text-muted font-mono">
                  <span>Prev: {kc.previous_value}</span>
                  <span>Curr: {kc.current_value}</span>
                </div>
                <div className="flex justify-between text-primary font-mono font-bold pt-1 border-t border-line/40">
                  <span>Delta: {kc.delta}</span>
                  <span>{kc.direction}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer & AI Assistant Launcher */}
      <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-4">
        <Button variant="secondary" icon={Bot} onClick={() => navigate("/clinical-assistant")}>
          Ask AI Assistant About This Change
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Close Comparison
        </Button>
      </div>
    </div>
  );
}
