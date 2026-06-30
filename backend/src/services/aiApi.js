// frontend/src/services/aiApi.js
// API calls for all three AI features: AI Intelligence, Chatbot, and Document Vault

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

// ─── FEATURE 1: AI Intelligence ──────────────────────────────

export const requestDailyInsight = (reportId = null, reportData = null) =>
  axios.post(
    `${API_URL}/ai/daily-insight`,
    { reportId, reportData },
    { headers: getAuthHeaders() },
  );

export const requestEvaluationSummary = (
  evaluationId = null,
  evaluationData = null,
) =>
  axios.post(
    `${API_URL}/ai/evaluation-summary`,
    { evaluationId, evaluationData },
    { headers: getAuthHeaders() },
  );

export const requestDashboardDigest = (stats) =>
  axios.post(
    `${API_URL}/ai/dashboard-digest`,
    { stats },
    { headers: getAuthHeaders() },
  );

export const requestMeetingMinutes = (meetingData) =>
  axios.post(`${API_URL}/ai/meeting-minutes`, meetingData, {
    headers: getAuthHeaders(),
  });

// ─── FEATURE 2: Chatbot ──────────────────────────────────────

export const sendChatMessage = (message) =>
  axios.post(
    `${API_URL}/chatbot/message`,
    { message },
    { headers: getAuthHeaders() },
  );

export const getChatHistory = () =>
  axios.get(`${API_URL}/chatbot/history`, { headers: getAuthHeaders() });

export const clearChatSession = () =>
  axios.delete(`${API_URL}/chatbot/clear`, { headers: getAuthHeaders() });

// ─── FEATURE 3: Document Vault ───────────────────────────────

export const uploadDocument = (documentData) =>
  axios.post(`${API_URL}/documents/upload`, documentData, {
    headers: getAuthHeaders(),
  });

export const fetchDocuments = (params = {}) =>
  axios.get(`${API_URL}/documents`, {
    headers: getAuthHeaders(),
    params,
  });

export const fetchDocumentById = (id) =>
  axios.get(`${API_URL}/documents/${id}`, { headers: getAuthHeaders() });

export const updateDocumentMeta = (id, updates) =>
  axios.put(`${API_URL}/documents/${id}`, updates, {
    headers: getAuthHeaders(),
  });

export const addDocumentVersion = (id, file, changeNote) =>
  axios.post(
    `${API_URL}/documents/${id}/version`,
    { file, changeNote },
    { headers: getAuthHeaders() },
  );

export const getDocumentDownloadUrl = (id) =>
  axios.get(`${API_URL}/documents/${id}/download`, {
    headers: getAuthHeaders(),
  });
