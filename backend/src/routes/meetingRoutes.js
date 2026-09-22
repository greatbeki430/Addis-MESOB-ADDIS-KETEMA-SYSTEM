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

// ════════════════════════════════════════════════════════════════
// ⚠️ ROUTE ORDERING MATTERS
//
// Express matches routes top-to-bottom, first-match-wins. Any
// route with a LITERAL path segment that could also match a
// wildcard (`/:something`) route MUST be declared BEFORE the
// wildcard. Otherwise the wildcard swallows the literal as if it
// were a value for the parameter, and the literal route never
// fires.
//
// Concretely in this file:
//   • /extensions  (literal)   must come before  /:id (wildcard)
//   • /auto-save   (literal, POST) has no wildcard sibling that
//                                collides — POST /:id does not exist,
//                                only POST /:id/lock and /:id/unlock,
//                                both two-segment, no overlap.
//   • /extension/:id/approve, /extension/:id/reject (three-segment)
//                                do not collide with /:id/anything
//                                (two-segment). Safe.
//
// If you ever add another single-segment literal GET or DELETE
// route (e.g. GET /summary), declare it ABOVE the /:id route below.
// ════════════════════════════════════════════════════════════════

// ─── Meeting CRUD ────────────────────────────────────────────

// POST /api/meetings - Create new meeting report (leaders and above)
router.post("/", leaderOrAdmin, createMeeting);

// GET /api/meetings/team/:teamId - Get meetings by team
router.get("/team/:teamId", getMeetings);

// GET /api/meetings - Get all meetings (with optional team query)
router.get("/", getMeetings);

// ─── Extension Request LIST (literal — MUST be above /:id) ──
// GET /api/meetings/extensions - Get all extension requests (admin)
router.get("/extensions", adminOrSuperAdmin, getExtensionRequests);

// ─── Single-meeting routes (wildcard — MUST be below any literal) ─

// GET /api/meetings/:id - Get single meeting
router.get("/:id", getMeetingById);

// PUT /api/meetings/:id - Update meeting
// The route is open to any authenticated user — the controller
// enforces the actual permission rule (member: own drafts;
// leader: any of their team's; admin: anything). Enforcing it
// here in middleware would require loading the meeting first,
// which the controller already does, so the check lives there
// to avoid a double fetch.
router.put("/:id", updateMeeting);

// DELETE /api/meetings/:id
// Same pattern as PUT above — no middleware guard, permission
// enforced in the controller.
router.delete("/:id", deleteMeeting);

// ─── Auto-Save Routes ────────────────────────────────────────
// POST /api/meetings/auto-save - Auto-save meeting progress
router.post("/auto-save", leaderOrAdmin, autoSaveMeeting);

// ─── Lock/Unlock Routes ──────────────────────────────────────
// POST /api/meetings/:id/lock - Lock meeting (auto-lock on expiry)
router.post("/:id/lock", leaderOrAdmin, lockMeeting);

// POST /api/meetings/:id/unlock - Unlock meeting (admin only)
router.post("/:id/unlock", adminOrSuperAdmin, unlockMeeting);

// ─── Extension Request ACTIONS ──────────────────────────────
// POST /api/meetings/:id/request-extension - Request extension
router.post("/:id/request-extension", leaderOrAdmin, requestExtension);

// POST /api/meetings/extension/:id/approve - Approve extension (admin)
router.post("/extension/:id/approve", adminOrSuperAdmin, approveExtension);

// POST /api/meetings/extension/:id/reject - Reject extension (admin)
router.post("/extension/:id/reject", adminOrSuperAdmin, rejectExtension);

// ─── Admin Progress Routes ──────────────────────────────────
// GET /api/meetings/:id/progress - Get meeting progress data (admin)
router.get("/:id/progress", adminOrSuperAdmin, getMeetingProgress);

// POST /api/meetings/:id/resume - Resume meeting (admin)
router.post("/:id/resume", adminOrSuperAdmin, resumeMeeting);

module.exports = router;
