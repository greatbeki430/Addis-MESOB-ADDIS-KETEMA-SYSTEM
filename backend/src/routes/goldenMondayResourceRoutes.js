// backend/src/routes/goldenMondayResourceRoutes.js
// ✅ COMPLETE FIXED VERSION

const express = require("express");
const router = express.Router();
const { protect, goldenMondayAdminOrAbove } = require("../middleware/auth");
const GoldenMondayResource = require("../models/GoldenMondayResource");
const GoldenMondaySession = require("../models/GoldenMondaySession");
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const { fileTypeFromBuffer } = require("file-type");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

// ─── Helper: Detect resource type for Cloudinary ──────────────
const getCloudinaryResourceType = (fileType) => {
  switch (fileType) {
    case "image":
      return "image";
    case "video":
      return "video";
    case "pdf":
    case "presentation":
    case "document":
    default:
      return "raw";
  }
};

// ─── GET resources for a session ─────────────────────────────
router.get("/session/:sessionId", protect, async (req, res) => {
  try {
    const resources = await GoldenMondayResource.find({
      session: req.params.sessionId,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({ success: true, resources });
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── UPLOAD resource to a session ─────────────────────────────
router.post(
  "/session/:sessionId",
  protect,
  goldenMondayAdminOrAbove,
  upload.single("file"),
  async (req, res) => {
    try {
      const { title, description, tags } = req.body;
      const sessionId = req.params.sessionId;

      // ✅ Check if session exists
      const session = await GoldenMondaySession.findById(sessionId);
      if (!session) {
        return res
          .status(404)
          .json({ success: false, error: "Session not found" });
      }

      // ✅ Check if file was uploaded
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "No file uploaded" });
      }

      console.log(
        `📤 Uploading: ${req.file.originalname} (${req.file.size} bytes)`,
      );

      // ✅ Detect file type with try/catch
      let detectedMime = req.file.mimetype;
      let fileType = "other";

      try {
        const fileTypeResult = await fileTypeFromBuffer(req.file.buffer);
        if (fileTypeResult) {
          detectedMime = fileTypeResult.mime;
          console.log(`📄 Detected MIME: ${detectedMime}`);
        }
      } catch (detectError) {
        console.warn(
          "⚠️ Could not detect file type, using mimetype:",
          detectError.message,
        );
      }

      // ✅ Determine file type
      const mimeType = detectedMime;
      if (mimeType.startsWith("image/")) fileType = "image";
      else if (mimeType === "application/pdf") fileType = "pdf";
      else if (
        mimeType === "application/vnd.ms-powerpoint" ||
        mimeType ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      )
        fileType = "presentation";
      else if (
        mimeType === "application/msword" ||
        mimeType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
        fileType = "document";
      else if (mimeType.startsWith("video/")) fileType = "video";
      else if (
        mimeType === "application/zip" ||
        mimeType === "application/x-zip-compressed"
      )
        fileType = "other";

      console.log(`📄 File type: ${fileType}`);

      // ✅ Upload to Cloudinary with correct resource_type
      const dataURI = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;
      const cloudinaryResourceType = getCloudinaryResourceType(fileType);
      console.log(`☁️ Cloudinary resource_type: ${cloudinaryResourceType}`);

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: `golden-monday/resources/${sessionId}`,
        resource_type: cloudinaryResourceType,
        public_id: `${Date.now()}-${req.file.originalname.split(".")[0]}`,
        overwrite: false,
      });

      console.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`);

      // ✅ Get existing resources count for version
      const existingCount = await GoldenMondayResource.countDocuments({
        session: sessionId,
      });

      // ✅ Create resource record
      const resource = new GoldenMondayResource({
        session: sessionId,
        title: title || req.file.originalname,
        filename: req.file.originalname,
        fileType,
        url: result.secure_url,
        publicId: result.public_id,
        size: req.file.size,
        version: existingCount + 1,
        uploadedBy: req.user._id,
        uploadedByName: req.user.name,
        description: description || "",
        tags: tags
          ? tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        downloads: 0,
        isActive: true,
      });

      await resource.save();

      // ✅ Add resource reference to session
      if (!session.resources) session.resources = [];
      session.resources.push(resource._id);
      await session.save();

      res.status(201).json({
        success: true,
        resource,
        message: "Resource uploaded successfully!",
      });
    } catch (error) {
      console.error("❌ Error uploading resource:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to upload resource",
      });
    }
  },
);

// ─── DELETE resource ───────────────────────────────────────────
router.delete(
  "/:resourceId",
  protect,
  goldenMondayAdminOrAbove,
  async (req, res) => {
    try {
      const resource = await GoldenMondayResource.findById(
        req.params.resourceId,
      );
      if (!resource) {
        return res
          .status(404)
          .json({ success: false, error: "Resource not found" });
      }

      // ✅ Delete from Cloudinary with correct resource_type
      const cloudinaryResourceType = getCloudinaryResourceType(
        resource.fileType,
      );
      try {
        await cloudinary.uploader.destroy(resource.publicId, {
          resource_type: cloudinaryResourceType,
        });
      } catch (cloudErr) {
        console.warn("Cloudinary delete failed:", cloudErr.message);
      }

      // ✅ Remove from session's resources array
      await GoldenMondaySession.findByIdAndUpdate(resource.session, {
        $pull: { resources: resource._id },
      });

      await resource.deleteOne();

      res.json({ success: true, message: "Resource deleted successfully" });
    } catch (error) {
      console.error("Error deleting resource:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

// ─── DOWNLOAD resource (increment count) ───────────────────────
router.put("/:resourceId/download", protect, async (req, res) => {
  try {
    const resource = await GoldenMondayResource.findById(req.params.resourceId);
    if (!resource) {
      return res
        .status(404)
        .json({ success: false, error: "Resource not found" });
    }

    resource.downloads = (resource.downloads || 0) + 1;
    await resource.save();

    res.json({
      success: true,
      url: resource.url,
      filename: resource.filename,
    });
  } catch (error) {
    console.error("Error incrementing download:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── UPDATE resource metadata ──────────────────────────────────
router.put(
  "/:resourceId",
  protect,
  goldenMondayAdminOrAbove,
  async (req, res) => {
    try {
      const { title, description, tags, isActive } = req.body;
      const resource = await GoldenMondayResource.findById(
        req.params.resourceId,
      );

      if (!resource) {
        return res
          .status(404)
          .json({ success: false, error: "Resource not found" });
      }

      if (title) resource.title = title;
      if (description !== undefined) resource.description = description;
      if (tags !== undefined) {
        resource.tags =
          typeof tags === "string"
            ? tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : Array.isArray(tags)
              ? tags
              : [];
      }
      if (isActive !== undefined) resource.isActive = isActive;

      await resource.save();

      res.json({ success: true, resource });
    } catch (error) {
      console.error("Error updating resource:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

module.exports = router;
