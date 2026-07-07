// backend/src/routes/goldenMondayRoutes.js

const express = require("express");
const router = express.Router();
const { protect, anyRole, leaderOrAdmin } = require("../middleware/auth");

const {
  getSessions,
  previewRecap,
  createSession,
  suggestTopics,
  getRoster,
  addToRoster,
  updateRosterEntry,
  removeFromRoster,
  previewRotation,
  assignRotation,
  reassignRotation,
  setPresentationTitle,
  uploadSessionRecording,
  removeSessionRecording,
  getLiveRecordings,
} = require("../controllers/goldenMondayController");

// ── Sessions ────────────────────────────────────────────────
// GET  /api/golden-monday                — list saved sessions, any authenticated user
router.get("/", protect, anyRole, getSessions);

// GET  /api/golden-monday/suggest-topics — AI-suggested topics for the next session
router.get("/suggest-topics", protect, leaderOrAdmin, suggestTopics);

// POST /api/golden-monday/recap          — generate an AI recap preview (not saved)
router.post("/recap", protect, leaderOrAdmin, previewRecap);

// POST /api/golden-monday                — save a session (auto-generates recap if omitted)
router.post("/", protect, leaderOrAdmin, createSession);

// ── Recordings (catch-up list) ─────────────────────────────
// GET  /api/golden-monday/recordings/live — recordings still within their visibility window
router.get("/recordings/live", protect, anyRole, getLiveRecordings);

// ── Rotation roster ─────────────────────────────────────────
// GET    /api/golden-monday/roster       — list the presenter roster
router.get("/roster", protect, anyRole, getRoster);
// POST   /api/golden-monday/roster       — add an employee to the roster
router.post("/roster", protect, leaderOrAdmin, addToRoster);
// PUT    /api/golden-monday/roster/:id   — update eligibility / leave / department
router.put("/roster/:id", protect, leaderOrAdmin, updateRosterEntry);
// DELETE /api/golden-monday/roster/:id   — remove from the roster
router.delete("/roster/:id", protect, leaderOrAdmin, removeFromRoster);

// ── Rotation engine ─────────────────────────────────────────
// GET  /api/golden-monday/rotation/preview        — ranked candidates for a week (no side effects)
router.get("/rotation/preview", protect, anyRole, previewRotation);
// POST /api/golden-monday/rotation/assign         — assign next presenter (auto or manual override)
router.post("/rotation/assign", protect, leaderOrAdmin, assignRotation);
// POST /api/golden-monday/rotation/:sessionId/reassign — undo + re-assign a week
router.post(
  "/rotation/:sessionId/reassign",
  protect,
  leaderOrAdmin,
  reassignRotation,
);

// ── Per-session actions ─────────────────────────────────────
// PUT    /api/golden-monday/:sessionId/title      — presenter locks in their own title
router.put("/:sessionId/title", protect, anyRole, setPresentationTitle);
// POST   /api/golden-monday/:sessionId/recording  — upload the session recording
router.post(
  "/:sessionId/recording",
  protect,
  leaderOrAdmin,
  uploadSessionRecording,
);
// DELETE /api/golden-monday/:sessionId/recording  — remove a recording early
router.delete(
  "/:sessionId/recording",
  protect,
  leaderOrAdmin,
  removeSessionRecording,
);

module.exports = router;
