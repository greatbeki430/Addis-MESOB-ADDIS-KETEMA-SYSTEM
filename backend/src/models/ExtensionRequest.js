// backend/src/models/ExtensionRequest.js
const mongoose = require("mongoose");

const extensionRequestSchema = new mongoose.Schema(
  {
    // ─── Reference to Meeting ────────────────────────────
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },

    // ─── Requestor Info ──────────────────────────────────
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestedByName: {
      type: String,
      required: true,
    },

    // ─── Request Details ─────────────────────────────────
    reason: {
      type: String,
      required: true,
    },
    requestedDuration: {
      type: Number, // in minutes
      default: 15,
    },

    // ─── Status ───────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
    },

    // ─── Approval Details ─────────────────────────────────
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedByName: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
      default: null,
    },

    // ─── Rejection Details ─────────────────────────────────
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedByName: {
      type: String,
      default: "",
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
    },

    // ─── Admin Notes ──────────────────────────────────────
    adminNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ───────────────────────────────────────────────
extensionRequestSchema.index({ meetingId: 1, status: 1 });
extensionRequestSchema.index({ requestedBy: 1, status: 1 });
extensionRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("ExtensionRequest", extensionRequestSchema);
