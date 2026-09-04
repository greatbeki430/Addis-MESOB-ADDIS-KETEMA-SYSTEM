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

// ─── Create Meeting ─────────────────────────────────────────
const createMeeting = async (req, res) => {
  try {
    console.log(
      "📝 Creating meeting with data:",
      JSON.stringify(req.body, null, 2),
    );

    const {
      date,
      timeStart,
      timeEnd,
      present,
      absent,
      prevResults,
      topics,
      explanation,
      gaps,
      agreements,
      signatures,
      teamId,
      teamName,
      status = "in_progress",
      meetingDuration = 30,
    } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    let teamObjectId = null;
    if (teamId) {
      teamObjectId = teamId;
    } else if (req.body.team) {
      teamObjectId = req.body.team;
    }

    // Clean arrays
    const cleanedPrevResults = cleanStringArray(prevResults);
    const cleanedTopics = cleanStringArray(topics);
    const cleanedGaps = cleanStringArray(gaps);
    const cleanedAgreements = cleanStringArray(agreements);
    const cleanedSignatures = cleanStringArray(signatures);

    // Handle present members
    let presentIds = [];
    if (Array.isArray(present)) {
      presentIds = present.filter((p) => p && p.trim && p.trim() !== "");
    }

    // Handle absent members
    let absentData = [];
    if (Array.isArray(absent)) {
      absentData = absent
        .filter((a) => a && a.name && a.name.trim())
        .map((a) => ({
          name: a.name.trim(),
          reason: a.reason || "",
        }));
    }

    const meetingData = {
      date: new Date(date),
      timeStart: timeStart || "",
      timeEnd: timeEnd || "",
      present: presentIds,
      absent: absentData,
      prevResults: cleanedPrevResults,
      topics: cleanedTopics,
      explanation: explanation || "",
      gaps: cleanedGaps,
      agreements: cleanedAgreements,
      signatures: cleanedSignatures,
      team: teamObjectId,
      teamName: teamName || "Unknown Team",
      createdBy: req.user._id,
      createdByName: req.user.name || "Unknown User",
      status: status || "in_progress",
      meetingDuration: meetingDuration || 30,
    };

    const meeting = await Meeting.create(meetingData);

    res.status(201).json({
      message: "✅ Meeting report saved successfully!",
      meeting,
    });
  } catch (error) {
    console.error("❌ Meeting creation error:", error);
    res.status(500).json({
      message: error.message,
      error: error.stack,
    });
  }
};

// ─── Auto-Save Meeting ──────────────────────────────────────
const autoSaveMeeting = async (req, res) => {
  try {
    const { meetingId, ...reportData } = req.body;

    let meeting;

    if (meetingId) {
      // Find existing meeting
      meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      // Check if user owns this meeting
      if (
        meeting.createdBy.toString() !== req.user._id.toString() &&
        !isAdmin(req.user)
      ) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Update meeting
      Object.assign(meeting, {
        ...reportData,
        isAutoSave: true,
        lastAutoSave: new Date(),
        autoSaveCount: (meeting.autoSaveCount || 0) + 1,
        status: "auto_saved",
      });

      // Save progress data for recovery
      meeting.progressData = {
        date: reportData.date,
        timeStart: reportData.timeStart,
        timeEnd: reportData.timeEnd,
        present: reportData.present,
        absent: reportData.absent,
        prevResults: reportData.prevResults,
        topics: reportData.topics,
        explanation: reportData.explanation,
        gaps: reportData.gaps,
        agreements: reportData.agreements,
        signatures: reportData.signatures,
      };

      await meeting.save();
    } else {
      // Create new auto-save draft
      const {
        date,
        timeStart,
        timeEnd,
        present,
        absent,
        prevResults,
        topics,
        explanation,
        gaps,
        agreements,
        signatures,
        teamId,
        teamName,
      } = reportData;

      meeting = await Meeting.create({
        date: date ? new Date(date) : new Date(),
        timeStart: timeStart || "",
        timeEnd: timeEnd || "",
        present: present || [],
        absent: absent || [],
        prevResults: cleanStringArray(prevResults),
        topics: cleanStringArray(topics),
        explanation: explanation || "",
        gaps: cleanStringArray(gaps),
        agreements: cleanStringArray(agreements),
        signatures: cleanStringArray(signatures),
        team: teamId || null,
        teamName: teamName || "Unknown Team",
        createdBy: req.user._id,
        createdByName: req.user.name || "Unknown User",
        status: "auto_saved",
        isAutoSave: true,
        lastAutoSave: new Date(),
        autoSaveCount: 1,
        progressData: {
          date: reportData.date,
          timeStart: reportData.timeStart,
          timeEnd: reportData.timeEnd,
          present: reportData.present,
          absent: reportData.absent,
          prevResults: reportData.prevResults,
          topics: reportData.topics,
          explanation: reportData.explanation,
          gaps: reportData.gaps,
          agreements: reportData.agreements,
          signatures: reportData.signatures,
        },
      });
    }

    res.json({
      success: true,
      message: "✅ Auto-saved successfully",
      meeting,
    });
  } catch (error) {
    console.error("❌ Auto-save error:", error);
    res.status(500).json({
      message: error.message,
      error: error.stack,
    });
  }
};

