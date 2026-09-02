import api from "./api";

export interface NotificationItem {
  id: number;
  user_id: number;
  patient_id?: string;
  prediction_id?: number;
  type: string;
  severity: "info" | "warning" | "high";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface NotificationListResponse {
  total: number;
  unread_count: number;
  items: NotificationItem[];
}

export async function getNotifications(params?: {
  unread_only?: boolean;
  type?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}): Promise<NotificationListResponse> {
  const response = await api.get<NotificationListResponse>("/notifications", { params });
  return response.data;
}

export async function getUnreadCount(): Promise<number> {
  const response = await api.get<{ count: number }>("/notifications/unread-count");
  return response.data.count;
}

export async function markNotificationRead(notificationId: number): Promise<NotificationItem> {
  const response = await api.patch<NotificationItem>(`/notifications/${notificationId}/read`);
  return response.data;
}

export async function markAllNotificationsRead(): Promise<{ message: string; count: number }> {
  const response = await api.patch<{ message: string; count: number }>("/notifications/read-all");
  return response.data;
}
