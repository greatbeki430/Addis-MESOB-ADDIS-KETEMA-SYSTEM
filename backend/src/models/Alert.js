// backend/src/models/Alert.js
const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["biometrics_failure", "attendance_verification", "system_alert"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    metadata: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "dismissed"],
      default: "pending",
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: Date,
  },
  { timestamps: true },
);

alertSchema.index({ status: 1, createdAt: -1 });
alertSchema.index({ type: 1, severity: 1 });

module.exports = mongoose.model("Alert", alertSchema);
