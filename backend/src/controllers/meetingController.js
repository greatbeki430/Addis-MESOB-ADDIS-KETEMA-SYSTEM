// backend/src/controllers/meetingController.js
const Meeting = require("../models/Meeting");
const ExtensionRequest = require("../models/ExtensionRequest");
const User = require("../models/User");

// ─── Helper: Clean string array ────────────────────────────
const cleanStringArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item) => item && item.trim && item.trim() !== "");
};

// ─── Helper: Check if user is admin ────────────────────────
const isAdmin = (user) => {
  return user && ["admin", "superadmin"].includes(user.role);
};

// ─── Helper: Ownership and same-team checks ─────────────────
// Shared by updateMeeting and deleteMeeting so the permission
// rules stay visibly identical in both places. If one is ever
// changed, the other should be changed too, and having the check
// in one function makes that visible at a glance.
// Non-admins may only file reports for their OWN team.
const violatesTeamScope = (user, teamId) => {
  if (isAdmin(user)) return false;
  if (!teamId) return false;
  return !user.team || user.team.toString() !== teamId.toString();
};

const ownerAndTeamCheck = (meeting, user) => {
  const isOwner = meeting.createdBy
    ? meeting.createdBy.toString() === user._id.toString()
    : false;

  const sameTeam =
    meeting.team && user.team
      ? meeting.team.toString() === user.team.toString()
      : false;

  return { isOwner, sameTeam };
};

// ─── Client-controlled status whitelist (B4) ───────────────
// Clients may only send these two. "locked"/"expired"/"auto_saved"
// are server-controlled. Anything else is rejected.
const CLIENT_STATUSES = new Set(["in_progress", "completed"]);
const validateClientStatus = (status) => {
  if (status === undefined) return null;
  if (!CLIENT_STATUSES.has(status)) {
    return `Invalid status "${status}". Allowed: in_progress, completed.`;
  }
  return null;
};

// ─── PATCH 1: Sanitizers for the structured attendance / signature ─────
// These match the shape produced by
// frontend/src/utils/forumReportHelpers.js
// (deriveAttendance / alignSignatures). Unknown / malformed entries are
// dropped so a hostile or buggy client cannot poison the array.
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const MAX_SIGNATURE_CHARS = 700 * 1024; // ~500 KB of image per signature

const cleanAttendance = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((a) => a && typeof a.name === "string" && a.name.trim())
    .map((a) => {
      const status = a.status === "absent" ? "absent" : "present";
      return {
        member: OBJECT_ID.test(a.member || "") ? a.member : null,
        name: a.name.trim(),
        role: a.role === "leader" ? "leader" : "member",
        source: a.source === "synced" ? "synced" : "manual",
        status,
        reason:
          status === "absent" && typeof a.reason === "string"
            ? a.reason.trim()
            : "",
      };
    });
};

const cleanSignatureData = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(
      (s) =>
        s &&
        typeof s.name === "string" &&
        s.name.trim() &&
        typeof s.image === "string" &&
        s.image.startsWith("data:image/") &&
        s.image.length <= MAX_SIGNATURE_CHARS,
    )
    .map((s) => ({
      key: typeof s.key === "string" ? s.key.slice(0, 200) : "",
      member: OBJECT_ID.test(s.member || "") ? s.member : null,
      name: s.name.trim(),
      role: s.role === "leader" ? "leader" : "member",
      image: s.image,
    }));
};
// ── end PATCH 1

// ─── Content field whitelist (B1) ──────────────────────────
// Only these keys may ever be written from a client-supplied body.
// Everything else (team, createdBy, createdByName, status, isLocked,
// extensionApproved, extensionExpiresAt, isResumed, resumedAt,
// progressData, adminNotes, autoSaveCount, lastAutoSave, isAutoSave)
// is server-owned. "status" is handled separately via B4 whitelist.
//
// ── PATCH 4a: three new fields appended so autoSaveMeeting can
//    persist them via cleanContentForWrite. ──
const CONTENT_FIELDS = [
  "date",
  "timeStart",
  "timeEnd",
  "present",
  "absent",
  "prevResults",
  "topics",
  "explanation",
  "gaps",
  "agreements",
  "signatures",
  "teamName",
  "aiGeneratedContent",
  "attendanceMode", // PATCH 4a
  "attendance", // PATCH 4a
  "signatureData", // PATCH 4a
];
const pickContentFields = (body = {}) => {
  const out = {};
  for (const k of CONTENT_FIELDS) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  // date conversion is done by callers, not here
  return out;
};

// ─── Extension window enforcement (B6) ─────────────────────
// A non-admin may not edit a report whose approved extension has
// already elapsed. Admins bypass this (they can always override).
const isPastExtension = (meeting) =>
  !!(
    meeting.extensionApproved &&
    meeting.extensionExpiresAt &&
    new Date(meeting.extensionExpiresAt).getTime() < Date.now()
  );

