// backend/src/routes/galleryRoutes.js
const express = require("express");
const router = express.Router();
const { protect, anyRole } = require("../middleware/auth");
const {
  signUploadHandler,
  listAlbums,
  createAlbum,
  getAlbum,
  updateAlbum,
  deleteAlbum,
  finalizeItem,
  listItems,
  updateItem,
  deleteItem,
  incrementView,
  incrementDownload,
  aiEditItem,
  restoreOriginal,
  bulkDownload,
} = require("../controllers/galleryController");

// ─── ORDER MATTERS: literal paths before parameterized ones ───

// Upload signature
router.post("/upload-signature", protect, anyRole, signUploadHandler);

// Bulk download
router.post("/bulk-download", protect, anyRole, bulkDownload);

// Flat item listing
router.get("/items", protect, anyRole, listItems);

// Per-item
router.patch("/items/:itemId", protect, anyRole, updateItem);
router.delete("/items/:itemId", protect, anyRole, deleteItem);
router.post("/items/:itemId/view", protect, anyRole, incrementView);
router.post("/items/:itemId/download", protect, anyRole, incrementDownload);
router.post("/items/:itemId/ai-edit", protect, anyRole, aiEditItem);
router.post(
  "/items/:itemId/restore-original",
  protect,
  anyRole,
  restoreOriginal,
);

// Albums
router.get("/", protect, anyRole, listAlbums);
router.post("/", protect, anyRole, createAlbum);
router.get("/:albumId", protect, anyRole, getAlbum);
router.patch("/:albumId", protect, anyRole, updateAlbum);
router.delete("/:albumId", protect, anyRole, deleteAlbum);

// Finalize a direct-to-Cloudinary upload
router.post("/:albumId/items/finalize", protect, anyRole, finalizeItem);

module.exports = router;
