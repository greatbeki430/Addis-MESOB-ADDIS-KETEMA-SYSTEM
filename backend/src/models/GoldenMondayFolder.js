// backend/src/models/GoldenMondayFolder.js
// Represents a folder that groups Golden Monday gallery photos together
// by Ethiopian date + topic (e.g. "ሐምሌ 23 ቀን 2018 ዓ.ም - Leadership Training").
//
// GalleryUploader.jsx creates one of these (find-or-create, keyed on `name`)
// before uploading photos into it. GalleryGrid.jsx / GalleryItem.jsx read
// folders back via `title`, `coverPhoto`, and `count` — see the shaping done
// in goldenMondayRoutes.js's GET /gallery/folders route.

const mongoose = require("mongoose");

const goldenMondayFolderSchema = new mongoose.Schema(
  {
    // Full display name, e.g. "ሐምሌ 23 ቀን 2018 ዓ.ም - Leadership Training".
    // Unique so repeated uploads on the same day/topic reuse the same
    // folder instead of creating duplicates (see the find-or-create route).
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    // The Ethiopian-calendar date string as generated on the frontend
    // (e.g. "ሐምሌ 23 ቀን 2018 ዓ.ም"), stored as-is for display — this is a
    // denormalized display string, not a queryable Date field.
    ethiopianDate: { type: String, default: "", trim: true },

    // The topic/presenter name entered when the folder was created.
    topic: { type: String, required: true, trim: true },

    // Same category enum as GoldenMondayGallery, so a folder can carry a
    // default category for photos uploaded into it.
    category: {
      type: String,
      enum: [
        "flag-raising",
        "presentation",
        "group-photo",
        "attendees",
        "event",
        "other",
      ],
      default: "other",
      index: true,
    },

    // Denormalized for fast folder-grid rendering without a join:
    // - coverPhoto: thumbnail URL of the most recently uploaded photo
    // - count: number of photos currently in this folder
    // Kept in sync by the gallery upload/delete routes in
    // goldenMondayRoutes.js (increment/decrement + refresh cover on delete).
    coverPhoto: { type: String, default: "" },
    count: { type: Number, default: 0 },

    // Who created the folder
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: { type: String, required: true },
  },
  { timestamps: true },
);

// Indexes
goldenMondayFolderSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model("GoldenMondayFolder", goldenMondayFolderSchema);
