// backend/src/controllers/goldenMondayController.js
// CRUD + AI endpoints for the "Golden Monday" feature.

const GoldenMondaySession = require("../models/GoldenMondaySession");
const {
  generateGoldenMondayRecap,
  generateGoldenMondayTopics,
} = require("../services/aiService");

// ─── Unified AI error handler (mirrors aiController.js) ───────
const handleAIError = (res, error, context = "") => {
  const code = error.code || "AI_UNKNOWN_ERROR";
  console.error(
    `[goldenMondayController] ❌ ${context} [${code}]:`,
    error.message,
  );

  if (code === "AI_RATE_LIMIT") {
    return res.status(429).json({
      message: "AI service quota exceeded. Please try again in a few minutes.",
      code,
    });
  }

  if (code === "AI_AUTH_ERROR" || code === "AI_NOT_CONFIGURED") {
    return res.status(503).json({
      message:
        "AI service is not available due to a configuration error. Contact system administrator.",
      code,
    });
  }

  return res.status(500).json({
    message: error.message || "AI service error",
    code,
  });
};

// ============================================================
// GET /api/golden-monday
// List saved sessions, most recent first.
// ============================================================
const getSessions = async (req, res) => {
  try {
    const sessions = await GoldenMondaySession.find()
      .sort({ date: -1 })
      .limit(50);
    res.json(sessions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load sessions", error: error.message });
  }
};

// ============================================================
// POST /api/golden-monday/recap
// Generate an AI recap preview WITHOUT saving — lets the person
// review/edit before committing it.
// ============================================================
const previewRecap = async (req, res) => {
  try {
    const { title, date, organization, speaker, rawNotes } = req.body;
    if (!rawNotes?.trim()) {
      return res
        .status(400)
        .json({ message: "Raw session notes are required" });
    }

    const recap = await generateGoldenMondayRecap({
      title,
      date,
      organization,
      speaker,
      rawNotes,
    });
    res.json({ ...recap, generatedAt: new Date().toISOString() });
  } catch (error) {
    handleAIError(res, error, "recap preview");
  }
};

// ============================================================
// POST /api/golden-monday
// Save a session. If no recap fields are supplied, one is
// generated automatically so a session is never saved blank.
// ============================================================
const createSession = async (req, res) => {
  try {
    const {
      title,
      date,
      organization,
      speaker,
      rawNotes,
      recapEn,
      recapAm,
      keyTakeaway,
      tags,
    } = req.body;

    if (!title?.trim() || !rawNotes?.trim()) {
      return res
        .status(400)
        .json({ message: "Title and raw notes are required" });
    }

    let finalRecap = { recapEn, recapAm, keyTakeaway, suggestedTags: tags };

    if (!recapEn) {
      try {
        finalRecap = await generateGoldenMondayRecap({
          title,
          date,
          organization,
          speaker,
          rawNotes,
        });
      } catch (aiError) {
        console.warn(
          "[goldenMondayController] AI recap failed on save, saving raw notes only:",
          aiError.message,
        );
      }
    }

    const session = await GoldenMondaySession.create({
      title: title.trim(),
      date: date || new Date(),
      organization: organization || "Addis MESOB",
      speaker: speaker || "Staff Member",
      rawNotes: rawNotes.trim(),
      recapEn: finalRecap.recapEn || "",
      recapAm: finalRecap.recapAm || "",
      keyTakeaway: finalRecap.keyTakeaway || "",
      tags: finalRecap.suggestedTags || tags || [],
      createdBy: req.user._id,
      createdByName: req.user.name,
    });

    res.status(201).json(session);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to save session", error: error.message });
  }
};

// ============================================================
// GET /api/golden-monday/suggest-topics
// AI-suggested topics for upcoming sessions, based on history.
// ============================================================
const suggestTopics = async (req, res) => {
  try {
    const recent = await GoldenMondaySession.find()
      .sort({ date: -1 })
      .limit(10)
      .select("title date recapEn keyTakeaway");

    const topics = await generateGoldenMondayTopics(recent);
    res.json({ topics, generatedAt: new Date().toISOString() });
  } catch (error) {
    handleAIError(res, error, "topic suggestions");
  }
};

module.exports = {
  getSessions,
  previewRecap,
  createSession,
  suggestTopics,
};
