// backend/src/models/GoldenMondayFolder.js
// Two-level folder hierarchy:
//   1. "week" folders — one per calendar week, keyed by that week's Monday
//      (weekOf), regardless of which day within the week a file was
//      actually uploaded on. This is what fixes "uploading twice on the
//      same day creates two folders."
//   2. "fileType" folders — children of a week folder, one per file type
//      (image/pdf/presentation/document/video/other), created on demand
//      the first time that type appears in that week.
//
// Old single-level date+topic folders are migrated into this shape by
// scripts/migrateGoldenMondayFolders.js — see that file for details.

const mongoose = require("mongoose");

const goldenMondayFolderSchema = new mongoose.Schema(
  {
    folderType: {
      type: String,
      enum: ["week", "fileType"],
      required: true,
      index: true,
    },

    // Only set on folderType === "week". Normalized to that week's Monday
    // at 00:00:00 local server time — this is the actual de-duplication
    // key that replaces the old "ethiopianDate + topic" string key.
    weekOf: { type: Date, default: null, index: true },

    // Display string version of weekOf for the Ethiopian calendar, set
    // once at creation time purely for display (not queried on).
    weekOfEthiopianDate: { type: String, default: "", trim: true },

    // Every distinct topic/presenter name typed in during any upload into
    // this week gets appended here (case-insensitive de-duped), since a
    // week can now span multiple upload sessions instead of exactly one.
    topics: { type: [String], default: [] },

    // Only set on folderType === "fileType".
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoldenMondayFolder",
      default: null,
      index: true,
    },
    fileType: {
      type: String,
      enum: ["image", "pdf", "presentation", "document", "video", "other"],
      default: null,
    },

    // Denormalized for fast grid rendering without a join. On a "week"
    // folder these are aggregated across all its fileType children; on a
    // "fileType" folder they're scoped to that type only.
    title: {
      type: String,
      default: "",
      trim: true,
    },
    coverPhoto: { type: String, default: "" },
    count: { type: Number, default: 0 },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: { type: String, required: true },
  },
  { timestamps: true },
);

// ✅ FIX: A week folder is unique per (weekOf, createdBy) pair
goldenMondayFolderSchema.index(
  { weekOf: 1, createdBy: 1 },
  { unique: true, partialFilterExpression: { folderType: "week" } },
);

// ✅ FIX: A fileType folder is unique per (parentFolder, fileType, createdBy) pair
goldenMondayFolderSchema.index(
  { parentFolder: 1, fileType: 1, createdBy: 1 },
  { unique: true, partialFilterExpression: { folderType: "fileType" } },
);

// Additional index for faster queries
goldenMondayFolderSchema.index({ createdBy: 1, folderType: 1, weekOf: -1 });

module.exports = mongoose.model("GoldenMondayFolder", goldenMondayFolderSchema);