const isCompletedOrLocked = (meeting) =>
  meeting.status === "completed" ||
  meeting.status === "locked" ||
  meeting.isLocked === true;

// ─── Content cleaning helper (used by create, autosave, update) ───
// Consolidates the cleaning logic that used to be duplicated.
const cleanContentForWrite = (raw) => {
  const out = { ...raw };
  if (out.date) out.date = new Date(out.date);
  if (out.present !== undefined) {
    out.present = Array.isArray(out.present)
      ? out.present.filter((p) => typeof p === "string" && p.trim() !== "")
      : [];
  }
  if (out.absent !== undefined) {
    out.absent = Array.isArray(out.absent)
      ? out.absent
          .filter((a) => a && a.name && String(a.name).trim())
          .map((a) => ({
            name: String(a.name).trim(),
            reason: String(a.reason || "").trim(),
          }))
      : [];
  }
  for (const field of [
    "prevResults",
    "topics",
    "gaps",
    "agreements",
    "signatures",
  ]) {
    if (out[field] !== undefined) out[field] = cleanStringArray(out[field]);
  }

  // ── PATCH 4b: sanitize the three new structured fields here so
  //    both autoSaveMeeting and updateMeeting pick them up
  //    automatically. Sanitizers are idempotent, so also applying
  //    them inline in createMeeting / updateMeeting is harmless. ──
  if (out.attendanceMode !== undefined) {
    out.attendanceMode = out.attendanceMode === "sync" ? "sync" : "manual";
  }
  if (out.attendance !== undefined) {
    out.attendance = cleanAttendance(out.attendance);
  }
  if (out.signatureData !== undefined) {
    out.signatureData = cleanSignatureData(out.signatureData);
  }
  // ── end PATCH 4b

  return out;
};

// ─── Empty-report guard ─────────────────────────────────────
// A report counts as "empty" when it has no topic, previous result,
// explanation, gap or agreement. Attendance alone does not count,
// because the synced roster defaults everyone to Present.
const hasReportContent = (r = {}) => {
  const hasText = (a) =>
    Array.isArray(a) && a.some((x) => typeof x === "string" && x.trim());
  return (
    hasText(r.topics) ||
    hasText(r.prevResults) ||
    hasText(r.gaps) ||
    hasText(r.agreements) ||
    (typeof r.explanation === "string" && r.explanation.trim().length > 0)
  );
};

const EMPTY_REPORT_RESPONSE = {
  message:
    "Cannot submit an empty report. Fill in at least one topic, explanation, gap, or agreement.",
  code: "EMPTY_REPORT",
};

// ─── Create Meeting ─────────────────────────────────────────
const createMeeting = async (req, res) => {
  try {
    const {
      date,
      teamId,
      teamName,
      status = "in_progress",
      meetingDuration = 30,
    } = req.body;

    // B4: reject anything outside the client whitelist
    const statusError = validateClientStatus(status);
    if (statusError) {
      return res.status(400).json({
        message: statusError,
        code: "INVALID_STATUS",
      });
    }

    if (!date) {
      return res
        .status(400)
        .json({ message: "Date is required", code: "DATE_REQUIRED" });
    }

    let teamObjectId = null;
    if (teamId) {
      teamObjectId = teamId;
    } else if (req.body.team) {
      teamObjectId = req.body.team;
    }

    if (violatesTeamScope(req.user, teamObjectId)) {
      return res.status(403).json({
        message: "You can only file reports for your own team",
        code: "WRONG_TEAM",
      });
    }

    // B1: whitelist then clean
    const content = cleanContentForWrite(pickContentFields(req.body));

    // Reject empty submissions
    if (status === "completed" && !hasReportContent(content)) {
      return res.status(400).json(EMPTY_REPORT_RESPONSE);
    }

    // ── PATCH 2: createMeeting builds meetingData inline (does not
    //    use cleanContentForWrite alone), so explicitly carry over
    //    the three structured fields from the whitelisted `content`. ──
    const meetingData = {
      ...content,
      date: new Date(date),
      team: teamObjectId,
      teamName: teamName || "Unknown Team",
      createdBy: req.user._id,
      createdByName: req.user.name || "Unknown User",
      status, // already validated as in_progress | completed
      meetingDuration: meetingDuration || 30,
      attendanceMode:
        req.body.attendanceMode === "sync"
          ? "sync"
          : content.attendanceMode || "manual",
      attendance:
        req.body.attendance !== undefined
          ? cleanAttendance(req.body.attendance)
          : content.attendance || [],
      signatureData:
        req.body.signatureData !== undefined
          ? cleanSignatureData(req.body.signatureData)
          : content.signatureData || [],
    };
    // ── end PATCH 2

    // A1 + B2: stamp completedAt/finalizedAt when completing
    if (status === "completed") {
      const now = new Date();
      meetingData.completedAt = now;
      meetingData.finalizedAt = now;
    }

    // ── PATCH 2b: when the client finalizes on timer expiry, it also
    //    sends timeExpired / isLocked / lockedAt / lockedReason and
    //    the finalizedAt stamp. Persist those so admin "expired"
    //    filters keep working even when this path is a CREATE
    //    (no prior draft existed). Validate defensively — client
    //    cannot set these arbitrarily except when status is
    //    completed, which is already whitelisted. ──
    if (status === "completed") {
      const now = new Date();
      if (req.body.timeExpired === true) {
        meetingData.timeExpired = true;
        meetingData.timeExpiredAt = req.body.timeExpiredAt
          ? new Date(req.body.timeExpiredAt)
          : now;
      }
      if (req.body.isLocked === true) {
        meetingData.isLocked = true;
        meetingData.lockedAt = req.body.lockedAt
          ? new Date(req.body.lockedAt)
          : now;
        if (typeof req.body.lockedReason === "string") {
          meetingData.lockedReason = req.body.lockedReason.slice(0, 500);
        }
      }
      if (req.body.finalizedAt) {
        const fa = new Date(req.body.finalizedAt);
        if (!Number.isNaN(fa.getTime())) meetingData.finalizedAt = fa;
      }
    }
    // ── end PATCH 2b

    const meeting = await Meeting.create(meetingData);

    res.status(201).json({
      message: "✅ Meeting report saved successfully!",
      meeting,
    });
  } catch (error) {
    console.error("❌ Meeting creation error:", error.message);
    res.status(500).json({
      message: "Failed to create meeting",
      code: "MEETING_CREATE_FAILED",
    });
  }
};

