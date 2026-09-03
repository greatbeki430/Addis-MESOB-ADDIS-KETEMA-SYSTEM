// frontend/src/context/AuthProvider.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { AuthContext } from "./AuthContext";
import { authAPI } from "../services/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // ─── Logout ────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  // ─── Load User ─────────────────────────────────────────────────
  const loadUser = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to load user:", error);
      if (error.response?.status === 401) {
        logout();
      } else {
        setUser(null);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // ✅ NEW: refreshUser function
  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return null;
      }

      const response = await authAPI.getMe();
      const userData = response.data;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error("Failed to refresh user:", error);
      if (error.response?.status === 401) {
        logout();
      }
      return null;
    }
  }, [logout]);

  // ─── Token Check ──────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const checkToken = async () => {
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (!payload?.exp) throw new Error("Invalid token: no exp field");

        if (Date.now() >= payload.exp * 1000) {
          console.log("Token expired, logging out...");
          if (isMounted) logout();
          return;
        }

        if (isMounted) await loadUser();
      } catch (err) {
        console.error("Invalid token:", err);
        if (isMounted) logout();
      }
    };

    checkToken();
    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Register ──────────────────────────────────────────────────
  const register = useCallback(async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  }, []);

  // ─── Login ─────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token: newToken, ...userInfo } = response.data;

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userInfo);

      console.log("🔑 Logged in user:", userInfo.name);
      console.log("📍 Branch:", userInfo.branch || "Not set");
      console.log("🏢 Department:", userInfo.team?.department || "Not set");

      try {
        const payload = JSON.parse(atob(newToken.split(".")[1]));
        console.log(
          "Token expires at:",
          new Date(payload.exp * 1000).toLocaleTimeString(),
        );
      } catch (e) {
        console.error("Token decode error:", e);
      }

      return { success: true, data: userInfo };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  }, []);

  const isAdmin = user?.role === "admin";
  const isSuperAdmin = user?.role === "superadmin";
  const isLeader = user?.role === "leader";
  const isEmployee = user?.role === "employee";
  const isAdminOrSuperAdmin = isAdmin || isSuperAdmin;
  const isLeaderOrAbove = isLeader || isAdmin || isSuperAdmin;

  // ─── Context Value ─────────────────────────────────────────────
  const value = useMemo(
    () => ({
      user,
      loading,
      token,
      isAuthenticated: !!user,
      isAdmin,
      isSuperAdmin,
      isLeader,
      isEmployee,
      isAdminOrSuperAdmin,
      isLeaderOrAbove,
      register,
      login,
      logout,
      refreshUser, // ✅ ADDED: refreshUser function
    }),
    [
      user,
      loading,
      token,
      isAdmin,
      isSuperAdmin,
      isLeader,
      isEmployee,
      isAdminOrSuperAdmin,
      isLeaderOrAbove,
      register,
      login,
      logout,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
