// backend/routes/dailyReportRoutes.js
const express = require("express");
const {
  createDailyReport,
  getDailyReports,
  getReportByDate,
  deleteReportByDate,
  getSummaryReport,
  getUserHistory, // ✅ NEW
  getReportById, // ✅ NEW
  updateReportById, // ✅ NEW
  deleteReportById, // ✅ NEW
} = require("../controllers/dailyReportController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ─── Public / Protected routes ──────────────────────────────────────────────
router.post("/", protect, createDailyReport);
router.get("/", protect, getDailyReports);

// ✅ IMPORTANT: /history MUST come before /date/:date and /:id
// GET /api/daily-reports/history - Get user's report history
router.get("/history", protect, getUserHistory);

// GET /api/daily-reports/summary?start=YYYY-MM-DD&end=YYYY-MM-DD&team=<id>&fiscalYearStart=YYYY-MM-DD
// Weekly rollup + optional fiscal-year-to-date cumulative total,
// matching the manual "ሳምንታዊ ሪፖርት" process in the paper/xlsx workflow.
router.get("/summary", protect, getSummaryReport);

// GET /api/daily-reports/date/:date - Get report by date
router.get("/date/:date", protect, getReportByDate);

// DELETE /api/daily-reports/date/:date - Delete report by date
router.delete("/date/:date", protect, deleteReportByDate);

// ─── CRUD by ID (for history tab) ──────────────────────────────────────────
// GET /api/daily-reports/:id - Get single report by ID
router.get("/:id", protect, getReportById);

// PUT /api/daily-reports/:id - Update report by ID
router.put("/:id", protect, updateReportById);

// DELETE /api/daily-reports/:id - Delete report by ID
router.delete("/:id", protect, deleteReportById);

module.exports = router;
