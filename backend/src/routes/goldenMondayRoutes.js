// backend/src/routes/goldenMondayRoutes.js

const express = require("express");
const router = express.Router();
const { protect, anyRole, leaderOrAdmin } = require("../middleware/auth");

const {
  getSessions,
  previewRecap,
  createSession,
  suggestTopics,
} = require("../controllers/goldenMondayController");

// GET  /api/golden-monday                — list saved sessions, any authenticated user
router.get("/", protect, anyRole, getSessions);

// GET  /api/golden-monday/suggest-topics — AI-suggested topics for the next session
router.get("/suggest-topics", protect, leaderOrAdmin, suggestTopics);

// POST /api/golden-monday/recap          — generate an AI recap preview (not saved)
router.post("/recap", protect, leaderOrAdmin, previewRecap);

// POST /api/golden-monday                — save a session (auto-generates recap if omitted)
router.post("/", protect, leaderOrAdmin, createSession);

module.exports = router;
