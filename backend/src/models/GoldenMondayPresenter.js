// backend/src/models/GoldenMondayPresenter.js
// The rotation roster: one row per eligible employee. This is the source
// of truth the rotation algorithm scores against — it is NOT the same as
// the session history (a presenter can be on the roster for months before
// ever presenting).

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
    department: { type: String, default: "", trim: true },

    // Whether this person currently takes part in the rotation.
    // Toggled off for people on leave, new hires still onboarding, etc.
    isEligible: { type: Boolean, default: true },
    // Temporary skip window (e.g. maternity/sick leave) — excluded from
    // selection while onLeaveUntil is in the future, without touching
    // their stats or requiring an admin to remember to re-enable them.
    onLeaveUntil: { type: Date, default: null },

    // ── Rotation stats (maintained by goldenMondayRotationService) ──
    timesPresented: { type: Number, default: 0 },
    lastPresentedAt: { type: Date, default: null },
    // Incremented each time this person is skipped/passed over while
    // eligible (e.g. manual override chose someone else). Used as a
    // gentle tie-breaker so being passed over repeatedly increases
    // priority next time.
    timesSkipped: { type: Number, default: 0 },
    // Set when this person is auto-assigned but hasn't confirmed a
    // title yet — lets the dashboard flag "needs a title".
    joinedRotationAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

goldenMondayPresenterSchema.index({ isEligible: 1, lastPresentedAt: 1 });

module.exports = mongoose.model(
  "GoldenMondayPresenter",
  goldenMondayPresenterSchema,
);
