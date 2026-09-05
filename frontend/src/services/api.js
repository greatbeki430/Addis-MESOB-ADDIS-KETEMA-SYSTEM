// frontend/src/services/api.js
import axios from "axios";

// Get base URL from environment or default to localhost
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

console.log("VITE_API_BASE_URL =", import.meta.env.VITE_API_BASE_URL);
console.log("API_BASE_URL =", API_BASE_URL);

// ⚠️ NOTE: do NOT set a default "Content-Type": "application/json" header on
// this instance. Axios already sets that automatically for plain-object
// bodies. A fixed instance default gets attached to EVERY request through
// this instance — including FormData/file uploads — so the browser can
// never attach its own multipart boundary. That was the actual cause of
// every gallery/photo upload failing with "No files were uploaded": the
// server received Content-Type: application/json for a multipart body and
// multer silently parsed zero files. This has already broken this app
// twice from being re-added — please don't re-add it again.
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Whenever the body is FormData (file/photo uploads), strip any
    // Content-Type header entirely so the browser computes the correct
    // one with a boundary. A manually set "multipart/form-data" string
    // (with no boundary) is just as broken as "application/json" here —
    // multer can't parse either. This covers every FormData call site,
    // present or future, even if a header is mistakenly added again.
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    } else if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle 401 errors and 404 user endpoints
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ─── Handle 404 for user endpoints globally ───
    if (error.response?.status === 404) {
      const url = error.config?.url || "";

      // Check if it's a user endpoint
      if (url.includes("/auth/users/") || url.includes("/users/")) {
        console.warn(`⚠️ User endpoint 404 (silenced): ${url}`);
        // Return empty data to prevent crashes instead of rejecting
        return Promise.resolve({
          data: null,
          status: 404,
          _isFallback: true,
        });
      }
    }

    // ─── Handle 401 Unauthorized ──────────────────────────────
    // ✅ FIX: a previous edit removed the redirect here on the theory that
    // "AuthProvider will handle it" once localStorage is cleared. It won't:
    // AuthProvider's isAuthenticated is driven by its own React `user`
    // state, and it only calls its logout() (which clears that state) from
    // inside loadUser()/refreshUser()'s own 401 catch blocks — it has no
    // listener on localStorage or on this interceptor. So clearing
    // localStorage here, alone, leaves the UI still believing it's logged
    // in (stale `user` state) until some unrelated call happens to 401
    // again through one of those two functions. A hard redirect is what
    // actually forces a clean re-mount that re-reads localStorage from
    // scratch, so re-add it.
    if (error.response?.status === 401) {
      const errorData = error.response?.data || {};
      const message = errorData.message || "Unauthorized";

      console.log("🔐 Auth error:", message);

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const shouldRedirect = !window.location.pathname.includes("/login");
      if (shouldRedirect) {
        alert("Your session has expired. Please login again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
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
  changePassword: (data) => api.put("/auth/change-password", data),
  updateProfile: (data) => api.put("/auth/profile", data),
  setGoldenMondayAdmin: (id, isGoldenMondayAdmin) =>
    api.put(`/auth/users/${id}/golden-monday-admin`, { isGoldenMondayAdmin }),
};

// ============================================================
// UPLOAD API
// ============================================================
export const uploadAPI = {
  // ✅ FIX: removed manual Content-Type header — see note on the request
  // interceptor above. A hardcoded "multipart/form-data" string has no
  // boundary parameter and the server can't parse the body at all.
  uploadEmployeePhoto: (formData) =>
    api.post("/upload/employee-photo", formData),
  uploadProfilePhoto: (formData) => api.post("/upload/profile-photo", formData),
};

// ============================================================
// NOTIFICATIONS API (GENERAL)
// ============================================================
export const notificationAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.includeRead !== undefined)
      queryParams.append("includeRead", params.includeRead);
    return api.get(`/notifications?${queryParams.toString()}`);
  },
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
  dismiss: (id) => api.delete(`/notifications/${id}/dismiss`),
};

