// backend/routes/dailyReportRoutes.js
const express = require("express");
const {
  createDailyReport,
  getDailyReports,
  getReportByDate,
  deleteReportByDate,
} = require("../controllers/dailyReportController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createDailyReport);
router.get("/", protect, getDailyReports);
router.get("/date/:date", protect, getReportByDate);
router.delete("/date/:date", protect, deleteReportByDate);

module.exports = router;
