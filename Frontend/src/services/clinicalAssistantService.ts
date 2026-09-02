import api from "./api";
import { getApiErrorMessage } from "./authService";
import type { AssistantChatRequest, AssistantChatResponse } from "../types";

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

export async function getAssistantHealth(): Promise<AssistantHealthResponse> {
  try {
    const response = await api.get<AssistantHealthResponse>("/clinical-assistant/health");
    return response.data;
  } catch (error) {
    return { status: "unavailable", provider: "unknown", detail: "Health endpoint unreachable" };
  }
}