// ============================================================
// MEETINGS API (Forum Reports)
// ============================================================
export const meetingAPI = {
  create: (data) => api.post("/meetings", data),
  getAll: (params = {}) => api.get("/meetings", { params }),
  getById: (id) => api.get(`/meetings/${id}`),
  getByTeam: (teamId) => api.get(`/meetings/team/${teamId}`),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
  autoSave: (data) => api.post("/meetings/auto-save", data),
  lock: (id, reason = "") => api.post(`/meetings/${id}/lock`, { reason }),
  unlock: (id) => api.post(`/meetings/${id}/unlock`),
  requestExtension: (id, reason, requestedDuration = 15) =>
    api.post(`/meetings/${id}/request-extension`, {
      reason,
      requestedDuration,
    }),
  approveExtension: (requestId, adminNotes = "") =>
    api.post(`/meetings/extension/${requestId}/approve`, { adminNotes }),
  rejectExtension: (requestId, rejectionReason, adminNotes = "") =>
    api.post(`/meetings/extension/${requestId}/reject`, {
      rejectionReason,
      adminNotes,
    }),
  getExtensionRequests: (status = "pending") =>
    api.get("/meetings/extensions", { params: { status } }),
  getProgress: (id) => api.get(`/meetings/${id}/progress`),
  resume: (id) => api.post(`/meetings/${id}/resume`),
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
  addComment: (id, text) => api.post(`/evaluations/${id}/comments`, { text }),
  deleteComment: (id, commentId) =>
    api.delete(`/evaluations/${id}/comments/${commentId}`),
  react: (id, emoji) => api.post(`/evaluations/${id}/reactions`, { emoji }),
};

// ============================================================
// DAILY REPORTS API
// ============================================================
export const dailyReportAPI = {
  create: (data) => api.post("/daily-reports", data),
  getAll: (params) => api.get("/daily-reports", { params }),
  getByDate: (date) => api.get(`/daily-reports/date/${date}`),
  getMine: (date) => api.get(`/daily-reports/mine/${date}`),
  deleteByDate: (date) => api.delete(`/daily-reports/date/${date}`),
  getUserHistory: () => api.get("/daily-reports/history"),
  getById: (id) => api.get(`/daily-reports/${id}`),
  update: (id, data) => api.put(`/daily-reports/${id}`, data),
  delete: (id) => api.delete(`/daily-reports/${id}`),
  getTeamFeed: (params = {}) => api.get("/daily-reports/feed", { params }),
  addComment: (id, text) => api.post(`/daily-reports/${id}/comments`, { text }),
  deleteComment: (id, commentId) =>
    api.delete(`/daily-reports/${id}/comments/${commentId}`),
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
// SERVICES API
// ============================================================
export const serviceAPI = {
  getAll: (params = {}) => api.get("/services", { params }),
  seed: () => api.post("/services/seed"),
  create: (data) => api.post("/services", data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  // ✅ FIX: removed manual Content-Type header — see note above.
  importExcel: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/services/import-excel", formData);
  },
  previewImport: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/services/preview-import", formData);
  },
};

// ============================================================
// PUBLIC API
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
// DOCUMENT VAULT API
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
// DEPARTMENTS API
// ============================================================
export const departmentAPI = {
  getAll: () => api.get("/departments"),
  getDepartments: () => api.get("/departments"),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post("/departments", data),
  createDepartment: (data) => api.post("/departments", data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),
};