// ─── Auto-Save Meeting ──────────────────────────────────────
const autoSaveMeeting = async (req, res) => {
  try {
    const { meetingId } = req.body;

    // B1: whitelist the content fields before touching anything.
    // PATCH 4a + 4b make this include the three structured fields.
    const content = cleanContentForWrite(pickContentFields(req.body));
    const now = new Date();

    let meeting;

    if (meetingId) {
      meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        return res
          .status(404)
          .json({ message: "Meeting not found", code: "MEETING_NOT_FOUND" });
      }

      // Ownership check (unchanged from original — owner or admin only)
      const isOwner =
        meeting.createdBy &&
        meeting.createdBy.toString() === req.user._id.toString();
      if (!isOwner && !isAdmin(req.user)) {
        return res
          .status(403)
          .json({ message: "Not authorized", code: "NOT_OWNER" });
      }

      // B1: validate team scope on the update path
      if (violatesTeamScope(req.user, meeting.team)) {
        return res.status(403).json({
          message: "You can only edit reports for your own team",
          code: "WRONG_TEAM",
        });
      }

      // B3: never downgrade a completed / locked report
      if (isCompletedOrLocked(meeting)) {
        return res.status(409).json({
          message:
            "This report is completed or locked; autosave is not allowed.",
          code: "AUTOSAVE_LOCKED",
        });
      }

      // B3: refuse autosave after an expired, unapproved timer
      if (meeting.timeExpired && !meeting.extensionApproved) {
        return res.status(409).json({
          message:
            "This report has expired; request an extension before continuing.",
          code: "AUTOSAVE_EXPIRED",
        });
      }

      // B6: refuse autosave after a passed approved-extension window
      if (isPastExtension(meeting)) {
        return res.status(409).json({
          message: "Your extension window has elapsed.",
          code: "EXTENSION_EXPIRED",
        });
      }

      // Apply the whitelisted content
      Object.assign(meeting, content);
      meeting.isAutoSave = true;
      meeting.lastAutoSave = now;
      meeting.autoSaveCount = (meeting.autoSaveCount || 0) + 1;
      // Only downgrade in_progress → auto_saved, never touch completed/locked
      if (meeting.status === "in_progress") {
        meeting.status = "auto_saved";
      }

      // ── PATCH 5: progress snapshot must include the structured
      //    fields so resumeMeeting can fully restore them. ──
      meeting.progressData = {
        date: meeting.date,
        timeStart: meeting.timeStart,
        timeEnd: meeting.timeEnd,
        present: meeting.present,
        absent: meeting.absent,
        prevResults: meeting.prevResults,
        topics: meeting.topics,
        explanation: meeting.explanation,
        gaps: meeting.gaps,
        agreements: meeting.agreements,
        signatures: meeting.signatures,
        attendanceMode: meeting.attendanceMode, // PATCH 5
        attendance: meeting.attendance, // PATCH 5
        signatureData: meeting.signatureData, // PATCH 5
      };
      // ── end PATCH 5

      await meeting.save();
    } else {
      // Do not create blank drafts (e.g. from the pagehide flush)
      if (!hasReportContent(content)) {
        return res.json({ success: true, skipped: true, meeting: null });
      }

      // Create new draft
      const teamObjectId = req.body.teamId || req.body.team || null;
      if (violatesTeamScope(req.user, teamObjectId)) {
        return res.status(403).json({
          message: "You can only file reports for your own team",
          code: "WRONG_TEAM",
        });
      }

      meeting = await Meeting.create({
        ...content,
        date: content.date || now,
        team: teamObjectId,
        teamName: req.body.teamName || "Unknown Team",
        createdBy: req.user._id,
        createdByName: req.user.name || "Unknown User",
        status: "auto_saved",
        isAutoSave: true,
        lastAutoSave: now,
        autoSaveCount: 1,
      });
    }

    res.json({
      success: true,
      message: "✅ Auto-saved successfully",
      meeting,
    });
  } catch (error) {
    console.error("❌ Auto-save error:", error.message);
    res.status(500).json({
      message: "Auto-save failed",
      code: "AUTOSAVE_FAILED",
    });
  }
};

