// backend/routes/dailyReportRoutes.js
const express = require("express");
const {
  createDailyReport,
  getDailyReports,
  getReportByDate,
  deleteReportByDate,
  getSummaryReport,
} = require("../controllers/dailyReportController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createDailyReport);
router.get("/", protect, getDailyReports);
// GET /api/daily-reports/summary?start=YYYY-MM-DD&end=YYYY-MM-DD&team=<id>&fiscalYearStart=YYYY-MM-DD
// Weekly rollup + optional fiscal-year-to-date cumulative total,
// matching the manual "ሳምንታዊ ሪፖርት" process in the paper/xlsx workflow.
router.get("/summary", protect, getSummaryReport);
router.get("/date/:date", protect, getReportByDate);
router.delete("/date/:date", protect, deleteReportByDate);

module.exports = router;
