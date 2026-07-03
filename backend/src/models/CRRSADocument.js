// backend/src/models/CRRSADocument.js
// Permanent document storage model for CRRSA sector
// Documents are NEVER auto-deleted — retention policy is "lifetime"

const mongoose = require("mongoose");

const DOCUMENT_TYPES = [
  "birth_certificate",
  "death_certificate",
  "marriage_certificate",
  "divorce_certificate",
  "residence_id",
  "name_change",
  "registration_book",
  "circular",
  "directive",
  "correspondence",
  "application_form",
  "other",
];

const documentVersionSchema = new mongoose.Schema({
  fileUrl: { type: String, required: true },
  filePublicId: { type: String },
  fileSize: { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  uploadedAt: { type: Date, default: Date.now },
  changeNote: { type: String },
});

const crrSADocumentSchema = new mongoose.Schema(
  {
    // ─── Core identity ───────────────────────────────────
    referenceNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: DOCUMENT_TYPES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },

    // ─── Citizen/subject metadata ────────────────────────
    citizenName: {
      type: String,
      trim: true,
      index: true,
    },
    citizenNameAmharic: {
      type: String,
      trim: true,
    },
    dateOfBirth: Date,
    nationalId: String,

    // ─── Document metadata ───────────────────────────────
    issueDate: { type: Date, index: true },
    expiryDate: { type: Date },
    issuingOfficer: { type: String },
    issuingDepartment: {
      type: String,
      default: "Civil Registry",
    },
    language: {
      type: String,
      enum: ["am", "en", "both"],
      default: "am",
    },

    // ─── File storage ────────────────────────────────────
    fileUrl: { type: String, required: true },
    filePublicId: { type: String },
    fileType: {
      type: String,
      enum: ["pdf", "jpg", "png", "tiff", "other"],
      default: "pdf",
    },
    fileSize: { type: Number },
    thumbnailUrl: { type: String },

    // ─── Version history ─────────────────────────────────
    versionHistory: [documentVersionSchema],

    // ─── AI-extracted metadata ───────────────────────────
    aiExtractedData: {
      referenceNumber: String,
      citizenName: String,
      documentDate: String,
      summary: String,
      extractedAt: Date,
    },

    // ─── Tags and search ─────────────────────────────────
    tags: [{ type: String, lowercase: true }],
    notes: { type: String },

    // ─── Access control ──────────────────────────────────
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedByName: String,
    accessLevel: {
      type: String,
      enum: ["employee", "leader", "admin"],
      default: "admin",
    },

    // ─── Retention policy ────────────────────────────────
    retentionPolicy: {
      type: String,
      enum: ["lifetime", "10_years", "5_years"],
      default: "lifetime",
    },
    isArchived: { type: Boolean, default: false },

    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt: Date,
    deleteReason: String,
  },
  {
    timestamps: true,
  },
);

// ─── ✅ FIX: Text index with language_override ────────────────
// This prevents MongoDB from using the "language" field for text search
// language configuration. The default is "language" which conflicts
// with our document's language field.
crrSADocumentSchema.index(
  {
    referenceNumber: "text",
    citizenName: "text",
    citizenNameAmharic: "text",
    title: "text",
    tags: "text",
    notes: "text",
  },
  {
    language_override: "textSearchLang", // ✅ Point MongoDB elsewhere
  },
);

// ─── Compound index for common queries ───────────────────────
crrSADocumentSchema.index({ documentType: 1, issueDate: -1 });
crrSADocumentSchema.index({ uploadedBy: 1, createdAt: -1 });

// ─── Export DOCUMENT_TYPES for use in controller ─────────────
crrSADocumentSchema.statics.DOCUMENT_TYPES = DOCUMENT_TYPES;

module.exports = mongoose.model("CRRSADocument", crrSADocumentSchema);
