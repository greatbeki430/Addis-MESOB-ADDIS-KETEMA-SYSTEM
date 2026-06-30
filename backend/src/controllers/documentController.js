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
      textContent, // Optional: text content for AI extraction
      retentionPolicy,
    } = req.body;

    if (!file) return res.status(400).json({ message: "File is required" });
    if (!documentType)
      return res.status(400).json({ message: "Document type is required" });
    if (!title)
      return res.status(400).json({ message: "Document title is required" });

    // Generate reference number
    const referenceNumber =
      req.body.referenceNumber || generateReferenceNumber(documentType);

    // Check for duplicate reference number
    const existing = await CRRSADocument.findOne({ referenceNumber });
    if (existing) {
      return res.status(409).json({
        message: `Reference number ${referenceNumber} already exists`,
        existingDocumentId: existing._id,
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadDocumentToCloud(file, {
      documentType,
      referenceNumber,
    });

    // AI extraction (if text content is provided)
    let aiExtractedData = null;
    if (textContent && textContent.trim()) {
      aiExtractedData = await extractDocumentMetadataWithAI(
        textContent,
        documentType,
      );
    }

    // Create document record
    const document = await CRRSADocument.create({
      referenceNumber,
      documentType,
      title,
      citizenName: citizenName?.trim(),
      citizenNameAmharic: citizenNameAmharic?.trim(),
      nationalId,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      issueDate: issueDate ? new Date(issueDate) : undefined,
      issuingOfficer,
      issuingDepartment: issuingDepartment || "Civil Registry",
      fileUrl: uploadResult.url,
      filePublicId: uploadResult.publicId,
      fileType: uploadResult.fileType,
      fileSize: uploadResult.fileSize,
      thumbnailUrl: uploadResult.thumbnailUrl,
      tags: Array.isArray(tags)
        ? tags
        : tags?.split(",").map((t) => t.trim()) || [],
      notes,
      accessLevel: accessLevel || "admin",
      retentionPolicy: retentionPolicy || "lifetime",
      uploadedBy: req.user._id,
      uploadedByName: req.user.name,
      aiExtractedData,
    });

    await logAudit(
      document._id,
      referenceNumber,
      "upload",
      req.user,
      req,
      `Uploaded ${documentType}: ${title}`,
    );

    res.status(201).json({
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
    console.error("Document upload error:", error);
    res.status(500).json({ message: error.message });
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

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  addDocumentVersion,
  flagDocumentDeleted,
  downloadDocument,
};
