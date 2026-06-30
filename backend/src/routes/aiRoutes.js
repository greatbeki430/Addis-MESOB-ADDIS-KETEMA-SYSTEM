// backend/src/routes/aiRoutes.js
// All AI-powered backend intelligence endpoints

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
} = require("../controllers/aiController");

// POST /api/ai/daily-insight      — any authenticated user
router.post("/daily-insight", protect, anyRole, getDailyInsight);

// POST /api/ai/evaluation-summary — leader or admin only
router.post(
  "/evaluation-summary",
  protect,
  leaderOrAdmin,
  getEvaluationSummary,
);

// POST /api/ai/dashboard-digest   — admin/superadmin only
router.post(
  "/dashboard-digest",
  protect,
  adminOrSuperAdmin,
  getDashboardDigest,
);

// POST /api/ai/meeting-minutes    — leader or admin
router.post("/meeting-minutes", protect, leaderOrAdmin, getMeetingMinutes);

module.exports = router;
