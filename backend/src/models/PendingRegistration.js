// backend/src/models/PendingRegistration.js
// Holds employee self-registrations submitted via Telegram until an admin
// approves or rejects them. On approval, a real User document is created —
// this model never becomes a User itself, it's just the queue.

const mongoose = require("mongoose");

const pendingRegistrationSchema = new mongoose.Schema(
  {
    // ── Telegram Information ──
    telegramChatId: { type: String, required: true, index: true },
    telegramUsername: { type: String },

    // ── Personal Information ──
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },

    // ── Employee Details (NEW) ──
    department: { type: String, default: "", trim: true },
    position: { type: String, default: "", trim: true },
    skills: { type: [String], default: [] },
    hireDate: { type: Date, default: null },
    profilePhotoUrl: { type: String, default: "" },
    emergencyContact: { type: String, default: "", trim: true },

    // ── OTP Verification ──
    otpCode: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    otpVerified: { type: Boolean, default: false },

    // ── Registration Status ──
    status: {
      type: String,
      enum: ["pending_otp", "pending_approval", "approved", "rejected"],
      default: "pending_otp",
      index: true,
    },
    rejectionReason: { type: String },

    // ── Approval Tracking ──
    createdUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedByName: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

// ── Indexes for performance ──
pendingRegistrationSchema.index({ status: 1, createdAt: -1 });
pendingRegistrationSchema.index({ email: 1 });
pendingRegistrationSchema.index({ telegramChatId: 1 });

module.exports = mongoose.model(
  "PendingRegistration",
  pendingRegistrationSchema,
);
