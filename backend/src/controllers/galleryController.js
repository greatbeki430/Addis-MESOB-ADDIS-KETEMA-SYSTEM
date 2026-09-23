// backend/src/controllers/galleryController.js
// Gallery — albums (programs) + media items (photos/videos).
//
// Upload flow is now:
//   1. POST /api/gallery/upload-signature  → returns a signed token
//   2. Browser POSTs the file directly to Cloudinary
//   3. POST /api/gallery/:albumId/items/finalize → persists metadata
//
// The old base64-through-JSON path is gone.

const mongoose = require("mongoose");
const GalleryAlbum = require("../models/GalleryAlbum");
const GalleryItem = require("../models/GalleryItem");
const {
  signUpload,
  verifyCloudinaryAsset,
  deleteGalleryFile,
  buildVideoThumbnailUrl,
  buildPhotoThumbnailUrl,
} = require("../services/galleryService");

// ─── Role helpers ──────────────────────────────────────────
const LEADER_TIER = new Set(["leader", "admin", "superadmin"]);
const ADMIN_TIER = new Set(["admin", "superadmin"]);
const canUpload = (user) => LEADER_TIER.has(user?.role);
const canDelete = (user) => ADMIN_TIER.has(user?.role);
const canHardDelete = (user) => user?.role === "superadmin";

// ─── Access filter by role ─────────────────────────────────
const buildAccessFilter = (user) => {
  if (ADMIN_TIER.has(user?.role)) return {};
  if (user?.role === "leader") {
    return { accessLevel: { $in: ["employee", "leader"] } };
  }
  return { accessLevel: "employee" };
};

// ============================================================
// UPLOAD SIGNATURE (direct-to-Cloudinary)
// ============================================================

