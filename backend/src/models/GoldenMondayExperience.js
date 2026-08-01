// backend/src/models/GoldenMondayExperience.js
// "Experiences Shared" — Kirkpatrick Model Levels 1-2 (Reaction + Learning).
// Staff log what they took away from a session: was it relevant, what did
// they learn, would they recommend it to a colleague. This is deliberately
// lighter-weight than GoldenMondayResult (which covers Levels 3-4, Behavior
// + Results) — an Experience can exist on its own, a Result optionally
// links back to one.

const mongoose = require("mongoose");

const goldenMondayExperienceSchema = new mongoose.Schema(
  {
    // Which session this experience is about (optional — staff may share a
    // general reflection not tied to one specific Monday).
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoldenMondaySession",
      default: null,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: { type: String, required: true },
    department: { type: String, default: "" },

    // Kirkpatrick Level 2 (Learning): the core content.
    whatILearned: { type: String, required: true, trim: true, maxlength: 2000 },

    // Kirkpatrick Level 1 (Reaction): how relevant/valuable did it feel.
    relevanceRating: { type: Number, min: 1, max: 5, default: 5 },
    wouldRecommend: { type: Boolean, default: true },

    // Tags: user-supplied plus lightweight auto-suggested keywords (see
    // suggestTagsFromText in goldenMondayRoutes.js — a simple keyword-
    // frequency heuristic, not a paid AI call, so this works standalone
    // without depending on any LLM provider being configured).
    tags: { type: [String], default: [] },
    aiSuggestedTags: { type: [String], default: [] },

    // Lightweight peer recognition — one endorsement per user, toggled.
    endorsedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

goldenMondayExperienceSchema.index({ createdAt: -1 });
goldenMondayExperienceSchema.index({ tags: 1 });

module.exports = mongoose.model(
  "GoldenMondayExperience",
  goldenMondayExperienceSchema,
);
