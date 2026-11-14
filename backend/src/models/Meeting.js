// backend/src/models/Meeting.js
const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    // ─── Basic Info ──────────────────────────────────────
    date: {
      type: Date,
      required: true,
    },
    timeStart: {
      type: String,
      default: "",
    },
    timeEnd: {
      type: String,
      default: "",
    },

    // ─── Attendees ────────────────────────────────────────
    present: {
      type: [String],
      default: [],
    },
    absent: {
      type: [
        {
          name: { type: String, default: "" },
          reason: { type: String, default: "" },
        },
      ],
      default: [],
    },

    // ─── Meeting Content ──────────────────────────────────
    prevResults: {
      type: [String],
      default: [],
    },
    topics: {
      type: [String],
      default: [],
    },
    explanation: {
      type: String,
      default: "",
    },
    gaps: {
      type: [String],
      default: [],
    },
    agreements: {
      type: [String],
      default: [],
    },
    signatures: {
      type: [String],
      default: [],
    },

    // ─── Team Info ────────────────────────────────────────
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    teamName: {
      type: String,
      default: "Unknown Team",
    },

    // ─── Created By ───────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: {
      type: String,
      default: "",
    },

    // ─── Timer & Auto-Save Fields ─────────────────────────
    status: {
      type: String,
      enum: ["in_progress", "auto_saved", "completed", "expired", "locked"],
      default: "in_progress",
    },
    isAutoSave: {
      type: Boolean,
      default: false,
    },
    lastAutoSave: {
      type: Date,
      default: null,
    },
    autoSaveCount: {
      type: Number,
      default: 0,
    },
    meetingDuration: {
      type: Number, // in minutes
      default: 30,
    },
    timeExpired: {
      type: Boolean,
      default: false,
    },
    timeExpiredAt: {
      type: Date,
      default: null,
    },

    // ─── Lifecycle stamps ─────────────────────────────────
    // completedAt / finalizedAt are stamped by the controller
    // (A1 + B2) the moment status transitions to "completed",
    // whether from createMeeting or updateMeeting.
    completedAt: {
      type: Date,
      default: null,
    },
    finalizedAt: {
      type: Date,
      default: null,
    },
    aiGeneratedContent: {
      type: String,
      default: "",
    },

    // ─── Extension lifecycle ──────────────────────────────
    extensionApproved: {
      type: Boolean,
      default: false,
    },
    extensionExpiresAt: {
      type: Date,
      default: null,
    },
    isResumed: {
      type: Boolean,
      default: false,
    },
    resumedAt: {
      type: Date,
      default: null,
    },

    // ─── Lock state ───────────────────────────────────────
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    lockedReason: {
      type: String,
      default: "",
    },

    // ─── Progress snapshot (used by resume / admin view) ──
    progressData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ─── Admin Notes ──────────────────────────────────────
    adminNotes: {
      type: String,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ───────────────────────────────────────────────
meetingSchema.index({ date: -1, team: 1 });
meetingSchema.index({ createdAt: -1 });
meetingSchema.index({ teamName: 1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ createdBy: 1, status: 1 });
meetingSchema.index({ isLocked: 1, lockedAt: 1 });

module.exports = mongoose.model("Meeting", meetingSchema);
