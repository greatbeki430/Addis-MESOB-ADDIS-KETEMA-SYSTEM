// backend/src/controllers/aiController.js
// All AI endpoints for Addis MESOB System

const {
  generateDailyInsight,
  generateEvaluationSummary,
  generateDashboardDigest,
  generateMeetingMinutes,
  generateServiceRecommendations,
  generatePerformanceTrend,
  categorizeComplaint,
  translateContent,
  generateReportTitle,
} = require("../services/aiService");

const DailyReport = require("../models/DailyReport");
const Evaluation = require("../models/Evaluation");
const Service = require("../models/Service");

// ─── helper: wrap quota errors consistently ──────────────────
const handleAIError = (res, error, context = "") => {
  console.error(`❌ AI ${context} error:`, error.message, error.status);
  const isQuota =
    error.status === 429 ||
    error.message?.includes("quota") ||
    error.message?.includes("RESOURCE_EXHAUSTED");
  if (isQuota)
    return res.status(429).json({
      message: "AI service quota exceeded. Please try again later.",
      code: "QUOTA_EXCEEDED",
      retryAfter: 60,
    });
  return res.status(500).json({
    message: "AI service error",
    error: error.message,
    code: "AI_SERVICE_ERROR",
  });
};

// ============================================================
// POST /api/ai/daily-insight
// ============================================================
const getDailyInsight = async (req, res) => {
  try {
    let reportData = req.body.reportData;

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

    if (!reportData?.entries)
      return res
        .status(400)
        .json({ message: "Report data or reportId is required" });

    const insight = await generateDailyInsight(reportData);
    res.json({ insight, generatedAt: new Date().toISOString() });
  } catch (error) {
    handleAIError(res, error, "daily insight");
  }
};

// ============================================================
// POST /api/ai/evaluation-summary
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

    if (!evaluationData)
      return res
        .status(400)
        .json({ message: "Evaluation data or evaluationId required" });

    const summary = await generateEvaluationSummary(evaluationData);
    res.json({ summary, generatedAt: new Date().toISOString() });
  } catch (error) {
    handleAIError(res, error, "evaluation summary");
  }
};

// ============================================================
// POST /api/ai/dashboard-digest
// ============================================================
const getDashboardDigest = async (req, res) => {
  try {
    const { stats } = req.body;
    if (!stats)
      return res.status(400).json({ message: "Stats object is required" });

    let digest;
    try {
      digest = await generateDashboardDigest(stats);
    } catch (aiError) {
      const isQuota =
        aiError.status === 429 || aiError.message?.includes("quota");
      if (isQuota) {
        // Graceful fallback — never crash the dashboard
        const { activeTeams, totalServicesLogged, topDepartment, period } =
          stats;
        digest = `📊 System Summary: ${activeTeams || 0} teams active, ${totalServicesLogged || 0} services logged this ${period || "period"}. ${topDepartment && topDepartment !== "N/A" ? `Top department: ${topDepartment}.` : ""} Continue delivering quality service to citizens.`;
        return res.json({
          digest,
          generatedAt: new Date().toISOString(),
          _warning: "Quota exceeded, using fallback",
        });
      }
      throw aiError;
    }
    res.json({ digest, generatedAt: new Date().toISOString() });
  } catch (error) {
    // Final fallback — dashboard must never show a hard error
    const { stats } = req.body || {};
    res.json({
      digest: `System active: ${stats?.activeTeams || 0} teams, ${stats?.totalServicesLogged || 0} services logged.`,
      generatedAt: new Date().toISOString(),
      _error: "AI temporarily unavailable",
    });
  }
};

// ============================================================
// POST /api/ai/meeting-minutes
// ============================================================
const getMeetingMinutes = async (req, res) => {
  try {
    const { title, date, attendees, agenda, notes } = req.body;
    if (!notes)
      return res.status(400).json({ message: "Meeting notes are required" });
    const minutes = await generateMeetingMinutes({
      title,
      date,
      attendees,
      agenda,
      notes,
    });
    res.json({ minutes, generatedAt: new Date().toISOString() });
  } catch (error) {
    handleAIError(res, error, "meeting minutes");
  }
};