// POST /api/gallery/upload-signature
// Body: { mediaType: "photo"|"video", albumId: "<id>"|"loose"|null }
const signUploadHandler = async (req, res) => {
  try {
    if (!canUpload(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only team leaders and above can upload media.",
      });
    }

    const { mediaType, albumId } = req.body || {};

    if (!["photo", "video"].includes(mediaType)) {
      return res.status(400).json({
        success: false,
        message: "mediaType must be 'photo' or 'video'.",
      });
    }

    const isLoose = !albumId || albumId === "loose";
    if (!isLoose) {
      if (!mongoose.Types.ObjectId.isValid(albumId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid album ID." });
      }
      const album = await GalleryAlbum.findOne({
        _id: albumId,
        isDeleted: false,
      });
      if (!album) {
        return res
          .status(404)
          .json({ success: false, message: "Album not found." });
      }
    }

    const sig = signUpload({
      mediaType,
      albumId: isLoose ? null : albumId,
      userId: req.user._id.toString(),
    });

    res.json({ success: true, ...sig });
  } catch (error) {
    console.error("signUploadHandler error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ALBUMS
// ============================================================

// GET /api/gallery
const listAlbums = async (req, res) => {
  try {
    const {
      search,
      programType,
      tag,
      startDate,
      endDate,
      isArchived,
      page = 1,
      limit = 24,
    } = req.query;

    const filter = { isDeleted: false, ...buildAccessFilter(req.user) };

    if (programType && programType !== "all") filter.programType = programType;
    if (tag) filter.tags = tag;
    if (isArchived !== undefined) filter.isArchived = isArchived === "true";

    if (startDate || endDate) {
      filter.programDate = {};
      if (startDate) filter.programDate.$gte = new Date(startDate);
      if (endDate) filter.programDate.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 24;
    const skip = (pageNum - 1) * limitNum;

    const [total, albums] = await Promise.all([
      GalleryAlbum.countDocuments(filter),
      GalleryAlbum.find(filter)
        .sort({ programDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const looseFilter = {
      album: null,
      isDeleted: false,
      ...buildAccessFilter(req.user),
    };
    const looseCount = await GalleryItem.countDocuments(looseFilter);

    res.json({
      success: true,
      albums,
      looseUploadsCount: looseCount,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("listAlbums error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/gallery
const createAlbum = async (req, res) => {
  try {
    if (!canUpload(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only team leaders and above can create albums.",
      });
    }

    const { title, description, programDate, location, programType, tags } =
      req.body;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Album title is required." });
    }

    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u1200-\u137F]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    const slug = `${baseSlug || "album"}-${Date.now().toString(36).slice(-4)}`;

    const album = await GalleryAlbum.create({
      title: title.trim(),
      slug,
      description: (description || "").trim(),
      programDate: programDate ? new Date(programDate) : undefined,
      location: (location || "").trim(),
      programType: programType || "other",
      tags: Array.isArray(tags)
        ? tags
        : (tags || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
      accessLevel: "employee",
      createdBy: req.user._id,
      createdByName: req.user.name,
    });

    res.status(201).json({ success: true, album });
  } catch (error) {
    console.error("createAlbum error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/gallery/:albumId
const getAlbum = async (req, res) => {
  try {
    const { albumId } = req.params;
    const { mediaType, page = 1, limit = 40 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(albumId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid album ID." });
    }

    const album = await GalleryAlbum.findOne({
      _id: albumId,
      isDeleted: false,
    }).lean();

    if (!album) {
      return res
        .status(404)
        .json({ success: false, message: "Album not found." });
    }

    const itemFilter = {
      album: albumId,
      isDeleted: false,
      ...buildAccessFilter(req.user),
    };
    if (mediaType && mediaType !== "all") itemFilter.mediaType = mediaType;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 40;
    const skip = (pageNum - 1) * limitNum;

    const [total, items] = await Promise.all([
      GalleryItem.countDocuments(itemFilter),
      GalleryItem.find(itemFilter)
        .sort({ capturedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      album,
      items,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("getAlbum error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/gallery/:albumId
const updateAlbum = async (req, res) => {
  try {
    if (!canUpload(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only team leaders and above can update albums.",
      });
    }

    const { albumId } = req.params;
    const allowed = [
      "title",
      "description",
      "programDate",
      "location",
      "programType",
      "tags",
      "coverImage",
      "isArchived",
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.tags && !Array.isArray(updates.tags)) {
      updates.tags = updates.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const album = await GalleryAlbum.findOneAndUpdate(
      { _id: albumId, isDeleted: false },
      updates,
      { new: true },
    );

    if (!album) {
      return res
        .status(404)
        .json({ success: false, message: "Album not found." });
    }

    res.json({ success: true, album });
  } catch (error) {
    console.error("updateAlbum error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/gallery/:albumId
const deleteAlbum = async (req, res) => {
  try {
    if (!canDelete(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete albums.",
      });
    }

    const { albumId } = req.params;
    const hard = req.query.hard === "true";

    const album = await GalleryAlbum.findById(albumId);
    if (!album) {
      return res
        .status(404)
        .json({ success: false, message: "Album not found." });
    }

    if (hard) {
      if (!canHardDelete(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only superadmins can permanently delete albums.",
        });
      }

      const items = await GalleryItem.find({ album: albumId });
      await Promise.all(
        items.map((it) =>
          deleteGalleryFile(it.filePublicId, it.mediaType).catch(() => {}),
        ),
      );

      if (album.coverImage?.publicId) {
        await deleteGalleryFile(album.coverImage.publicId, "photo").catch(
          () => {},
        );
      }

      await GalleryItem.deleteMany({ album: albumId });
      await GalleryAlbum.deleteOne({ _id: albumId });

      return res.json({
        success: true,
        message: "Album and all its media permanently deleted.",
      });
    }

    album.isDeleted = true;
    album.deletedBy = req.user._id;
    album.deletedAt = new Date();
    album.deleteReason = req.body?.reason || "No reason provided";
    await album.save();

    res.json({ success: true, message: "Album moved to trash." });
  } catch (error) {
    console.error("deleteAlbum error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ITEMS
// ============================================================

// POST /api/gallery/:albumId/items/finalize
// Body: {
//   cloudinaryPublicId, cloudinaryUrl, cloudinaryResourceType,
//   mediaType, fileName, fileSize, mimeType, width, height, duration,
//   caption?, capturedAt?, tags?
// }
const finalizeItem = async (req, res) => {
  try {
    if (!canUpload(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only team leaders and above can upload media.",
      });
    }

    const { albumId } = req.params;
    const isLoose = albumId === "loose";

    let album = null;
    if (!isLoose) {
      if (!mongoose.Types.ObjectId.isValid(albumId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid album ID." });
      }
      album = await GalleryAlbum.findOne({ _id: albumId, isDeleted: false });
      if (!album) {
        return res
          .status(404)
          .json({ success: false, message: "Album not found." });
      }
    }

    const {
      cloudinaryPublicId,
      cloudinaryUrl,
      mediaType,
      fileName,
      fileSize,
      mimeType,
      width,
      height,
      duration,
      caption,
      capturedAt,
      tags,
    } = req.body || {};

    if (!cloudinaryPublicId || !cloudinaryUrl) {
      return res.status(400).json({
        success: false,
        message: "cloudinaryPublicId and cloudinaryUrl are required.",
      });
    }
    if (!["photo", "video"].includes(mediaType)) {
      return res
        .status(400)
        .json({ success: false, message: "mediaType is required." });
    }

    // Verify the asset really exists on Cloudinary before persisting.
    try {
      await verifyCloudinaryAsset(cloudinaryPublicId, mediaType);
    } catch (verifyErr) {
      console.warn(
        `finalizeItem: Cloudinary asset ${cloudinaryPublicId} not found`,
      );
      return res.status(400).json({
        success: false,
        message:
          "Cloudinary asset could not be verified. The upload may have failed.",
      });
    }

    const thumbnailUrl =
      mediaType === "video"
        ? buildVideoThumbnailUrl(cloudinaryUrl)
        : buildPhotoThumbnailUrl(cloudinaryUrl);

    const item = await GalleryItem.create({
      album: isLoose ? null : albumId,
      mediaType,
      fileUrl: cloudinaryUrl,
      filePublicId: cloudinaryPublicId,
      thumbnailUrl,
      fileName: fileName || "",
      fileSize: fileSize || 0,
      mimeType: mimeType || "",
      width: width || 0,
      height: height || 0,
      duration: duration || 0,
      caption: (caption || "").trim(),
      capturedAt: capturedAt ? new Date(capturedAt) : undefined,
      tags: Array.isArray(tags)
        ? tags
        : (tags || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
      uploadedBy: req.user._id,
      uploadedByName: req.user.name,
    });

    if (album) {
      album.itemCount += 1;
      if (mediaType === "photo") album.photoCount += 1;
      if (mediaType === "video") album.videoCount += 1;
      if (!album.coverImage?.url && thumbnailUrl) {
        album.coverImage = { url: thumbnailUrl, publicId: cloudinaryPublicId };
      }
      await album.save();
    }

    res.status(201).json({ success: true, item });
  } catch (error) {
    console.error("finalizeItem error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/gallery/items
const listItems = async (req, res) => {
  try {
    const {
      album,
      mediaType,
      search,
      tag,
      startDate,
      endDate,
      page = 1,
      limit = 40,
    } = req.query;

    const filter = { isDeleted: false, ...buildAccessFilter(req.user) };

    if (album === "loose") filter.album = null;
    else if (album) filter.album = album;

    if (mediaType && mediaType !== "all") filter.mediaType = mediaType;
    if (tag) filter.tags = tag;

    if (startDate || endDate) {
      filter.capturedAt = {};
      if (startDate) filter.capturedAt.$gte = new Date(startDate);
      if (endDate) filter.capturedAt.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 40;
    const skip = (pageNum - 1) * limitNum;

    const [total, items] = await Promise.all([
      GalleryItem.countDocuments(filter),
      GalleryItem.find(filter)
        .sort({ capturedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      items,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("listItems error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/gallery/items/:itemId
const updateItem = async (req, res) => {
  try {
    if (!canUpload(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only team leaders and above can edit media.",
      });
    }

    const { itemId } = req.params;
    const allowed = ["caption", "tags", "capturedAt"];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    if (updates.tags && !Array.isArray(updates.tags)) {
      updates.tags = updates.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const item = await GalleryItem.findOneAndUpdate(
      { _id: itemId, isDeleted: false },
      updates,
      { new: true },
    );

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found." });
    }

    res.json({ success: true, item });
  } catch (error) {
    console.error("updateItem error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/gallery/items/:itemId
const deleteItem = async (req, res) => {
  try {
    if (!canDelete(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete media.",
      });
    }

    const { itemId } = req.params;
    const hard = req.query.hard === "true";

    const item = await GalleryItem.findById(itemId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found." });
    }

    if (hard) {
      if (!canHardDelete(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only superadmins can permanently delete media.",
        });
      }
      await deleteGalleryFile(item.filePublicId, item.mediaType).catch(
        () => {},
      );
      await GalleryItem.deleteOne({ _id: itemId });
    } else {
      item.isDeleted = true;
      item.deletedBy = req.user._id;
      item.deletedAt = new Date();
      item.deleteReason = req.body?.reason || "No reason provided";
      await item.save();
    }

    if (item.album) {
      const album = await GalleryAlbum.findById(item.album);
      if (album) {
        album.itemCount = Math.max(0, album.itemCount - 1);
        if (item.mediaType === "photo")
          album.photoCount = Math.max(0, album.photoCount - 1);
        if (item.mediaType === "video")
          album.videoCount = Math.max(0, album.videoCount - 1);
        await album.save();
      }
    }

    res.json({
      success: true,
      message: hard ? "Media permanently deleted." : "Media moved to trash.",
    });
  } catch (error) {
    console.error("deleteItem error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/gallery/items/:itemId/view
const incrementView = async (req, res) => {
  try {
    const { itemId } = req.params;
    await GalleryItem.updateOne({ _id: itemId }, { $inc: { viewCount: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/gallery/items/:itemId/download
const incrementDownload = async (req, res) => {
  try {
    const { itemId } = req.params;
    await GalleryItem.updateOne(
      { _id: itemId },
      { $inc: { downloadCount: 1 } },
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// AI-ASSISTED EDITING
// ============================================================

// POST /api/gallery/items/:itemId/ai-edit
// Body: { operation: "background_removed" | "enhanced" }
const aiEditItem = async (req, res) => {
  try {
    if (!canUpload(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only team leaders and above can edit media.",
      });
    }

    const { itemId } = req.params;
    const { operation } = req.body;

    if (!["background_removed", "enhanced"].includes(operation)) {
      return res
        .status(400)
        .json({ success: false, message: "Unsupported operation." });
    }

    const item = await GalleryItem.findOne({ _id: itemId, isDeleted: false });
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found." });
    }

    if (item.mediaType !== "photo") {
      return res.status(400).json({
        success: false,
        message: "AI editing is only available for photos.",
      });
    }

    // Requires the Cloudinary "remove_the_background" add-on. Without it,
    // the transformed URL returns the original — a no-op, not an error.
    const cloudinary = require("../config/cloudinary");

    const transformation =
      operation === "background_removed"
        ? [{ effect: "background_removal" }]
        : [{ effect: "improve" }];

    const transformedUrl = cloudinary.url(item.filePublicId, {
      resource_type: "image",
      transformation,
      secure: true,
    });

    item.originalFileUrl = item.originalFileUrl || item.fileUrl;
    item.fileUrl = transformedUrl;
    item.aiEdited = true;
    item.aiEditType = operation;
    await item.save();

    res.json({
      success: true,
      item,
      message:
        operation === "background_removed"
          ? "Background removed (Cloudinary AI add-on required)."
          : "Photo enhanced (Cloudinary AI add-on required).",
    });
  } catch (error) {
    console.error("aiEditItem error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/gallery/items/:itemId/restore-original
const restoreOriginal = async (req, res) => {
  try {
    if (!canUpload(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only team leaders and above can edit media.",
      });
    }

    const { itemId } = req.params;
    const item = await GalleryItem.findOne({ _id: itemId, isDeleted: false });

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found." });
    }

    if (!item.originalFileUrl) {
      return res.status(400).json({
        success: false,
        message: "This item has no original to restore.",
      });
    }

    item.fileUrl = item.originalFileUrl;
    item.originalFileUrl = undefined;
    item.aiEdited = false;
    item.aiEditType = null;
    await item.save();

    res.json({ success: true, item, message: "Original restored." });
  } catch (error) {
    console.error("restoreOriginal error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// BULK DOWNLOAD
// ============================================================

// POST /api/gallery/bulk-download
const bulkDownload = async (req, res) => {
  try {
    const archiver = require("archiver");
    const axios = require("axios");

    const { itemIds = [], albumId = null } = req.body || {};

    let items = [];
    if (Array.isArray(itemIds) && itemIds.length > 0) {
      items = await GalleryItem.find({
        _id: { $in: itemIds },
        isDeleted: false,
      }).lean();
    } else if (albumId) {
      items = await GalleryItem.find({
        album: albumId,
        isDeleted: false,
      }).lean();
    }

    if (items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items to download." });
    }

    const zipName = `gallery-${Date.now()}.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      console.error("bulkDownload archive error:", err);
      res.status(500).end();
    });
    archive.pipe(res);

    for (const item of items) {
      try {
        const response = await axios.get(item.fileUrl, {
          responseType: "stream",
          timeout: 60000,
        });
        const ext =
          item.fileUrl.split(".").pop().split("?")[0] ||
          (item.mediaType === "video" ? "mp4" : "jpg");
        const safeName =
          (item.fileName || item._id).replace(/[^a-zA-Z0-9._-]/g, "_") +
          (item.fileName?.includes(".") ? "" : `.${ext}`);
        archive.append(response.data, { name: safeName });

        GalleryItem.updateOne(
          { _id: item._id },
          { $inc: { downloadCount: 1 } },
        ).catch(() => {});
      } catch (err) {
        console.warn(`bulkDownload: skipped ${item._id} — ${err.message}`);
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error("bulkDownload error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
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
};
