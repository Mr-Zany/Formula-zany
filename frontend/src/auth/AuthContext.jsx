import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, clearTokens, getAccessToken, setTokens } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return null;
    }
    try {
      const profile = await apiFetch("/profile/");
      setUser(profile);
      return profile;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false));
  }, [refreshProfile]);

  const login = useCallback(
    async (email, password) => {
      const data = await apiFetch("/auth/token/", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
      setTokens({ access: data.access, refresh: data.refresh });
      return refreshProfile();
    },
    [refreshProfile]
  );

  const register = useCallback(
    async (payload) => {
      const data = await apiFetch("/auth/register/", {
        method: "POST",
        body: payload,
        auth: false,
      });
      // Sign them in immediately so they're not forced through the login
      // form a second time right after signing up.
      await login(payload.email, payload.password);
      return data;
    },
    [login]
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch) => {
    const profile = await apiFetch("/profile/", { method: "PATCH", body: patch });
    setUser(profile);
    return profile;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile, refreshProfile }),
    [user, loading, login, register, logout, updateProfile, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
