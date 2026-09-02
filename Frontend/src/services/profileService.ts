import api from "./api";
import type { ProfilePayload, ProfileUpdatePayload } from "../types";

export const getProfile = async (): Promise<ProfilePayload> => {
  const response = await api.get<ProfilePayload>("/profile");
  return response.data;
};

export const updateProfile = async (payload: ProfileUpdatePayload): Promise<ProfilePayload> => {
  const response = await api.put<ProfilePayload>("/profile", payload);
  return response.data;
};
