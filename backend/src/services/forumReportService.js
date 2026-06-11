import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Get auth token from localStorage
const getAuthToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token;
};

// Axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Save Forum Report (Meeting)
export const saveForumReport = async (reportData, teamId) => {
  try {
    const response = await api.post("/meetings", {
      team: teamId,
      date: reportData.date,
      timeStart: reportData.timeStart,
      timeEnd: reportData.timeEnd,
      present: reportData.present, // These should be User IDs
      absent: reportData.absent,
      prevResults: reportData.prevResults,
      topics: reportData.topics,
      explanation: reportData.explanation,
      gaps: reportData.gaps,
      agreements: reportData.agreements,
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Save error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to save report",
    };
  }
};

// Get all Forum Reports for a team
export const getForumReports = async (teamId) => {
  try {
    const response = await api.get(`/meetings/team/${teamId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Fetch error:", error);
    return { success: false, message: error.response?.data?.message };
  }
};

// Get single Forum Report by ID
export const getForumReportById = async (reportId) => {
  try {
    const response = await api.get(`/meetings/${reportId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};

// Update Forum Report
export const updateForumReport = async (reportId, reportData) => {
  try {
    const response = await api.put(`/meetings/${reportId}`, reportData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};

// Delete Forum Report
export const deleteForumReport = async (reportId) => {
  try {
    await api.delete(`/meetings/${reportId}`);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.response?.data?.message };
  }
};
