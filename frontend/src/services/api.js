import axios from "axios";

// Get base URL from environment or default to localhost
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

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

// Auth API
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  getMe: () => api.get("/auth/me"),
};

// Meetings API (Forum Reports)
export const meetingAPI = {
  create: (data) => api.post("/meetings", data),
  getAll: () => api.get("/meetings"),
  getById: (id) => api.get(`/meetings/${id}`),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
};

// Evaluations API
export const evaluationAPI = {
  create: (data) => api.post("/evaluations", data),
  getAll: () => api.get("/evaluations"),
  getByTeam: (teamId) => api.get(`/evaluations/team/${teamId}`),
};

// Daily Reports API
export const dailyReportAPI = {
  create: (data) => api.post("/daily-reports", data),
  getAll: () => api.get("/daily-reports"),
  getByDate: (date) => api.get(`/daily-reports/date/${date}`),
};

// Teams API
export const teamAPI = {
  getAll: () => api.get("/teams"),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post("/teams", data),
  update: (id, data) => api.put(`/teams/${id}`, data),
};

// Services API
export const serviceAPI = {
  getAll: () => api.get("/services"),
};

export default api;
