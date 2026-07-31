// backend/src/models/GoldenMondayCategory.js
// Dynamic categories for the Golden Monday gallery. The six "built-in"
// categories (flag-raising, presentation, group-photo, attendees, event,
// other) are NOT rows here — they're always valid and hardcoded in
// constants/goldenMondayCategories.js. This collection only holds
// categories the AI (or an admin) has added beyond that fixed set, so a
// PDF of, say, a training certificate doesn't get forced into "event"
// just because nothing else fits.

const mongoose = require("mongoose");

const goldenMondayCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // URL/db-safe key derived from name, e.g. "training-certificate".
    // Unique so the AI doesn't spawn near-duplicate categories for the
    // same concept across separate uploads.
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    // "ai" — created automatically because AI confidence in every
    //        existing category (built-in + dynamic) was below threshold.
    // "admin" — created manually by an admin from the UI.
    source: {
      type: String,
      enum: ["ai", "admin"],
      required: true,
    },

    // Only meaningful when source === "ai": the confidence score (0-1)
    // that triggered creation, kept for later admin review/audit.
    confidence: { type: Number, default: null },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null when source === "ai" and no human was involved
    },
    createdByName: { type: String, default: "AI", trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "GoldenMondayCategory",
  goldenMondayCategorySchema,
);
