// backend/src/models/GalleryAlbum.js
// A GalleryAlbum is a "program" or "event" the Communications Team
// captured media at (e.g. "Customer Service Week 2026"). It groups
// photos + videos from that program so they stay findable months later.

const mongoose = require("mongoose");

const galleryAlbumSchema = new mongoose.Schema(
  {
    // ─── Identity ────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },

    // ─── Program context ─────────────────────────────────
    programDate: {
      type: Date,
      index: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    programType: {
      type: String,
      enum: [
        "training",
        "workshop",
        "meeting",
        "ceremony",
        "field_visit",
        "awareness",
        "other",
      ],
      default: "other",
      index: true,
    },

    // ─── Cover image ─────────────────────────────────────
    coverImage: {
      url: String,
      publicId: String,
    },

    // ─── Organization ────────────────────────────────────
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    accessLevel: {
      type: String,
      enum: ["employee", "leader", "admin"],
      default: "employee",
      index: true,
    },

    // ─── Counters (updated on item add/remove) ──────────
    itemCount: {
      type: Number,
      default: 0,
    },
    photoCount: {
      type: Number,
      default: 0,
    },
    videoCount: {
      type: Number,
      default: 0,
    },

    // ─── Ownership ──────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdByName: String,

    // ─── Soft delete ────────────────────────────────────
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
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
galleryAlbumSchema.index({ createdAt: -1 });
galleryAlbumSchema.index({ isDeleted: 1, createdAt: -1 });
galleryAlbumSchema.index({ tags: 1, programDate: -1 });

// ─── Slug helper ───────────────────────────────────────────
galleryAlbumSchema.methods.generateSlug = function () {
  const base = (this.title || "album")
    .toLowerCase()
    .replace(/[^a-z0-9\u1200-\u137F]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Date.now().toString(36).slice(-4);
  return `${base || "album"}-${suffix}`;
};

module.exports = mongoose.model("GalleryAlbum", galleryAlbumSchema);
