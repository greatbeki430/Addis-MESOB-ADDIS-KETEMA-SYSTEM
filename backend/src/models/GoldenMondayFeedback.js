// backend/src/models/GoldenMondayFeedback.js
const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoldenMondaySession",
      required: true,
      index: true,
    },
    presenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewerName: {
      type: String,
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    ratings: {
      clarity: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      engagement: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      relevance: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      expertise: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      overall: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
    },
    strengths: {
      type: String,
      default: "",
    },
    improvements: {
      type: String,
      default: "",
    },
    additionalComments: {
      type: String,
      default: "",
    },
    wouldRecommend: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Ensure one feedback per reviewer per session
feedbackSchema.index({ session: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model("GoldenMondayFeedback", feedbackSchema);
