// backend/src/models/GoldenMondayGallery.js
// Gallery storage for Golden Monday photos (flag-raising, sessions, events)

const mongoose = require("mongoose");

const goldenMondayGallerySchema = new mongoose.Schema(
  {
    // Session reference (if photo is from a specific session)
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoldenMondaySession",
      default: null,
      index: true,
    },

    // ✅ NEW — Folder reference (Ethiopian date + topic grouping).
    // Populated when a photo is uploaded through GalleryUploader.jsx's
    // folder flow. Kept in sync with GoldenMondayFolder.count/coverPhoto
    // by the gallery upload/delete routes in goldenMondayRoutes.js.
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoldenMondayFolder",
      default: null,
      index: true,
    },

    // Photo metadata
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    caption: { type: String, default: "", trim: true },

    // Image storage
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    thumbnailUrl: { type: String, default: "" },
    thumbnailPublicId: { type: String, default: "" },

    // Image details
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    size: { type: Number, default: 0 }, // in bytes
    format: { type: String, default: "" },

    // Categorization
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

    // Tags for search
    tags: { type: [String], default: [] },

    // Who uploaded
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedByName: { type: String, required: true },

    // Visibility
    isPublic: { type: Boolean, default: true },

    // Date the photo was taken (if known, separate from upload date)
    photoDate: { type: Date, default: null },
  },
  { timestamps: true },
);

// Indexes
goldenMondayGallerySchema.index({ category: 1, createdAt: -1 });
goldenMondayGallerySchema.index({ session: 1 });
goldenMondayGallerySchema.index({ folder: 1 }); // ✅ NEW — powers "inside a folder" queries
goldenMondayGallerySchema.index({ tags: 1 });

module.exports = mongoose.model(
  "GoldenMondayGallery",
  goldenMondayGallerySchema,
);
