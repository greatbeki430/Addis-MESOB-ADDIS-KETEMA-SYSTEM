// backend/src/routes/meetingRoutes.js
const express = require("express");
const {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
} = require("../controllers/meetingController");
const {
  protect,
  anyRole,
  leaderOrAdmin,
  adminOrSuperAdmin,
} = require("../middleware/auth");

const router = express.Router();

// ✅ All routes require authentication
router.use(protect, anyRole);

// POST /api/meetings - Create new meeting report (leaders and above)
router.post("/", leaderOrAdmin, createMeeting);

// GET /api/meetings/team/:teamId - Get meetings by team
router.get("/team/:teamId", getMeetings);

// GET /api/meetings/:id - Get single meeting
router.get("/:id", getMeetingById);

// PUT /api/meetings/:id - Update meeting
router.put("/:id", updateMeeting);

// DELETE /api/meetings/:id - Delete meeting (admin only)
router.delete("/:id", adminOrSuperAdmin, deleteMeeting);

module.exports = router;
