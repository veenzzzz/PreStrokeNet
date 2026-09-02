import api from "./api";
import type { ActivityEvent, DashboardStatistics } from "../types";

export async function getDashboardStatistics(days = 30): Promise<DashboardStatistics> {
  const response = await api.get<DashboardStatistics>("/dashboard/statistics", { params: { days } });
  return response.data;
}

export async function getDashboardActivity(limit = 20): Promise<ActivityEvent[]> {
  const response = await api.get<ActivityEvent[]>("/dashboard/activity", { params: { limit } });
  return response.data;
}

export async function getDashboardSummary(): Promise<any> {
  const response = await api.get("/dashboard/summary");
  return response.data;
}