// ============================================================
// POST /api/ai/service-recommendations  ← NEW
// Body: { query: "citizen's question or need" }
// Auth: any authenticated user
// ============================================================
const getServiceRecommendations = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query?.trim())
      return res.status(400).json({ message: "Query is required" });

    // Fetch available services from DB
    const services = await Service.find({ active: true })
      .select("name nameEn dept deptEn")
      .limit(100);

    const result = await generateServiceRecommendations(query, services);

    let parsed;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      parsed = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { recommendations: [], summary: result };
    } catch {
      parsed = { recommendations: [], summary: result };
    }

    res.json({ ...parsed, generatedAt: new Date().toISOString() });
  } catch (error) {
    handleAIError(res, error, "service recommendations");
  }
};

// ============================================================
// POST /api/ai/performance-trend  ← NEW
// Body: { teamId, startDate, endDate }
// Auth: leader or above
// ============================================================
const getPerformanceTrend = async (req, res) => {
  try {
    const { teamId, startDate, endDate } = req.body;

    const query = {};
    if (teamId) query.team = teamId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const reports = await DailyReport.find(query)
      .populate("team", "name")
      .sort({ date: -1 })
      .limit(30);

    if (reports.length === 0)
      return res
        .status(400)
        .json({ message: "No reports found for the specified period" });

    const teamName = reports[0]?.team?.name || "Unknown Team";
    const trend = await generatePerformanceTrend(reports, teamName);

    res.json({
      trend,
      reportCount: reports.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleAIError(res, error, "performance trend");
  }
};

// ============================================================
// POST /api/ai/categorize-complaint  ← NEW
// Body: { complaint: "citizen complaint text" }
// Auth: any authenticated user
// ============================================================
const getCategoryAndResponse = async (req, res) => {
  try {
    const { complaint } = req.body;
    if (!complaint?.trim())
      return res.status(400).json({ message: "Complaint text is required" });

    const result = await categorizeComplaint(complaint);
    res.json({ ...result, generatedAt: new Date().toISOString() });
  } catch (error) {
    handleAIError(res, error, "complaint categorizer");
  }
};

// ============================================================
// POST /api/ai/translate  ← NEW
// Body: { text, targetLanguage: "am" | "en" }
// Auth: any authenticated user
// ============================================================
const getTranslation = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text?.trim())
      return res.status(400).json({ message: "Text is required" });
    if (!["am", "en"].includes(targetLanguage))
      return res
        .status(400)
        .json({ message: "targetLanguage must be 'am' or 'en'" });

    const translated = await translateContent(text, targetLanguage);
    res.json({
      translation: translated,
      from: targetLanguage === "am" ? "en" : "am",
      to: targetLanguage,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleAIError(res, error, "translation");
  }
};

// ============================================================
// POST /api/ai/generate-title  ← NEW
// Body: { type, period, teamName, highlights }
// Auth: any authenticated user
// ============================================================
const getReportTitle = async (req, res) => {
  try {
    const { type, period, teamName, highlights } = req.body;
    if (!type || !period)
      return res
        .status(400)
        .json({ message: "Report type and period are required" });

    const result = await generateReportTitle({
      type,
      period,
      teamName,
      highlights,
    });
    res.json({ ...result, generatedAt: new Date().toISOString() });
  } catch (error) {
    handleAIError(res, error, "report title");
  }
};

module.exports = {
  getDailyInsight,
  getEvaluationSummary,
  getDashboardDigest,
  getMeetingMinutes,
  getServiceRecommendations,
  getPerformanceTrend,
  getCategoryAndResponse,
  getTranslation,
  getReportTitle,
};
