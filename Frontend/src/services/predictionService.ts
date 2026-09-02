import axios from "axios";

import api from "./api";
import { getApiErrorMessage } from "./authService";
import type { PredictFinalRequest, PredictFinalResponse, PredictionErrorKind, PredictionResult, RiskLevel } from "../types";

const REQUEST_TIMEOUT_MS = 15_000;

export class PredictionRequestError extends Error {
  readonly kind: PredictionErrorKind;
  constructor(kind: PredictionErrorKind, message: string) {
    super(message);
    this.name = "PredictionRequestError";
    this.kind = kind;
  }
}

const normalizeRiskLevel = (value: unknown): RiskLevel => {
  const risk = String(value).trim().toLowerCase();
  if (risk.includes("low")) return "low";
  if (risk.includes("medium")) return "medium";
  if (risk.includes("high")) return "high";
  throw new PredictionRequestError("server", "The prediction service returned an unknown risk level.");
};

const normalizeProbability = (value: unknown, label: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new PredictionRequestError("server", `The prediction service returned an invalid ${label}.`);
  }
  return value * 100;
};

export async function predictFinal(payload: PredictFinalRequest, callerSignal?: AbortSignal): Promise<PredictionResult> {
  try {
    const response = await api.post<PredictFinalResponse>("/predict-final/", payload, { signal: callerSignal, timeout: REQUEST_TIMEOUT_MS });
    const data = response.data;
    const clinicalProbability = normalizeProbability(data.clinical_probability, "clinical probability");
    const keystrokeProbability = normalizeProbability(data.keystroke_probability, "keystroke probability");
    const finalProbability = normalizeProbability(data.final_probability, "final probability");
    return {
      id: typeof data.id === "number" ? data.id : undefined,
      score: Math.round(finalProbability),
      level: normalizeRiskLevel(data.risk),
      clinicalProbability,
      keystrokeProbability,
      finalProbability,
      summary: "Combined clinical and keystroke model estimate for clinician review.",
      explainability: data.explainability ?? null,
      recommendations: data.recommendations ?? data.explainability?.recommendations ?? [],
    };
  } catch (error) {
    if (error instanceof PredictionRequestError) throw error;
    if (axios.isCancel(error)) throw new PredictionRequestError("unknown", "The prediction request was cancelled. Try again.");
    if (axios.isAxiosError(error) && error.code === "ECONNABORTED") throw new PredictionRequestError("timeout", "The prediction request timed out. Try again.");
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const kind: PredictionErrorKind = status === 422 ? "validation" : status && status >= 500 ? "server" : axios.isAxiosError(error) && !error.response ? "offline" : "unknown";
    throw new PredictionRequestError(kind, getApiErrorMessage(error, kind === "offline" ? "The prediction service is offline. Start the backend and try again." : "Prediction failed unexpectedly. Try again."));
  }
}
