// backend/src/routes/meetingRoutes.js
const express = require("express");
const {
  createMeeting,
  autoSaveMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  lockMeeting,
  unlockMeeting,
  requestExtension,
  approveExtension,
  rejectExtension,
  getExtensionRequests,
  getMeetingProgress,
  resumeMeeting,
} = require("../controllers/meetingController");
const {
  protect,
  anyRole,
  leaderOrAdmin,
  adminOrSuperAdmin,
} = require("../middleware/auth");

const router = express.Router();

// ─── All routes require authentication ──────────────────────
router.use(protect, anyRole);

// ─── Meeting CRUD ────────────────────────────────────────────
// POST /api/meetings - Create new meeting report (leaders and above)
router.post("/", leaderOrAdmin, createMeeting);

// GET /api/meetings/team/:teamId - Get meetings by team
router.get("/team/:teamId", getMeetings);

// GET /api/meetings - Get all meetings (with optional team query)
router.get("/", getMeetings);

// GET /api/meetings/:id - Get single meeting
router.get("/:id", getMeetingById);

// PUT /api/meetings/:id - Update meeting
router.put("/:id", updateMeeting);

// DELETE /api/meetings/:id - Delete meeting (admin only)
router.delete("/:id", adminOrSuperAdmin, deleteMeeting);

// ─── Auto-Save Routes ────────────────────────────────────────
// POST /api/meetings/auto-save - Auto-save meeting progress
router.post("/auto-save", leaderOrAdmin, autoSaveMeeting);

// ─── Lock/Unlock Routes ──────────────────────────────────────
// POST /api/meetings/:id/lock - Lock meeting (auto-lock on expiry)
router.post("/:id/lock", leaderOrAdmin, lockMeeting);

// POST /api/meetings/:id/unlock - Unlock meeting (admin only)
router.post("/:id/unlock", adminOrSuperAdmin, unlockMeeting);

// ─── Extension Request Routes ───────────────────────────────
// POST /api/meetings/:id/request-extension - Request extension
router.post("/:id/request-extension", leaderOrAdmin, requestExtension);

// POST /api/meetings/extension/:id/approve - Approve extension (admin)
router.post("/extension/:id/approve", adminOrSuperAdmin, approveExtension);

// POST /api/meetings/extension/:id/reject - Reject extension (admin)
router.post("/extension/:id/reject", adminOrSuperAdmin, rejectExtension);

// GET /api/meetings/extensions - Get all extension requests (admin)
router.get("/extensions", adminOrSuperAdmin, getExtensionRequests);

// ─── Admin Progress Routes ──────────────────────────────────
// GET /api/meetings/:id/progress - Get meeting progress data (admin)
router.get("/:id/progress", adminOrSuperAdmin, getMeetingProgress);

// POST /api/meetings/:id/resume - Resume meeting (admin)
router.post("/:id/resume", adminOrSuperAdmin, resumeMeeting);

module.exports = router;
