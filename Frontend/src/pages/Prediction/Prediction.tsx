import { UserRound, Users } from "lucide-react";
import { useState, type FormEvent } from "react";

import { PageHeader } from "../../components/PageHeader";
import { RiskScoreCard } from "../../components/PredictionCard";
import { useToast } from "../../components/useToast";
import { PredictionRequestError, predictFinal } from "../../services/predictionService";
import type { PredictionErrorState, PredictionResult } from "../../types";
import { BatchScreeningPanel } from "./components/BatchScreeningPanel";
import { PredictionForm } from "./components/PredictionForm";
import { ExplainabilityPanel } from "./components/ExplainabilityPanel";
import { RecommendedNextSteps } from "./components/RecommendedNextSteps";
import { buildPredictFinalPayload, initialForm, type PredictionFormField, type PredictionFormState } from "./predictionForm";

export function Prediction() {
  const [viewMode, setViewMode] = useState<"single" | "batch">("single");
  const [form, setForm] = useState<PredictionFormState>(initialForm);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<PredictionErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { notify } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const prediction = await predictFinal(buildPredictFinalPayload(form));
      setResult(prediction);
      notify({ type: "success", title: "Prediction saved", message: "The assessment is ready for clinical review." });
    } catch (requestError) {
      if (requestError instanceof PredictionRequestError) {
        setError({ kind: requestError.kind, message: requestError.message });
      } else {
        setError({ kind: "unknown", message: "Prediction failed unexpectedly. Try again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: PredictionFormField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="page-canvas">
      <PageHeader
        eyebrow="Clinical workflow"
        title="Stroke prediction"
        description="Enter patient context to generate an AI-assisted risk estimate for clinician review."
      />

      <div className="mt-5 flex rounded-xl border border-line bg-surface/40 p-1 w-fit">
        <button
          type="button"
          onClick={() => setViewMode("single")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            viewMode === "single"
              ? "bg-primary text-app font-bold shadow-sm"
              : "text-muted hover:text-text"
          }`}
        >
          <UserRound className="size-4" />
          Single Patient Assessment
        </button>
        <button
          type="button"
          onClick={() => setViewMode("batch")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            viewMode === "batch"
              ? "bg-primary text-app font-bold shadow-sm"
              : "text-muted hover:text-text"
          }`}
        >
          <Users className="size-4" />
          Batch Cohort CSV Screening
        </button>
      </div>

      {viewMode === "single" ? (
        <div className="mt-7 grid items-start gap-5 xl:grid-cols-[1.12fr_0.88fr]">
          <PredictionForm form={form} isLoading={isLoading} onFieldChange={handleFieldChange} onSubmit={handleSubmit} />
          <div className="space-y-5 xl:sticky xl:top-24">
            <RiskScoreCard result={result} error={error?.message ?? null} isLoading={isLoading} />
            {result?.explainability ? <ExplainabilityPanel explainability={result.explainability} /> : null}
            {result ? <RecommendedNextSteps /> : null}
          </div>
        </div>
      ) : (
        <div className="mt-7">
          <BatchScreeningPanel />
        </div>
      )}
    </div>
  );
}

