// backend/src/controllers/goldenMondayController.js
// CRUD + AI + rotation + recording endpoints for the "Golden Monday" feature.

const GoldenMondaySession = require("../models/GoldenMondaySession");
const GoldenMondayPresenter = require("../models/GoldenMondayPresenter");
const User = require("../models/User");
const {
  generateGoldenMondayRecap,
  generateGoldenMondayTopics,
} = require("../services/aiService");
const rotation = require("../services/goldenMondayRotationService");
const recording = require("../services/goldenMondayRecordingService");

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

// Turns a thrown service error into the right HTTP status.
const handleServiceError = (res, error, fallbackMessage) => {
  const knownCodes = {
    NO_ELIGIBLE_PRESENTERS: 400,
    PRESENTER_NOT_ELIGIBLE: 400,
    NOT_FOUND: 404,
  };
  const status = knownCodes[error.code] || 500;
  res
    .status(status)
    .json({ message: error.message || fallbackMessage, code: error.code });
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

    // Hide expired recording URLs even if the sweep job hasn't run yet.
    const withLiveRecordings = sessions.map((s) => {
      const obj = s.toObject();
      if (!s.isRecordingLive()) obj.recordingUrl = "";
      return obj;
    });

    res.json(withLiveRecordings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load sessions", error: error.message });
  }
};

// ============================================================
// POST /api/golden-monday/recap
// Generate an AI recap preview WITHOUT saving.
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
// Save/update a session's recap notes (manual entry path, still
// supported alongside the rotation-driven flow below).
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

    const weekOf = rotation.mondayOf(date ? new Date(date) : new Date());

    const session = await GoldenMondaySession.findOneAndUpdate(
      { weekOf },
      {
        $set: {
          title: title.trim(),
          date: date || new Date(),
          weekOf,
          organization: organization || "Addis MESOB",
          speaker: speaker || "Staff Member",
          rawNotes: rawNotes.trim(),
          recapEn: finalRecap.recapEn || "",
          recapAm: finalRecap.recapAm || "",
          keyTakeaway: finalRecap.keyTakeaway || "",
          tags: finalRecap.suggestedTags || tags || [],
          status: "completed",
          createdBy: req.user._id,
          createdByName: req.user.name,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

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

// ============================================================
// ROSTER MANAGEMENT
// ============================================================

// GET /api/golden-monday/roster
const getRoster = async (req, res) => {
  try {
    const roster = await GoldenMondayPresenter.find().sort({ name: 1 });
    res.json(roster);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load roster", error: error.message });
  }
};

// POST /api/golden-monday/roster  { userId }
const addToRoster = async (req, res) => {
  try {
    const { userId, department } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = await GoldenMondayPresenter.findOne({ user: userId });
    if (existing) {
      return res
        .status(409)
        .json({ message: "User is already on the rotation roster" });
    }

    const entry = await GoldenMondayPresenter.create({
      user: user._id,
      name: user.name,
      department: department || "",
    });
    res.status(201).json(entry);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add to roster", error: error.message });
  }
};

// PUT /api/golden-monday/roster/:id  { isEligible, onLeaveUntil, department }
const updateRosterEntry = async (req, res) => {
  try {
    const { isEligible, onLeaveUntil, department } = req.body;
    const update = {};
    if (isEligible !== undefined) update.isEligible = isEligible;
    if (onLeaveUntil !== undefined) update.onLeaveUntil = onLeaveUntil;
    if (department !== undefined) update.department = department;

    const entry = await GoldenMondayPresenter.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true },
    );
    if (!entry)
      return res.status(404).json({ message: "Roster entry not found" });
    res.json(entry);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update roster entry", error: error.message });
  }
};

// DELETE /api/golden-monday/roster/:id
const removeFromRoster = async (req, res) => {
  try {
    const entry = await GoldenMondayPresenter.findByIdAndDelete(req.params.id);
    if (!entry)
      return res.status(404).json({ message: "Roster entry not found" });
    res.json({ message: "Removed from roster" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to remove from roster", error: error.message });
  }
};

// ============================================================
// ROTATION
// ============================================================

// GET /api/golden-monday/rotation/next-preview?weekOf=YYYY-MM-DD
// Shows the ranked candidate list WITHOUT assigning anything — lets
// admins see who is next and why before committing.
const previewRotation = async (req, res) => {
  try {
    const weekOf = req.query.weekOf
      ? rotation.mondayOf(new Date(req.query.weekOf))
      : rotation.nextMondayFrom();
    const { ranking, rosterAvgPresented } =
      await rotation.computeRanking(weekOf);

    res.json({
      weekOf,
      rosterAvgPresented,
      ranking: ranking.map((r, i) => ({
        rank: i + 1,
        userId: r.presenter.user,
        name: r.presenter.name,
        department: r.presenter.department,
        daysSinceLastPresented:
          r.daysSinceLast >= 100000 ? "never presented" : r.daysSinceLast,
        timesPresented: r.presenter.timesPresented,
        timesSkipped: r.presenter.timesSkipped,
        score: Math.round(r.score * 100) / 100,
      })),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to compute rotation preview",
      error: error.message,
    });
  }
};

// POST /api/golden-monday/rotation/assign  { weekOf?, manualPresenterId? }
const assignRotation = async (req, res) => {
  try {
    const { weekOf, manualPresenterId } = req.body;
    const result = await rotation.assignNextPresenter({
      weekOf: weekOf ? new Date(weekOf) : undefined,
      manualPresenterId: manualPresenterId || null,
      actorUser: req.user,
    });
    res.status(result.alreadyAssigned ? 200 : 201).json(result);
  } catch (error) {
    handleServiceError(res, error, "Failed to assign presenter");
  }
};

// POST /api/golden-monday/rotation/:sessionId/reassign  { reason }
const reassignRotation = async (req, res) => {
  try {
    const result = await rotation.reassignPresenter({
      sessionId: req.params.sessionId,
      actorUser: req.user,
      reason: req.body.reason,
    });
    res.json(result);
  } catch (error) {
    handleServiceError(res, error, "Failed to reassign presenter");
  }
};

// PUT /api/golden-monday/:sessionId/title  { title }
// The assigned presenter (or an admin) locks in their chosen title.
const setPresentationTitle = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const session = await GoldenMondaySession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const isOwner = session.presenter?.toString() === req.user._id.toString();
    const isPrivileged = ["leader", "admin", "superadmin"].includes(
      req.user.role,
    );
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        message:
          "Only the assigned presenter or a leader/admin can set the title",
      });
    }

    const updated = await rotation.confirmPresentationTitle(
      req.params.sessionId,
      title,
    );
    res.json(updated);
  } catch (error) {
    handleServiceError(res, error, "Failed to set presentation title");
  }
};

