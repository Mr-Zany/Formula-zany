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
      // Section 9b: the once-per-login check (sign in/account
      // created/catch-up/reached Gold-or-Top3-while-away/etc). Called
      // *before* refreshProfile below -- both endpoints run the same
      // idempotent just-reached-Gold/Top3 flag flip (Section 10b), so
      // whichever runs first "wins" the edge-trigger. Login-events must win
      // here, or a threshold crossed while away gets miscategorized as a
      // live event (wrong dismiss timing, and it won't join the combined
      // away banner). Best-effort -- a failure here shouldn't block login.
      let events = [];
      try {
        const loginEvents = await apiFetch("/notifications/login-events/");
        events = loginEvents.events || [];
      } catch {
        events = [];
      }
      const profile = await refreshProfile();
      return { profile, events };
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
      const loginResult = await login(payload.email, payload.password);
      return { ...data, ...loginResult };
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

  // Section 5c: "Agree to Continue" on the ToS re-consent pop-up.
  const acceptTos = useCallback(async () => {
    const profile = await apiFetch("/accounts/tos/accept/", { method: "POST" });
    setUser(profile);
    return profile;
  }, []);

  // Section 7b: the photo editor's real upload path.
  const uploadProfilePhoto = useCallback(async (dataUrl) => {
    const profile = await apiFetch("/profile/photo/", {
      method: "POST",
      body: { image: dataUrl },
    });
    setUser(profile);
    return profile;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      refreshProfile,
      acceptTos,
      uploadProfilePhoto,
    }),
    [user, loading, login, register, logout, updateProfile, refreshProfile, acceptTos, uploadProfilePhoto]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
