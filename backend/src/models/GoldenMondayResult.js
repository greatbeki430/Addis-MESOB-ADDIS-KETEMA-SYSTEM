// backend/src/models/GoldenMondayResult.js
// "Results Gained" — Kirkpatrick Model Levels 3-4 (Behavior + Results).
// Staff log what they actually DID with something they learned, and what
// measurably changed because of it. Optionally links back to the
// GoldenMondayExperience entry that prompted it, so reporting can trace
// learning -> application -> outcome as one thread instead of two
// disconnected logs.

const mongoose = require("mongoose");

const OUTCOME_CATEGORIES = [
  "efficiency",
  "quality",
  "morale",
  "retention",
  "revenue",
  "other",
];

const TIMEFRAMES = [
  "immediate",
  "within-month",
  "within-quarter",
  "within-year",
];

const goldenMondayResultSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoldenMondaySession",
      default: null,
      index: true,
    },

    // Optional link back to the Experience that prompted this result —
    // lets reporting trace the full Kirkpatrick chain for one topic.
    experience: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoldenMondayExperience",
      default: null,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: { type: String, required: true },
    department: { type: String, default: "" },

    // Kirkpatrick Level 3 (Behavior): what did you actually do differently.
    whatIApplied: { type: String, required: true, trim: true, maxlength: 2000 },

    // Kirkpatrick Level 4 (Results): the tangible outcome, if any.
    measurableOutcome: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    outcomeCategory: {
      type: String,
      enum: OUTCOME_CATEGORIES,
      default: "other",
      index: true,
    },
    timeframe: {
      type: String,
      enum: TIMEFRAMES,
      default: "within-month",
    },

    tags: { type: [String], default: [] },
    aiSuggestedTags: { type: [String], default: [] },

    endorsedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

goldenMondayResultSchema.index({ createdAt: -1 });
goldenMondayResultSchema.index({ outcomeCategory: 1, createdAt: -1 });

module.exports = mongoose.model("GoldenMondayResult", goldenMondayResultSchema);
module.exports.OUTCOME_CATEGORIES = OUTCOME_CATEGORIES;
module.exports.TIMEFRAMES = TIMEFRAMES;
