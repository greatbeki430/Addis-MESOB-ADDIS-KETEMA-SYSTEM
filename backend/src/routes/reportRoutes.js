const express = require("express");
const {
  createReport,
  getReports,
  getReportById,
  deleteReport,
  getReportsByTeam,
  getReportsByUser,
} = require("../controllers/reportController");
const { protect, adminOrSuperAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createReport);
router.get("/", protect, getReports);
router.get("/team/:teamId", protect, getReportsByTeam);
router.get("/user/:userId", protect, getReportsByUser);
router.get("/:id", protect, getReportById);
router.delete("/:id", protect, adminOrSuperAdmin, deleteReport);

module.exports = router;
