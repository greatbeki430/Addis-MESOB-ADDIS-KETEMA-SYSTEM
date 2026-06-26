const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema(
  {
    // ✅ Keep team reference for compatibility
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: false, // Make optional for standalone evaluations
    },
    // ✅ New fields for the enhanced evaluation
    teamName: {
      type: String,
      default: "Untitled Team",
    },
    members: {
      type: [String],
      default: [],
    },
    scores: {
      type: Object,
      default: {},
    },
    comments: {
      type: Object,
      default: {},
    },
    totalScores: {
      type: [Object],
      default: [],
    },
    evaluatedBy: {
      type: String,
      required: true,
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
    language: {
      type: String,
      default: "en",
    },
    // ✅ Keep old fields for backward compatibility
    period: {
      type: String,
      required: false,
    },
    bestPerformer: {
      type: String,
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    // ✅ Add status field
    status: {
      type: String,
      enum: ["draft", "submitted", "approved"],
      default: "draft",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Evaluation", evaluationSchema);
