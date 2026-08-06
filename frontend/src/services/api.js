import axios from "axios";

// Get base URL from environment or default to localhost
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

console.log("VITE_API_BASE_URL =", import.meta.env.VITE_API_BASE_URL);
console.log("API_BASE_URL =", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // fail fast instead of hanging forever on a dead/unreachable backend
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
// AUTH API - Add changePassword
// ============================================================
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  getMe: () => api.get("/auth/me"),
  getUsers: () => api.get("/auth/users"),
  getUser: (id) => api.get(`/auth/users/${id}`),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  // ✅ Add this
  changePassword: (data) => api.put("/auth/change-password", data),
  // ✅ Add this for profile update
  updateProfile: (data) => api.put("/auth/profile", data),
};

// In api.js - uploadAPI section
export const uploadAPI = {
  uploadEmployeePhoto: (formData) =>
    api.post("/upload/employee-photo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  // ✅ Add this
  uploadProfilePhoto: (formData) =>
    api.post("/upload/profile-photo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
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
  // ✅ Full own-report object (incl. summary) for a date, used to pre-fill the form
  getMine: (date) => api.get(`/daily-reports/mine/${date}`),
  deleteByDate: (date) => api.delete(`/daily-reports/date/${date}`),
  // ✅ ADD THIS - Get user's report history
  getUserHistory: () => api.get("/daily-reports/history"),
  // ✅ ADD THIS - Get single report by ID
  getById: (id) => api.get(`/daily-reports/${id}`),
  // ✅ ADD THIS - Update report
  update: (id, data) => api.put(`/daily-reports/${id}`, data),
  // ✅ ADD THIS - Delete report by ID
  delete: (id) => api.delete(`/daily-reports/${id}`),
  // ✅ Team feed - everyone's reports for a team, to see & react to each other's
  getTeamFeed: (params) => api.get("/daily-reports/feed", { params }),
  // ✅ Comments on a report
  addComment: (id, text) => api.post(`/daily-reports/${id}/comments`, { text }),
  deleteComment: (id, commentId) =>
    api.delete(`/daily-reports/${id}/comments/${commentId}`),
  // ✅ Toggle a reaction (like/heart/etc.) on a report
  react: (id, emoji) => api.post(`/daily-reports/${id}/reactions`, { emoji }),
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

  // ✅ Accepts BOTH calling styles that exist in this codebase:
  //   1) Object style — used by AIEvaluationHelper.jsx:
  //        getEvaluationSummary({ evaluationData: {...} })
  //   2) Positional style — used when wired through AISummary's generic
  //      `fetchFn={aiAPI.getEvaluationSummary} args={[evaluationId, evaluationData]}`
  //      pattern, which calls `fetchFn(...args)`:
  //        getEvaluationSummary(evaluationId, evaluationData)
  // A prior version of this function only handled style #1, which silently
  // broke style #2 — both evaluationId and evaluationData came through as
  // undefined, and the backend correctly rejected the request with
  // "Evaluation data or evaluationId required". Detecting the shape of the
  // first argument fixes both call sites without touching the callers.
  getEvaluationSummary: (arg1, arg2) => {
    let evaluationId;
    let evaluationData;
    let language = "am";

    const isOptionsObject =
      arg1 &&
      typeof arg1 === "object" &&
      !Array.isArray(arg1) &&
      ("evaluationData" in arg1 ||
        "evaluationId" in arg1 ||
        "language" in arg1);

    if (isOptionsObject) {
      ({ evaluationId, evaluationData, language = "am" } = arg1);
    } else {
      evaluationId = arg1;
      evaluationData = arg2;
    }

    return api.post("/ai/evaluation-summary", {
      evaluationId,
      evaluationData,
      language,
    });
  },

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
  // 📋 ATTENDANCE MANAGEMENT - ✅ UPDATED TO MATCH BACKEND
  // ──────────────────────────────────────────────────────────────

  // GET /api/golden-monday/:sessionId/attendance - Get attendance for a session
  getAttendance: (sessionId) =>
    api.get(`/golden-monday/${sessionId}/attendance`),

  // POST /api/golden-monday/:sessionId/attendance - Record attendance for a session
  recordAttendance: (sessionId, data) =>
    api.post(`/golden-monday/${sessionId}/attendance`, data),

  // ──────────────────────────────────────────────────────────────
  // 🖼️ GALLERY MANAGEMENT - UPDATED with timeout and progress
  // ──────────────────────────────────────────────────────────────

  // GET /api/golden-monday/gallery - Get gallery photos with filters
  getGallery: (params) => api.get("/golden-monday/gallery", { params }),

  // ✅ POST /api/golden-monday/gallery - Upload with progress and longer timeout
  uploadGalleryPhoto: (data, onProgress) => {
    const formData = new FormData();

    // Handle base64 image
    if (data.image && data.image.startsWith("data:image")) {
      const blob = dataURLtoBlob(data.image);
      formData.append("image", blob, "photo.jpg");
    } else {
      formData.append("image", data.image);
    }

    if (data.folderId) formData.append("folderId", data.folderId);
    if (data.category) formData.append("category", data.category);
    if (data.sessionId) formData.append("sessionId", data.sessionId);
    if (data.lang) formData.append("lang", data.lang);

    return api.post("/golden-monday/gallery", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 180000, // 3 minutes for upload
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percentCompleted);
        }
      },
    });
  },

  // DELETE /api/golden-monday/gallery/:photoId - Delete a gallery photo
  deleteGalleryPhoto: (photoId) =>
    api.delete(`/golden-monday/gallery/${photoId}`),

  // ✅ GET /api/golden-monday/gallery/folders - list folders
  getFolders: (params) => api.get("/golden-monday/gallery/folders", { params }),

  // ✅ POST /api/golden-monday/gallery/folders - find-or-create a folder
  createFolder: (data) => api.post("/golden-monday/gallery/folders", data),

  // ✅ POST /api/golden-monday/gallery/analyze - AI analyze with 30s timeout
  analyzeGalleryPhoto: (data) =>
    api.post("/golden-monday/gallery/analyze", data, {
      timeout: 30000, // 30 seconds for AI
    }),

  // ──────────────────────────────────────────────────────────────
  // 🎥 RECORDINGS MANAGEMENT
  // ──────────────────────────────────────────────────────────────

  // GET /api/golden-monday/recordings/live - Get currently available recordings
  getLiveRecordings: () => api.get("/golden-monday/recordings/live"),

  // POST /api/golden-monday/:sessionId/recording - Upload a recording for a session
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
  addToRoster: (userId, department) =>
    api.post("/golden-monday/roster", { userId, department }),
  registerEmployee: (data) => api.post("/golden-monday/roster", data),

  // PUT /api/golden-monday/roster/:id - Update an employee's roster entry
  updateRosterEntry: (id, updates) =>
    api.put(`/golden-monday/roster/${id}`, updates),

  // PUT /api/golden-monday/roster/:userId - Toggle employee eligibility
  updateEmployeeEligibility: (userId, isEligible) =>
    api.put(`/golden-monday/roster/${userId}`, { isEligible }),

  // DELETE /api/golden-monday/roster/:id - Remove an employee from the roster
  removeFromRoster: (id) => api.delete(`/golden-monday/roster/${id}`),
  removeEmployee: (userId) => api.delete(`/golden-monday/roster/${userId}`),

  // ──────────────────────────────────────────────────────────────
  // 🔄 ROTATION ENGINE
  // ──────────────────────────────────────────────────────────────

  // GET /api/golden-monday/rotation/preview - Preview rotation ranking
  previewRotation: (weekOf) =>
    api.get("/golden-monday/rotation/preview", { params: { weekOf } }),
  getRanking: () => api.get("/golden-monday/rotation/preview"),

  // GET /api/golden-monday/rotation/next - Get the next scheduled presenter
  getNextPresenter: () => api.get("/golden-monday/rotation/next"),

  // POST /api/golden-monday/rotation/assign - Assign a presenter for a week
  assignRotation: (weekOf, manualPresenterId) =>
    api.post("/golden-monday/rotation/assign", { weekOf, manualPresenterId }),
  assignPresenter: (userId) =>
    api.post("/golden-monday/rotation/assign", { manualPresenterId: userId }),

  // POST /api/golden-monday/rotation/:sessionId/reassign - Reassign a session
  reassignRotation: (sessionId, reason) =>
    api.post(`/golden-monday/rotation/${sessionId}/reassign`, { reason }),

  // ──────────────────────────────────────────────────────────────
  // 📝 PER-SESSION ACTIONS
  // ──────────────────────────────────────────────────────────────

  // PUT /api/golden-monday/:sessionId/title - Set presentation title
  setPresentationTitle: (sessionId, title) =>
    api.put(`/golden-monday/${sessionId}/title`, { title }),

  // ──────────────────────────────────────────────────────────────
  // 📊 STATISTICS & ANALYTICS
  // ──────────────────────────────────────────────────────────────

  // GET /api/golden-monday/stats - Get Golden Monday program statistics
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
  postToTelegram: (sessionId) => api.post(`/telegram/post/${sessionId}`),

  // ──────────────────────────────────────────────────────────────
  // 📋 PENDING REGISTRATIONS (Telegram Bot Self-Registration)
  // ──────────────────────────────────────────────────────────────

  getPendingRegistrations: () =>
    api.get("/registrations/pending", { withCredentials: true }),

  approveRegistration: (id) =>
    api.put(`/registrations/${id}/approve`, {}, { withCredentials: true }),

  rejectRegistration: (id) =>
    api.put(`/registrations/${id}/reject`, {}, { withCredentials: true }),

  getRegistrations: (params) =>
    api.get("/registrations", { params, withCredentials: true }),

  getRegistration: (id) =>
    api.get(`/registrations/${id}`, { withCredentials: true }),

  // ──────────────────────────────────────────────────────────────
  // 🗑️ EMPLOYEE DELETION WITH TELEGRAM NOTIFICATION
  // ──────────────────────────────────────────────────────────────

  deleteEmployeeWithNotification: (userId, reason) =>
    api.delete(`/employees/${userId}`, {
      data: { reason },
      withCredentials: true,
    }),

  // ──────────────────────────────────────────────────────────────
  // ✅ EXPERIENCES & RESULTS (New features)
  // ──────────────────────────────────────────────────────────────

  // GET /api/golden-monday/experiences - Get experiences
  getExperiences: (sessionId, tag, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });
    if (sessionId) params.append("session", sessionId);
    if (tag) params.append("tag", tag);
    return api.get(`/golden-monday/experiences?${params.toString()}`);
  },

  // POST /api/golden-monday/experiences - Create an experience
  createExperience: (data) => api.post("/golden-monday/experiences", data),

  // POST /api/golden-monday/experiences/:id/endorse - Toggle endorsement
  endorseExperience: (id) =>
    api.post(`/golden-monday/experiences/${id}/endorse`),

  // DELETE /api/golden-monday/experiences/:id - Delete an experience
  deleteExperience: (id) => api.delete(`/golden-monday/experiences/${id}`),

  // GET /api/golden-monday/results - Get results
  getResults: (sessionId, category, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });
    if (sessionId) params.append("session", sessionId);
    if (category && category !== "all") params.append("category", category);
    return api.get(`/golden-monday/results?${params.toString()}`);
  },

  // POST /api/golden-monday/results - Create a result
  createResult: (data) => api.post("/golden-monday/results", data),

  // POST /api/golden-monday/results/:id/endorse - Toggle endorsement
  endorseResult: (id) => api.post(`/golden-monday/results/${id}/endorse`),

  // DELETE /api/golden-monday/results/:id - Delete a result
  deleteResult: (id) => api.delete(`/golden-monday/results/${id}`),

  // ──────────────────────────────────────────────────────────────
  // ✅ REPORTS (New features)
  // ──────────────────────────────────────────────────────────────

  // GET /api/golden-monday/reports/rotation - Rotation report
  getRotationReport: () => api.get("/golden-monday/reports/rotation"),

  // GET /api/golden-monday/reports/employee-performance - Employee performance report
  getEmployeePerformanceReport: () =>
    api.get("/golden-monday/reports/employee-performance"),

  // GET /api/golden-monday/reports/dashboard - Dashboard report
  getDashboardReport: () => api.get("/golden-monday/reports/dashboard"),

  // GET /api/golden-monday/reports/ai-insights - AI insights report
  getAIInsightsReport: () => api.get("/golden-monday/reports/ai-insights"),

  // ──────────────────────────────────────────────────────────────
  // 👤 USER DETAILS (for Presenter Spotlight)
  // ──────────────────────────────────────────────────────────────

  // GET /api/auth/users/:userId - Get user details including photo
  getUserDetails: (userId) => api.get(`/auth/users/${userId}`),
};

// ✅ Helper: dataURL to Blob (add at the bottom of the file, before export default)
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// ============================================================
// DEFAULT EXPORT
// ============================================================
export default api;