// ============================================================
// RECORDINGS
// ============================================================

// POST /api/golden-monday/:sessionId/recording  { file (base64 video), visibleDays? }
const uploadSessionRecording = async (req, res) => {
  try {
    const { file, visibleDays } = req.body;
    if (!file)
      return res.status(400).json({ message: "Video file is required" });

    const session = await GoldenMondaySession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const result = await recording.uploadRecording(file, {
      sessionId: session._id,
      visibleDays,
    });

    Object.assign(session, result);
    session.status = "completed";
    await session.save();

    res.status(201).json(session);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to upload recording", error: error.message });
  }
};

// DELETE /api/golden-monday/:sessionId/recording
const removeSessionRecording = async (req, res) => {
  try {
    const session = await GoldenMondaySession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    await recording.deleteRecording(session.recordingPublicId);
    session.recordingUrl = "";
    session.recordingPublicId = "";
    session.recordingDeleted = true;
    await session.save();

    res.json({ message: "Recording removed" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to remove recording", error: error.message });
  }
};

// GET /api/golden-monday/recordings/live
// Only recordings still within their visibility window — this is the
// "posted for some days of the week" catch-up list.
const getLiveRecordings = async (req, res) => {
  try {
    const sessions = await GoldenMondaySession.find({
      recordingUrl: { $ne: "" },
      recordingDeleted: false,
      recordingExpiresAt: { $gt: new Date() },
    }).sort({ recordingUploadedAt: -1 });

    res.json(sessions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load recordings", error: error.message });
  }
};

module.exports = {
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
};