// ─── Get Meetings ───────────────────────────────────────────
//
// Returns the list of meeting reports visible to the caller.
//
// Visibility rule, matching the History tab's permission model:
//   • Admin/superadmin → everything, no clamp
//   • Team leader      → every report on their own team, plus their
//                        own reports from any team
//   • Everyone else    → their own reports only
//
// Query params:
//   • :teamId (route), teamId or team (query) → narrow to a single team
//   • status           → exact status, or "draft" for the umbrella
//                        over the two not-yet-final statuses
//   • submitted=true   → only completed (submitted) reports
//   • mine=true        → only reports the caller created
//   • isLocked         → "true" / "false"
const getMeetings = async (req, res) => {
  try {
    const { teamId, team, status, isLocked, mine, submitted } = req.query;

    const filter = {};

    // ── Team filter (narrowing) ─────────────────────────────
    // Also honour GET /meetings/team/:teamId (param was ignored before).
    const requestedTeamId = req.params.teamId || teamId || team;
    if (requestedTeamId) {
      filter.team = requestedTeamId;
    }

    // ── Status filter ───────────────────────────────────────
    if (submitted === "true") {
      filter.status = "completed";
    } else if (status && status !== "all") {
      if (status === "draft") {
        // "Draft" is a UI-level umbrella over the two not-yet-final
        // statuses. The model keeps them apart because the timer
        // promotes in_progress → auto_saved automatically.
        filter.status = { $in: ["in_progress", "auto_saved"] };
      } else {
        filter.status = status;
      }
    }

    // ── Only my own reports ─────────────────────────────────
    if (mine === "true") {
      filter.createdBy = req.user._id;
    }

    // ── Locked filter ───────────────────────────────────────
    if (isLocked !== undefined) {
      filter.isLocked = isLocked === "true";
    }

    // ── Visibility clamp ────────────────────────────────────
    const isAdminUser = isAdmin(req.user);
    const isLeaderUser = req.user.role === "leader";
    const userTeamId = req.user.team ? req.user.team.toString() : null;

    if (!isAdminUser) {
      if (isLeaderUser && userTeamId) {
        // A leader sees everything on their own team, plus any report
        // they personally authored on any other team (edge case —
        // e.g. they were moved between teams after submitting).
        filter.$or = [{ team: req.user.team }, { createdBy: req.user._id }];
      } else if (userTeamId) {
        // Team members can read their teammates' SUBMITTED reports (never
        // their in-progress drafts), plus everything they wrote themselves.
        filter.$or = [
          {
            team: req.user.team,
            status: { $nin: ["in_progress", "auto_saved"] },
          },
          { createdBy: req.user._id },
        ];
      } else {
        // No team assigned — own reports only.
        filter.createdBy = req.user._id;
      }
    }

    let query = Meeting.find(filter).populate("createdBy", "name email");
    if (submitted === "true") {
      // Keep the list light: signature images load when a report is opened.
      query = query
        .select("-signatureData -progressData -aiGeneratedContent")
        .sort({ completedAt: -1, updatedAt: -1 });
    } else {
      query = query.sort({ updatedAt: -1, date: -1 });
    }

    const meetings = await query;

    res.json(meetings);
  } catch (error) {
    console.error("❌ Get meetings error:", error.message);
    res.status(500).json({
      message: "Failed to load meetings",
      code: "MEETINGS_FETCH_FAILED",
    });
  }
};

// ─── Get Meeting by ID ──────────────────────────────────────
const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("reviewedBy", "name email");

    if (!meeting) {
      return res
        .status(404)
        .json({ message: "Meeting not found", code: "MEETING_NOT_FOUND" });
    }

    // Check access
    const isOwner =
      meeting.createdBy &&
      meeting.createdBy._id.toString() === req.user._id.toString();
    const isAdminUser = isAdmin(req.user);

    // B7: same-team leaders may READ locked reports.
    const sameTeam =
      meeting.team && req.user.team
        ? meeting.team.toString() === req.user.team.toString()
        : false;
    const isLeaderOfTeam = req.user.role === "leader" && sameTeam;

    if (meeting.isLocked && !isAdminUser && !isOwner && !isLeaderOfTeam) {
      return res.status(403).json({
        message:
          "This report is locked. Only the owner, team leader, or admin can view it.",
        code: "MEETING_LOCKED",
      });
    }

    if (meeting.timeExpired && !isAdminUser && !isOwner && !isLeaderOfTeam) {
      return res.status(403).json({
        message: "This report has expired. Contact an admin for access.",
        code: "MEETING_EXPIRED",
        meeting: {
          _id: meeting._id,
          teamName: meeting.teamName,
          date: meeting.date,
          status: meeting.status,
          createdByName: meeting.createdByName,
          createdAt: meeting.createdAt,
        },
      });
    }

    res.json(meeting);
  } catch (error) {
    console.error("❌ Get meeting by ID error:", error.message);
    res.status(500).json({
      message: "Failed to load meeting",
      code: "MEETING_FETCH_FAILED",
    });
  }
};

