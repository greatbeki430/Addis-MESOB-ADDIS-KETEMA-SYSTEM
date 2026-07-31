// backend/src/models/GoldenMondayGallery.js
// Gallery storage for Golden Monday photos, PDFs, docs, and video
// (flag-raising, sessions, events, and now any file type).

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

    // Folder reference (Ethiopian date + topic grouping). Kept in sync
    // with GoldenMondayFolder.count/coverPhoto by the gallery upload/
    // delete routes in goldenMondayRoutes.js.
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoldenMondayFolder",
      default: null,
      index: true,
    },

    // Photo/file metadata
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    caption: { type: String, default: "", trim: true },

    // ── File type (NEW) ──────────────────────────────────────────
    // Derived SERVER-SIDE from the actual uploaded bytes/MIME type,
    // never trusted from client-reported values alone — see the
    // multi-file upload route for how this gets set.
    fileType: {
      type: String,
      enum: ["image", "pdf", "presentation", "document", "video", "other"],
      required: true,
      default: "image",
      index: true,
    },

    // Original filename as the user selected it, e.g. "Q3-report.pdf".
    // Needed to render/label non-image types and label downloads.
    originalFilename: { type: String, default: "", trim: true },

    // Real MIME type as verified server-side (e.g. "application/pdf").
    mimeType: { type: String, default: "", trim: true },

    // Which Cloudinary resource_type this was actually uploaded as
    // ("image", "video", or "raw") — needed to correctly call
    // cloudinary.uploader.destroy() later, since that call requires
    // knowing the resource_type for anything other than "image".
    cloudinaryResourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      default: "image",
    },

    // Image/media storage
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    thumbnailUrl: { type: String, default: "" },
    thumbnailPublicId: { type: String, default: "" },

    // True only when thumbnailUrl is a generic static type-icon (e.g.
    // Cloudinary couldn't generate a real preview) rather than an
    // actual preview of the file's content. Lets the frontend decide
    // whether to show it full-bleed or as a small centered icon.
    thumbnailIsGeneric: { type: Boolean, default: false },

    // Media details
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    size: { type: Number, default: 0 }, // in bytes
    format: { type: String, default: "" },
    durationSec: { type: Number, default: 0 }, // video only

    // ── Categorization (UPDATED — no longer a closed enum) ────────
    // Free-form string now: either one of BUILT_IN_CATEGORIES from
    // constants/goldenMondayCategories.js, or a slug that exists as a
    // row in the GoldenMondayCategory collection. Enforced at the
    // application layer (route/controller), not the schema layer,
    // since Mongoose enums can't validate against a dynamic collection.
    category: {
      type: String,
      default: "other",
      trim: true,
      lowercase: true,
      index: true,
    },

    // How the category was decided, for admin transparency/debugging.
    categorySource: {
      type: String,
      enum: ["ai", "manual", "default"],
      default: "default",
    },
    categoryConfidence: { type: Number, default: null },

    // Which AI provider actually produced the categorization (or which
    // ones were tried and failed) — surfaced to admins so "AI categorization
    // unavailable" isn't a black box.
    categorizationProvider: { type: String, default: "" },
    categorizationAttempts: {
      type: [
        {
          provider: { type: String },
          success: { type: Boolean },
          errorCode: { type: String, default: "" },
        },
      ],
      default: [],
    },

    // Tags for search
    tags: { type: [String], default: [] },

    // ── Deduplication (NEW) ────────────────────────────────────────
    // SHA-256 of the raw file bytes — catches byte-identical re-uploads
    // for every file type.
    contentHash: { type: String, default: "", index: true },

    // Perceptual hash (images only) — catches visually-similar-but-not-
    // identical re-uploads (recompressed, re-cropped, resaved). Null for
    // non-image types, since a meaningful equivalent for PDFs/video would
    // need OCR/frame-sampling, which is out of scope here.
    perceptualHash: { type: String, default: "" },

    // Who uploaded
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedByName: { type: String, required: true },

    // Visibility
    isPublic: { type: Boolean, default: true },

    // Date the photo/file relates to (if known, separate from upload date)
    photoDate: { type: Date, default: null },
  },
  { timestamps: true },
);

// Indexes
goldenMondayGallerySchema.index({ category: 1, createdAt: -1 });
goldenMondayGallerySchema.index({ fileType: 1, createdAt: -1 });
goldenMondayGallerySchema.index({ session: 1 });
goldenMondayGallerySchema.index({ folder: 1 });
goldenMondayGallerySchema.index({ tags: 1 });

module.exports = mongoose.model(
  "GoldenMondayGallery",
  goldenMondayGallerySchema,
);
