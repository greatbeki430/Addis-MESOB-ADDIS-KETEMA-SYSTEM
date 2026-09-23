// backend/src/routes/leaderboardRoutes.js
// All routes require authentication. Role-based redaction happens inside
// the controller — see leaderboardController.js for the reasoning.

const express = require("express");
const router = express.Router();
const { protect, anyRole } = require("../middleware/auth");
const {
  getTeamLeaderboard,
  getPersonLeaderboard,
  getCelebration,
  getMyPerformance,
} = require("../controllers/leaderboardController");

router.use(protect, anyRole);

// Public-to-everyone: current month's top team, no sensitive fields.
router.get("/celebration", getCelebration);

// Self-service: caller's own scores and team position.
router.get("/me", getMyPerformance);

// Team board: shape depends on caller's role.
router.get("/teams", getTeamLeaderboard);

// Individual board: leader + admin only (checked in controller).
router.get("/people", getPersonLeaderboard);

module.exports = router;