// ─── Update Meeting ──────────────────────────────────────────
//
// Permission model, matching the History tab's "Open" button:
//   • Admin/superadmin → can update any report, including locked ones
//   • Team leader      → can update any report on their own team,
//                        unless it's locked
//   • Everyone else    → can update ONLY their own drafts
//                        (in_progress or auto_saved) that aren't locked
//
// Without the draft-and-owner check, a member could PUT a completed
// report that seven people have already signed and rewrite the
// content underneath their signatures. The signature is the whole
// point of the artifact — the rule has to make it impossible.
const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res
        .status(404)
        .json({ message: "Meeting not found", code: "MEETING_NOT_FOUND" });
    }

    const isAdminUser = isAdmin(req.user);
    const isLeaderUser = req.user.role === "leader";

    const { isOwner, sameTeam } = ownerAndTeamCheck(meeting, req.user);

    const isLocked = meeting.isLocked === true || meeting.status === "locked";

    const isDraft =
      meeting.status === "in_progress" || meeting.status === "auto_saved";

    // ── Who is allowed to update this report? ────────────────
    const allowed =
      isAdminUser ||
      (!isLocked && isLeaderUser && sameTeam) ||
      (!isLocked && isOwner && isDraft);

    if (!allowed) {
      // Distinguish the reasons so the client can show a useful
      // message rather than a generic 403.
      if (isLocked && !isAdminUser) {
        return res.status(403).json({
          message:
            "This report is locked. Ask an admin to unlock it before editing.",
          code: "MEETING_LOCKED",
        });
      }
      if (isOwner && !isDraft && !isLeaderUser && !isAdminUser) {
        return res.status(403).json({
          message:
            "Completed reports can only be edited by a team leader or admin.",
          code: "MEETING_NOT_A_DRAFT",
        });
      }
      if (isLeaderUser && !sameTeam) {
        return res.status(403).json({
          message: "You can only edit reports on your own team.",
          code: "WRONG_TEAM",
        });
      }
      return res.status(403).json({
        message: "Not authorized to update this report",
        code: "NOT_AUTHORIZED",
      });
    }

    // ── Apply the update ─────────────────────────────────────
    // B1: whitelist content fields
    // PATCH 4a + 4b make this include the three structured fields.
    const content = cleanContentForWrite(pickContentFields(req.body));

    // B4: whitelist status
    const statusError = validateClientStatus(req.body.status);
    if (statusError) {
      return res
        .status(400)
        .json({ message: statusError, code: "INVALID_STATUS" });
    }

    // Reject empty submissions (checked against the merged result so a
    // partial update of an existing report is still judged correctly)
    if (req.body.status === "completed") {
      const merged = { ...meeting.toObject(), ...content };
      if (!hasReportContent(merged)) {
        return res.status(400).json(EMPTY_REPORT_RESPONSE);
      }
    }

    // B6: non-admins cannot edit after an approved extension has elapsed
    if (!isAdminUser && isPastExtension(meeting)) {
      return res.status(409).json({
        message:
          "Your extension window has elapsed. Contact an admin to resume.",
        code: "EXTENSION_EXPIRED",
      });
    }

    const updates = { ...content };

    // ── PATCH 3: explicitly carry over the three structured fields
    //    even if cleanContentForWrite were ever changed to skip them.
    //    Sanitizers are idempotent so this is safe alongside 4b. ──
    if (req.body.attendanceMode !== undefined) {
      updates.attendanceMode =
        req.body.attendanceMode === "sync" ? "sync" : "manual";
    }
    if (req.body.attendance !== undefined) {
      updates.attendance = cleanAttendance(req.body.attendance);
    }
    if (req.body.signatureData !== undefined) {
      updates.signatureData = cleanSignatureData(req.body.signatureData);
    }
    // ── end PATCH 3

    // A1 + B2: stamp on completion
    if (req.body.status === "completed") {
      const now = new Date();
      updates.status = "completed";
      updates.completedAt = now;
      updates.finalizedAt = now;

      // ── PATCH 3b: on timer-expiry finalization, also persist the
      //    lock/expiry audit trail. Only honored when status is
      //    completed (already whitelisted). ──
      if (req.body.timeExpired === true) {
        updates.timeExpired = true;
        updates.timeExpiredAt = req.body.timeExpiredAt
          ? new Date(req.body.timeExpiredAt)
          : now;
      }
      if (req.body.isLocked === true) {
        updates.isLocked = true;
        updates.lockedAt = req.body.lockedAt
          ? new Date(req.body.lockedAt)
          : now;
        if (typeof req.body.lockedReason === "string") {
          updates.lockedReason = req.body.lockedReason.slice(0, 500);
        }
      }
      if (req.body.finalizedAt) {
        const fa = new Date(req.body.finalizedAt);
        if (!Number.isNaN(fa.getTime())) updates.finalizedAt = fa;
      }
      // ── end PATCH 3b
    } else if (req.body.status === "in_progress") {
      updates.status = "in_progress";
    }

    // Accept explicit aiGeneratedContent only if provided
    if (typeof req.body.aiGeneratedContent === "string") {
      updates.aiGeneratedContent = req.body.aiGeneratedContent;
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true },
    );

    res.json({
      message: "✅ Meeting updated successfully!",
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error("❌ Update meeting error:", error.message);
    res.status(500).json({
      message: "Failed to update meeting",
      code: "MEETING_UPDATE_FAILED",
    });
  }
};