// ─── Get Meetings ───────────────────────────────────────────
const getMeetings = async (req, res) => {
  try {
    const { teamId, team, status, isLocked } = req.query;

    let filter = {};

    if (teamId) {
      filter.team = teamId;
    } else if (team) {
      filter.team = team;
    }

    if (status) {
      filter.status = status;
    }

    // If isLocked is provided, filter by that
    if (isLocked !== undefined) {
      filter.isLocked = isLocked === "true";
    }

    // If user is not admin, only show their own meetings
    if (!isAdmin(req.user)) {
      filter.createdBy = req.user._id;
    }

    const meetings = await Meeting.find(filter)
      .populate("createdBy", "name email")
      .sort({ date: -1, createdAt: -1 });

    res.json(meetings);
  } catch (error) {
    console.error("❌ Get meetings error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Meeting by ID ──────────────────────────────────────
const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("reviewedBy", "name email");

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check access
    const isOwner =
      meeting.createdBy._id.toString() === req.user._id.toString();
    const isAdminUser = isAdmin(req.user);

    // If meeting is locked and user is not admin, only show if they are the owner
    if (meeting.isLocked && !isAdminUser && !isOwner) {
      return res.status(403).json({
        message: "This report is locked. Only the owner or admin can view it.",
        isLocked: true,
      });
    }

    // If meeting is expired and user is not admin, show limited data
    if (meeting.timeExpired && !isAdminUser && !isOwner) {
      return res.status(403).json({
        message: "This report has expired. Contact an admin for access.",
        isExpired: true,
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
    console.error("❌ Get meeting by ID error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Meeting ──────────────────────────────────────────
const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check authorization
    const isOwner = meeting.createdBy.toString() === req.user._id.toString();
    const isAdminUser = isAdmin(req.user);

    if (!isOwner && !isAdminUser) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this meeting" });
    }

    // If meeting is locked, only admin can update
    if (meeting.isLocked && !isAdminUser) {
      return res
        .status(403)
        .json({
          message: "This meeting is locked. Only admins can update it.",
        });
    }

    // If meeting is expired, only admin can update
    if (meeting.timeExpired && !isAdminUser) {
      return res
        .status(403)
        .json({
          message: "This meeting has expired. Only admins can update it.",
        });
    }

    const updates = { ...req.body };

    // Clean arrays
    ["prevResults", "topics", "gaps", "agreements", "signatures"].forEach(
      (field) => {
        if (Array.isArray(updates[field])) {
          updates[field] = cleanStringArray(updates[field]);
        }
      },
    );

    // Handle date conversion
    if (updates.date) {
      updates.date = new Date(updates.date);
    }

    // If status is being set to "completed", set completedAt
    if (updates.status === "completed") {
      updates.completedAt = new Date();
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
    console.error("❌ Update meeting error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Lock Meeting ────────────────────────────────────────────
const lockMeeting = async (req, res) => {
  try {
    const { reason } = req.body;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Only owner or admin can lock
    const isOwner = meeting.createdBy.toString() === req.user._id.toString();
    const isAdminUser = isAdmin(req.user);

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ message: "Not authorized" });
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
    console.error("❌ Lock meeting error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Unlock Meeting (Admin only) ────────────────────────────
const unlockMeeting = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res
        .status(403)
        .json({ message: "Only admins can unlock meetings" });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
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
    console.error("❌ Unlock meeting error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Meeting ──────────────────────────────────────────
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Only admin or owner can delete
    const isOwner = meeting.createdBy.toString() === req.user._id.toString();
    const isAdminUser = isAdmin(req.user);

    if (!isOwner && !isAdminUser) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this meeting" });
    }

    await meeting.deleteOne();
    res.json({ message: "✅ Meeting deleted successfully" });
  } catch (error) {
    console.error("❌ Delete meeting error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Request Extension ───────────────────────────────────────
const requestExtension = async (req, res) => {
  try {
    const { reason, requestedDuration = 15 } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check if user owns this meeting
    if (meeting.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          message: "Not authorized to request extension for this meeting",
        });
    }

    // Check if there's already a pending request
    const existingRequest = await ExtensionRequest.findOne({
      meetingId: meeting._id,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(409).json({
        message: "You already have a pending extension request",
        request: existingRequest,
      });
    }

    const extensionRequest = await ExtensionRequest.create({
      meetingId: meeting._id,
      requestedBy: req.user._id,
      requestedByName: req.user.name || "Unknown User",
      reason: reason.trim(),
      requestedDuration: requestedDuration || 15,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "✅ Extension request submitted successfully",
      request: extensionRequest,
    });
  } catch (error) {
    console.error("❌ Extension request error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Approve Extension (Admin only) ─────────────────────────
const approveExtension = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res
        .status(403)
        .json({ message: "Only admins can approve extensions" });
    }

    const { adminNotes } = req.body;

    const extensionRequest = await ExtensionRequest.findById(req.params.id);
    if (!extensionRequest) {
      return res.status(404).json({ message: "Extension request not found" });
    }

    if (extensionRequest.status !== "pending") {
      return res.status(400).json({
        message: `Request is already ${extensionRequest.status}`,
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
    console.error("❌ Approve extension error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Reject Extension (Admin only) ──────────────────────────
const rejectExtension = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res
        .status(403)
        .json({ message: "Only admins can reject extensions" });
    }

    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const extensionRequest = await ExtensionRequest.findById(req.params.id);
    if (!extensionRequest) {
      return res.status(404).json({ message: "Extension request not found" });
    }

    if (extensionRequest.status !== "pending") {
      return res.status(400).json({
        message: `Request is already ${extensionRequest.status}`,
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
    console.error("❌ Reject extension error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Extension Requests (Admin only) ────────────────────
const getExtensionRequests = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res
        .status(403)
        .json({ message: "Only admins can view extension requests" });
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
    console.error("❌ Get extension requests error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Meeting by ID with Progress (Admin only) ───────────
const getMeetingProgress = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res
        .status(403)
        .json({ message: "Only admins can view progress data" });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
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
      },
    });
  } catch (error) {
    console.error("❌ Get meeting progress error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Resume Meeting (Admin only) ────────────────────────────
const resumeMeeting = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res
        .status(403)
        .json({ message: "Only admins can resume meetings" });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
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
    console.error("❌ Resume meeting error:", error);
    res.status(500).json({ message: error.message });
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
