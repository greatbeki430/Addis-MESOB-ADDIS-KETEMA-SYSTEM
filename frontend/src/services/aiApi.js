// frontend/src/services/aiApi.js
// Re-exports from api.js for convenience — uses the shared axios instance
export { aiAPI as default, aiAPI, chatbotAPI, documentAPI } from "./api";

// Named convenience re-exports used by AISummary.jsx and ChatbotWidget.jsx
export {
  aiAPI as requestDailyInsight,
  aiAPI as requestEvaluationSummary,
  aiAPI as requestDashboardDigest,
  aiAPI as requestMeetingMinutes,
  aiAPI as suggestEmployeeFields, // ✅ NEW: Re-export the new method
} from "./api";
