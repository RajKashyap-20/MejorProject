import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const result = await apiRequest("/api/auth/me");
      setUser(result.user);
      return result.user;
    } catch (error) {
      if (error.message.toLowerCase().includes("sign in")) {
        setUser(null);
        return null;
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest("/api/auth/me")
      .then((result) => {
        if (active) setUser(result.user);
      })
      .catch((error) => {
        if (active && error.message.toLowerCase().includes("sign in")) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    setUser,
    refreshUser,
    signOut: async () => {
      await apiRequest("/api/auth/logout", { method: "POST" });
      setUser(null);
    },
  }), [user, loading, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
