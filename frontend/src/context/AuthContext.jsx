/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Check token expiration on load
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expTime = payload.exp * 1000;
        const now = Date.now();

        if (now >= expTime) {
          console.log("Token expired on load, logging out...");
          localStorage.removeItem("token");
          setToken(null);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Invalid token:", e);
        localStorage.removeItem("token");
        setToken(null);
        setLoading(false);
        return;
      }
    }

    // Only load user if token exists and is valid
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadUser = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
    } catch (error) {
      console.error("Failed to load user:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setToken(null);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

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

      // Decode token to check expiration
      try {
        const payload = JSON.parse(atob(newToken.split(".")[1]));
        const expTime = payload.exp * 1000;
        console.log(
          `Token expires at: ${new Date(expTime).toLocaleTimeString()}`,
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userInfo);
      return { success: true, data: userInfo };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const isAdmin = user?.role === "admin";

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
