// backend/src/models/PendingRegistration.js
// Holds employee self-registrations submitted via Telegram until an admin
// approves or rejects them. On approval, a real User document is created —
// this model never becomes a User itself, it's just the queue.

const mongoose = require("mongoose");

const pendingRegistrationSchema = new mongoose.Schema(
  {
    telegramChatId: { type: String, required: true, index: true },
    telegramUsername: { type: String },

    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },

    otpCode: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    otpVerified: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["pending_otp", "pending_approval", "approved", "rejected"],
      default: "pending_otp",
      index: true,
    },
    rejectionReason: { type: String },

    // Set once approved — links this queue entry to the real account created
    createdUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedByName: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "PendingRegistration",
  pendingRegistrationSchema,
);
