// backend/src/models/DocumentAuditLog.js
// Immutable audit trail for every action on CRRSA documents

const mongoose = require("mongoose");

const documentAuditLogSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CRRSADocument",
      required: true,
      index: true,
    },
    documentRef: String, // Reference number snapshot (in case doc is soft-deleted)
    action: {
      type: String,
      enum: [
        "upload",
        "view",
        "download",
        "update",
        "archive",
        "delete_flag",
        "restore",
      ],
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    performedByName: String,
    performedByRole: String,
    ipAddress: String,
    details: String, // Optional extra context
  },
  {
    timestamps: true,
    // Audit logs are NEVER deleted
  },
);

// Index for quick lookup of a document's history
documentAuditLogSchema.index({ document: 1, createdAt: -1 });

module.exports = mongoose.model("DocumentAuditLog", documentAuditLogSchema);
