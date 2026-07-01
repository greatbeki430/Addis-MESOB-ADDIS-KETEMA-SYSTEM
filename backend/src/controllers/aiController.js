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
    const isQuotaError =
      error.status === 429 ||
      error.message?.includes("quota") ||
      error.message?.includes("RESOURCE_EXHAUSTED");

    if (isQuotaError) {
      return res.status(429).json({
        message: "AI service quota exceeded. Please try again later.",
        code: "QUOTA_EXCEEDED",
        retryAfter: 60,
      });
    }

    res.status(500).json({
      message: "AI service error",
      error: error.message,
      code: "AI_SERVICE_ERROR",
    });
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
    const isQuotaError =
      error.status === 429 ||
      error.message?.includes("quota") ||
      error.message?.includes("RESOURCE_EXHAUSTED");

    if (isQuotaError) {
      return res.status(429).json({
        message: "AI service quota exceeded. Please try again later.",
        code: "QUOTA_EXCEEDED",
        retryAfter: 60,
      });
    }

    res.status(500).json({
      message: "AI service error",
      error: error.message,
      code: "AI_SERVICE_ERROR",
    });
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

    console.log("📊 Generating dashboard digest with stats:", stats);

    let digest;
    try {
      digest = await generateDashboardDigest(stats);
    } catch (aiError) {
      console.error("❌ AI generation failed:", aiError.message);

      // ✅ Check if it's a quota error (429)
      const isQuotaError =
        aiError.status === 429 ||
        aiError.message?.includes("quota") ||
        aiError.message?.includes("RESOURCE_EXHAUSTED") ||
        aiError.message?.includes("rate limit");

      if (isQuotaError) {
        console.log("⚠️ Gemini API quota exceeded, using static fallback");
        // ✅ Static fallback digest - never fails
        const {
          totalUsers,
          activeTeams,
          totalServicesLogged,
          topDepartment,
          period,
        } = stats;
        digest = `📊 System Summary: ${activeTeams || 0} teams active, ${totalServicesLogged || 0} services logged this ${period || "period"}. ${topDepartment && topDepartment !== "N/A" ? `Top department: ${topDepartment}.` : ""} ${totalUsers ? `Total users: ${totalUsers}.` : ""} Continue delivering quality service to citizens.`;

        // ✅ Return with a warning header but success status
        return res.status(200).json({
          digest,
          generatedAt: new Date().toISOString(),
          _warning: "AI service quota exceeded, using fallback digest",
        });
      } else {
        // For other errors, re-throw
        throw aiError;
      }
    }

    res.json({ digest, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("❌ AI dashboard digest error:", error);

    // ✅ Last resort fallback - never fail completely
    const { stats } = req.body || {};
    const fallbackDigest = `📊 System active: ${stats?.activeTeams || 0} teams, ${stats?.totalServicesLogged || 0} services logged. ${stats?.topDepartment && stats?.topDepartment !== "N/A" ? `Top: ${stats.topDepartment}.` : ""}`;

    res.status(200).json({
      digest: fallbackDigest,
      generatedAt: new Date().toISOString(),
      _error: "AI service temporarily unavailable",
    });
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
    const isQuotaError =
      error.status === 429 ||
      error.message?.includes("quota") ||
      error.message?.includes("RESOURCE_EXHAUSTED");

    if (isQuotaError) {
      return res.status(429).json({
        message: "AI service quota exceeded. Please try again later.",
        code: "QUOTA_EXCEEDED",
        retryAfter: 60,
      });
    }

    res.status(500).json({
      message: "AI service error",
      error: error.message,
      code: "AI_SERVICE_ERROR",
    });
  }
};

module.exports = {
  getDailyInsight,
  getEvaluationSummary,
  getDashboardDigest,
  getMeetingMinutes,
};
