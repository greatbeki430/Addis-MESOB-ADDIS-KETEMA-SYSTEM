// backend/src/routes/aiRoutes.js

const express = require("express");
const router = express.Router();
const {
  protect,
  anyRole,
  leaderOrAdmin,
  adminOrSuperAdmin,
} = require("../middleware/auth");

const {
  getDailyInsight,
  getEvaluationSummary,
  getDashboardDigest,
  getMeetingMinutes,
  getServiceRecommendations,
  getPerformanceTrend,
  getCategoryAndResponse,
  getTranslation,
  getReportTitle,
} = require("../controllers/aiController");

// ─── Existing endpoints ───────────────────────────────────────
// POST /api/ai/daily-insight          — any authenticated user
router.post("/daily-insight", protect, anyRole, getDailyInsight);

// POST /api/ai/evaluation-summary     — leader or admin
router.post(
  "/evaluation-summary",
  protect,
  leaderOrAdmin,
  getEvaluationSummary,
);

// POST /api/ai/dashboard-digest       — admin/superadmin
router.post(
  "/dashboard-digest",
  protect,
  adminOrSuperAdmin,
  getDashboardDigest,
);

// POST /api/ai/meeting-minutes        — leader or admin
router.post("/meeting-minutes", protect, leaderOrAdmin, getMeetingMinutes);

// ─── New endpoints ────────────────────────────────────────────
// POST /api/ai/service-recommendations — any authenticated user
// Given a citizen's question, recommends relevant CRRSA services
router.post(
  "/service-recommendations",
  protect,
  anyRole,
  getServiceRecommendations,
);

// POST /api/ai/performance-trend      — leader or admin
// Analyzes multiple daily reports to find performance patterns
router.post("/performance-trend", protect, leaderOrAdmin, getPerformanceTrend);

// POST /api/ai/categorize-complaint   — any authenticated user
// Categorizes a citizen complaint and drafts a response
router.post("/categorize-complaint", protect, anyRole, getCategoryAndResponse);

// POST /api/ai/translate              — any authenticated user
// Translates Amharic <-> English for government content
router.post("/translate", protect, anyRole, getTranslation);

// POST /api/ai/generate-title         — any authenticated user
// Generates professional bilingual report titles
router.post("/generate-title", protect, anyRole, getReportTitle);

module.exports = router;
