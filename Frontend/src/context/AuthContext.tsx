import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { AuthContext } from "./contextValue";
import { clearSession } from "../services/api";
import { getApiErrorMessage, loginUser, logoutUser, registerUser } from "../services/authService";
import { getProfile, updateProfile as updateProfileRequest } from "../services/profileService";
import type { AuthUser, LoginPayload, ProfilePayload, ProfileUpdatePayload, RegisterPayload } from "../types";

const mapProfileToUser = (profile: ProfilePayload): AuthUser => ({ id: profile.id, fullName: profile.full_name, email: profile.email, role: profile.role });
const persistUser = (user: AuthUser) => localStorage.setItem("prestrokenet-user", JSON.stringify(user));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState(() => localStorage.getItem("prestrokenet-token"));
  const [isInitializing, setIsInitializing] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const clearLocalSession = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const applyProfile = useCallback((profile: ProfilePayload) => {
    const nextUser = mapProfileToUser(profile);
    persistUser(nextUser);
    setUser(nextUser);
    setProfileError(null);
    return nextUser;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!localStorage.getItem("prestrokenet-token")) {
      setIsInitializing(false);
      return;
    }
    try {
      applyProfile(await getProfile());
    } catch (error) {
      clearLocalSession();
      setProfileError(getApiErrorMessage(error, "Your session has expired. Please sign in again."));
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [applyProfile, clearLocalSession]);

  useEffect(() => { void refreshProfile().catch(() => undefined); }, [refreshProfile]);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsInitializing(true);
    setProfileError(null);
    try {
      const authResponse = await loginUser(payload);
      localStorage.setItem("prestrokenet-token", authResponse.access_token);
      localStorage.setItem("prestrokenet-refresh-token", authResponse.refresh_token);
      setToken(authResponse.access_token);
      applyProfile(await getProfile());
    } catch (error) {
      clearLocalSession();
      setProfileError(getApiErrorMessage(error, "We couldn't load your profile after signing in."));
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [applyProfile, clearLocalSession]);

  const register = useCallback(async (payload: RegisterPayload) => { await registerUser(payload); }, []);
  const updateProfile = useCallback(async (payload: ProfileUpdatePayload) => applyProfile(await updateProfileRequest(payload)), [applyProfile]);
  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem("prestrokenet-refresh-token");
    if (refreshToken) void logoutUser(refreshToken).catch(() => undefined);
    clearLocalSession();
    setProfileError(null);
    setIsInitializing(false);
  }, [clearLocalSession]);

  const value = useMemo(() => ({ user, isAuthenticated: Boolean(token && user), isInitializing, profileError, login, register, refreshProfile, updateProfile, logout }), [isInitializing, login, logout, profileError, refreshProfile, register, token, updateProfile, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
