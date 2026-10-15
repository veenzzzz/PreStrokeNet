import api from "./api";
import type { CarePathway, DoctorNotePayload, PredictionDetail, PredictionListResponse, PredictionSearchParams, PredictionSummary, PredictionUpdatePayload } from "../types";

export async function getPredictionHistory(): Promise<PredictionSummary[]> {
  const response = await api.get<PredictionSummary[]>("/predictions/");
  return response.data;
}

export async function searchPredictions(params: PredictionSearchParams): Promise<PredictionListResponse> {
  const response = await api.get<PredictionListResponse>("/predictions/search", { params });
  return response.data;
}

export async function getPrediction(id: number): Promise<PredictionDetail> {
  const response = await api.get<PredictionDetail>(`/predictions/${id}`);
  return response.data;
}

export async function getPredictionCarePathway(id: number): Promise<CarePathway> {
  const response = await api.get<CarePathway>(`/predictions/${id}/care-pathway`);
  return response.data;
}

export async function updatePrediction(id: number, payload: PredictionUpdatePayload): Promise<PredictionDetail> {
  const response = await api.put<PredictionDetail>(`/predictions/${id}`, payload);
  return response.data;
}

export async function updateDoctorNotes(id: number, payload: DoctorNotePayload): Promise<PredictionDetail> {
  const response = await api.put<PredictionDetail>(`/predictions/${id}/notes`, payload);
  return response.data;
}

export async function deletePrediction(id: number): Promise<void> {
  await api.delete(`/predictions/${id}`);
}

export async function getCounterfactualSimulation(
  id: number,
  modifications?: Record<string, number | null>
): Promise<import("../types").CounterfactualSimulationData> {
  if (modifications && Object.keys(modifications).length > 0) {
    const response = await api.post<import("../types").CounterfactualSimulationData>(
      `/predictions/${id}/counterfactual`,
      modifications
    );
    return response.data;
  }
  const response = await api.get<import("../types").CounterfactualSimulationData>(
    `/predictions/${id}/counterfactual`
  );
  return response.data;
}


