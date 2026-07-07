// backend/src/models/GoldenMondayPresenter.js
// The rotation roster: one row per eligible employee.

const mongoose = require("mongoose");

const goldenMondayPresenterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    department: { type: String, default: "", trim: true },
    position: { type: String, default: "", trim: true },

    // Profile photo for Telegram posts
    profilePhotoUrl: { type: String, default: "" },
    profilePhotoPublicId: { type: String, default: "" },

    // Eligibility
    isEligible: { type: Boolean, default: true },
    onLeaveUntil: { type: Date, default: null },

    // Registration tracking
    registeredAt: { type: Date, default: Date.now },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Rotation stats
    timesPresented: { type: Number, default: 0 },
    lastPresentedAt: { type: Date, default: null },
    timesSkipped: { type: Number, default: 0 },
    joinedRotationAt: { type: Date, default: Date.now },

    // Preferences
    preferredTopics: { type: [String], default: [] },
    availableDays: { type: [String], default: ["Monday"] },
  },
  { timestamps: true },
);

goldenMondayPresenterSchema.index({ isEligible: 1, lastPresentedAt: 1 });
goldenMondayPresenterSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model(
  "GoldenMondayPresenter",
  goldenMondayPresenterSchema,
);
