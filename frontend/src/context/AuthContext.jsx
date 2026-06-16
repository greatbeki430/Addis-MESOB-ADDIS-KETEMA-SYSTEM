/* eslint-disable no-unused-vars */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

// Hook
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // ========================
  // LOGOUT (must be first)
  // ========================
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  // ========================
  // LOAD USER
  // ========================
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

  // ========================
  // TOKEN CHECK ON LOAD
  // ========================
  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      if (!payload?.exp) {
        throw new Error("Invalid token: no exp field");
      }

      const expTime = payload.exp * 1000;
      const now = Date.now();

      if (now >= expTime) {
        console.log("Token expired, logging out...");
        logout();
        return;
      }

      loadUser();
    } catch (err) {
      console.error("Invalid token:", err);
      logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========================
  // REGISTER
  // ========================
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

  // ========================
  // LOGIN
  // ========================
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token: newToken, ...userInfo } = response.data;

      // Save token
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userInfo);

      // Debug expiry (optional)
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

  // ========================
  // STATE VALUES
  // ========================
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
