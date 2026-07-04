// backend/src/models/GoldenMondaySession.js
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
      required: [true, "Raw session notes are required"],
      trim: true,
    },
    recapEn: {
      type: String,
      default: "",
      trim: true,
    },
    recapAm: {
      type: String,
      default: "",
      trim: true,
    },
    keyTakeaway: {
      type: String,
      default: "",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
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

// Index for efficient sorting
goldenMondaySessionSchema.index({ date: -1 });

module.exports = mongoose.model(
  "GoldenMondaySession",
  goldenMondaySessionSchema,
);
