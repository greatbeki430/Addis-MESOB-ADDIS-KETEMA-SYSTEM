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

    // ── HR-lite fields added to back the Employee Management UI ──
    // These are plain fields, visible/editable to anyone who can already
    // reach the roster endpoints (leader/admin/superadmin).
    phone: { type: String, default: "", trim: true },
    hireDate: { type: Date, default: null },
    skills: { type: [String], default: [] },
    notes: { type: String, default: "", trim: true },
    emergencyContact: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },

    // Salary is sensitive HR data. The schema stores it, but the
    // controller enforces that only admin/superadmin can read or write
    // this field — see goldenMondayController.js for the gate. Never
    // trust the frontend alone to hide this; it's enforced server-side.
    salary: { type: Number, default: null, select: false },
  },
  { timestamps: true },
);

goldenMondayPresenterSchema.index({ isEligible: 1, lastPresentedAt: 1 });
goldenMondayPresenterSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model(
  "GoldenMondayPresenter",
  goldenMondayPresenterSchema,
);
