// backend/src/services/goldenMondayService.js
// Complete service for Golden Monday management

const GoldenMondayPresenter = require("../models/GoldenMondayPresenter");
const GoldenMondaySession = require("../models/GoldenMondaySession");
const User = require("../models/User");
const { generatePresentationTopicIdeas } = require("./aiService");
const {
  uploadRecording,
  deleteRecording,
} = require("./goldenMondayRecordingService");
const { mondayOf, nextMondayFrom } = require("./goldenMondayRotationService");
const telegramService = require("./telegramService");

const W_RECENCY = 1;
const W_FREQUENCY = 30;
const W_SKIPPED = 15;
const NEVER_PRESENTED_DAYS = 100000;

// ============================================================
// EMPLOYEE REGISTRATION
// ============================================================

/**
 * Register an employee for Golden Monday rotation
 */
const registerEmployee = async (userId, registeredBy, options = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const existing = await GoldenMondayPresenter.findOne({ user: userId });
  if (existing) {
    throw new Error("Employee already registered");
  }

  const presenter = new GoldenMondayPresenter({
    user: userId,
    name: user.name,
    email: user.email,
    department: options.department || user.department || "",
    position: options.position || user.position || "",
    profilePhotoUrl: options.profilePhotoUrl || "",
    registeredBy: registeredBy,
    preferredTopics: options.preferredTopics || [],
  });

  await presenter.save();
  return presenter;
};

/**
 * Get all registered employees with their stats
 */
const getRegisteredEmployees = async (filters = {}) => {
  const query = {};

  if (filters.isEligible !== undefined) {
    query.isEligible = filters.isEligible;
  }
  if (filters.department) {
    query.department = filters.department;
  }
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: "i" } },
      { email: { $regex: filters.search, $options: "i" } },
    ];
  }

  const employees = await GoldenMondayPresenter.find(query)
    .populate("user", "name email role department")
    .sort({ lastPresentedAt: 1, joinedRotationAt: 1 });

  return employees;
};

/**
 * Update employee eligibility (toggle on/off)
 */
const updateEmployeeEligibility = async (
  userId,
  isEligible,
  onLeaveUntil = null,
) => {
  const presenter = await GoldenMondayPresenter.findOne({ user: userId });
  if (!presenter) {
    throw new Error("Employee not found in roster");
  }

  presenter.isEligible = isEligible;
  if (onLeaveUntil) {
    presenter.onLeaveUntil = new Date(onLeaveUntil);
  }
  await presenter.save();
  return presenter;
};

/**
 * Remove employee from rotation
 */
const removeEmployee = async (userId) => {
  const presenter = await GoldenMondayPresenter.findOneAndDelete({
    user: userId,
  });
  if (!presenter) {
    throw new Error("Employee not found in roster");
  }
  return presenter;
};

// ============================================================
// ROTATION ALGORITHM
// ============================================================

