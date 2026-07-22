// backend/src/models/Attendance.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
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
    checkIn: Date,
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
      enum: [
        "present",
        "absent",
        "late",
        "half-day",
        "pending_verification",
        "completed",
      ],
      default: "pending_verification",
    },
    verificationMethod: {
      type: String,
      enum: ["biometrics", "digital", "manual"],
      default: "biometrics",
    },
    reasonForDigitalCheckIn: String,
    notes: String,
    deviceInfo: mongoose.Schema.Types.Mixed,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
  },
  { timestamps: true },
);

// Index for faster queries
attendanceSchema.index({ userId: 1, date: 1 });
attendanceSchema.index({ teamId: 1, date: 1 });
attendanceSchema.index({ status: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