// ✅ Helper: dataURL to Blob
function dataURLtoBlob(dataURL) {
  try {
    const arr = dataURL.split(",");
    if (!arr || arr.length < 2) {
      throw new Error("Invalid data URL format");
    }
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
      throw new Error("Could not extract MIME type from data URL");
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (error) {
    console.error("❌ [dataURLtoBlob] Error:", error.message);
    throw error;
  }
}

// ============================================================
// GOLDEN MONDAY API — COMPLETE FIXED
// ============================================================
export const goldenMondayAPI = {
  // ──────────────────────────────────────────────────────────────
  // 📋 SESSIONS MANAGEMENT
  // ──────────────────────────────────────────────────────────────
  getAll: () => api.get("/golden-monday"),
  getSessions: () => api.get("/golden-monday"),
  getUpcomingSessions: () => api.get("/golden-monday/sessions/upcoming"),
  getPastSessions: () => api.get("/golden-monday/sessions/past"),
  create: (data) => api.post("/golden-monday", data),
  createSession: (data) => api.post("/golden-monday", data),
  previewRecap: (data) => api.post("/golden-monday/recap", data),
  suggestTopics: () => api.get("/golden-monday/suggest-topics"),
  getSuggestedTopics: () => api.get("/golden-monday/suggest-topics"),

  // ──────────────────────────────────────────────────────────────
  // 📋 ATTENDANCE MANAGEMENT
  // ──────────────────────────────────────────────────────────────
  getAttendance: (sessionId) =>
    api.get(`/golden-monday/${sessionId}/attendance`),
  recordAttendance: (sessionId, data) =>
    api.post(`/golden-monday/${sessionId}/attendance`, data),

  // ──────────────────────────────────────────────────────────────
  // 🖼️ GALLERY MANAGEMENT
  // ──────────────────────────────────────────────────────────────
  getGallery: (params) => api.get("/golden-monday/gallery", { params }),
  uploadGalleryPhoto: (data, onProgress) => {
    let formData;

    if (data instanceof FormData) {
      formData = data;
    } else {
      formData = new FormData();

      if (
        data.image &&
        typeof data.image === "string" &&
        data.image.startsWith("data:")
      ) {
        try {
          const blob = dataURLtoBlob(data.image);
          const ext = blob.type.split("/")[1]?.split("+")[0] || "bin";
          const filename = data.filename || `upload.${ext}`;
          formData.append("image", blob, filename);
        } catch (blobError) {
          console.error(
            "❌ [UPLOAD] Failed to convert dataURL to blob:",
            blobError,
          );
          return Promise.reject(
            new Error("Failed to process image data: " + blobError.message),
          );
        }
      } else if (data.image) {
        formData.append("image", data.image);
      } else {
        console.error("❌ [UPLOAD] No image data provided");
        return Promise.reject(new Error("No image data provided"));
      }

      if (data.folderId) {
        formData.append("folderId", data.folderId);
      } else {
        return Promise.reject(new Error("folderId is required for upload"));
      }

      if (data.category) formData.append("category", data.category);
      if (data.sessionId) formData.append("sessionId", data.sessionId);
      if (data.lang) formData.append("lang", data.lang);
      if (data.topic) formData.append("topic", data.topic);
    }

    return api
      .post("/golden-monday/gallery", formData, {
        timeout: 180000,
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(Math.min(percentCompleted, 100));
          }
        },
      })
      .catch((error) => {
        console.error(
          "❌ [UPLOAD] Request failed:",
          error.response?.data || error.message,
        );
        if (error.response?.data?.error) {
          const enhancedError = new Error(error.response.data.error);
          enhancedError.status = error.response.status;
          enhancedError.code = error.response.data.code;
          return Promise.reject(enhancedError);
        }
        return Promise.reject(error);
      });
  },
  deleteGalleryPhoto: (photoId) =>
    api.delete(`/golden-monday/gallery/${photoId}`),
  getFolders: (params) => api.get("/golden-monday/gallery/folders", { params }),
  createFolder: (data) => api.post("/golden-monday/gallery/folders", data),
  analyzeGalleryPhoto: (data) =>
    api.post("/golden-monday/gallery/analyze", data, { timeout: 30000 }),

  // ──────────────────────────────────────────────────────────────
  // 🎥 RECORDINGS MANAGEMENT
  // ──────────────────────────────────────────────────────────────
  getLiveRecordings: () => api.get("/golden-monday/recordings/live"),
  uploadRecording: (sessionId, file, visibleDays) =>
    api.post(`/golden-monday/${sessionId}/recording`, { file, visibleDays }),
  removeRecording: (sessionId) =>
    api.delete(`/golden-monday/${sessionId}/recording`),

  // ──────────────────────────────────────────────────────────────
  // 👥 ROSTER MANAGEMENT
  // ──────────────────────────────────────────────────────────────
  getRoster: () => api.get("/golden-monday/roster"),
  getEmployees: () => api.get("/golden-monday/roster"),
  addToRoster: (userId, department) =>
    api.post("/golden-monday/roster", { userId, department }),
  registerEmployee: (data) => api.post("/golden-monday/roster", data),
  updateRosterEntry: (id, updates) =>
    api.put(`/golden-monday/roster/${id}`, updates),
  updateEmployeeEligibility: (userId, isEligible) =>
    api.put(`/golden-monday/roster/${userId}`, { isEligible }),
  removeFromRoster: (id) => api.delete(`/golden-monday/roster/${id}`),
  removeEmployee: (userId) => api.delete(`/golden-monday/roster/${userId}`),

  // ──────────────────────────────────────────────────────────────
  // 🔄 ROTATION ENGINE
  // ──────────────────────────────────────────────────────────────
  previewRotation: (weekOf) =>
    api.get("/golden-monday/rotation/preview", { params: { weekOf } }),
  getRanking: () => api.get("/golden-monday/rotation/preview"),
  getNextPresenter: () => api.get("/golden-monday/rotation/next"),
  assignRotation: (weekOf, manualPresenterId) =>
    api.post("/golden-monday/rotation/assign", { weekOf, manualPresenterId }),
  assignPresenter: (userId) =>
    api.post("/golden-monday/rotation/assign", { manualPresenterId: userId }),
  reassignRotation: (sessionId, reason) =>
    api.post(`/golden-monday/rotation/${sessionId}/reassign`, { reason }),

  // ──────────────────────────────────────────────────────────────
  // 📝 PER-SESSION ACTIONS
  // ──────────────────────────────────────────────────────────────
  setPresentationTitle: (sessionId, title) =>
    api.put(`/golden-monday/${sessionId}/title`, { title }),

  // ──────────────────────────────────────────────────────────────
  // 📊 STATISTICS & ANALYTICS
  // ──────────────────────────────────────────────────────────────
  getStats: () => api.get("/golden-monday/stats"),

  // ──────────────────────────────────────────────────────────────
  // 🏛️ PILLARS
  // ──────────────────────────────────────────────────────────────
  getPillars: () => api.get("/golden-monday/pillars"),

  // ──────────────────────────────────────────────────────────────
  // 📱 TELEGRAM INTEGRATION
  // ──────────────────────────────────────────────────────────────
  postToTelegram: (sessionId) => api.post(`/telegram/post/${sessionId}`),

  // ──────────────────────────────────────────────────────────────
  // 📋 PENDING REGISTRATIONS
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
  // 🗑️ EMPLOYEE DELETION
  // ──────────────────────────────────────────────────────────────
  deleteEmployeeWithNotification: (userId, reason) =>
    api.delete(`/employees/${userId}`, {
      data: { reason },
      withCredentials: true,
    }),

  // ──────────────────────────────────────────────────────────────
  // ✅ EXPERIENCES & RESULTS
  // ──────────────────────────────────────────────────────────────
  getExperiences: (sessionId, tag, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });
    if (sessionId) params.append("session", sessionId);
    if (tag) params.append("tag", tag);
    return api.get(`/golden-monday/experiences?${params.toString()}`);
  },
  createExperience: (data) => api.post("/golden-monday/experiences", data),
  endorseExperience: (id) =>
    api.post(`/golden-monday/experiences/${id}/endorse`),
  deleteExperience: (id) => api.delete(`/golden-monday/experiences/${id}`),

  getResults: (sessionId, category, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });
    if (sessionId) params.append("session", sessionId);
    if (category && category !== "all") params.append("category", category);
    return api.get(`/golden-monday/results?${params.toString()}`);
  },
  createResult: (data) => api.post("/golden-monday/results", data),
  endorseResult: (id) => api.post(`/golden-monday/results/${id}/endorse`),
  deleteResult: (id) => api.delete(`/golden-monday/results/${id}`),

  // ──────────────────────────────────────────────────────────────
  // ✅ REPORTS
  // ──────────────────────────────────────────────────────────────
  getRotationReport: () => api.get("/golden-monday/reports/rotation"),
  getEmployeePerformanceReport: () =>
    api.get("/golden-monday/reports/employee-performance"),
  getDashboardReport: () => api.get("/golden-monday/reports/dashboard"),
  getAIInsightsReport: () => api.get("/golden-monday/reports/ai-insights"),

  // ──────────────────────────────────────────────────────────────
  // 👤 USER DETAILS
  // ──────────────────────────────────────────────────────────────
  getUserDetails: (userId) => api.get(`/auth/users/${userId}`),

  // ─── Resources ──────────────────────────────────────────────────
  getSessionResources: (sessionId) =>
    api.get(`/golden-monday/resources/session/${sessionId}`),
  // ✅ FIX: removed manual Content-Type header — see note above.
  uploadSessionResource: (sessionId, formData, onProgress) =>
    api.post(`/golden-monday/resources/session/${sessionId}`, formData, {
      timeout: 60000,
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(Math.min(percentCompleted, 100));
        }
      },
    }),
  deleteSessionResource: (resourceId) =>
    api.delete(`/golden-monday/resources/${resourceId}`),
  downloadResource: (resourceId) =>
    api.put(`/golden-monday/resources/${resourceId}/download`),
  updateSessionResource: (resourceId, data) =>
    api.put(`/golden-monday/resources/${resourceId}`, data),

  // ─── NOTIFICATIONS - ✅ FIXED to match backend routes ──────
  // These now use the general /notifications endpoint instead of /golden-monday/notifications
  getNotifications: (params) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page);
    if (params?.limit) queryParams.append("limit", params.limit);
    if (params?.includeRead !== undefined)
      queryParams.append("includeRead", params.includeRead);
    return api.get(`/notifications?${queryParams.toString()}`);
  },
  // Alias for consistency with notificationAPI
  getNotificationList: (params) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page);
    if (params?.limit) queryParams.append("limit", params.limit);
    if (params?.includeRead !== undefined)
      queryParams.append("includeRead", params.includeRead);
    return api.get(`/notifications?${queryParams.toString()}`);
  },
  // ✅ FIXED: GET unread count (not POST)
  getUnreadCount: () => api.get("/notifications/unread-count"),
  // ✅ FIXED: PUT to mark as read
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),
  markRead: (id) => api.put(`/notifications/${id}/read`), // Alias
  // ✅ FIXED: PUT to mark all as read
  markAllNotificationsRead: () => api.put("/notifications/read-all"),
  markAllRead: () => api.put("/notifications/read-all"), // Alias
  // ✅ FIXED: DELETE to dismiss (not PUT)
  dismissNotification: (id) => api.delete(`/notifications/${id}/dismiss`),
  dismiss: (id) => api.delete(`/notifications/${id}/dismiss`), // Alias

  // ─── QR Check-in ──────────────────────────────────────────────
  // Changed from POST to GET for QR generation
  generateQRCheckIn: (sessionId) =>
    api.get(`/golden-monday/qr-checkin/${sessionId}`),

  // ✅ ADD THIS: For recording the actual check-in (POST)
  recordQRCheckIn: (sessionId, data) =>
    api.post(`/golden-monday/qr-checkin/${sessionId}`, data || {}),
};

// ============================================================
// FEED API
// ============================================================
export const feedAPI = {
  getFeed: (params = {}) => api.get("/feed", { params }),
  getFeedItem: (type, id) => api.get(`/feed/${type}/${id}`),
};

export default api;