// ─── Lock Meeting ────────────────────────────────────────────
const lockMeeting = async (req, res) => {
  try {
    const { reason } = req.body;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res
        .status(404)
        .json({ message: "Meeting not found", code: "MEETING_NOT_FOUND" });
    }

    // Only owner or admin can lock
    const isOwner = meeting.createdBy.toString() === req.user._id.toString();
    const isAdminUser = isAdmin(req.user);

    if (!isOwner && !isAdminUser) {
      return res
        .status(403)
        .json({ message: "Not authorized", code: "NOT_OWNER" });
    }

    meeting.isLocked = true;
    meeting.lockedAt = new Date();
    meeting.lockedReason = reason || "Meeting time expired";
    meeting.status = "locked";

    // Auto-save before locking
    meeting.isAutoSave = true;
    meeting.lastAutoSave = new Date();

    await meeting.save();

    res.json({
      success: true,
      message: "✅ Meeting locked successfully",
      meeting,
    });
  } catch (error) {
    console.error("❌ Lock meeting error:", error.message);
    res.status(500).json({
      message: "Failed to lock meeting",
      code: "MEETING_LOCK_FAILED",
    });
  }
};

// ─── Unlock Meeting (Admin only) ────────────────────────────
const unlockMeeting = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only admins can unlock meetings",
        code: "INSUFFICIENT_ROLE",
      });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res
        .status(404)
        .json({ message: "Meeting not found", code: "MEETING_NOT_FOUND" });
    }

    meeting.isLocked = false;
    meeting.lockedAt = null;
    meeting.lockedReason = "";
    meeting.status = "in_progress";
    meeting.isResumed = true;
    meeting.resumedAt = new Date();

    await meeting.save();

    res.json({
      success: true,
      message: "✅ Meeting unlocked successfully",
      meeting,
    });
  } catch (error) {
    console.error("❌ Unlock meeting error:", error.message);
    res.status(500).json({
      message: "Failed to unlock meeting",
      code: "MEETING_UNLOCK_FAILED",
    });
  }
};

// ─── Delete Meeting ──────────────────────────────────────────
//
// Permission model matches updateMeeting, except that the "must be
// a draft" clause is not applied to leaders — a leader can delete
// any of their team's reports, including completed ones. The reason
// for the difference: correcting a mistake in a completed report
// requires deleting and re-submitting, and forcing the leader to
// first unlock, then delete, then re-create is friction with no
// security benefit (the leader already had edit rights before the
// report was completed).
//
// Members cannot delete a completed report they authored. To remove
// one, they have to ask their leader — the audit trail of "who
// deleted the signed copy" is worth keeping.
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res
        .status(404)
        .json({ message: "Meeting not found", code: "MEETING_NOT_FOUND" });
    }

    const isAdminUser = isAdmin(req.user);
    const isLeaderUser = req.user.role === "leader";

    const { isOwner, sameTeam } = ownerAndTeamCheck(meeting, req.user);

    const isDraft =
      meeting.status === "in_progress" || meeting.status === "auto_saved";

    const allowed =
      isAdminUser || (isLeaderUser && sameTeam) || (isOwner && isDraft);

    if (!allowed) {
      if (isOwner && !isDraft && !isLeaderUser && !isAdminUser) {
        return res.status(403).json({
          message:
            "Completed reports can only be deleted by a team leader or admin.",
          code: "MEETING_NOT_A_DRAFT",
        });
      }
      if (isLeaderUser && !sameTeam) {
        return res.status(403).json({
          message: "You can only delete reports on your own team.",
          code: "WRONG_TEAM",
        });
      }
      return res.status(403).json({
        message: "Not authorized to delete this report",
        code: "NOT_AUTHORIZED",
      });
    }

    await meeting.deleteOne();
    res.json({ message: "✅ Meeting deleted successfully" });
  } catch (error) {
    console.error("❌ Delete meeting error:", error.message);
    res.status(500).json({
      message: "Failed to delete meeting",
      code: "MEETING_DELETE_FAILED",
    });
  }
};

