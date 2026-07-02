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
      type: [String], // Changed from ObjectId to String to handle names
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
  },
  {
    timestamps: true,
  },
);

// ─── Index for queries ───────────────────────────────────────
meetingSchema.index({ date: -1, team: 1 });
meetingSchema.index({ createdAt: -1 });
meetingSchema.index({ teamName: 1 });

module.exports = mongoose.model("Meeting", meetingSchema);
