// backend/src/controllers/goldenMondayController.js
// CRUD + AI + rotation + recording endpoints for the "Golden Monday" feature.

const GoldenMondaySession = require("../models/GoldenMondaySession");
const GoldenMondayPresenter = require("../models/GoldenMondayPresenter");
const GoldenMondayGallery = require("../models/GoldenMondayGallery");
const User = require("../models/User");
const {
  generateGoldenMondayRecap,
  generateGoldenMondayTopics,
  analyzeDocumentImage,
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

// Only admin/superadmin may read or write salary. Called before
// returning roster data and before applying updates.
const canSeeSalary = (user) =>
  user && ["admin", "superadmin"].includes(user.role);

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
// Salary is select:false at the schema level, so it's excluded by
// default. Only pull it in explicitly for admin/superadmin callers.
const getRoster = async (req, res) => {
  try {
    let query = GoldenMondayPresenter.find().sort({ name: 1 });
    if (canSeeSalary(req.user)) {
      query = query.select("+salary");
    }
    const roster = await query;
    res.json(roster);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load roster", error: error.message });
  }
};

// POST /api/golden-monday/roster
// { userId, department, position, profilePhotoUrl, phone, hireDate,
//   skills, notes, emergencyContact, address, salary? }
const addToRoster = async (req, res) => {
  try {
    const {
      userId,
      department,
      position,
      profilePhotoUrl,
      phone,
      hireDate,
      skills,
      notes,
      emergencyContact,
      address,
      salary,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = await GoldenMondayPresenter.findOne({ user: userId });
    if (existing) {
      return res
        .status(409)
        .json({ message: "User is already on the rotation roster" });
    }

    const doc = {
      user: user._id,
      name: user.name,
      email: user.email,
      department: department || "",
      position: position || "",
      profilePhotoUrl: profilePhotoUrl || "",
      phone: phone || "",
      hireDate: hireDate || null,
      skills: Array.isArray(skills) ? skills : [],
      notes: notes || "",
      emergencyContact: emergencyContact || "",
      address: address || "",
      registeredBy: req.user._id,
    };

    // Only admin/superadmin can set salary at creation time.
    if (canSeeSalary(req.user) && salary !== undefined && salary !== "") {
      doc.salary = Number(salary);
    }

    let entry = await GoldenMondayPresenter.create(doc);

    // Re-fetch with salary included if the caller is allowed to see it,
    // since select:false hides it on the object returned by .create().
    if (canSeeSalary(req.user)) {
      entry = await GoldenMondayPresenter.findById(entry._id).select("+salary");
    }

    res.status(201).json(entry);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add to roster", error: error.message });
  }
};

// PUT /api/golden-monday/roster/:id
// { isEligible, onLeaveUntil, department, position, profilePhotoUrl,
//   phone, hireDate, skills, notes, emergencyContact, address, salary? }
const updateRosterEntry = async (req, res) => {
  try {
    const {
      name, // ✅ ADD THIS
      email, // ✅ ADD THIS
      isEligible,
      onLeaveUntil,
      department,
      position,
      profilePhotoUrl,
      phone,
      hireDate,
      skills,
      notes,
      emergencyContact,
      address,
      salary,
    } = req.body;

    const update = {};
    if (name !== undefined && name.trim()) update.name = name.trim(); // ✅ ADD THIS
    if (email !== undefined && email.trim()) update.email = email.trim(); // ✅ ADD THIS
    if (isEligible !== undefined) update.isEligible = isEligible;
    if (onLeaveUntil !== undefined) update.onLeaveUntil = onLeaveUntil;
    if (department !== undefined) update.department = department;
    if (position !== undefined) update.position = position;
    if (profilePhotoUrl !== undefined) update.profilePhotoUrl = profilePhotoUrl;
    if (phone !== undefined) update.phone = phone;
    if (hireDate !== undefined) update.hireDate = hireDate || null;
    if (skills !== undefined)
      update.skills = Array.isArray(skills) ? skills : [];
    if (notes !== undefined) update.notes = notes;
    if (emergencyContact !== undefined)
      update.emergencyContact = emergencyContact;
    if (address !== undefined) update.address = address;

    if (salary !== undefined && canSeeSalary(req.user)) {
      update.salary = salary === "" ? null : Number(salary);
    }

    let query = GoldenMondayPresenter.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (canSeeSalary(req.user)) {
      query = query.select("+salary");
    }
    const entry = await query;

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

// ============================================================
// 🖼️ AI GALLERY PHOTO CATEGORIZATION - ENHANCED VERSION
// ============================================================

/**
 * AI-powered photo categorization for Golden Monday gallery
 * Uses the existing analyzeDocumentImage AI service with enhanced keyword matching
 */
const analyzeAndCategorizePhoto = async (req, res) => {
  try {
    const { image, sessionId } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    // Extract base64 data
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeType = image.includes("data:")
      ? image.match(/data:([^;]+)/)?.[1] || "image/jpeg"
      : "image/jpeg";

    // Use the existing AI service for vision analysis
    const analysis = await analyzeDocumentImage(base64Data, mimeType);

    // ─── ENHANCED CATEGORY DETECTION ──────────────────────────
    let detectedCategory = "other";
    let confidence = 0.5;
    let matchedKeywords = [];
    let suggestedCategories = [];

    // Build a rich text context from all analysis fields
    const fullText = [
      analysis.title || "",
      analysis.notes || "",
      analysis.citizenName || "",
      analysis.citizenNameAmharic || "",
      analysis.issuingDepartment || "",
      (analysis.tags || []).join(" "),
      analysis.documentType || "",
    ]
      .join(" ")
      .toLowerCase();

    // Also check individual fields for better detection
    const title = (analysis.title || "").toLowerCase();
    const notes = (analysis.notes || "").toLowerCase();
    const department = (analysis.issuingDepartment || "").toLowerCase();
    const docType = (analysis.documentType || "").toLowerCase();

    // ─── FLAG RAISING DETECTION ──────────────────────────────
    const flagKeywords = [
      "flag",
      "ባንዲራ",
      "ethiopian flag",
      "ኢትዮጵያ ባንዲራ",
      "flag raising",
      "ባንዲራ ማንሳት",
      "national flag",
      "ብሔራዊ ባንዲራ",
      "flag ceremony",
      "ባንዲራ ሥነ ሥርዓት",
      "flagpole",
      "ባንዲራ ምሰሶ",
      "flags",
      "ባንዲራዎች",
      "ethiopian national flag",
      "የኢትዮጵያ ብሔራዊ ባንዲራ",
      "flag raising ceremony",
      "ባንዲራ ማንሳት ሥነ ሥርዓት",
      "green yellow red",
      "ቢጫ ቀይ አረንጓዴ",
      "flag bearer",
      "ባንዲራ ተሸካሚ",
    ];

    for (const keyword of flagKeywords) {
      if (
        fullText.includes(keyword) ||
        title.includes(keyword) ||
        notes.includes(keyword)
      ) {
        matchedKeywords.push(keyword);
        detectedCategory = "flag-raising";
        confidence = Math.max(confidence, 0.85);
        break;
      }
    }

    // ─── PRESENTATION DETECTION ───────────────────────────────
    if (detectedCategory === "other") {
      const presentationKeywords = [
        "presentation",
        "ዝግጅት",
        "presenter",
        "አቅራቢ",
        "slide",
        "ስላይድ",
        "powerpoint",
        "power point",
        "ppt",
        "speaker",
        "ተናጋሪ",
        "presenting",
        "በማቅረብ",
        "presented",
        "አቅርቧል",
        "keynote",
        "lecture",
        "ትምህርት",
        "speaking",
        "ማውራት",
        "talk",
        "ንግግር",
        "presentation skills",
        "public speaking",
        "ህዝባዊ ንግግር",
        "presentation material",
        "የዝግጅት ቁሳቁስ",
        "presenter on stage",
        "መድረክ ላይ አቅራቢ",
        "presentation screen",
        "የዝግጅት ማያ",
        "presenting",
        "በማቅረብ ላይ",
        "presentation slides",
        "የዝግጅት ስላይዶች",
      ];

      for (const keyword of presentationKeywords) {
        if (
          fullText.includes(keyword) ||
          title.includes(keyword) ||
          notes.includes(keyword)
        ) {
          matchedKeywords.push(keyword);
          detectedCategory = "presentation";
          confidence = Math.max(confidence, 0.82);
          break;
        }
      }
    }

    // ─── GROUP PHOTO DETECTION ────────────────────────────────
    if (detectedCategory === "other") {
      const groupKeywords = [
        "group",
        "ቡድን",
        "team",
        "ቡድን",
        "group photo",
        "የቡድን ፎቶ",
        "group picture",
        "የቡድን ምስል",
        "staff photo",
        "የሰራተኛ ፎቶ",
        "team photo",
        "የቡድን ፎቶ",
        "group of people",
        "የሰዎች ቡድን",
        "group shot",
        "የቡድን ምስል",
        "together",
        "አብረው",
        "group portrait",
        "የቡድን ሥዕል",
        "multiple people",
        "ብዙ ሰዎች",
        "crowd",
        "ህዝብ",
        "gathering",
        "መሰብሰብ",
        "team building",
        "ቡድን መገንባት",
        "group of employees",
        "የሰራተኞች ቡድን",
        "staff group",
        "የሰራተኛ ቡድን",
      ];

      for (const keyword of groupKeywords) {
        if (
          fullText.includes(keyword) ||
          title.includes(keyword) ||
          notes.includes(keyword)
        ) {
          matchedKeywords.push(keyword);
          detectedCategory = "group-photo";
          confidence = Math.max(confidence, 0.8);
          break;
        }
      }
    }

    // ─── ATTENDEES DETECTION ──────────────────────────────────
    if (detectedCategory === "other") {
      const attendeeKeywords = [
        "attendee",
        "ተሳታፊ",
        "audience",
        "ተመልካች",
        "participant",
        "ተሳታፊ",
        "attendees",
        "ተሳታፊዎች",
        "people",
        "ሰዎች",
        "crowd",
        "ህዝብ",
        "auditorium",
        "አዳራሽ",
        "seated",
        "ተቀምጧል",
        "viewers",
        "ተመልካቾች",
        "spectators",
        "ተመልካቾች",
        "listeners",
        "አድማጮች",
        "attendance",
        "መገኘት",
        "participating",
        "በመሳተፍ",
        "people sitting",
        "የተቀመጡ ሰዎች",
        "people watching",
        "የሚመለከቱ ሰዎች",
        "audience seating",
        "የተመልካች መቀመጫ",
        "filled seats",
        "የተሞሉ መቀመጫዎች",
        "people in audience",
        "በተመልካች ውስጥ ያሉ ሰዎች",
      ];

      for (const keyword of attendeeKeywords) {
        if (
          fullText.includes(keyword) ||
          title.includes(keyword) ||
          notes.includes(keyword)
        ) {
          matchedKeywords.push(keyword);
          detectedCategory = "attendees";
          confidence = Math.max(confidence, 0.78);
          break;
        }
      }
    }

    // ─── EVENT DETECTION ──────────────────────────────────────
    if (detectedCategory === "other") {
      const eventKeywords = [
        "event",
        "ዝግጅት",
        "ceremony",
        "ሥነ ሥርዓት",
        "celebration",
        "ክብረ በዓል",
        "award",
        "ሽልማት",
        "gathering",
        "መሰብሰብ",
        "festival",
        "በዓል",
        "conference",
        "ጉባኤ",
        "seminar",
        "ሴሚናር",
        "workshop",
        "ዎርክሾፕ",
        "meeting",
        "ስብሰባ",
        "summit",
        "ስብሰባ",
        "forum",
        "መድረክ",
        "symposium",
        "ሲምፖዚየም",
        "expo",
        "ኤክስፖ",
        "exhibition",
        "ኤክስቢሽን",
        "graduation",
        "ምረቃ",
        "opening ceremony",
        "የመክፈቻ ሥነ ሥርዓት",
        "closing ceremony",
        "የመዝጊያ ሥነ ሥርዓት",
        "special event",
        "ልዩ ዝግጅት",
        "official event",
        "ኦፊሴላዊ ዝግጅት",
        "ceremonial",
        "ሥነ ሥርዓታዊ",
        "event hall",
        "የዝግጅት አዳራሽ",
        "event venue",
        "የዝግጅት ቦታ",
      ];

      for (const keyword of eventKeywords) {
        if (
          fullText.includes(keyword) ||
          title.includes(keyword) ||
          notes.includes(keyword)
        ) {
          matchedKeywords.push(keyword);
          detectedCategory = "event";
          confidence = Math.max(confidence, 0.82);
          break;
        }
      }
    }

    // ─── USE DOCUMENT TYPE MAPPING ────────────────────────────
    if (detectedCategory === "other" && analysis.documentType) {
      const categoryMap = {
        birth_certificate: "event",
        death_certificate: "event",
        marriage_certificate: "event",
        divorce_certificate: "event",
        residence_id: "attendees",
        name_change: "attendees",
        presentation: "presentation",
        group_photo: "group-photo",
        flag_raising: "flag-raising",
        attendees: "attendees",
        event: "event",
        certificate: "event",
        id_card: "attendees",
        license: "attendees",
      };

      if (categoryMap[analysis.documentType]) {
        detectedCategory = categoryMap[analysis.documentType];
        confidence = analysis.confidence === "high" ? 0.85 : 0.6;
        matchedKeywords.push(`document_type: ${analysis.documentType}`);
      }
    }

    // ─── CONFIDENCE ADJUSTMENT BASED ON ANALYSIS ──────────────
    if (analysis.confidence === "high") {
      confidence = Math.max(confidence, 0.8);
    } else if (analysis.confidence === "medium") {
      confidence = Math.max(confidence, 0.65);
    }

    // If we detected something but confidence is still low, boost it
    if (detectedCategory !== "other" && confidence < 0.6) {
      confidence = 0.7;
    }

    // ─── SUGGESTED CATEGORIES ─────────────────────────────────
    if (detectedCategory !== "other") {
      const categoryRelations = {
        "flag-raising": ["event", "attendees", "group-photo"],
        presentation: ["attendees", "event", "group-photo"],
        "group-photo": ["attendees", "event", "presentation"],
        attendees: ["event", "presentation", "group-photo"],
        event: ["attendees", "presentation", "group-photo"],
      };
      suggestedCategories = categoryRelations[detectedCategory] || ["other"];
    } else {
      suggestedCategories = [
        "event",
        "attendees",
        "presentation",
        "group-photo",
        "flag-raising",
      ];
    }

    // Log the categorization result for debugging
    console.log(
      `[AI Gallery] Category: ${detectedCategory} (${Math.round(confidence * 100)}%) - Matched: ${matchedKeywords.join(", ") || "none"}`,
    );

    res.json({
      category: detectedCategory,
      confidence: Math.round(confidence * 100) / 100,
      matchedKeywords: matchedKeywords.slice(0, 5),
      suggestedCategories: suggestedCategories.slice(0, 3),
      analysis: {
        title: analysis.title || "",
        notes: analysis.notes || "",
        documentType: analysis.documentType || "other",
        citizenName: analysis.citizenName || "",
        tags: analysis.tags || [],
        issuingDepartment: analysis.issuingDepartment || "",
        nationalId: analysis.nationalId || "",
      },
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    res.json({
      category: "other",
      confidence: 0.3,
      matchedKeywords: [],
      suggestedCategories: [
        "event",
        "presentation",
        "group-photo",
        "attendees",
        "flag-raising",
      ],
      analysis: {
        notes: "AI analysis unavailable. Please select a category manually.",
        documentType: "other",
      },
    });
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
  analyzeAndCategorizePhoto,
};
