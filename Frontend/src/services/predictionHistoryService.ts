import api from "./api";
import type { DoctorNotePayload, PredictionDetail, PredictionListResponse, PredictionSearchParams, PredictionSummary, PredictionUpdatePayload } from "../types";

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