// ─── Request Extension ───────────────────────────────────────
// B5: owner-only request (documented decision). The report must be
// completed or expired. requestedDuration is capped to [5, 30] minutes.
const requestExtension = async (req, res) => {
  try {
    const { reason } = req.body;
    let requestedDuration = Number(req.body.requestedDuration ?? 15);

    if (!reason || !reason.trim()) {
      return res
        .status(400)
        .json({ message: "Reason is required", code: "REASON_REQUIRED" });
    }

    // Cap
    if (!Number.isFinite(requestedDuration)) requestedDuration = 15;
    requestedDuration = Math.min(
      30,
      Math.max(5, Math.round(requestedDuration)),
    );

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res
        .status(404)
        .json({ message: "Meeting not found", code: "MEETING_NOT_FOUND" });
    }

    // Owner-only (B5 default)
    if (meeting.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only the report owner can request an extension.",
        code: "NOT_OWNER",
      });
    }

    // Must be expired / completed
    const eligible =
      meeting.status === "completed" ||
      meeting.status === "expired" ||
      meeting.timeExpired === true;
    if (!eligible) {
      return res.status(409).json({
        message:
          "Extensions can only be requested after the meeting time has ended.",
        code: "NOT_EXPIRED",
      });
    }

    // No pending duplicate
    const existingRequest = await ExtensionRequest.findOne({
      meetingId: meeting._id,
      status: "pending",
    });
    if (existingRequest) {
      return res.status(409).json({
        message: "You already have a pending extension request.",
        code: "EXTENSION_PENDING",
        request: existingRequest,
      });
    }

    const extensionRequest = await ExtensionRequest.create({
      meetingId: meeting._id,
      requestedBy: req.user._id,
      requestedByName: req.user.name || "Unknown User",
      reason: reason.trim(),
      requestedDuration,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "✅ Extension request submitted successfully",
      request: extensionRequest,
    });
  } catch (error) {
    console.error("❌ Extension request error:", error.message);
    res.status(500).json({
      message: "Failed to submit extension request",
      code: "EXTENSION_REQUEST_FAILED",
    });
  }
};

// ─── Approve Extension (Admin only) ─────────────────────────
const approveExtension = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only admins can approve extensions",
        code: "INSUFFICIENT_ROLE",
      });
    }

    const { adminNotes } = req.body;

    const extensionRequest = await ExtensionRequest.findById(req.params.id);
    if (!extensionRequest) {
      return res.status(404).json({
        message: "Extension request not found",
        code: "EXTENSION_NOT_FOUND",
      });
    }

    if (extensionRequest.status !== "pending") {
      return res.status(400).json({
        message: `Request is already ${extensionRequest.status}`,
        code: "EXTENSION_NOT_PENDING",
      });
    }

    // Update request
    extensionRequest.status = "approved";
    extensionRequest.approvedBy = req.user._id;
    extensionRequest.approvedByName = req.user.name || "Admin";
    extensionRequest.approvedAt = new Date();
    extensionRequest.adminNotes = adminNotes || "";

    await extensionRequest.save();

    // Update meeting
    const meeting = await Meeting.findById(extensionRequest.meetingId);
    if (meeting) {
      meeting.extensionApproved = true;
      meeting.extensionExpiresAt = new Date(
        Date.now() + (extensionRequest.requestedDuration || 15) * 60 * 1000,
      );
      meeting.status = "in_progress";
      meeting.isLocked = false;
      meeting.isResumed = true;
      meeting.resumedAt = new Date();
      await meeting.save();
    }

    res.json({
      success: true,
      message: "✅ Extension approved successfully",
      request: extensionRequest,
      meeting,
    });
  } catch (error) {
    console.error("❌ Approve extension error:", error.message);
    res.status(500).json({
      message: "Failed to approve extension",
      code: "EXTENSION_APPROVE_FAILED",
    });
  }
};

