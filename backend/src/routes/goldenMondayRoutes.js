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

const rotationService = require("../services/goldenMondayRotationService");
const GoldenMondaySession = require("../models/GoldenMondaySession");
const GoldenMondayPresenter = require("../models/GoldenMondayPresenter");

// ── Sessions ────────────────────────────────────────────────
router.get("/", protect, anyRole, getSessions);
router.get("/suggest-topics", protect, leaderOrAdmin, suggestTopics);
router.post("/recap", protect, leaderOrAdmin, previewRecap);
router.post("/", protect, leaderOrAdmin, createSession);

// ── Sessions - Upcoming & Past ─────────────────────────────
router.get("/sessions/upcoming", protect, anyRole, async (req, res) => {
  try {
    const sessions = await GoldenMondaySession.find({
      status: { $in: ["scheduled", "ongoing"] },
      date: { $gte: new Date() },
    })
      .sort({ date: 1 })
      .populate("presenter", "name email department profilePhotoUrl");
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/sessions/past", protect, anyRole, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const sessions = await GoldenMondaySession.find({
      status: "completed",
      date: { $lt: new Date() },
    })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate("presenter", "name email department profilePhotoUrl");

    const total = await GoldenMondaySession.countDocuments({
      status: "completed",
      date: { $lt: new Date() },
    });

    res.json({
      sessions,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Recordings ─────────────────────────────────────────────
router.get("/recordings/live", protect, anyRole, getLiveRecordings);

// ── Rotation roster ─────────────────────────────────────────
// NOTE: addToRoster/updateRosterEntry now accept a larger payload
// (phone, hireDate, skills, notes, emergencyContact, address, and a
// role-gated salary) — that's all handled inside the controller, so
// no route-level changes were needed here.
router.get("/roster", protect, anyRole, getRoster);
router.post("/roster", protect, leaderOrAdmin, addToRoster);
router.put("/roster/:id", protect, leaderOrAdmin, updateRosterEntry);
router.delete("/roster/:id", protect, leaderOrAdmin, removeFromRoster);

// ── Rotation engine ─────────────────────────────────────────
router.get("/rotation/preview", protect, anyRole, previewRotation);
router.get("/rotation/next", protect, anyRole, async (req, res) => {
  try {
    const next = await rotationService.getNextPresenter();
    res.json(next);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/rotation/assign", protect, leaderOrAdmin, assignRotation);
router.post(
  "/rotation/:sessionId/reassign",
  protect,
  leaderOrAdmin,
  reassignRotation,
);

// ── Per-session actions ─────────────────────────────────────
router.put("/:sessionId/title", protect, anyRole, setPresentationTitle);
router.post(
  "/:sessionId/recording",
  protect,
  leaderOrAdmin,
  uploadSessionRecording,
);
router.delete(
  "/:sessionId/recording",
  protect,
  leaderOrAdmin,
  removeSessionRecording,
);

// ── Stats ────────────────────────────────────────────────────
router.get("/stats", protect, anyRole, async (req, res) => {
  try {
    const [
      totalSessions,
      totalPresenters,
      upcomingSessions,
      completedSessions,
    ] = await Promise.all([
      GoldenMondaySession.countDocuments(),
      GoldenMondayPresenter.countDocuments({ isEligible: true }),
      GoldenMondaySession.countDocuments({
        status: { $in: ["scheduled", "ongoing"] },
        date: { $gte: new Date() },
      }),
      GoldenMondaySession.countDocuments({ status: "completed" }),
    ]);

    const sessionsWithRatings = await GoldenMondaySession.find({
      averageRating: { $gt: 0 },
    }).select("averageRating");

    let averageRating = 0;
    if (sessionsWithRatings.length > 0) {
      const total = sessionsWithRatings.reduce(
        (sum, s) => sum + s.averageRating,
        0,
      );
      averageRating = total / sessionsWithRatings.length;
    }

    res.json({
      totalSessions,
      totalPresenters,
      upcomingSessions,
      completedSessions,
      averageRating: Math.round(averageRating * 10) / 10,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── Pillars ──────────────────────────────────────────────────
router.get("/pillars", protect, anyRole, async (req, res) => {
  try {
    const pillars = [
      {
        icon: "FiSunrise",
        title: "A weekly reset",
        body: "Every Monday morning, offices across the organization pause the routine for shared learning — a deliberate start to the work week instead of a rushed one.",
      },
      {
        icon: "FiUsers",
        title: "Peer-led, not top-down",
        body: "Sessions are usually carried by colleagues themselves — department heads, team leaders, and long-serving staff sharing real experience, not scripted lectures.",
      },
      {
        icon: "FiTrendingUp",
        title: "Built for multiskilling",
        body: "The stated goal is to push every employee beyond a single fixed skill set — technology literacy, service standards, and adaptability all get airtime over time.",
      },
    ];
    res.json(pillars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
