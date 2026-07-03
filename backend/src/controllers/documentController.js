// backend/src/controllers/documentController.js
// CRRSA Document Vault — upload, search, view, update, audit
// Routes: /api/documents/*

const CRRSADocument = require("../models/CRRSADocument");
const DocumentAuditLog = require("../models/DocumentAuditLog");
const {
  uploadDocumentToCloud,
  deleteDocumentFromCloud,
  extractDocumentMetadataWithAI,
  generateReferenceNumber,
} = require("../services/documentService");
const { analyzeDocumentImage } = require("../services/aiService");

// ─── Helper: log an audit event ──────────────────────────────
const logAudit = async (
  documentId,
  documentRef,
  action,
  user,
  req,
  details = "",
) => {
  try {
    await DocumentAuditLog.create({
      document: documentId,
      documentRef,
      action,
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      ipAddress: req.ip || req.headers["x-forwarded-for"],
      details,
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
};

// ============================================================
// POST /api/documents/upload
// Body: { file (base64), documentType, title, citizenName, citizenNameAmharic,
//         issueDate, issuingOfficer, tags, notes, textContent (optional for AI OCR) }
// Auth: employee and above
// ============================================================
const uploadDocument = async (req, res) => {
  try {
    console.log("📝 Upload request received");

    const {
      file,
      documentType,
      title,
      citizenName,
      citizenNameAmharic,
      issueDate,
      issuingOfficer,
      issuingDepartment,
      nationalId,
      dateOfBirth,
      tags,
      notes,
      accessLevel,
      textContent,
      retentionPolicy,
    } = req.body;

    // ✅ Log the incoming data (without the large file)
    console.log(`   Document Type: ${documentType}`);
    console.log(`   Title: ${title}`);
    console.log(`   File present: ${!!file}`);
    console.log(`   File size: ${file ? Math.round(file.length / 1024) : 0}KB`);

    // ✅ Validate required fields
    if (!file) {
      console.error("❌ File is missing");
      return res.status(400).json({
        success: false,
        message: "File is required",
        code: "FILE_REQUIRED",
      });
    }

    if (!documentType) {
      console.error("❌ Document type is missing");
      return res.status(400).json({
        success: false,
        message: "Document type is required",
        code: "DOCUMENT_TYPE_REQUIRED",
      });
    }

    if (!title || !title.trim()) {
      console.error("❌ Title is missing");
      return res.status(400).json({
        success: false,
        message: "Document title is required",
        code: "TITLE_REQUIRED",
      });
    }

    // ✅ Extract base64 data for size check
    const base64Data = file.includes(",") ? file.split(",")[1] : file;
    const fileSizeBytes = Math.round((base64Data.length * 3) / 4);
    const fileSizeMB = fileSizeBytes / (1024 * 1024);

    console.log(`📄 File size: ${fileSizeMB.toFixed(2)}MB`);

    if (fileSizeMB > 20) {
      console.error(`❌ File too large: ${fileSizeMB.toFixed(2)}MB`);
      return res.status(400).json({
        success: false,
        message: `File size (${fileSizeMB.toFixed(2)}MB) exceeds 20MB limit`,
        code: "FILE_TOO_LARGE",
      });
    }

    // ✅ Generate reference number
    const referenceNumber =
      req.body.referenceNumber || generateReferenceNumber(documentType);
    console.log(`📋 Reference number: ${referenceNumber}`);

    // ✅ Check for duplicate reference number
    let existing = null;
    try {
      existing = await CRRSADocument.findOne({ referenceNumber });
      if (existing) {
        console.warn(`⚠️ Duplicate reference: ${referenceNumber}`);
        return res.status(409).json({
          success: false,
          message: `Reference number ${referenceNumber} already exists`,
          existingDocumentId: existing._id,
          code: "DUPLICATE_REFERENCE",
        });
      }
    } catch (dbError) {
      console.warn("⚠️ Database check warning:", dbError.message);
      // Continue - this is not fatal
    }

    // ✅ Upload to Cloudinary
    console.log("☁️ Uploading to Cloudinary...");
    let uploadResult;
    try {
      uploadResult = await uploadDocumentToCloud(file, {
        documentType,
        referenceNumber,
      });
      console.log("✅ Cloudinary upload successful:", uploadResult.publicId);
      console.log("   URL:", uploadResult.url);
    } catch (uploadError) {
      console.error("❌ Cloudinary upload failed:", uploadError.message);
      return res.status(500).json({
        success: false,
        message: `Cloudinary upload failed: ${uploadError.message}`,
        code: "CLOUDINARY_UPLOAD_FAILED",
      });
    }

    // ✅ AI extraction (if text content is provided)
    let aiExtractedData = null;
    if (textContent && textContent.trim()) {
      try {
        aiExtractedData = await extractDocumentMetadataWithAI(
          textContent,
          documentType,
        );
        console.log("✅ AI extraction complete");
      } catch (aiError) {
        console.warn("⚠️ AI extraction failed:", aiError.message);
        // Continue without AI data
      }
    }

    // ✅ Create document record in database
    console.log("💾 Saving to database...");
    let document;
    try {
      document = await CRRSADocument.create({
        referenceNumber,
        documentType,
        title: title.trim(),
        citizenName: citizenName?.trim(),
        citizenNameAmharic: citizenNameAmharic?.trim(),
        nationalId: nationalId?.trim(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        issuingOfficer: issuingOfficer?.trim(),
        issuingDepartment: issuingDepartment || "Civil Registry",
        fileUrl: uploadResult.url,
        filePublicId: uploadResult.publicId,
        fileType: uploadResult.fileType,
        fileSize: uploadResult.fileSize,
        thumbnailUrl: uploadResult.thumbnailUrl,
        tags: Array.isArray(tags)
          ? tags
          : tags?.split(",").map((t) => t.trim()) || [],
        notes: notes?.trim(),
        accessLevel: accessLevel || "admin",
        retentionPolicy: retentionPolicy || "lifetime",
        uploadedBy: req.user._id,
        uploadedByName: req.user.name,
        aiExtractedData,
      });
      console.log(`✅ Document saved: ${document._id}`);
    } catch (dbError) {
      console.error("❌ Database save error:", dbError.message);
      console.error("❌ Error details:", dbError);

      // ✅ If database save fails, try to delete the uploaded file from Cloudinary
      try {
        if (uploadResult && uploadResult.publicId) {
          await deleteDocumentFromCloud(uploadResult.publicId);
          console.log("🗑️ Rolled back Cloudinary upload");
        }
      } catch (rollbackError) {
        console.error("❌ Rollback failed:", rollbackError.message);
      }

      return res.status(500).json({
        success: false,
        message: `Database save failed: ${dbError.message}`,
        code: "DATABASE_SAVE_FAILED",
        details:
          process.env.NODE_ENV === "development" ? dbError.stack : undefined,
      });
    }

    // ✅ Log audit
    try {
      await logAudit(
        document._id,
        referenceNumber,
        "upload",
        req.user,
        req,
        `Uploaded ${documentType}: ${title}`,
      );
      console.log("✅ Audit log saved");
    } catch (auditError) {
      console.warn("⚠️ Audit log failed:", auditError.message);
      // Don't fail the request for audit failure
    }

    // ✅ Return success response
    console.log("✅ Upload completed successfully");
    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document: {
        _id: document._id,
        referenceNumber: document.referenceNumber,
        title: document.title,
        documentType: document.documentType,
        fileUrl: document.fileUrl,
        thumbnailUrl: document.thumbnailUrl,
        aiExtractedData: document.aiExtractedData,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Document upload error:", error);
    console.error("❌ Error stack:", error.stack);

    // ✅ Return detailed error for debugging
    res.status(500).json({
      success: false,
      message: error.message || "Document upload failed",
      code: "UPLOAD_ERROR",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// ============================================================
// GET /api/documents
// Query: ?search=&type=&startDate=&endDate=&page=1&limit=20
// Auth: all roles (filtered by accessLevel)
// ============================================================
const getDocuments = async (req, res) => {
  try {
    const {
      search,
      type,
      startDate,
      endDate,
      isArchived,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { isDeleted: false };

    // Role-based visibility
    if (req.user.role === "employee") {
      filter.accessLevel = "employee";
      filter.uploadedBy = req.user._id; // Employees only see their own uploads
    } else if (req.user.role === "leader") {
      filter.accessLevel = { $in: ["employee", "leader"] };
    }
    // admin and superadmin see all

    if (type) filter.documentType = type;
    if (isArchived !== undefined) filter.isArchived = isArchived === "true";

    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate);
    }

    // Text search
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await CRRSADocument.countDocuments(filter);

    const documents = await CRRSADocument.find(filter)
      .select("-versionHistory -filePublicId") // Exclude sensitive fields from list
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("uploadedBy", "name role");

    res.json({
      documents,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// GET /api/documents/:id
// Auth: role-based access
// ============================================================
const getDocumentById = async (req, res) => {
  try {
    const doc = await CRRSADocument.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate("uploadedBy", "name role");

    if (!doc) return res.status(404).json({ message: "Document not found" });

    // Access check
    if (
      req.user.role === "employee" &&
      doc.uploadedBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Log view
    await logAudit(doc._id, doc.referenceNumber, "view", req.user, req);

    // Fetch audit trail for this document
    const auditLog = await DocumentAuditLog.find({ document: doc._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("performedBy", "name");

    res.json({ document: doc, auditLog });
  } catch (error) {
    console.error("Get document error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// PUT /api/documents/:id
// Update metadata only (not the file itself — use /version for that)
// Auth: admin, superadmin
// ============================================================
const updateDocument = async (req, res) => {
  try {
    if (!["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const allowed = [
      "title",
      "citizenName",
      "citizenNameAmharic",
      "issueDate",
      "issuingOfficer",
      "issuingDepartment",
      "tags",
      "notes",
      "accessLevel",
      "isArchived",
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const doc = await CRRSADocument.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    if (!doc) return res.status(404).json({ message: "Document not found" });

    await logAudit(
      doc._id,
      doc.referenceNumber,
      "update",
      req.user,
      req,
      `Updated fields: ${Object.keys(updates).join(", ")}`,
    );

    res.json({ message: "Document updated", document: doc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// POST /api/documents/:id/version
// Upload a new version of an existing document's file
// Auth: admin, superadmin
// ============================================================
const addDocumentVersion = async (req, res) => {
  try {
    if (!["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { file, changeNote } = req.body;
    if (!file) return res.status(400).json({ message: "New file is required" });

    const doc = await CRRSADocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // Push old file to version history
    doc.versionHistory.push({
      fileUrl: doc.fileUrl,
      filePublicId: doc.filePublicId,
      fileSize: doc.fileSize,
      uploadedBy: req.user._id,
      uploadedAt: doc.updatedAt,
      changeNote: changeNote || "Previous version",
    });

    // Upload new file
    const uploadResult = await uploadDocumentToCloud(file, {
      documentType: doc.documentType,
      referenceNumber: `${doc.referenceNumber}_v${doc.versionHistory.length + 1}`,
    });

    doc.fileUrl = uploadResult.url;
    doc.filePublicId = uploadResult.publicId;
    doc.fileType = uploadResult.fileType;
    doc.fileSize = uploadResult.fileSize;
    doc.thumbnailUrl = uploadResult.thumbnailUrl;

    await doc.save();

    await logAudit(
      doc._id,
      doc.referenceNumber,
      "update",
      req.user,
      req,
      `New version uploaded. ${doc.versionHistory.length} previous versions kept.`,
    );

    res.json({
      message: `Version ${doc.versionHistory.length + 1} uploaded successfully`,
      document: doc,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// POST /api/documents/:id/flag-delete
// Soft-delete: marks as deleted but NEVER removes from Cloudinary
// Auth: superadmin only
// ============================================================
const flagDocumentDeleted = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Superadmin access required" });
    }

    const { reason } = req.body;
    const doc = await CRRSADocument.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deletedBy: req.user._id,
        deletedAt: new Date(),
        deleteReason: reason || "No reason provided",
      },
      { new: true },
    );

    if (!doc) return res.status(404).json({ message: "Document not found" });

    await logAudit(
      doc._id,
      doc.referenceNumber,
      "delete_flag",
      req.user,
      req,
      `Reason: ${reason}`,
    );

    res.json({
      message: "Document flagged as deleted (file retained in storage)",
      document: doc,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// GET /api/documents/:id/download
// Returns the file URL for download (logs the event)
// Auth: all roles (with access check)
// ============================================================
const downloadDocument = async (req, res) => {
  try {
    const doc = await CRRSADocument.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!doc) return res.status(404).json({ message: "Document not found" });

    await logAudit(doc._id, doc.referenceNumber, "download", req.user, req);

    // Return the file URL so the frontend can trigger a browser download
    res.json({
      fileUrl: doc.fileUrl,
      fileName: `${doc.referenceNumber}.${doc.fileType}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// POST /api/documents/analyze
// Body: { file (base64), mimeType }
// Auth: any authenticated user (same access as upload)
// Reads the document via Gemini vision and returns suggested
// form field values — does NOT save or upload anything yet.
// ============================================================
const analyzeDocument = async (req, res) => {
  try {
    const { file, mimeType } = req.body;

    if (!file) {
      return res.status(400).json({ message: "File is required" });
    }

    // Derive mime type from the base64 data URL prefix if not explicitly given
    let resolvedMimeType = mimeType;
    if (!resolvedMimeType && file.startsWith("data:")) {
      resolvedMimeType = file.substring(5, file.indexOf(";"));
    }
    if (!resolvedMimeType) {
      return res.status(400).json({ message: "Could not determine file type" });
    }

    const analysis = await analyzeDocumentImage(file, resolvedMimeType);

    res.json({ analysis });
  } catch (error) {
    console.error("Document analysis error:", error);
    res.status(500).json({
      message: "AI analysis failed",
      error: error.message,
    });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  addDocumentVersion,
  flagDocumentDeleted,
  downloadDocument,
  analyzeDocument,
};