const scoreCandidate = (presenter, weekOf, rosterAvgPresented) => {
  const daysSinceLast = presenter.lastPresentedAt
    ? Math.floor(
        (weekOf.getTime() - new Date(presenter.lastPresentedAt).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : NEVER_PRESENTED_DAYS;

  const frequencyGap = rosterAvgPresented - (presenter.timesPresented || 0);

  const score =
    W_RECENCY * daysSinceLast +
    W_FREQUENCY * frequencyGap +
    W_SKIPPED * (presenter.timesSkipped || 0);

  return { presenter, score, daysSinceLast };
};

/**
 * Get the next presenter (highest score) with full details
 */
const getNextPresenter = async (weekOf = nextMondayFrom()) => {
  const roster = await GoldenMondayPresenter.find({
    isEligible: true,
    $or: [{ onLeaveUntil: null }, { onLeaveUntil: { $lte: new Date() } }],
  }).lean();

  if (roster.length === 0) {
    return null;
  }

  const totalPresented = roster.reduce(
    (sum, p) => sum + (p.timesPresented || 0),
    0,
  );
  const rosterAvgPresented = totalPresented / roster.length;

  const scored = roster
    .map((p) => scoreCandidate(p, weekOf, rosterAvgPresented))
    .sort((a, b) => b.score - a.score);

  return scored[0];
};

/**
 * Get full ranking list for display
 */
const getFullRanking = async (weekOf = nextMondayFrom(), limit = 10) => {
  const roster = await GoldenMondayPresenter.find({
    isEligible: true,
    $or: [{ onLeaveUntil: null }, { onLeaveUntil: { $lte: new Date() } }],
  }).lean();

  if (roster.length === 0) {
    return [];
  }

  const totalPresented = roster.reduce(
    (sum, p) => sum + (p.timesPresented || 0),
    0,
  );
  const rosterAvgPresented = totalPresented / roster.length;

  const scored = roster
    .map((p) => {
      const result = scoreCandidate(p, weekOf, rosterAvgPresented);
      return {
        userId: p.user,
        name: p.name,
        department: p.department,
        profilePhotoUrl: p.profilePhotoUrl || "",
        timesPresented: p.timesPresented,
        daysSinceLastPresented: result.daysSinceLast,
        score: result.score,
        isEligible: p.isEligible,
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
};

// ============================================================
// SESSION MANAGEMENT
// ============================================================

/**
 * Create or update a session with full details
 */
const upsertSession = async (sessionData, actorUser) => {
  const weekOf = mondayOf(sessionData.date || new Date());

  let session = await GoldenMondaySession.findOne({ weekOf });

  if (!session) {
    session = new GoldenMondaySession({
      weekOf,
      createdBy: actorUser._id,
      createdByName: actorUser.name,
    });
  }

  // Update basic info
  if (sessionData.title) session.title = sessionData.title;
  if (sessionData.organization) session.organization = sessionData.organization;
  if (sessionData.rawNotes) session.rawNotes = sessionData.rawNotes;
  if (sessionData.presentationDescription) {
    session.presentationDescription = sessionData.presentationDescription;
  }
  if (sessionData.presentationSlides) {
    session.presentationSlides = sessionData.presentationSlides;
  }
  if (sessionData.status) session.status = sessionData.status;

  session.updatedBy = actorUser._id;
  await session.save();

  return session;
};

/**
 * Assign a presenter to a session
 */
const assignPresenterToSession = async (weekOf, presenterUserId, actorUser) => {
  const session = await GoldenMondaySession.findOne({ weekOf });
  if (!session) {
    throw new Error("Session not found for this week");
  }

  if (session.presenter) {
    throw new Error("This week already has a presenter assigned");
  }

  const presenter = await GoldenMondayPresenter.findOne({
    user: presenterUserId,
  });
  if (!presenter || !presenter.isEligible) {
    throw new Error("Presenter not eligible or not found");
  }

  // Generate AI topic suggestions
  let suggestedTopics = [];
  let suggestedTopicsWithRationale = [];
  try {
    const recentTitles = await GoldenMondaySession.find({
      presentationTitle: { $ne: "" },
    })
      .sort({ date: -1 })
      .limit(10)
      .select("presentationTitle -_id")
      .lean();

    const topics = await generatePresentationTopicIdeas({
      presenterName: presenter.name,
      department: presenter.department,
      recentTitles: recentTitles.map((s) => s.presentationTitle),
    });

    suggestedTopics = topics.map((t) => t.title);
    suggestedTopicsWithRationale = topics;
  } catch (err) {
    console.warn("Topic suggestion failed:", err.message);
  }

  // Update session
  session.presenter = presenter.user;
  session.presenterName = presenter.name;
  session.presenterDepartment = presenter.department;
  session.presenterPhotoUrl = presenter.profilePhotoUrl || "";
  session.suggestedTopics = suggestedTopics;
  session.suggestedTopicsWithRationale = suggestedTopicsWithRationale;
  session.assignmentMethod = "auto-rotation";
  session.status = "scheduled";
  await session.save();

  // Update presenter stats
  await GoldenMondayPresenter.updateOne(
    { user: presenter.user },
    {
      $inc: { timesPresented: 1 },
      $set: { lastPresentedAt: weekOf },
    },
  );

  // Post to Telegram if configured
  await telegramService.postPresenterAnnouncement(session, presenter);

  return session;
};

/**
 * Get session by ID with full details
 */
const getSessionById = async (sessionId) => {
  const session = await GoldenMondaySession.findById(sessionId)
    .populate("presenter", "name email department profilePhotoUrl")
    .populate("attendees.user", "name email department")
    .populate("feedback.user", "name email department");

  if (!session) {
    throw new Error("Session not found");
  }
  return session;
};

/**
 * Get upcoming sessions
 */
const getUpcomingSessions = async (limit = 5) => {
  const sessions = await GoldenMondaySession.find({
    status: { $in: ["scheduled", "ongoing"] },
    date: { $gte: new Date() },
  })
    .sort({ date: 1 })
    .limit(limit)
    .populate("presenter", "name email department profilePhotoUrl");

  return sessions;
};

/**
 * Get past sessions
 */
const getPastSessions = async (limit = 20, page = 1) => {
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

  return {
    sessions,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Add photo to session
 */
const addSessionPhoto = async (sessionId, photoData, actorUser) => {
  const session = await GoldenMondaySession.findById(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  session.photos.push({
    url: photoData.url,
    publicId: photoData.publicId,
    caption: photoData.caption || "",
    uploadedBy: actorUser._id,
  });

  await session.save();
  return session;
};

/**
 * Add feedback to session
 */
const addSessionFeedback = async (sessionId, feedbackData) => {
  const session = await GoldenMondaySession.findById(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  session.feedback.push({
    user: feedbackData.userId,
    rating: feedbackData.rating,
    comment: feedbackData.comment || "",
  });

  // Recalculate average rating
  const ratings = session.feedback.map((f) => f.rating).filter((r) => r);
  if (ratings.length > 0) {
    session.averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  }

  await session.save();
  return session;
};

// ============================================================
// TELEGRAM INTEGRATION
// ============================================================

/**
 * Post presenter announcement to Telegram
 */
const postToTelegram = async (sessionId) => {
  const session = await GoldenMondaySession.findById(sessionId).populate(
    "presenter",
    "name email department profilePhotoUrl",
  );

  if (!session) {
    throw new Error("Session not found");
  }

  const result = await telegramService.postPresenterAnnouncement(session);

  session.telegramPostId = result.postId;
  session.telegramPostedAt = new Date();
  session.telegramMessageUrl = result.messageUrl;
  await session.save();

  return result;
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Employee registration
  registerEmployee,
  getRegisteredEmployees,
  updateEmployeeEligibility,
  removeEmployee,

  // Rotation
  getNextPresenter,
  getFullRanking,
  assignPresenterToSession,

  // Session management
  upsertSession,
  getSessionById,
  getUpcomingSessions,
  getPastSessions,
  addSessionPhoto,
  addSessionFeedback,

  // Telegram
  postToTelegram,
};
