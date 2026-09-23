// backend/src/services/galleryService.js
// Cloudinary upload/delete helpers for Gallery photos and videos.

const cloudinary = require("../config/cloudinary");

// ─── Config ────────────────────────────────────────────────
const PHOTO_MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const VIDEO_MAX_BYTES = 200 * 1024 * 1024; // 200 MB

const GALLERY_ROOT_FOLDER = "gallery";

// ─── Mime → media type ─────────────────────────────────────
const getMediaType = (mimeType = "") => {
  if (mimeType.startsWith("image/")) return "photo";
  if (mimeType.startsWith("video/")) return "video";
  return null;
};

// ─── Cloudinary resource_type per media type ───────────────
const cloudResourceType = (mediaType) =>
  mediaType === "video" ? "video" : "image";

// ─── Build a Cloudinary thumbnail URL for a video ──────────
// Cloudinary auto-generates a JPG preview of any uploaded video
// by swapping the extension: .mp4 → .jpg, plus a transform.
const buildVideoThumbnailUrl = (secureUrl) => {
  if (!secureUrl) return "";
  return secureUrl
    .replace(/\.(mp4|mov|webm|mkv|avi|m4v)$/i, ".jpg")
    .replace("/upload/", "/upload/so_0,w_600,h_400,c_fill,q_auto,f_auto/");
};

// ─── Upload one file to Cloudinary ─────────────────────────
const uploadGalleryFile = async (base64File, { mediaType, albumId }) => {
  if (!base64File) throw new Error("File is required");

  const mimeMatch = base64File.match(/^data:(.+?);base64,/);
  const detectedMime = mimeMatch ? mimeMatch[1] : "";
  const resolvedMediaType = mediaType || getMediaType(detectedMime);

  if (!resolvedMediaType) {
    throw new Error(
      "Unsupported file type. Only images and videos are allowed.",
    );
  }

  // Size check (base64 length × 0.75 ≈ bytes)
  const base64Data = base64File.includes(",")
    ? base64File.split(",")[1]
    : base64File;
  const sizeBytes = Math.round((base64Data.length * 3) / 4);

  const maxBytes =
    resolvedMediaType === "video" ? VIDEO_MAX_BYTES : PHOTO_MAX_BYTES;
  if (sizeBytes > maxBytes) {
    const maxMB = Math.round(maxBytes / (1024 * 1024));
    throw new Error(
      `File too large. Max ${maxMB}MB for ${resolvedMediaType}s.`,
    );
  }

  const folder = albumId
    ? `${GALLERY_ROOT_FOLDER}/albums/${albumId}`
    : `${GALLERY_ROOT_FOLDER}/loose`;

  const result = await cloudinary.uploader.upload(base64File, {
    folder,
    resource_type: cloudResourceType(resolvedMediaType),
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });

  const thumbnailUrl =
    resolvedMediaType === "video"
      ? buildVideoThumbnailUrl(result.secure_url)
      : result.secure_url.replace(
          "/upload/",
          "/upload/w_600,h_400,c_fill,q_auto,f_auto/",
        );

  return {
    mediaType: resolvedMediaType,
    fileUrl: result.secure_url,
    filePublicId: result.public_id,
    thumbnailUrl,
    fileName: result.original_filename || "",
    fileSize: result.bytes || sizeBytes,
    mimeType: detectedMime,
    width: result.width || 0,
    height: result.height || 0,
    duration: result.duration || 0,
    cloudinaryResourceType: result.resource_type,
  };
};

// ─── Delete one file from Cloudinary ───────────────────────
const deleteGalleryFile = async (publicId, mediaType = "photo") => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: cloudResourceType(mediaType),
      invalidate: true,
    });
  } catch (err) {
    console.warn(
      `[galleryService] Cloudinary delete failed for ${publicId}:`,
      err.message,
    );
  }
};

module.exports = {
  uploadGalleryFile,
  deleteGalleryFile,
  getMediaType,
  buildVideoThumbnailUrl,
  PHOTO_MAX_BYTES,
  VIDEO_MAX_BYTES,
};
