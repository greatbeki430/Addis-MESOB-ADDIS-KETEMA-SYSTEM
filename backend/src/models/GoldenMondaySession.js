// backend/src/models/GoldenMondaySession.js
// Addis MESOB — Golden Monday session record.
// A "session" is one Monday 2:00-2:50 (8:00-8:50 AM) slot. It now carries
// the presenter-rotation assignment and the (temporary) recording, in
// addition to the original AI recap fields.

const mongoose = require("mongoose");

const goldenMondaySessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Session title is required"],
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    // Normalized Monday (00:00) this session belongs to — used as the
    // unique key for "one assignment per week" and for calendar lookups.
    weekOf: {
      type: Date,
      required: true,
      index: true,
    },
    organization: {
      type: String,
      trim: true,
      default: "Addis MESOB",
    },
    speaker: {
      type: String,
      trim: true,
      default: "Staff Member",
    },
    rawNotes: {
      type: String,
      trim: true,
      default: "",
    },
    recapEn: { type: String, default: "", trim: true },
    recapAm: { type: String, default: "", trim: true },
    keyTakeaway: { type: String, default: "", trim: true },
    tags: { type: [String], default: [] },

    // ── Presenter rotation ─────────────────────────────────────
    presenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    presenterName: { type: String, default: "", trim: true },
    presenterDepartment: { type: String, default: "", trim: true },
    // Employees choose their own title once assigned.
    presentationTitle: { type: String, default: "", trim: true },
    titleConfirmedAt: { type: Date, default: null },
    // Topic ideas offered by the AI when the presenter is assigned
    // (the presenter can pick one, tweak it, or ignore it).
    suggestedTopics: { type: [String], default: [] },
    assignmentMethod: {
      type: String,
      enum: ["auto-rotation", "manual-override", "self-selected", "legacy"],
      default: "legacy",
    },

    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },

    // ── Recording (temporary, auto-expiring) ───────────────────
    recordingUrl: { type: String, default: "" },
    recordingPublicId: { type: String, default: "" },
    recordingDurationSec: { type: Number, default: 0 },
    recordingUploadedAt: { type: Date, default: null },
    // How many days the recording stays visible/downloadable after
    // upload (default: rest of that ISO week, see recordingService).
    recordingVisibleDays: { type: Number, default: 7 },
    recordingExpiresAt: { type: Date, default: null, index: true },
    recordingDeleted: { type: Boolean, default: false },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Efficient sorting / lookups
goldenMondaySessionSchema.index({ date: -1 });
goldenMondaySessionSchema.index({ weekOf: 1 }, { unique: true, sparse: true });

// A recording is "live" (visible to staff) while it hasn't expired
// and hasn't been soft-deleted.
goldenMondaySessionSchema.methods.isRecordingLive = function () {
  return (
    !!this.recordingUrl &&
    !this.recordingDeleted &&
    this.recordingExpiresAt &&
    this.recordingExpiresAt.getTime() > Date.now()
  );
};

module.exports = mongoose.model(
  "GoldenMondaySession",
  goldenMondaySessionSchema,
);
