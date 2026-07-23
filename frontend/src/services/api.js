// src/services/api.js
import axios from "axios";

// Get base URL from environment or default to localhost
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

console.log("VITE_API_BASE_URL =", import.meta.env.VITE_API_BASE_URL);
console.log("API_BASE_URL =", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // fail fast instead of hanging forever on a dead/unreachable backend
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
// PUBLIC API - No authentication required
// ============================================================
export const publicAPI = {
  getServices: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);
    if (params.department) queryParams.append("department", params.department);

    return api.get(`/public/services?${queryParams.toString()}`);
  },

  getDepartments: () => api.get("/public/services/departments"),
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

  // ✅ NEW: AI auto-fill for employee creation
  suggestEmployeeFields: (userData) =>
    api.post("/ai/suggest-employee-fields", userData),
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
// UPLOAD API - For file uploads (employee photos, etc.)
// ============================================================
export const uploadAPI = {
  uploadEmployeePhoto: (formData) =>
    api.post("/upload/employee-photo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};

// ============================================================
// DEPARTMENTS API — NEW
// Standalone department registry: create/manage departments
// independent of employee assignment, see live headcounts, rename
// safely (existing employee records get updated to match).
// ============================================================
export const departmentAPI = {
  // GET /api/departments - list all departments with employee counts
  getAll: () => api.get("/departments"),
  getDepartments: () => api.get("/departments"),

  // GET /api/departments/:id
  getById: (id) => api.get(`/departments/${id}`),

  // POST /api/departments  { name, description?, head?, headName? }
  create: (data) => api.post("/departments", data),
  createDepartment: (data) => api.post("/departments", data),

  // PUT /api/departments/:id  { name?, description?, head?, headName?, isActive? }
  update: (id, data) => api.put(`/departments/${id}`, data),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),

  // DELETE /api/departments/:id - refuses if employees are still assigned
  delete: (id) => api.delete(`/departments/${id}`),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),
};

