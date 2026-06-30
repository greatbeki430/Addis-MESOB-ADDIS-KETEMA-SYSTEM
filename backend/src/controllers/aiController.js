// backend/src/controllers/aiController.js
// Handles all AI-powered analysis endpoints for Addis MESOB System
// Routes: POST /api/ai/daily-insight, /evaluation-summary, /dashboard-digest, /meeting-minutes

const {
  generateDailyInsight,
  generateEvaluationSummary,
  generateDashboardDigest,
  generateMeetingMinutes,
} = require("../services/aiService");

const DailyReport = require("../models/DailyReport");
const Evaluation = require("../models/Evaluation");
const Report = require("../models/Report");

// ============================================================
// POST /api/ai/daily-insight
// Body: { reportId } OR { reportData: { date, entries, grandTotal, teamName } }
// Auth: any authenticated user
// ============================================================
const getDailyInsight = async (req, res) => {
  try {
    let reportData = req.body.reportData;

    // If reportId is provided, fetch from DB
    if (!reportData && req.body.reportId) {
      const report = await DailyReport.findById(req.body.reportId).populate(
        "team",
        "name",
      );
      if (!report) return res.status(404).json({ message: "Report not found" });

      reportData = {
        date: report.date,
        entries: report.entries,
        grandTotal: report.grandTotal,
        teamName: report.team?.name || "Unknown Team",
      };
    }

    if (!reportData || !reportData.entries) {
      return res
        .status(400)
        .json({ message: "Report data or reportId is required" });
    }

    const insight = await generateDailyInsight(reportData);
    res.json({ insight, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("AI daily insight error:", error);
    res.status(500).json({ message: "AI service error", error: error.message });
  }
};

// ============================================================
// POST /api/ai/evaluation-summary
// Body: { evaluationId } OR { evaluationData }
// Auth: leader, admin, superadmin
// ============================================================
const getEvaluationSummary = async (req, res) => {
  try {
    let evaluationData = req.body.evaluationData;

    if (!evaluationData && req.body.evaluationId) {
      const evaluation = await Evaluation.findById(req.body.evaluationId);
      if (!evaluation)
        return res.status(404).json({ message: "Evaluation not found" });
      evaluationData = evaluation.toObject();
    }

    if (!evaluationData) {
      return res
        .status(400)
        .json({ message: "Evaluation data or evaluationId required" });
    }

    const summary = await generateEvaluationSummary(evaluationData);
    res.json({ summary, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("AI evaluation summary error:", error);
    res.status(500).json({ message: "AI service error", error: error.message });
  }
};

// ============================================================
// POST /api/ai/dashboard-digest
// Body: { stats: { totalUsers, activeTeams, totalServicesLogged, evaluationsCompleted, topDepartment, period } }
// Auth: admin, superadmin
// ============================================================
const getDashboardDigest = async (req, res) => {
  try {
    const { stats } = req.body;

    if (!stats) {
      return res.status(400).json({ message: "Stats object is required" });
    }

    const digest = await generateDashboardDigest(stats);
    res.json({ digest, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("AI dashboard digest error:", error);
    res.status(500).json({ message: "AI service error", error: error.message });
  }
};

// ============================================================
// POST /api/ai/meeting-minutes
// Body: { title, date, attendees, agenda, notes }
// Auth: leader, admin, superadmin
// ============================================================
const getMeetingMinutes = async (req, res) => {
  try {
    const { title, date, attendees, agenda, notes } = req.body;

    if (!notes) {
      return res
        .status(400)
        .json({ message: "Meeting notes are required to generate minutes" });
    }

    const minutes = await generateMeetingMinutes({
      title,
      date,
      attendees,
      agenda,
      notes,
    });
    res.json({ minutes, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("AI meeting minutes error:", error);
    res.status(500).json({ message: "AI service error", error: error.message });
  }
};

module.exports = {
  getDailyInsight,
  getEvaluationSummary,
  getDashboardDigest,
  getMeetingMinutes,
};
