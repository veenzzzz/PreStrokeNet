import api from "./api";
import type { ModelAnalyticsResponse } from "../types";

export async function getModelAnalytics(): Promise<ModelAnalyticsResponse> {
  const response = await api.get<ModelAnalyticsResponse>("/model-analytics/");
  return response.data;
}
