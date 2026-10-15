import {
  ArrowDownRight,
  Award,
  HeartPulse,
  RotateCcw,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { RiskBadge } from "../../../components/PredictionCard";
import { getCounterfactualSimulation } from "../../../services/predictionHistoryService";
import type { CounterfactualSimulationData } from "../../../types";

interface CounterfactualSimulatorProps {
  predictionId: number;
}

export function CounterfactualSimulator({ predictionId }: CounterfactualSimulatorProps) {
  const [data, setData] = useState<CounterfactualSimulationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  // Modifiable parameters state
  const [smoking, setSmoking] = useState<number>(0);
  const [hypertension, setHypertension] = useState<number>(0);
  const [glucose, setGlucose] = useState<number>(100);
  const [bmi, setBmi] = useState<number>(25);

  const loadBaseline = useCallback(() => {
    setIsLoading(true);
    getCounterfactualSimulation(predictionId)
      .then((res) => {
        setData(res);
        setSmoking(res.baseline.smoking_status);
        setHypertension(res.baseline.hypertension);
        setGlucose(Math.round(res.baseline.avg_glucose_level));
        setBmi(Number(res.baseline.bmi.toFixed(1)));
      })
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [predictionId]);

  useEffect(() => {
    loadBaseline();
  }, [loadBaseline]);

  const runSimulation = useCallback(
    async (mods: { hypertension: number; smoking_status: number; avg_glucose_level: number; bmi: number }) => {
      setIsSimulating(true);
      try {
        const next = await getCounterfactualSimulation(predictionId, mods);
        setData(next);
      } catch {
        // preserve existing state
      } finally {
        setIsSimulating(false);
      }
    },
    [predictionId]
  );

  const handleSmokingChange = (val: number) => {
    setSmoking(val);
    runSimulation({ hypertension, smoking_status: val, avg_glucose_level: glucose, bmi });
  };

  const handleHypertensionChange = (val: number) => {
    setHypertension(val);
    runSimulation({ hypertension: val, smoking_status: smoking, avg_glucose_level: glucose, bmi });
  };

  const handleGlucoseChange = (val: number) => {
    setGlucose(val);
    runSimulation({ hypertension, smoking_status: smoking, avg_glucose_level: val, bmi });
  };

  const handleBmiChange = (val: number) => {
    setBmi(val);
    runSimulation({ hypertension, smoking_status: smoking, avg_glucose_level: glucose, bmi: val });
  };

  const resetToBaseline = () => {
    if (!data) return;
    setSmoking(data.baseline.smoking_status);
    setHypertension(data.baseline.hypertension);
    setGlucose(Math.round(data.baseline.avg_glucose_level));
    setBmi(Number(data.baseline.bmi.toFixed(1)));
    runSimulation({
      hypertension: data.baseline.hypertension,
      smoking_status: data.baseline.smoking_status,
      avg_glucose_level: data.baseline.avg_glucose_level,
      bmi: data.baseline.bmi,
    });
  };

  const applyOptimalTargets = () => {
    setSmoking(0);
    setHypertension(0);
    setGlucose(95);
    setBmi(24.0);
    runSimulation({
      hypertension: 0,
      smoking_status: 0,
      avg_glucose_level: 95.0,
      bmi: 24.0,
    });
  };

  if (isLoading) {
    return <div className="glass-panel p-6 animate-pulse h-64" />;
  }

  if (!data) {
    return null;
  }

  const baselineRiskLevel = data.baseline.risk.toLowerCase() as "low" | "medium" | "high";
  const simulatedRiskLevel = data.simulated.risk.toLowerCase() as "low" | "medium" | "high";
  const arrPct = (data.simulated.absolute_risk_reduction * 100).toFixed(1);
  const rrrPct = data.simulated.relative_risk_reduction_pct.toFixed(1);
  const hasRiskReduction = data.simulated.absolute_risk_reduction > 0.001;

  return (
    <section className="glass-panel p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
              Counterfactual AI Simulation
            </span>
            <span className="text-xs text-muted font-mono">
              Shared Decision-Making Tool
            </span>
          </div>
          <h2 className="mt-1 font-display text-lg font-bold text-text flex items-center gap-2">
            <Sliders className="size-5 text-primary" aria-hidden="true" />
            &quot;What-If&quot; Clinical Risk Intervention Simulator
          </h2>
          <p className="mt-1 text-xs text-muted max-w-xl">
            Simulate expected stroke probability reductions in real time by adjusting modifiable clinical targets and counseling patient lifestyle modifications.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={resetToBaseline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-muted hover:text-text text-xs transition"
          >
            <RotateCcw className="size-3.5" />
            Reset Baseline
          </button>
          <button
            type="button"
            onClick={applyOptimalTargets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition"
          >
            <Sparkles className="size-3.5" />
            Apply Guideline Targets
          </button>
        </div>
      </div>

      {/* Hero Comparison: Baseline vs. Simulated Projection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Baseline Card */}
        <div className="rounded-2xl border border-line bg-white/[0.02] p-4 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
            Current Patient Baseline
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-3xl font-bold text-text">
              {(data.baseline.final_probability * 100).toFixed(1)}%
            </span>
            <RiskBadge level={baselineRiskLevel} />
          </div>
          <p className="text-[11px] text-muted font-mono">
            Recorded evaluation score
          </p>
        </div>

        {/* Arrow / Impact Summary */}
        <div
          className={`rounded-2xl border p-4 flex flex-col justify-center items-center text-center transition-all ${
            hasRiskReduction
              ? "border-success/30 bg-success/10 text-success"
              : "border-line bg-white/[0.02] text-muted"
          }`}
        >
          {hasRiskReduction ? (
            <>
              <div className="flex items-center gap-1.5 font-display text-2xl font-extrabold text-success">
                <ArrowDownRight className="size-6" />
                <span>-{arrPct}%</span>
              </div>
              <span className="text-xs font-semibold mt-0.5">Absolute Risk Reduction (ARR)</span>
              <span className="text-[11px] font-mono text-success/80 mt-1">
                Relative reduction: <strong>-{rrrPct}%</strong>
              </span>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold text-text">Baseline Level</span>
              <span className="text-xs text-muted mt-1">Adjust sliders below to simulate risk reduction</span>
            </>
          )}
        </div>

        {/* Projected Simulated Card */}
        <div
          className={`rounded-2xl border p-4 space-y-2 transition-all ${
            isSimulating
              ? "opacity-60"
              : hasRiskReduction
              ? "border-primary/40 bg-primary/5"
              : "border-line bg-white/[0.02]"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
            Simulated Post-Intervention
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-3xl font-extrabold text-primary">
              {(data.simulated.final_probability * 100).toFixed(1)}%
            </span>
            <RiskBadge level={simulatedRiskLevel} />
          </div>
          <p className="text-[11px] text-primary/80 font-mono">
            Projected with active intervention targets
          </p>
        </div>
      </div>

      {/* Counseling Callout */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3 text-xs leading-relaxed">
        <Zap className="size-4 text-warning shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-text">Clinical Counseling Insight: </span>
          <span className="text-muted">{data.counseling_message}</span>
        </div>
      </div>

      {/* Interactive Sliders & Toggles */}
      <div className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
          <HeartPulse className="size-4 text-primary" />
          Modifiable Risk Factor Targets
        </span>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Smoking Status */}
          <div className="p-4 rounded-xl border border-line bg-white/[0.02] space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="sim-smoking" className="text-xs font-semibold text-text">Smoking Status</label>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  smoking === 0 ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                }`}
              >
                {smoking === 0 ? "Non-Smoker / Cessation" : "Current Smoker"}
              </span>
            </div>
            <div className="flex rounded-lg border border-line bg-white/[0.04] p-1 text-xs">
              <button
                type="button"
                id="sim-smoking"
                onClick={() => handleSmokingChange(0)}
                className={`flex-1 py-1.5 rounded-md font-semibold transition ${
                  smoking === 0 ? "bg-primary text-app font-bold" : "text-muted hover:text-text"
                }`}
              >
                Smoke-Free Target
              </button>
              <button
                type="button"
                onClick={() => handleSmokingChange(1)}
                className={`flex-1 py-1.5 rounded-md font-semibold transition ${
                  smoking === 1 ? "bg-danger text-white font-bold" : "text-muted hover:text-text"
                }`}
              >
                Active Smoker
              </button>
            </div>
          </div>

          {/* Blood Pressure Control */}
          <div className="p-4 rounded-xl border border-line bg-white/[0.02] space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="sim-hypertension" className="text-xs font-semibold text-text">Blood Pressure Control</label>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  hypertension === 0 ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                }`}
              >
                {hypertension === 0 ? "Controlled (<130/80)" : "Uncontrolled Hypertension"}
              </span>
            </div>
            <div className="flex rounded-lg border border-line bg-white/[0.04] p-1 text-xs">
              <button
                type="button"
                id="sim-hypertension"
                onClick={() => handleHypertensionChange(0)}
                className={`flex-1 py-1.5 rounded-md font-semibold transition ${
                  hypertension === 0 ? "bg-primary text-app font-bold" : "text-muted hover:text-text"
                }`}
              >
                Normotensive Goal
              </button>
              <button
                type="button"
                onClick={() => handleHypertensionChange(1)}
                className={`flex-1 py-1.5 rounded-md font-semibold transition ${
                  hypertension === 1 ? "bg-warning text-app font-bold" : "text-muted hover:text-text"
                }`}
              >
                Hypertensive
              </button>
            </div>
          </div>

          {/* Average Glucose Level */}
          <div className="p-4 rounded-xl border border-line bg-white/[0.02] space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="sim-glucose" className="text-xs font-semibold text-text">Average Glucose Target</label>
              <span className="font-mono text-xs font-bold text-primary">{glucose} mg/dL</span>
            </div>
            <input
              id="sim-glucose"
              type="range"
              min={70}
              max={280}
              step={5}
              value={glucose}
              onChange={(e) => handleGlucoseChange(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted font-mono">
              <span>Optimal: &lt;100 mg/dL</span>
              <span>Baseline: {Math.round(data.baseline.avg_glucose_level)} mg/dL</span>
            </div>
          </div>

          {/* Body Mass Index (BMI) */}
          <div className="p-4 rounded-xl border border-line bg-white/[0.02] space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="sim-bmi" className="text-xs font-semibold text-text">Body Mass Index (BMI)</label>
              <span className="font-mono text-xs font-bold text-primary">{bmi} kg/m²</span>
            </div>
            <input
              id="sim-bmi"
              type="range"
              min={18.5}
              max={45.0}
              step={0.5}
              value={bmi}
              onChange={(e) => handleBmiChange(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted font-mono">
              <span>Healthy: 18.5 – 24.9</span>
              <span>Baseline: {data.baseline.bmi.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ranked Impact of Isolated Interventions */}
      <div className="space-y-3 pt-2 border-t border-line">
        <span className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
          <Award className="size-4 text-warning" />
          Ranked Single-Intervention Impact on Patient Risk
        </span>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {data.intervention_rankings.map((rank, index) => {
            const isHighest = index === 0 && rank.arr > 0;
            return (
              <div
                key={rank.factor}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                  isHighest
                    ? "border-success/30 bg-success/[0.04]"
                    : "border-line bg-white/[0.02]"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text">{rank.label}</span>
                    {isHighest && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-success/15 text-success">
                        Highest Impact
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted block mt-0.5">{rank.description}</span>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <span
                    className={`font-bold block ${
                      rank.arr > 0 ? "text-success" : "text-muted"
                    }`}
                  >
                    {rank.arr > 0 ? `-${(rank.arr * 100).toFixed(1)}%` : "0.0%"}
                  </span>
                  <span className="text-[10px] text-muted">isolated ARR</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
