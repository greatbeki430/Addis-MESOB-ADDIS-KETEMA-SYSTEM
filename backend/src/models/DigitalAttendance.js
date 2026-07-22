// backend/src/models/DigitalAttendance.js
const mongoose = require("mongoose");

const digitalAttendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    date: {
      type: String,
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: Date,
    checkInLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      manual: Boolean,
    },
    checkOutLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      manual: Boolean,
    },
    hours: Number,
    status: {
      type: String,
      enum: ["pending_verification", "completed", "rejected", "verified"],
      default: "pending_verification",
    },
    reasonForDigitalCheckIn: String,
    notes: String,
    deviceInfo: mongoose.Schema.Types.Mixed,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,
    biometricsRestored: {
      type: Boolean,
      default: false,
    },
    biometricsRestoredAt: Date,
  },
  { timestamps: true },
);

// Indexes for performance
digitalAttendanceSchema.index({ userId: 1, date: 1 });
digitalAttendanceSchema.index({ status: 1 });
digitalAttendanceSchema.index({ teamId: 1 });

module.exports = mongoose.model("DigitalAttendance", digitalAttendanceSchema);
