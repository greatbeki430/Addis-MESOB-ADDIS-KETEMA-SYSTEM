// backend/src/models/Evaluation.js
const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema(
  {
    // Team reference for compatibility
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: false,
    },
    // Evaluation data
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
    // Backward compatibility
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
    // Status
    status: {
      type: String,
      enum: ["draft", "submitted", "approved"],
      default: "draft",
    },
    // ✅ Digital Signatures
    signatures: {
      type: Object,
      default: {},
    },
    // ✅ Social feed: lets employees (who can't create/edit evaluations)
    // react to and discuss a finalized evaluation. Kept separate from
    // `comments` above, which stores per-criterion scoring notes.
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: { type: String, required: true, default: "👍" },
        _id: false,
      },
    ],
    discussion: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: { type: String, required: true, trim: true, maxlength: 1000 },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Evaluation", evaluationSchema);
