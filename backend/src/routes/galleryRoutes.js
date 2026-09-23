// backend/src/routes/galleryRoutes.js
// Gallery routes — albums (programs) + media items (photos/videos).

const express = require("express");
const router = express.Router();
const { protect, anyRole } = require("../middleware/auth");
const {
  listAlbums,
  createAlbum,
  getAlbum,
  updateAlbum,
  deleteAlbum,
  uploadItems,
  listItems,
  updateItem,
  deleteItem,
  incrementView,
  incrementDownload,
  aiEditItem,
  restoreOriginal,
  bulkDownload,
} = require("../controllers/galleryController");

// ────────────────────────────────────────────────────────────
// ORDER MATTERS: specific paths must come BEFORE parameterized
// paths like /:albumId, otherwise Express will treat "items" or
// "bulk-download" as an albumId.
// ────────────────────────────────────────────────────────────

// ─── Bulk download (must be before /:albumId) ───────────────
router.post("/bulk-download", protect, anyRole, bulkDownload);

// ─── Flat item listing across albums ────────────────────────
router.get("/items", protect, anyRole, listItems);

// ─── Per-item routes ────────────────────────────────────────
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

// ─── Albums ─────────────────────────────────────────────────
router.get("/", protect, anyRole, listAlbums);
router.post("/", protect, anyRole, createAlbum);
router.get("/:albumId", protect, anyRole, getAlbum);
router.patch("/:albumId", protect, anyRole, updateAlbum);
router.delete("/:albumId", protect, anyRole, deleteAlbum);

// ─── Upload items into an album (or "loose") ────────────────
router.post("/:albumId/items", protect, anyRole, uploadItems);

module.exports = router;
