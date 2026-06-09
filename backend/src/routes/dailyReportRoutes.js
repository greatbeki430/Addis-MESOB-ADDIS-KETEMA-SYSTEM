const express = require("express");
const {
  createDailyReport,
  getDailyReports,
} = require("../controllers/dailyReportController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createDailyReport);
router.get("/", protect, getDailyReports);

module.exports = router;
