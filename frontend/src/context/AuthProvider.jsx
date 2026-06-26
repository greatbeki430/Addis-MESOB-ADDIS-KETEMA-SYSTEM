// src/context/AuthProvider.jsx
import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import { authAPI } from "../services/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
    } catch (error) {
      console.error("Failed to load user:", error);
      if (error.response?.status === 401) {
        logout();
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

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

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token: newToken, ...userInfo } = response.data;

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userInfo);

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
  };

  const isAdmin = user?.role === "admin";
  const isSuperAdmin = user?.role === "superadmin";
  const isLeader = user?.role === "leader";
  const isEmployee = user?.role === "employee";
  const isAdminOrSuperAdmin = isAdmin || isSuperAdmin;
  const isLeaderOrAbove = isLeader || isAdmin || isSuperAdmin;

  const value = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
