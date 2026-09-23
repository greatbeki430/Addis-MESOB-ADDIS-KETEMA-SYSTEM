// backend/src/models/GalleryItem.js
// A single photo or video inside a GalleryAlbum (or standalone in
// "Loose Uploads" when album === null).

const mongoose = require("mongoose");

const galleryItemSchema = new mongoose.Schema(
  {
    // ─── Album link (null = Loose Uploads) ──────────────
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GalleryAlbum",
      default: null,
      index: true,
    },

    // ─── Media identity ─────────────────────────────────
    mediaType: {
      type: String,
      enum: ["photo", "video"],
      required: true,
      index: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    filePublicId: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: "",
    },

    // ─── Media dimensions (from Cloudinary) ─────────────
    width: Number,
    height: Number,
    duration: Number, // seconds, videos only

    // ─── Metadata ───────────────────────────────────────
    caption: {
      type: String,
      default: "",
      trim: true,
    },
    capturedAt: {
      type: Date,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },

    // ─── Uploader ───────────────────────────────────────
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    uploadedByName: String,

    // ─── Engagement ─────────────────────────────────────
    viewCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },

    // ─── AI editing tracking ────────────────────────────
    aiEdited: {
      type: Boolean,
      default: false,
    },
    aiEditType: {
      type: String,
      enum: ["background_removed", "enhanced", "other", null],
      default: null,
    },
    originalFileUrl: String, // preserved when an AI edit replaces the file

    // ─── Soft delete ────────────────────────────────────
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt: Date,
    deleteReason: String,
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ───────────────────────────────────────────────
galleryItemSchema.index({ album: 1, createdAt: -1 });
galleryItemSchema.index({ album: 1, mediaType: 1, createdAt: -1 });
galleryItemSchema.index({ uploadedBy: 1, createdAt: -1 });
galleryItemSchema.index({ isDeleted: 1, createdAt: -1 });
galleryItemSchema.index(
  { caption: "text", tags: "text", fileName: "text" },
  { language_override: "textSearchLang" },
);

module.exports = mongoose.model("GalleryItem", galleryItemSchema);
