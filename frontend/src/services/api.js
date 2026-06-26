import axios from "axios";

// Get base URL from environment or default to localhost
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

console.log("VITE_API_BASE_URL =", import.meta.env.VITE_API_BASE_URL);
console.log("API_BASE_URL =", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ✅ Response interceptor to handle 401 errors - FIXED
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Optionally redirect to login
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  getMe: () => api.get("/auth/me"),
  // User management endpoints
  getUsers: () => api.get("/auth/users"),
  getUser: (id) => api.get(`/auth/users/${id}`),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

// Meetings API (Forum Reports)
export const meetingAPI = {
  create: (data) => api.post("/meetings", data),
  getAll: () => api.get("/meetings"),
  getById: (id) => api.get(`/meetings/${id}`),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
};

// ✅ Evaluations API - COMPLETE
export const evaluationAPI = {
  create: (data) => api.post("/evaluations", data),
  getAll: () => api.get("/evaluations"),
  getById: (id) => api.get(`/evaluations/${id}`),
  getByTeam: (teamId) => api.get(`/evaluations/team/${teamId}`),
  update: (id, data) => api.put(`/evaluations/${id}`, data),
  delete: (id) => api.delete(`/evaluations/${id}`),
};

// Daily Reports API
export const dailyReportAPI = {
  create: (data) => api.post("/daily-reports", data),
  getAll: () => api.get("/daily-reports"),
  getByDate: (date) => api.get(`/daily-reports/date/${date}`),
};

// ✅ Teams API - COMPLETE
export const teamAPI = {
  getAll: () => api.get("/teams"),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post("/teams", data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
};

// Services API
// export const serviceAPI = {
//   getAll: () => api.get("/services"),
// };

export const serviceAPI = {
  getAll: () => api.get("/services"),
  // ✅ New methods
  seed: () => api.post("/services/seed"),
  create: (data) => api.post("/services", data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
};

// Reports API
export const reportAPI = {
  create: (data) => api.post("/reports", data),
  getAll: (params) => api.get("/reports", { params }),
  getById: (id) => api.get(`/reports/${id}`),
  getByTeam: (teamId) => api.get(`/reports/team/${teamId}`),
  getByUser: (userId) => api.get(`/reports/user/${userId}`),
  delete: (id) => api.delete(`/reports/${id}`),
};

export default api;