// ============================================================
// GOLDEN MONDAY API — COMPLETE
// ============================================================
export const goldenMondayAPI = {
  // ──────────────────────────────────────────────────────────────
  // 📋 SESSIONS MANAGEMENT
  // ──────────────────────────────────────────────────────────────

  // GET /api/golden-monday - Get all sessions (past, present, future)
  getAll: () => api.get("/golden-monday"),
  getSessions: () => api.get("/golden-monday"),

  // GET /api/golden-monday/sessions/upcoming - Get only future sessions
  getUpcomingSessions: () => api.get("/golden-monday/sessions/upcoming"),

  // GET /api/golden-monday/sessions/past - Get only past sessions
  getPastSessions: () => api.get("/golden-monday/sessions/past"),

  // POST /api/golden-monday - Create a new Golden Monday session
  create: (data) => api.post("/golden-monday", data),
  createSession: (data) => api.post("/golden-monday", data),

  // POST /api/golden-monday/recap - Generate AI-powered recap preview
  previewRecap: (data) => api.post("/golden-monday/recap", data),

  // GET /api/golden-monday/suggest-topics - Get AI-suggested topics
  suggestTopics: () => api.get("/golden-monday/suggest-topics"),
  getSuggestedTopics: () => api.get("/golden-monday/suggest-topics"),

  // ──────────────────────────────────────────────────────────────
  // 🎥 RECORDINGS MANAGEMENT
  // ──────────────────────────────────────────────────────────────

  // GET /api/golden-monday/recordings/live - Get currently available recordings
  getLiveRecordings: () => api.get("/golden-monday/recordings/live"),

  // POST /api/golden-monday/:sessionId/recording - Upload a recording for a session
  // @param {string} sessionId - The session ID
  // @param {File} file - The recording file to upload
  // @param {number} visibleDays - Days the recording should remain available
  uploadRecording: (sessionId, file, visibleDays) =>
    api.post(`/golden-monday/${sessionId}/recording`, { file, visibleDays }),

  // DELETE /api/golden-monday/:sessionId/recording - Remove a session's recording
  removeRecording: (sessionId) =>
    api.delete(`/golden-monday/${sessionId}/recording`),

  // ──────────────────────────────────────────────────────────────
  // 👥 ROSTER MANAGEMENT (Employee Rotation Pool)
  // ──────────────────────────────────────────────────────────────

  // GET /api/golden-monday/roster - Get all employees in the rotation roster
  getRoster: () => api.get("/golden-monday/roster"),
  getEmployees: () => api.get("/golden-monday/roster"),

  // POST /api/golden-monday/roster - Add a user to the roster
  // @param {string} userId - The user ID to add
  // @param {string} department - The user's department
  // Accepts additional fields: position, profilePhotoUrl, phone, hireDate,
  // skills, notes, emergencyContact, address, salary (admin/superadmin only)
  addToRoster: (userId, department) =>
    api.post("/golden-monday/roster", { userId, department }),
  registerEmployee: (data) => api.post("/golden-monday/roster", data),

  // PUT /api/golden-monday/roster/:id - Update an employee's roster entry
  // @param {string} id - The roster entry ID
  // @param {Object} updates - Fields to update (name, department, position, etc.)
  updateRosterEntry: (id, updates) =>
    api.put(`/golden-monday/roster/${id}`, updates),

  // PUT /api/golden-monday/roster/:userId - Toggle employee eligibility
  // @param {string} userId - The user ID
  // @param {boolean} isEligible - true = eligible for rotation, false = excluded
  updateEmployeeEligibility: (userId, isEligible) =>
    api.put(`/golden-monday/roster/${userId}`, { isEligible }),

  // DELETE /api/golden-monday/roster/:id - Remove an employee from the roster
  removeFromRoster: (id) => api.delete(`/golden-monday/roster/${id}`),
  removeEmployee: (userId) => api.delete(`/golden-monday/roster/${userId}`),

  // ──────────────────────────────────────────────────────────────
  // 🔄 ROTATION ENGINE (Fair Presenter Selection Algorithm)
  // ──────────────────────────────────────────────────────────────

  // GET /api/golden-monday/rotation/preview - Preview rotation ranking
  // @param {string} weekOf - The week date to preview (e.g., "2026-07-27")
  previewRotation: (weekOf) =>
    api.get("/golden-monday/rotation/preview", { params: { weekOf } }),
  getRanking: () => api.get("/golden-monday/rotation/preview"),

  // GET /api/golden-monday/rotation/next - Get the next scheduled presenter
  getNextPresenter: () => api.get("/golden-monday/rotation/next"),

  // POST /api/golden-monday/rotation/assign - Assign a presenter for a week
  // @param {string} weekOf - The week date to assign
  // @param {string} manualPresenterId - Optional: override with specific user
  assignRotation: (weekOf, manualPresenterId) =>
    api.post("/golden-monday/rotation/assign", { weekOf, manualPresenterId }),
  assignPresenter: (userId) =>
    api.post("/golden-monday/rotation/assign", { manualPresenterId: userId }),

  // POST /api/golden-monday/rotation/:sessionId/reassign - Reassign a session
  // @param {string} sessionId - The session to reassign
  // @param {string} reason - Why the reassignment is happening
  reassignRotation: (sessionId, reason) =>
    api.post(`/golden-monday/rotation/${sessionId}/reassign`, { reason }),

  // ──────────────────────────────────────────────────────────────
  // 📝 PER-SESSION ACTIONS
  // ──────────────────────────────────────────────────────────────

  // PUT /api/golden-monday/:sessionId/title - Set presentation title
  // @param {string} sessionId - The session ID
  // @param {string} title - The presentation title
  setPresentationTitle: (sessionId, title) =>
    api.put(`/golden-monday/${sessionId}/title`, { title }),

  // ──────────────────────────────────────────────────────────────
  // 📊 STATISTICS & ANALYTICS
  // ──────────────────────────────────────────────────────────────

  // GET /api/golden-monday/stats - Get Golden Monday program statistics
  // Returns: total sessions, presenters, attendance rates, department metrics
  getStats: () => api.get("/golden-monday/stats"),

  // ──────────────────────────────────────────────────────────────
  // 🏛️ PILLARS (Golden Monday Framework/Values)
  // ──────────────────────────────────────────────────────────────

  // GET /api/golden-monday/pillars - Get the four pillars of Golden Monday
  getPillars: () => api.get("/golden-monday/pillars"),

  // ──────────────────────────────────────────────────────────────
  // 📱 TELEGRAM INTEGRATION
  // ──────────────────────────────────────────────────────────────

  // POST /api/telegram/post/:sessionId - Post session announcement to Telegram
  // @param {string} sessionId - The session to announce
  postToTelegram: (sessionId) => api.post(`/telegram/post/${sessionId}`),

  // ──────────────────────────────────────────────────────────────
  // 📋 PENDING REGISTRATIONS (Telegram Bot Self-Registration)
  // ──────────────────────────────────────────────────────────────

  // GET /api/registrations/pending - Get all registrations awaiting admin approval
  // Returns: Array of pending registrations with user details
  // Requires: Admin or SuperAdmin role
  getPendingRegistrations: () =>
    api.get("/registrations/pending", { withCredentials: true }),

  // PUT /api/registrations/:id/approve - Approve a pending registration
  // @param {string} id - The registration ID
  // Creates a User account, sends login credentials via Telegram
  // Requires: Admin or SuperAdmin role
  approveRegistration: (id) =>
    api.put(`/registrations/${id}/approve`, {}, { withCredentials: true }),

  // PUT /api/registrations/:id/reject - Reject a pending registration
  // @param {string} id - The registration ID
  // Sends rejection notification via Telegram
  // Requires: Admin or SuperAdmin role
  rejectRegistration: (id) =>
    api.put(`/registrations/${id}/reject`, {}, { withCredentials: true }),

  // GET /api/registrations - Get registrations with filters
  // @param {Object} params - Query parameters
  // @param {string} params.status - Filter by status (pending_approval, approved, rejected)
  // @param {number} params.limit - Results per page (default: 50)
  // @param {number} params.skip - Pagination offset
  // Requires: Admin or SuperAdmin role
  getRegistrations: (params) =>
    api.get("/registrations", { params, withCredentials: true }),

  // GET /api/registrations/:id - Get a single registration by ID
  // @param {string} id - The registration ID
  // Requires: Admin or SuperAdmin role
  getRegistration: (id) =>
    api.get(`/registrations/${id}`, { withCredentials: true }),

   // ──────────────────────────────────────────────────────────────
  // 🗑️ EMPLOYEE DELETION WITH TELEGRAM NOTIFICATION
  // ──────────────────────────────────────────────────────────────

  // DELETE /api/employees/:userId - Delete employee with Telegram notification
  // @param {string} userId - The user ID to delete
  // @param {string} reason - Reason for deletion (optional)
  deleteEmployeeWithNotification: (userId, reason) =>
    api.delete(`/employees/${userId}`, { 
      data: { reason }, 
      withCredentials: true 
    }),
};
};

// ============================================================
// DEFAULT EXPORT
// ============================================================
export default api;
