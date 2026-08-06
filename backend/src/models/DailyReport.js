const mongoose = require("mongoose");

const dailyReportSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    entries: [
      {
        dept: String,
        service: String,
        male: Number,
        female: Number,
        total: Number,
        notes: String,
      },
    ],
    grandTotal: Number,
    summary: {
      type: String,
      maxlength: 3000,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: {
          type: String,
          default: "👍",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

// ✅ Index for efficient queries
dailyReportSchema.index({ date: 1, createdBy: 1 }, { unique: true });
dailyReportSchema.index({ team: 1, date: -1 });
dailyReportSchema.index({ createdBy: 1, date: -1 });

module.exports = mongoose.model("DailyReport", dailyReportSchema);
