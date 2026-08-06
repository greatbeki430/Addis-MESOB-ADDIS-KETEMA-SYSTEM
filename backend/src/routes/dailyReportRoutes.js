// backend/routes/dailyReportRoutes.js
const express = require("express");
const {
  createDailyReport,
  getDailyReports,
  getReportByDate,
  getMyReportByDate,
  deleteReportByDate,
  getSummaryReport,
  getUserHistory,
  getTeamFeed,
  getReportById,
  updateReportById,
  deleteReportById,
  addComment,
  deleteComment,
  toggleReaction,
} = require("../controllers/dailyReportController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Every authenticated user (employee, leader, admin, superadmin) can create
// and read daily reports. Fine-grained scoping (own team vs. all teams,
// own report vs. moderating a teammate's) happens inside the controller.
router.post("/", protect, createDailyReport);
router.get("/", protect, getDailyReports);

// ✅ IMPORTANT: specific routes MUST come before /date/:date and /:id
router.get("/history", protect, getUserHistory);

// GET /api/daily-reports/feed - team feed: everyone's reports, for
// commenting/reacting to each other's daily reports
router.get("/feed", protect, getTeamFeed);

// GET /api/daily-reports/summary?start=YYYY-MM-DD&end=YYYY-MM-DD&team=<id>&fiscalYearStart=YYYY-MM-DD
router.get("/summary", protect, getSummaryReport);

// GET /api/daily-reports/date/:date - caller's own report entries for a date
// (kept array-shaped for backward compatibility with existing callers)
router.get("/date/:date", protect, getReportByDate);

// GET /api/daily-reports/mine/:date - caller's own FULL report for a date
// (object shape, includes summary/_id — used by the report form to pre-fill)
router.get("/mine/:date", protect, getMyReportByDate);

// DELETE /api/daily-reports/date/:date - caller's own report for a date
router.delete("/date/:date", protect, deleteReportByDate);

// ─── CRUD by ID (for history tab / feed) ───────────────────────────────────
router.get("/:id", protect, getReportById);
router.put("/:id", protect, updateReportById);
router.delete("/:id", protect, deleteReportById);

// ─── Comments & reactions (the "see and react to each other" part) ────────
router.post("/:id/comments", protect, addComment);
router.delete("/:id/comments/:commentId", protect, deleteComment);
router.post("/:id/reactions", protect, toggleReaction);

module.exports = router;
