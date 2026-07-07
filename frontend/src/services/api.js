// src/services/api.js
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

// ✅ Response interceptor to handle 401 errors - IMPROVED
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      const errorData = error.response?.data || {};
      const message = errorData.message || "Unauthorized";

      console.log("🔐 Auth error:", message);

      // Check if it's a token expiration
      if (message.includes("expired") || message.includes("token failed")) {
        console.log("⏰ Token expired, clearing session...");
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Show a friendly message
        const shouldRedirect = !window.location.pathname.includes("/login");

        if (shouldRedirect) {
          alert("Your session has expired. Please login again.");
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = "/login";
          }, 500);
        }
      } else {
        // For other auth errors, just clear token
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    return Promise.reject(error);
  },
);

// ============================================================
// AUTH API
// ============================================================
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  getMe: () => api.get("/auth/me"),
  getUsers: () => api.get("/auth/users"),
  getUser: (id) => api.get(`/auth/users/${id}`),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

// ============================================================
// MEETINGS API (Forum Reports)
// ============================================================
export const meetingAPI = {
  create: (data) => api.post("/meetings", data),
  getAll: () => api.get("/meetings"),
  getById: (id) => api.get(`/meetings/${id}`),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
};

// ============================================================
// EVALUATIONS API
// ============================================================
export const evaluationAPI = {
  create: (data) => api.post("/evaluations", data),
  getAll: () => api.get("/evaluations"),
  getById: (id) => api.get(`/evaluations/${id}`),
  getByTeam: (teamId) => api.get(`/evaluations/team/${teamId}`),
  update: (id, data) => api.put(`/evaluations/${id}`, data),
  delete: (id) => api.delete(`/evaluations/${id}`),
};

// ============================================================
// DAILY REPORTS API
// ============================================================
export const dailyReportAPI = {
  create: (data) => api.post("/daily-reports", data),
  getAll: (params) => api.get("/daily-reports", { params }),
  getByDate: (date) => api.get(`/daily-reports/date/${date}`),
  deleteByDate: (date) => api.delete(`/daily-reports/date/${date}`),
};