// ─── Reject Extension (Admin only) ──────────────────────────
const rejectExtension = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only admins can reject extensions",
        code: "INSUFFICIENT_ROLE",
      });
    }

    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        message: "Rejection reason is required",
        code: "REJECTION_REASON_REQUIRED",
      });
    }

    const extensionRequest = await ExtensionRequest.findById(req.params.id);
    if (!extensionRequest) {
      return res.status(404).json({
        message: "Extension request not found",
        code: "EXTENSION_NOT_FOUND",
      });
    }

    if (extensionRequest.status !== "pending") {
      return res.status(400).json({
        message: `Request is already ${extensionRequest.status}`,
        code: "EXTENSION_NOT_PENDING",
      });
    }

    extensionRequest.status = "rejected";
    extensionRequest.rejectedBy = req.user._id;
    extensionRequest.rejectedByName = req.user.name || "Admin";
    extensionRequest.rejectedAt = new Date();
    extensionRequest.rejectionReason = rejectionReason.trim();
    extensionRequest.adminNotes = adminNotes || "";

    await extensionRequest.save();

    res.json({
      success: true,
      message: "❌ Extension rejected",
      request: extensionRequest,
    });
  } catch (error) {
    console.error("❌ Reject extension error:", error.message);
    res.status(500).json({
      message: "Failed to reject extension",
      code: "EXTENSION_REJECT_FAILED",
    });
  }
};

// ─── Get Extension Requests (Admin only) ────────────────────
const getExtensionRequests = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only admins can view extension requests",
        code: "INSUFFICIENT_ROLE",
      });
    }

    const { status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const requests = await ExtensionRequest.find(filter)
      .populate("requestedBy", "name email")
      .populate("approvedBy", "name email")
      .populate("rejectedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("❌ Get extension requests error:", error.message);
    res.status(500).json({
      message: "Failed to load extension requests",
      code: "EXTENSIONS_FETCH_FAILED",
    });
  }
};

// ─── Get Meeting by ID with Progress (Admin only) ───────────
const getMeetingProgress = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only admins can view progress data",
        code: "INSUFFICIENT_ROLE",
      });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res
        .status(404)
        .json({ message: "Meeting not found", code: "MEETING_NOT_FOUND" });
    }

    res.json({
      success: true,
      meeting: {
        _id: meeting._id,
        teamName: meeting.teamName,
        date: meeting.date,
        status: meeting.status,
        isLocked: meeting.isLocked,
        isAutoSave: meeting.isAutoSave,
        lastAutoSave: meeting.lastAutoSave,
        autoSaveCount: meeting.autoSaveCount,
        progressData: meeting.progressData,
        createdByName: meeting.createdByName,
        createdAt: meeting.createdAt,
        updatedAt: meeting.updatedAt,
        // ── PATCH 6: expose the structured fields so the admin
        //    "View Saved Progress" modal can show the synced roster
        //    and drawn signatures. ──
        attendanceMode: meeting.attendanceMode,
        attendance: meeting.attendance,
        signatureData: meeting.signatureData,
        // ── end PATCH 6
      },
    });
  } catch (error) {
    console.error("❌ Get meeting progress error:", error.message);
    res.status(500).json({
      message: "Failed to load progress",
      code: "PROGRESS_FETCH_FAILED",
    });
  }
};

// ─── Resume Meeting (Admin only) ────────────────────────────
const resumeMeeting = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only admins can resume meetings",
        code: "INSUFFICIENT_ROLE",
      });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res
        .status(404)
        .json({ message: "Meeting not found", code: "MEETING_NOT_FOUND" });
    }

    // Restore from progress data
    if (meeting.progressData) {
      const progress = meeting.progressData;
      meeting.date = progress.date ? new Date(progress.date) : meeting.date;
      meeting.timeStart = progress.timeStart || "";
      meeting.timeEnd = progress.timeEnd || "";
      meeting.present = progress.present || [];
      meeting.absent = progress.absent || [];
      meeting.prevResults = cleanStringArray(progress.prevResults);
      meeting.topics = cleanStringArray(progress.topics);
      meeting.explanation = progress.explanation || "";
      meeting.gaps = cleanStringArray(progress.gaps);
      meeting.agreements = cleanStringArray(progress.agreements);
      meeting.signatures = cleanStringArray(progress.signatures);

      // ── PATCH 5 (resume side): restore the three structured fields
      //    from the snapshot so roster + signatures come back. ──
      meeting.attendanceMode =
        progress.attendanceMode === "sync" ? "sync" : "manual";
      meeting.attendance = cleanAttendance(progress.attendance);
      meeting.signatureData = cleanSignatureData(progress.signatureData);
      // ── end PATCH 5 (resume side)
    }

    meeting.isLocked = false;
    meeting.lockedAt = null;
    meeting.lockedReason = "";
    meeting.status = "in_progress";
    meeting.isResumed = true;
    meeting.resumedAt = new Date();
    meeting.timeExpired = false;
    meeting.timeExpiredAt = null;

    await meeting.save();

    res.json({
      success: true,
      message: "✅ Meeting resumed successfully",
      meeting,
    });
  } catch (error) {
    console.error("❌ Resume meeting error:", error.message);
    res.status(500).json({
      message: "Failed to resume meeting",
      code: "MEETING_RESUME_FAILED",
    });
  }
};

// ─── Export all functions ────────────────────────────────────
module.exports = {
  createMeeting,
  autoSaveMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  lockMeeting,
  unlockMeeting,
  requestExtension,
  approveExtension,
  rejectExtension,
  getExtensionRequests,
  getMeetingProgress,
  resumeMeeting,
};
