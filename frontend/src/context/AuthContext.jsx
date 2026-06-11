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

  // ✅ No separate loadUser function - logic directly in useEffect
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const response = await authAPI.getMe();
        if (isMounted) {
          setUser(response.data);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        if (isMounted) {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [token]);

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
