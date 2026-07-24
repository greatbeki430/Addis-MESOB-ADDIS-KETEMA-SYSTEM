// backend/src/models/GoldenMondayAttendance.js
// Attendance records for Golden Monday sessions with signature support

const mongoose = require("mongoose");

const goldenMondayAttendanceSchema = new mongoose.Schema(
  {
    // Session reference
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoldenMondaySession",
      required: true,
      index: true,
    },

    // Employee who attended
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    department: { type: String, default: "", trim: true },

    // Attendance details
    attended: { type: Boolean, default: true },
    checkedInAt: { type: Date, default: Date.now },
    checkedOutAt: { type: Date, default: null },

    // Signature - stored as base64 image or text
    signature: {
      type: String,
      default: "",
    },
    signatureType: {
      type: String,
      enum: ["draw", "text", "none"],
      default: "none",
    },
    signatureText: { type: String, default: "", trim: true },

    // Role at the session
    role: {
      type: String,
      enum: ["presenter", "attendee", "organizer", "admin"],
      default: "attendee",
    },

    // Feedback (optional)
    feedback: { type: String, default: "", trim: true },
    rating: { type: Number, min: 1, max: 5, default: null },

    // Who recorded this attendance (admin/leader)
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recordedByName: { type: String, required: true },
  },
  { timestamps: true },
);

// Compound unique index to prevent duplicate attendance per session per user
goldenMondayAttendanceSchema.index(
  { session: 1, user: 1 },
  { unique: true, sparse: true },
);

// Index for reporting
goldenMondayAttendanceSchema.index({ session: 1, attended: 1 });
goldenMondayAttendanceSchema.index({ department: 1, checkedInAt: -1 });

module.exports = mongoose.model(
  "GoldenMondayAttendance",
  goldenMondayAttendanceSchema,
);
