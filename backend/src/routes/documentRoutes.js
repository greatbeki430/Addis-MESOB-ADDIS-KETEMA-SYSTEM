// backend/src/routes/documentRoutes.js

const express = require("express");
const router = express.Router();
const { protect, anyRole, adminOrSuperAdmin } = require("../middleware/auth");
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  addDocumentVersion,
  flagDocumentDeleted,
  downloadDocument,
  analyzeDocument,
} = require("../controllers/documentController");

// GET    /api/documents                — list/search documents
router.get("/", protect, anyRole, getDocuments);

// POST   /api/documents/analyze        — AI vision analysis (pre-upload, no save)
router.post("/analyze", protect, anyRole, analyzeDocument);

// POST   /api/documents/upload         — upload new document
router.post("/upload", protect, anyRole, uploadDocument);

// GET    /api/documents/:id            — get single document + audit log
router.get("/:id", protect, anyRole, getDocumentById);

// PUT    /api/documents/:id            — update metadata (admin only)
router.put("/:id", protect, adminOrSuperAdmin, updateDocument);

// POST   /api/documents/:id/version    — upload new version of a document
router.post("/:id/version", protect, adminOrSuperAdmin, addDocumentVersion);

// DELETE /api/documents/:id/flag       — soft delete (superadmin only)
router.delete(
  "/:id/flag",
  protect,
  (req, res, next) => {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Superadmin only" });
    }
    next();
  },
  flagDocumentDeleted,
);

// GET    /api/documents/:id/download   — get download URL
router.get("/:id/download", protect, anyRole, downloadDocument);

module.exports = router;
