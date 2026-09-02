import type { AxiosError } from "axios";

import api from "./api";
import type {
  AuthTokenResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from "../types";

export const loginUser = async (payload: LoginPayload): Promise<AuthTokenResponse> => {
  const response = await api.post<AuthTokenResponse>("/auth/login", payload);
  return response.data;
};

export const registerUser = async (payload: RegisterPayload) => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

export const logoutUser = async (refresh_token: string) => {
  await api.post("/auth/logout", { refresh_token });
};

export const forgotPassword = async (payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> => {
  const response = await api.post<ForgotPasswordResponse>("/auth/forgot-password", payload);
  return response.data;
};

export const resetPassword = async (payload: ResetPasswordPayload): Promise<ForgotPasswordResponse> => {
  const response = await api.post<ForgotPasswordResponse>("/auth/reset-password", payload);
  return response.data;
};

type ApiErrorDetail = string | Array<{ loc?: Array<string | number>; msg?: string }>;

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ detail?: ApiErrorDetail }>;
  const detail = axiosError.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail.map(({ loc, msg }) => {
      const message = msg?.trim();
      if (!message) return null;
      const field = loc?.at(-1);
      return typeof field === "string" && field !== "body" ? `${field}: ${message}` : message;
    }).filter((message): message is string => Boolean(message));
    if (messages.length > 0) return messages.join(" ");
  }
  if (axiosError.request && !axiosError.response) return "We couldn't reach the server. Make sure the backend is running and try again.";
  return fallback;
};
