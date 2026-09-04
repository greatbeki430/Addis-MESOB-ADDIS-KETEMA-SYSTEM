// frontend/src/services/forumReportService.js
// Forum Report service with auto-save and admin functions

import api from "./api";

export const forumReportService = {
  // ─── Auto-save report progress ─────────────────────────────
  autoSave: async (reportData) => {
    try {
      const response = await api.post("/meetings/auto-save", reportData);
      return response.data;
    } catch (error) {
      console.error("Auto-save failed:", error);
      throw error;
    }
  },

  // ─── Save final report ──────────────────────────────────────
  saveReport: async (reportData) => {
    try {
      const response = await api.post("/meetings", reportData);
      return response.data;
    } catch (error) {
      console.error("Save report failed:", error);
      throw error;
    }
  },

  // ─── Get all reports ────────────────────────────────────────
  getReports: async (params = {}) => {
    try {
      const response = await api.get("/meetings", { params });
      return response.data;
    } catch (error) {
      console.error("Get reports failed:", error);
      throw error;
    }
  },

  // ─── Get report by ID ──────────────────────────────────────
  getReportById: async (id) => {
    try {
      const response = await api.get(`/meetings/${id}`);
      return response.data;
    } catch (error) {
      console.error("Get report failed:", error);
      throw error;
    }
  },

  // ─── Update report ─────────────────────────────────────────
  updateReport: async (id, data) => {
    try {
      const response = await api.put(`/meetings/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Update report failed:", error);
      throw error;
    }
  },

  // ─── Delete report ──────────────────────────────────────────
  deleteReport: async (id) => {
    try {
      const response = await api.delete(`/meetings/${id}`);
      return response.data;
    } catch (error) {
      console.error("Delete report failed:", error);
      throw error;
    }
  },

  // ─── Lock report ────────────────────────────────────────────
  lockReport: async (id, reason = "") => {
    try {
      const response = await api.post(`/meetings/${id}/lock`, { reason });
      return response.data;
    } catch (error) {
      console.error("Lock report failed:", error);
      throw error;
    }
  },

  // ─── Unlock report (admin only) ────────────────────────────
  unlockReport: async (id) => {
    try {
      const response = await api.post(`/meetings/${id}/unlock`);
      return response.data;
    } catch (error) {
      console.error("Unlock report failed:", error);
      throw error;
    }
  },

  // ─── Request extension ──────────────────────────────────────
  requestExtension: async (meetingId, reason, requestedDuration = 15) => {
    try {
      const response = await api.post(
        `/meetings/${meetingId}/request-extension`,
        {
          reason,
          requestedDuration,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Extension request failed:", error);
      throw error;
    }
  },

  // ─── Approve extension (admin only) ────────────────────────
  approveExtension: async (requestId, adminNotes = "") => {
    try {
      const response = await api.post(
        `/meetings/extension/${requestId}/approve`,
        {
          adminNotes,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Approve extension failed:", error);
      throw error;
    }
  },

  // ─── Reject extension (admin only) ─────────────────────────
  rejectExtension: async (requestId, rejectionReason, adminNotes = "") => {
    try {
      const response = await api.post(
        `/meetings/extension/${requestId}/reject`,
        {
          rejectionReason,
          adminNotes,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Reject extension failed:", error);
      throw error;
    }
  },

  // ─── Get extension requests (admin only) ──────────────────
  getExtensionRequests: async (status = "pending") => {
    try {
      const response = await api.get("/meetings/extensions", {
        params: { status },
      });
      return response.data;
    } catch (error) {
      console.error("Get extension requests failed:", error);
      throw error;
    }
  },

  // ─── Get meeting progress (admin only) ────────────────────
  getMeetingProgress: async (meetingId) => {
    try {
      const response = await api.get(`/meetings/${meetingId}/progress`);
      return response.data;
    } catch (error) {
      console.error("Get meeting progress failed:", error);
      throw error;
    }
  },

  // ─── Resume meeting (admin only) ──────────────────────────
  resumeMeeting: async (meetingId) => {
    try {
      const response = await api.post(`/meetings/${meetingId}/resume`);
      return response.data;
    } catch (error) {
      console.error("Resume meeting failed:", error);
      throw error;
    }
  },
};

export default forumReportService;
