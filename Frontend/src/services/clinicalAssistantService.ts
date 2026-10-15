import api from "./api";
import { getApiErrorMessage } from "./authService";
import type {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantChatSessionDetail,
  AssistantChatSessionSummary,
} from "../types";

export interface AssistantHealthResponse {
  status: string;
  provider: string;
  mode?: string;
  model?: string;
  detail?: string;
}

export async function postAssistantChat(payload: AssistantChatRequest): Promise<AssistantChatResponse> {
  try {
    const response = await api.post<AssistantChatResponse>("/clinical-assistant/chat", payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "AI Clinical Assistant is currently unavailable. Please try again."));
  }
}

export async function getAssistantSessions(patientId?: string): Promise<AssistantChatSessionSummary[]> {
  try {
    const params = patientId ? { patient_id: patientId } : {};
    const response = await api.get<AssistantChatSessionSummary[]>("/clinical-assistant/sessions", { params });
    return response.data;
  } catch (error) {
    console.warn("Could not load assistant sessions:", error);
    return [];
  }
}

export async function getAssistantSessionDetail(sessionId: number): Promise<AssistantChatSessionDetail | null> {
  try {
    const response = await api.get<AssistantChatSessionDetail>(`/clinical-assistant/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not load chat session"));
  }
}

export async function deleteAssistantSession(sessionId: number): Promise<void> {
  try {
    await api.delete(`/clinical-assistant/sessions/${sessionId}`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not delete chat session"));
  }
}

export async function getAssistantHealth(): Promise<AssistantHealthResponse> {
  try {
    const response = await api.get<AssistantHealthResponse>("/clinical-assistant/health");
    return response.data;
  } catch (error) {
    return { status: "unavailable", provider: "unknown", detail: "Health endpoint unreachable" };
  }
}

