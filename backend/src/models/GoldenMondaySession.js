// backend/src/models/GoldenMondaySession.js
// Complete session record with all dynamic data

const mongoose = require("mongoose");

const goldenMondaySessionSchema = new mongoose.Schema(
  {
    // Basic Info
    title: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    weekOf: { type: Date, required: true, index: true },

    // Organization
    organization: { type: String, trim: true, default: "Addis MESOB" },

    // Presenter Info
    presenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    presenterName: { type: String, default: "", trim: true },
    presenterDepartment: { type: String, default: "", trim: true },
    presenterPhotoUrl: { type: String, default: "" },

    // Presentation Details
    presentationTitle: { type: String, default: "", trim: true },
    titleConfirmedAt: { type: Date, default: null },
    presentationDescription: { type: String, default: "", trim: true },
    presentationSlides: { type: String, default: "" }, // URL to slides

    // AI Generated
    suggestedTopics: { type: [String], default: [] },
    suggestedTopicsWithRationale: { type: [Object], default: [] },
    aiGeneratedRecap: { type: String, default: "" },
    aiGeneratedRecapAm: { type: String, default: "" },
    aiGeneratedRecapOm: { type: String, default: "" },
    keyTakeaway: { type: String, default: "", trim: true },
    tags: { type: [String], default: [] },

    // Session Status
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
    assignmentMethod: {
      type: String,
      enum: ["auto-rotation", "manual-override", "self-selected", "legacy"],
      default: "legacy",
    },

    // Media - Photos
    photos: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
          caption: { type: String, default: "" },
          uploadedAt: { type: Date, default: Date.now },
          uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
      ],
      default: [],
    },

    // Media - Videos (recordings)
    recordingUrl: { type: String, default: "" },
    recordingPublicId: { type: String, default: "" },
    recordingDurationSec: { type: Number, default: 0 },
    recordingUploadedAt: { type: Date, default: null },
    recordingVisibleDays: { type: Number, default: 7 },
    recordingExpiresAt: { type: Date, default: null, index: true },
    recordingDeleted: { type: Boolean, default: false },

    // Media - Additional videos (other than main recording)
    additionalVideos: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
          title: { type: String, default: "" },
          uploadedAt: { type: Date, default: Date.now },
          uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
      ],
      default: [],
    },

    // Raw notes and recap
    rawNotes: { type: String, default: "", trim: true },
    recapEn: { type: String, default: "", trim: true },
    recapAm: { type: String, default: "", trim: true },
    recapOm: { type: String, default: "", trim: true },

    // Telegram Integration
    telegramPostId: { type: String, default: "" },
    telegramPostedAt: { type: Date, default: null },
    telegramMessageUrl: { type: String, default: "" },

    // Attendance
    attendees: {
      type: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          name: { type: String, required: true },
          department: { type: String, default: "" },
          attended: { type: Boolean, default: true },
          feedback: { type: String, default: "" },
        },
      ],
      default: [],
    },

    // Feedback & Evaluation
    feedback: {
      type: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          rating: { type: Number, min: 1, max: 5, default: 3 },
          comment: { type: String, default: "" },
          submittedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    averageRating: { type: Number, default: 0 },

    // Creator/Audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: { type: String, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Indexes for performance
goldenMondaySessionSchema.index({ date: -1 });
goldenMondaySessionSchema.index({ weekOf: 1 }, { unique: true, sparse: true });
goldenMondaySessionSchema.index({ status: 1 });
goldenMondaySessionSchema.index({ presenter: 1 });

// Methods
goldenMondaySessionSchema.methods.isRecordingLive = function () {
  return (
    !!this.recordingUrl &&
    !this.recordingDeleted &&
    this.recordingExpiresAt &&
    this.recordingExpiresAt.getTime() > Date.now()
  );
};

goldenMondaySessionSchema.methods.isUpcoming = function () {
  return this.status === "scheduled" && this.date > new Date();
};

goldenMondaySessionSchema.methods.isPast = function () {
  return this.status === "completed" || this.date < new Date();
};

module.exports = mongoose.model(
  "GoldenMondaySession",
  goldenMondaySessionSchema,
);