// ============================================================
// TEAMS API
// ============================================================
export const teamAPI = {
  getAll: () => api.get("/teams"),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post("/teams", data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
};

// ============================================================
// SERVICES API - UPDATED to handle paginated response
// ============================================================
export const serviceAPI = {
  getAll: (params = {}) => api.get("/services", { params }),
  seed: () => api.post("/services/seed"),
  create: (data) => api.post("/services", data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/services/import-excel", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  previewImport: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/services/preview-import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ============================================================
// REPORTS API
// ============================================================
export const reportAPI = {
  create: (data) => api.post("/reports", data),
  getAll: (params) => api.get("/reports", { params }),
  getById: (id) => api.get(`/reports/${id}`),
  getByTeam: (teamId) => api.get(`/reports/team/${teamId}`),
  getByUser: (userId) => api.get(`/reports/user/${userId}`),
  delete: (id) => api.delete(`/reports/${id}`),
};

// ============================================================
// AI INTELLIGENCE API
// ============================================================
export const aiAPI = {
  getDailyInsight: (reportId, reportData) =>
    api.post("/ai/daily-insight", { reportId, reportData }),
  getEvaluationSummary: (evaluationId, evaluationData) =>
    api.post("/ai/evaluation-summary", { evaluationId, evaluationData }),
  getDashboardDigest: (stats) => api.post("/ai/dashboard-digest", { stats }),
  getMeetingMinutes: (data) => api.post("/ai/meeting-minutes", data),
  getServiceRecommendations: (query) =>
    api.post("/ai/service-recommendations", { query }),
  getPerformanceTrend: (data) => api.post("/ai/performance-trend", data),
  categorizeComplaint: (complaint) =>
    api.post("/ai/categorize-complaint", { complaint }),
  translate: (text, targetLanguage) =>
    api.post("/ai/translate", { text, targetLanguage }),
  generateReportTitle: (data) => api.post("/ai/generate-title", data),
};

// ============================================================
// CHATBOT API
// ============================================================
export const chatbotAPI = {
  sendMessage: (message) => api.post("/chatbot/message", { message }),
  getHistory: () => api.get("/chatbot/history"),
  clearSession: () => api.delete("/chatbot/clear"),
};

// ============================================================
// CRRSA DOCUMENT VAULT API
// ============================================================
export const documentAPI = {
  upload: (data) => api.post("/documents/upload", data),
  analyze: (file, mimeType) =>
    api.post("/documents/analyze", { file, mimeType }),
  getAll: (params) => api.get("/documents", { params }),
  getById: (id) => api.get(`/documents/${id}`),
  update: (id, updates) => api.put(`/documents/${id}`, updates),
  addVersion: (id, file, changeNote) =>
    api.post(`/documents/${id}/version`, { file, changeNote }),
  getDownloadUrl: (id) => api.get(`/documents/${id}/download`),
  flagDelete: (id, reason) =>
    api.delete(`/documents/${id}/flag`, { data: { reason } }),
};

// ============================================================
// GOLDEN MONDAY API — COMPLETE
// ============================================================
export const goldenMondayAPI = {
  // ── Sessions ──
  // GET /api/golden-monday - Get all sessions
  getAll: () => api.get("/golden-monday"),
  getSessions: () => api.get("/golden-monday"),

  // GET /api/golden-monday/sessions/upcoming - Get upcoming sessions
  getUpcomingSessions: () => api.get("/golden-monday/sessions/upcoming"),

  // GET /api/golden-monday/sessions/past - Get past sessions
  getPastSessions: () => api.get("/golden-monday/sessions/past"),

  // POST /api/golden-monday - Create a session
  create: (data) => api.post("/golden-monday", data),
  createSession: (data) => api.post("/golden-monday", data),

  // POST /api/golden-monday/recap - Generate AI recap preview
  previewRecap: (data) => api.post("/golden-monday/recap", data),

  // GET /api/golden-monday/suggest-topics - AI topic suggestions
  suggestTopics: () => api.get("/golden-monday/suggest-topics"),
  getSuggestedTopics: () => api.get("/golden-monday/suggest-topics"),

  // ── Recordings ──
  // GET /api/golden-monday/recordings/live - Get live recordings
  getLiveRecordings: () => api.get("/golden-monday/recordings/live"),

  // POST /api/golden-monday/:sessionId/recording - Upload recording
  uploadRecording: (sessionId, file, visibleDays) =>
    api.post(`/golden-monday/${sessionId}/recording`, { file, visibleDays }),

  // DELETE /api/golden-monday/:sessionId/recording - Remove recording
  removeRecording: (sessionId) =>
    api.delete(`/golden-monday/${sessionId}/recording`),

  // ── Rotation Roster ──
  // GET /api/golden-monday/roster - Get roster
  getRoster: () => api.get("/golden-monday/roster"),
  getEmployees: () => api.get("/golden-monday/roster"),

  // POST /api/golden-monday/roster - Add to roster
  addToRoster: (userId, department) =>
    api.post("/golden-monday/roster", { userId, department }),
  registerEmployee: (data) => api.post("/golden-monday/roster", data),

  // PUT /api/golden-monday/roster/:id - Update roster entry
  updateRosterEntry: (id, updates) =>
    api.put(`/golden-monday/roster/${id}`, updates),
  updateEmployeeEligibility: (userId, isEligible) =>
    api.put(`/golden-monday/roster/${userId}`, { isEligible }),

  // DELETE /api/golden-monday/roster/:id - Remove from roster
  removeFromRoster: (id) => api.delete(`/golden-monday/roster/${id}`),
  removeEmployee: (userId) => api.delete(`/golden-monday/roster/${userId}`),

  // ── Rotation Engine ──
  // GET /api/golden-monday/rotation/preview - Preview rotation ranking
  previewRotation: (weekOf) =>
    api.get("/golden-monday/rotation/preview", { params: { weekOf } }),
  getRanking: () => api.get("/golden-monday/rotation/preview"),

  // GET /api/golden-monday/rotation/next - Get next presenter
  getNextPresenter: () => api.get("/golden-monday/rotation/next"),

  // POST /api/golden-monday/rotation/assign - Assign next presenter
  assignRotation: (weekOf, manualPresenterId) =>
    api.post("/golden-monday/rotation/assign", { weekOf, manualPresenterId }),
  assignPresenter: (userId) =>
    api.post("/golden-monday/rotation/assign", { manualPresenterId: userId }),

  // POST /api/golden-monday/rotation/:sessionId/reassign - Reassign
  reassignRotation: (sessionId, reason) =>
    api.post(`/golden-monday/rotation/${sessionId}/reassign`, { reason }),

  // ── Per-session actions ──
  // PUT /api/golden-monday/:sessionId/title - Set presentation title
  setPresentationTitle: (sessionId, title) =>
    api.put(`/golden-monday/${sessionId}/title`, { title }),

  // ── Stats ──
  // GET /api/golden-monday/stats - Get stats
  getStats: () => api.get("/golden-monday/stats"),

  // ── Pillars ──
  // GET /api/golden-monday/pillars - Get pillars
  getPillars: () => api.get("/golden-monday/pillars"),

  // ── Telegram ──
  // POST /api/telegram/post/:sessionId - Post to Telegram
  postToTelegram: (sessionId) => api.post(`/telegram/post/${sessionId}`),
};

// ============================================================
// DEFAULT EXPORT
// ============================================================
export default api;
