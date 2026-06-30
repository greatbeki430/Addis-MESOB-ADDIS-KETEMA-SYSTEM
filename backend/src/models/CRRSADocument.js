// backend/src/models/CRRSADocument.js
// Permanent document storage model for CRRSA sector
// Documents are NEVER auto-deleted — retention policy is "lifetime"

const mongoose = require("mongoose");

const DOCUMENT_TYPES = [
  "birth_certificate", // የልደት ምስክር ወረቀት
  "death_certificate", // የሞት ምስክር ወረቀት
  "marriage_certificate", // የጋብቻ ምስክር ወረቀት
  "divorce_certificate", // የፍቺ ምስክር ወረቀት
  "residence_id", // የኑሮ መታወቂያ
  "name_change", // የስም ለውጥ ምስክር ወረቀት
  "registration_book", // የምዝገባ መዝገብ
  "circular", // ደብዳቤ / ክብ ደብዳቤ
  "directive", // መመሪያ
  "correspondence", // ደብዳቤ
  "application_form", // ማመልከቻ ቅጽ
  "other", // ሌሎች
];

const documentVersionSchema = new mongoose.Schema({
  fileUrl: { type: String, required: true },
  filePublicId: { type: String }, // Cloudinary public ID
  fileSize: { type: Number }, // bytes
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  uploadedAt: { type: Date, default: Date.now },
  changeNote: { type: String }, // What changed in this version
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
      required: true, // e.g. "Birth Certificate – Abebe Kebede"
    },

    // ─── Citizen/subject metadata ────────────────────────
    citizenName: {
      type: String,
      trim: true,
      index: true, // searchable
    },
    citizenNameAmharic: {
      type: String,
      trim: true,
    },
    dateOfBirth: Date,
    nationalId: String,

    // ─── Document metadata ───────────────────────────────
    issueDate: { type: Date, index: true },
    expiryDate: { type: Date }, // null = permanent (most CRRSA docs)
    issuingOfficer: { type: String },
    issuingDepartment: {
      type: String,
      default: "Civil Registry", // ሲቪል ምዝገባ
    },
    language: {
      type: String,
      enum: ["am", "en", "both"],
      default: "am",
    },

    // ─── File storage ────────────────────────────────────
    fileUrl: { type: String, required: true }, // Cloudinary secure URL
    filePublicId: { type: String }, // For Cloudinary management
    fileType: {
      type: String,
      enum: ["pdf", "jpg", "png", "tiff", "other"],
      default: "pdf",
    },
    fileSize: { type: Number }, // bytes
    thumbnailUrl: { type: String }, // Preview image (for PDFs)

    // ─── Version history ─────────────────────────────────
    // Current file is always the latest; previous versions stored here
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
      default: "admin", // Only admins can see documents by default
    },

    // ─── Retention policy ────────────────────────────────
    retentionPolicy: {
      type: String,
      enum: ["lifetime", "10_years", "5_years"],
      default: "lifetime", // CRRSA documents are kept forever
    },
    isArchived: { type: Boolean, default: false }, // Archived, but NEVER deleted

    // Soft delete — documents can be flagged but the file remains in Cloudinary
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt: Date,
    deleteReason: String,
  },
  {
    timestamps: true,
    // Text index for full-text search across key fields
  },
);

// ─── Text index for search ───────────────────────────────────
crrSADocumentSchema.index({
  referenceNumber: "text",
  citizenName: "text",
  citizenNameAmharic: "text",
  title: "text",
  tags: "text",
  notes: "text",
});

// ─── Compound index for common queries ───────────────────────
crrSADocumentSchema.index({ documentType: 1, issueDate: -1 });
crrSADocumentSchema.index({ uploadedBy: 1, createdAt: -1 });

// ─── Export DOCUMENT_TYPES for use in controller ─────────────
crrSADocumentSchema.statics.DOCUMENT_TYPES = DOCUMENT_TYPES;

module.exports = mongoose.model("CRRSADocument", crrSADocumentSchema);
