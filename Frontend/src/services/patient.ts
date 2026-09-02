import api from "./api";
import type {
  PatientAssessmentHistoryItem,
  RiskProgressionResponse,
  ActivityEvent
} from "../types";

export async function getPatientHistory(patientId: string): Promise<PatientAssessmentHistoryItem[]> {
  const response = await api.get<PatientAssessmentHistoryItem[]>(`/patients/${patientId}/history`);
  return response.data;
}

export async function getPatientRiskProgression(patientId: string): Promise<RiskProgressionResponse> {
  const response = await api.get<RiskProgressionResponse>(`/patients/${patientId}/risk-progression`);
  return response.data;
}

export async function getPatientTimeline(patientId: string): Promise<ActivityEvent[]> {
  const response = await api.get<ActivityEvent[]>(`/patients/${patientId}/timeline`);
  return response.data;
}

export async function getPatientRiskChange(
  patientId: string,
  previousPredictionId: number,
  currentPredictionId: number
): Promise<any> {
  const response = await api.get(`/patients/${patientId}/risk-change`, {
    params: {
      previous_prediction_id: previousPredictionId,
      current_prediction_id: currentPredictionId
    }
  });
  return response.data;
}
